import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, type ErrorCodeValue } from '../constants/error-codes';

export interface BusinessExceptionOptions {
  code?: ErrorCodeValue | string;
  status?: HttpStatus;
  details?: unknown;
}

export class BusinessException extends HttpException {
  readonly code: ErrorCodeValue | string;
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
