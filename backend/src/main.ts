import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { json, static as serveStatic, urlencoded } from 'express';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { HttpErrorFilter } from './common/filters/http-exception.filter';
import { requestContextMiddleware } from './common/middleware/request-context.middleware';
import {
  contentTypeGuardMiddleware,
  helmetSecurityMiddleware,
} from './common/middleware/security.middleware';
import { createValidationException } from './common/validation/validation-exception.factory';
import { AuditLogService } from './modules/audit/audit-log.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    bufferLogs: true,
  });
  const config = app.get(ConfigService);
  const auditLogService = app.get(AuditLogService);

  const host = config.get<string>('HOST', '0.0.0.0');
  const port = config.get<number>('PORT', 3000);
  const apiPrefix = config.get<string>('API_PREFIX', 'api/v1');
  const trustProxy = config.get<boolean>('TRUST_PROXY', false);
  const jsonBodyLimit = config.get<string>('JSON_BODY_LIMIT', '1mb');
  const urlencodedBodyLimit = config.get<string>(
    'URLENCODED_BODY_LIMIT',
    '100kb',
  );
  const mediaStoragePath =
    config.get<string>('MEDIA_STORAGE_PATH') || join(process.cwd(), 'storage');

  if (apiPrefix) app.setGlobalPrefix(apiPrefix);

  const expressApplication = app.getHttpAdapter().getInstance() as {
    set: (setting: string, value: unknown) => void;
    disable: (setting: string) => void;
  };
  expressApplication.disable('x-powered-by');
  if (trustProxy) expressApplication.set('trust proxy', 1);

  app.use(requestContextMiddleware);
  app.use(helmetSecurityMiddleware);
  app.use(cookieParser());
  app.use(
    '/uploads',
    serveStatic(mediaStoragePath, {
      fallthrough: false,
      immutable: true,
      maxAge: '7d',
      index: false,
      dotfiles: 'deny',
      redirect: false,
      setHeaders: (response) => {
        response.setHeader('X-Content-Type-Options', 'nosniff');
        response.setHeader('Content-Disposition', 'inline');
      },
    }),
  );
  app.use(contentTypeGuardMiddleware);
  app.use(json({ limit: jsonBodyLimit, strict: true }));
  app.use(
    urlencoded({
      extended: false,
      limit: urlencodedBodyLimit,
      parameterLimit: 100,
    }),
  );

  const corsOrigins = config
    .get<string>('CORS_ORIGINS', '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Accept',
      'Authorization',
      'Content-Type',
      'Cookie',
      'X-Confirm-Dangerous-Action',
      'X-Request-Id',
      'X-Requested-With',
    ],
    exposedHeaders: ['Retry-After', 'X-Request-Id'],
    maxAge: 600,
    optionsSuccessStatus: 204,
  });

  app.useGlobalFilters(new HttpErrorFilter(auditLogService));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
      validationError: { target: false, value: false },
      exceptionFactory: createValidationException,
    }),
  );
  app.enableShutdownHooks();

  await app.listen(port, host);
  console.log(`Điện Lạnh 247 API listening on http://${host}:${port}/${apiPrefix}`);
}

void bootstrap().catch((error: unknown) => {
  console.error('Failed to start Điện Lạnh 247 API', {
    name: error instanceof Error ? error.name : 'UnknownError',
    message: error instanceof Error ? error.message : 'Startup failed',
  });
  process.exitCode = 1;
});
