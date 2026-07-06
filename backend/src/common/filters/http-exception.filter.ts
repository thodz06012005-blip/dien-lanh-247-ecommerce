import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : (exception.status || exception.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);

    // Handle 413 Payload Too Large
    if (status === HttpStatus.PAYLOAD_TOO_LARGE || exception.type === 'entity.too.large') {
      return response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
        success: false,
        message: 'Payload too large',
      });
    }

    // Handle 415 Unsupported Media Type
    if (status === HttpStatus.UNSUPPORTED_MEDIA_TYPE) {
      return response.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).json({
        success: false,
        message: 'Unsupported content type',
      });
    }

    // Handle Malformed JSON (SyntaxError from body-parser)
    if (exception instanceof SyntaxError && (exception as any).status === 400 && 'body' in exception) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Invalid JSON payload',
      });
    }

    // Fallback: If exception is a NestJS HttpException, respond with its response structure
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      return response.status(status).json(res);
    }

    // Fallback for generic server errors (hide stack trace in production)
    return response.status(status).json({
      statusCode: status,
      message: exception.message || 'Internal server error',
    });
  }
}
