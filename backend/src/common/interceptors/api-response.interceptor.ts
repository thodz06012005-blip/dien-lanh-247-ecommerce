import {
  CallHandler,
  ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { map, type Observable } from 'rxjs';
import type { RequestWithContext } from '../middleware/request-context.middleware';

interface ExistingEnvelope extends Record<string, unknown> {
  success: boolean;
}

function isExistingEnvelope(value: unknown): value is ExistingEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as { success?: unknown }).success === 'boolean'
  );
}

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor<unknown, unknown> {
  intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>() as RequestWithContext;

    return next.handle().pipe(
      map((data) => {
        const metadata = {
          requestId: request.requestId ?? 'unknown',
          timestamp: new Date().toISOString(),
          path: request.originalUrl,
        };

        if (isExistingEnvelope(data)) {
          return {
            ...data,
            ...metadata,
          };
        }

        return {
          success: true,
          data,
          ...metadata,
        };
      }),
    );
  }
}
