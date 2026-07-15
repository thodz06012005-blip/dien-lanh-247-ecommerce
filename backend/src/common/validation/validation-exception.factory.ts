import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { ErrorCode } from '../constants/error-codes';

interface ValidationIssue {
  field: string;
  messages: string[];
}

function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): ValidationIssue[] {
  return errors.flatMap((error) => {
    const field = parentPath ? `${parentPath}.${error.property}` : error.property;
    const current = error.constraints
      ? [{ field, messages: Object.values(error.constraints) }]
      : [];
    return [
      ...current,
      ...flattenValidationErrors(error.children ?? [], field),
    ];
  });
}

export function createValidationException(errors: ValidationError[]) {
  const details = flattenValidationErrors(errors).slice(0, 100);
  return new BadRequestException({
    code: ErrorCode.VALIDATION_ERROR,
    message: 'Dữ liệu không hợp lệ.',
    details,
  });
}
