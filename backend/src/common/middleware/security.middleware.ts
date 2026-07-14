import { HttpStatus } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { ErrorCode } from '../constants/error-codes';
import type { RequestWithContext } from './request-context.middleware';

const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);
const ALLOWED_CONTENT_TYPES = [
  'application/json',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
];

export function securityHeadersMiddleware(request: Request, response: Response, next: NextFunction) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");

  if (request.secure || request.headers['x-forwarded-proto'] === 'https') {
    response.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }

  next();
}

export function contentTypeGuardMiddleware(request: Request, response: Response, next: NextFunction) {
  if (!BODY_METHODS.has(request.method)) {
    next();
    return;
  }

  const contentLength = request.headers['content-length'];
  if (contentLength === '0') {
    next();
    return;
  }

  const contentType = request.headers['content-type']?.toLowerCase() ?? '';
  const isAllowed = ALLOWED_CONTENT_TYPES.some((allowed) => contentType.startsWith(allowed));

  if (isAllowed) {
    next();
    return;
  }

  const requestWithContext = request as RequestWithContext;
  const message = 'Content-Type must be application/json, form-urlencoded or multipart/form-data.';

  response.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).json({
    success: false,
    statusCode: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    message,
    error: {
      code: ErrorCode.UNSUPPORTED_MEDIA_TYPE,
      message,
    },
    requestId: requestWithContext.requestId ?? 'unknown',
    timestamp: new Date().toISOString(),
    method: request.method,
    path: request.originalUrl,
  });
}
