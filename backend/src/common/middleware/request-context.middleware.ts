import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export interface RequestWithContext extends Request {
  requestId: string;
}

function normalizeRequestId(value: string | undefined): string | null {
  const requestId = value?.trim();
  if (!requestId || requestId.length > 128) return null;
  if (!/^[A-Za-z0-9._:-]+$/.test(requestId)) return null;
  return requestId;
}

export function requestContextMiddleware(request: Request, response: Response, next: NextFunction) {
  const requestId = normalizeRequestId(request.header('x-request-id')) ?? randomUUID();
  (request as RequestWithContext).requestId = requestId;
  response.setHeader('X-Request-Id', requestId);
  next();
}
