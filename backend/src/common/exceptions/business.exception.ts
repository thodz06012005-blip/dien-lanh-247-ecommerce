import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../constants/error-codes';

export interface BusinessExceptionOptions {
  code?: string;
  status?: HttpStatus;
  details?: unknown;
}

export class BusinessException extends HttpException {
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, options: BusinessExceptionOptions = {}) {
    const code = options.code ?? ErrorCode.BUSINESS_RULE_VIOLATION;
    const status = options.status ?? HttpStatus.BAD_REQUEST;

    super(
      {
        success: false,
        code,
        message,
        details: options.details,
      },
      status,
    );

    this.name = BusinessException.name;
    this.code = code;
    this.details = options.details;
  }
}
