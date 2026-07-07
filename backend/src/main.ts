import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { HttpErrorFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  // Disable default bodyParser to allow custom limits and pre-parsing Content-Type checks
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.setGlobalPrefix('api/v1');

  app.use(cookieParser());

  // Custom Security Headers Middleware (Plan 18 Hardening)
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:3001 http://localhost:3000 ws://localhost:3001 ws://localhost:3000 http://127.0.0.1:3001 http://127.0.0.1:3000 ws://127.0.0.1:3001 ws://127.0.0.1:3000;");
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    }
    next();
  });

  // 1. Content-Type Guard for POST/PATCH/PUT
  app.use((req: any, res: any, next: any) => {
    const method = req.method;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const contentType = req.headers['content-type'];
      const contentLength = req.headers['content-length'];
      if (contentLength === '0') {
        return next();
      }
      if (!contentType || !contentType.toLowerCase().startsWith('application/json')) {
        return res.status(415).json({
          success: false,
          message: 'Unsupported content type'
        });
      }
    }
    next();
  });

  const jsonLimit = process.env.JSON_BODY_LIMIT || '1mb';
  const urlencodedLimit = process.env.URLENCODED_BODY_LIMIT || '100kb';

  app.use(json({ limit: jsonLimit }));
  app.use(urlencoded({ extended: false, limit: urlencodedLimit }));

  // Register Global Error Filter
  app.useGlobalFilters(new HttpErrorFilter());

  const corsOriginsEnv = process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS;
  const corsOrigins = corsOriginsEnv
    ? corsOriginsEnv.split(',').map(o => o.trim()).filter(o => o.length > 0)
    : [
        'http://localhost:5174',
        'http://localhost:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:5173'
      ];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With', 'Cookie'],
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
