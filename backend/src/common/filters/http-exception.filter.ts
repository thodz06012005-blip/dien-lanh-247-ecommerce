import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuditLogService } from '../../modules/audit/audit-log.service';
import { ErrorCode, type ErrorCodeValue } from '../constants/error-codes';
import { BusinessException } from '../exceptions/business.exception';
import type { ApiErrorResponse } from '../interfaces/api-response.interface';
import type { RequestWithContext } from '../middleware/request-context.middleware';
import { sanitizeForLog } from '../security/redaction.util';

interface ExceptionPayload extends Record<string, unknown> {
  code?: string;
  details?: unknown;
  error?: string | { code?: string; message?: string; details?: unknown };
  message?: string | string[];
}

interface ErrorLike {
  code?: string;
  message?: string;
  status?: number;
  statusCode?: number;
  type?: string;
}

const STATUS_CODE_MAP: Partial<Record<HttpStatus, ErrorCodeValue>> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.PAYLOAD_TOO_LARGE]: ErrorCode.PAYLOAD_TOO_LARGE,
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: ErrorCode.UNSUPPORTED_MEDIA_TYPE,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.RATE_LIMITED,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readExceptionPayload(exception: unknown): ExceptionPayload {
  if (!(exception instanceof HttpException)) return {};
  const response = exception.getResponse();
  if (typeof response === 'string') return { message: response };
  return isRecord(response) ? response : {};
}

function readStatus(exception: unknown): HttpStatus {
  if (exception instanceof HttpException) return exception.getStatus();
  if (!isRecord(exception)) return HttpStatus.INTERNAL_SERVER_ERROR;
  const candidate = Number(exception.status ?? exception.statusCode);
  return Number.isInteger(candidate) && candidate >= 400 && candidate <= 599
    ? candidate
    : HttpStatus.INTERNAL_SERVER_ERROR;
}

function readPrismaCode(exception: unknown): string | null {
  if (!isRecord(exception) || typeof exception.code !== 'string') return null;
  return exception.code.startsWith('P') ? exception.code : null;
}

function resolveErrorCode(
  exception: unknown,
  status: HttpStatus,
  payload: ExceptionPayload,
): string {
  if (exception instanceof BusinessException) return exception.code;
  if (typeof payload.code === 'string') return payload.code;
  if (isRecord(payload.error) && typeof payload.error.code === 'string') {
    return payload.error.code;
  }
  const prismaCode = readPrismaCode(exception);
  if (prismaCode === 'P2002') return ErrorCode.RESOURCE_ALREADY_EXISTS;
  if (prismaCode === 'P2025') return ErrorCode.RESOURCE_NOT_FOUND;
  if (prismaCode) return ErrorCode.DATABASE_ERROR;
  return STATUS_CODE_MAP[status] ?? ErrorCode.INTERNAL_ERROR;
}

function resolveMessageAndDetails(
  exception: unknown,
  status: HttpStatus,
  payload: ExceptionPayload,
): { message: string; details?: unknown } {
  if (Array.isArray(payload.message)) {
    return { message: 'Dữ liệu không hợp lệ.', details: payload.message };
  }
  if (typeof payload.message === 'string' && payload.message.trim()) {
    return {
      message: payload.message,
      details:
        payload.details ??
        (isRecord(payload.error) ? payload.error.details : undefined),
    };
  }
  if (isRecord(payload.error) && typeof payload.error.message === 'string') {
    return { message: payload.error.message, details: payload.error.details };
  }
  const errorLike: ErrorLike = isRecord(exception) ? exception : {};
  if (status < HttpStatus.INTERNAL_SERVER_ERROR && errorLike.message) {
    return { message: errorLike.message };
  }
  return { message: 'Internal server error' };
}

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  constructor(private readonly auditLogService?: AuditLogService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>() as RequestWithContext;
    const errorLike: ErrorLike = isRecord(exception) ? exception : {};

    let status = readStatus(exception);
    if (errorLike.type === 'entity.too.large') status = HttpStatus.PAYLOAD_TOO_LARGE;

    const isMalformedJson =
      exception instanceof SyntaxError &&
      status === HttpStatus.BAD_REQUEST &&
      'body' in exception;
    const payload = isMalformedJson
      ? ({ message: 'Invalid JSON payload' } satisfies ExceptionPayload)
      : readExceptionPayload(exception);
    const code = isMalformedJson
      ? ErrorCode.VALIDATION_ERROR
      : resolveErrorCode(exception, status, payload);
    const { message, details } = resolveMessageAndDetails(
      exception,
      status,
      payload,
    );

    const body: ApiErrorResponse = {
      success: false,
      statusCode: status,
      message,
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details }),
      },
      requestId: request.requestId ?? 'unknown',
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.originalUrl,
    };

    try {
      const metadata = {
        status,
        code,
        method: request.method,
        path: request.originalUrl,
        requestId: body.requestId,
      };
      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        this.auditLogService?.auditRateLimited(
          request,
          'REQUEST_RATE_LIMITED',
          'http',
          request.originalUrl,
          metadata,
          'Request rejected by rate limit',
        );
      } else if (
        status === HttpStatus.UNAUTHORIZED ||
        status === HttpStatus.FORBIDDEN
      ) {
        this.auditLogService?.auditDenied(
          request,
          'REQUEST_ACCESS_DENIED',
          'http',
          request.originalUrl,
          metadata,
          'Request rejected by authentication or authorization',
        );
      } else if (
        status === HttpStatus.PAYLOAD_TOO_LARGE ||
        status === HttpStatus.UNSUPPORTED_MEDIA_TYPE
      ) {
        this.auditLogService?.auditFailure(
          request,
          'REQUEST_PAYLOAD_REJECTED',
          'http',
          request.originalUrl,
          metadata,
          'Request payload rejected by security policy',
        );
      }
    } catch {
      // Error reporting must never replace the original API response.
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR && process.env.NODE_ENV !== 'test') {
      console.error(
        'Unhandled API error',
        sanitizeForLog({
          requestId: body.requestId,
          method: body.method,
          path: body.path,
          code,
          exception,
        }),
      );
    }

    response.status(status).json(body);
  }
}
