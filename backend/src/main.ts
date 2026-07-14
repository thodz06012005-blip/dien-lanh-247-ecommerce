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
  securityHeadersMiddleware,
} from './common/middleware/security.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    bufferLogs: true,
  });
  const config = app.get(ConfigService);

  const host = config.get<string>('HOST', '0.0.0.0');
  const port = config.get<number>('PORT', 3000);
  const apiPrefix = config.get<string>('API_PREFIX', 'api/v1');
  const trustProxy = config.get<boolean>('TRUST_PROXY', false);
  const jsonBodyLimit = config.get<string>('JSON_BODY_LIMIT', '1mb');
  const urlencodedBodyLimit = config.get<string>('URLENCODED_BODY_LIMIT', '100kb');
  const mediaStoragePath = config.get<string>('MEDIA_STORAGE_PATH') || join(process.cwd(), 'storage');

  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix);
  }

  if (trustProxy) {
    const expressApplication = app.getHttpAdapter().getInstance() as {
      set: (setting: string, value: unknown) => void;
    };
    expressApplication.set('trust proxy', 1);
  }

  app.use(requestContextMiddleware);
  app.use(securityHeadersMiddleware);
  app.use(cookieParser());
  app.use('/uploads', serveStatic(mediaStoragePath, {
    fallthrough: false,
    immutable: true,
    maxAge: '7d',
    index: false,
  }));
  app.use(contentTypeGuardMiddleware);
  app.use(json({ limit: jsonBodyLimit }));
  app.use(urlencoded({ extended: false, limit: urlencodedBodyLimit }));

  const configuredOrigins = config.get<string>('CORS_ORIGINS', '');
  const corsOrigins = configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
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
    exposedHeaders: ['X-Request-Id'],
  });

  app.useGlobalFilters(new HttpErrorFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      stopAtFirstError: false,
    }),
  );
  app.enableShutdownHooks();

  await app.listen(port, host);
  console.log(`Điện Lạnh 247 API listening on http://${host}:${port}/${apiPrefix}`);
}

void bootstrap().catch((error: unknown) => {
  console.error('Failed to start Điện Lạnh 247 API', error);
  process.exitCode = 1;
});
