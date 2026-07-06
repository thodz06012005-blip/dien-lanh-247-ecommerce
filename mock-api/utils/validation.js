/**
 * Mock API Input Validation Helpers (Plan 11)
 * Standardizes sanitization and validation for query, params, and body inputs.
 */

const { respondError } = require('./response');

const isString = (val) => typeof val === 'string';

const isNonEmptyString = (val) => isString(val) && val.trim().length > 0;

const validateRequiredString = (val, fieldName, errors, minLen = 1, maxLen = 1000) => {
  if (val === undefined || val === null) {
    errors.push({ field: fieldName, message: `${fieldName} là bắt buộc` });
    return;
  }
  if (!isString(val)) {
    errors.push({ field: fieldName, message: `${fieldName} phải là chuỗi ký tự` });
    return;
  }
  const trimmed = val.trim();
  if (trimmed.length < minLen || trimmed.length > maxLen) {
    errors.push({ field: fieldName, message: `${fieldName} phải có độ dài từ ${minLen} đến ${maxLen} ký tự` });
  }
};

const validateOptionalString = (val, fieldName, errors, maxLen = 1000) => {
  if (val === undefined || val === null) return;
  if (!isString(val)) {
    errors.push({ field: fieldName, message: `${fieldName} phải là chuỗi ký tự` });
    return;
  }
  const trimmed = val.trim();
  if (trimmed.length > maxLen) {
    errors.push({ field: fieldName, message: `${fieldName} không được vượt quá ${maxLen} ký tự` });
  }
};

const validateEnum = (val, allowedValues, fieldName, errors, isRequired = true) => {
  if (val === undefined || val === null) {
    if (isRequired) {
      errors.push({ field: fieldName, message: `${fieldName} là bắt buộc` });
    }
    return;
  }
  if (!allowedValues.includes(val)) {
    errors.push({ field: fieldName, message: `${fieldName} phải là một trong các giá trị: ${allowedValues.join(', ')}` });
  }
};

const validateNumber = (val, fieldName, errors, min = 0, max = Infinity, isRequired = true) => {
  if (val === undefined || val === null) {
    if (isRequired) {
      errors.push({ field: fieldName, message: `${fieldName} là bắt buộc` });
    }
    return;
  }
  const num = Number(val);
  if (isNaN(num)) {
    errors.push({ field: fieldName, message: `${fieldName} phải là số` });
    return;
  }
  if (num < min || num > max) {
    errors.push({ field: fieldName, message: `${fieldName} phải nằm trong khoảng từ ${min} đến ${max}` });
  }
};

const validateInteger = (val, fieldName, errors, min = 0, max = Infinity, isRequired = true) => {
  if (val === undefined || val === null) {
    if (isRequired) {
      errors.push({ field: fieldName, message: `${fieldName} là bắt buộc` });
    }
    return;
  }
  const num = Number(val);
  if (!Number.isInteger(num)) {
    errors.push({ field: fieldName, message: `${fieldName} phải là số nguyên` });
    return;
  }
  if (num < min || num > max) {
    errors.push({ field: fieldName, message: `${fieldName} phải nằm trong khoảng từ ${min} đến ${max}` });
  }
};

const validateArrayOfStrings = (val, fieldName, errors, minItems = 0, maxItems = 50) => {
  if (val === undefined || val === null) return;
  if (!Array.isArray(val)) {
    errors.push({ field: fieldName, message: `${fieldName} phải là mảng` });
    return;
  }
  if (val.length < minItems || val.length > maxItems) {
    errors.push({ field: fieldName, message: `${fieldName} phải có từ ${minItems} đến ${maxItems} phần tử` });
    return;
  }
  for (let i = 0; i < val.length; i++) {
    if (!isString(val[i]) || val[i].trim().length === 0) {
      errors.push({ field: `${fieldName}[${i}]`, message: `Mỗi phần tử trong ${fieldName} phải là chuỗi không rỗng` });
    }
  }
};

const validateDate = (val, fieldName, errors, isRequired = true) => {
  if (val === undefined || val === null) {
    if (isRequired) {
      errors.push({ field: fieldName, message: `${fieldName} là bắt buộc` });
    }
    return;
  }
  if (!isString(val)) {
    errors.push({ field: fieldName, message: `${fieldName} phải là chuỗi ngày tháng định dạng YYYY-MM-DD` });
    return;
  }
  const parsed = Date.parse(val);
  if (isNaN(parsed)) {
    errors.push({ field: fieldName, message: `${fieldName} không đúng định dạng ngày tháng` });
  }
};

const validatePagination = (query, errors) => {
  if (query.page !== undefined) {
    validateInteger(query.page, 'page', errors, 1, 100000, false);
  }
  if (query.limit !== undefined) {
    validateInteger(query.limit, 'limit', errors, 1, 100, false); // limit max 100
  }
};

const validateSort = (query, allowedFields, errors) => {
  if (query.sortBy !== undefined) {
    validateEnum(query.sortBy, allowedFields, 'sortBy', errors, false);
  }
  if (query.sortOrder !== undefined) {
    validateEnum(query.sortOrder, ['asc', 'desc', 'ASC', 'DESC'], 'sortOrder', errors, false);
  }
};

const sendValidationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.map(err => ({
      field: err.field,
      message: err.message
    }))
  });
};

module.exports = {
  isNonEmptyString,
  validateRequiredString,
  validateOptionalString,
  validateEnum,
  validateNumber,
  validateInteger,
  validateArrayOfStrings,
  validateDate,
  validatePagination,
  validateSort,
  sendValidationError
};
