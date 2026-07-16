import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { RequestWithContext } from '../middleware/request-context.middleware';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HttpRequest');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>() as RequestWithContext & {
      user?: { userId?: number | string; sub?: number | string; role?: string };
    };
    const response = http.getResponse<Response>();
    const startedAt = Date.now();
    const baseEvent = {
      event: 'http_request',
      requestId: request.requestId || 'unknown',
      method: request.method,
      path: request.path,
      actorId: String(request.user?.userId || request.user?.sub || 'anonymous'),
      actorRole: request.user?.role || 'anonymous',
    };

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            JSON.stringify({
              ...baseEvent,
              statusCode: response.statusCode,
              durationMs: Date.now() - startedAt,
            }),
          );
        },
        error: (error: unknown) => {
          const statusCode =
            error instanceof HttpException ? error.getStatus() : response.statusCode || 500;
          this.logger.error(
            JSON.stringify({
              ...baseEvent,
              statusCode,
              durationMs: Date.now() - startedAt,
              errorName: error instanceof Error ? error.name : 'UnknownError',
            }),
          );
        },
      }),
    );
  }
}
