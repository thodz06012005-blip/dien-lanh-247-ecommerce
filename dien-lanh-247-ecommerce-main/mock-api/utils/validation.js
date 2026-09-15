/**
 * Mock API Input Validation & Query Hardening Helpers (Plan 12)
 * Standardizes query parameters, sanitizes search inputs, and protects against object injection.
 */

const { respondError } = require('./response');

const isString = (val) => typeof val === 'string';

const isNonEmptyString = (val) => isString(val) && val.trim().length > 0;

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};

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

// ================================================================
// QUERY HARDENING HELPERS (Plan 12)
// ================================================================

/**
 * Validate that query only contains allowed keys to prevent Object Injection / Pollution.
 */
const validateAllowedQueryKeys = (query, allowedKeys, errors) => {
  if (!query || typeof query !== 'object') return;
  const keys = Object.keys(query);
  for (const key of keys) {
    if (!allowedKeys.includes(key)) {
      errors.push({ field: key, message: `Tham số truy vấn '${key}' không hợp lệ` });
    }
    // Deep check to prevent Object Injection/Pollution via nested query parameters (e.g. ?sortBy[constructor]=1)
    if (query[key] !== null && typeof query[key] === 'object') {
      errors.push({ field: key, message: `Tham số truy vấn '${key}' không được là một đối tượng hoặc mảng` });
    }
  }
};

/**
 * Strictly validates pagination parameters.
 */
const validatePaginationStrict = (query, errors) => {
  if (query.page !== undefined) {
    validateInteger(query.page, 'page', errors, 1, 100000, false);
  }
  if (query.limit !== undefined) {
    validateInteger(query.limit, 'limit', errors, 1, 100, false); // limit strictly capped at 100
  }
};

/**
 * Strictly validates sorting parameters.
 */
const validateSortStrict = (query, allowedFields, errors) => {
  if (query.sortBy !== undefined) {
    validateEnum(query.sortBy, allowedFields, 'sortBy', errors, false);
  }
  if (query.sortOrder !== undefined) {
    // Normalize and strictly enforce asc / desc
    const order = String(query.sortOrder).toLowerCase();
    if (order !== 'asc' && order !== 'desc') {
      errors.push({ field: 'sortOrder', message: 'sortOrder chỉ nhận giá trị: asc hoặc desc' });
    }
  }
};

/**
 * Validates range numeric queries (e.g. minPrice and maxPrice).
 */
const validateRangeQuery = (query, minKey, maxKey, errors) => {
  let minVal = null;
  let maxVal = null;

  if (query[minKey] !== undefined) {
    validateNumber(query[minKey], minKey, errors, 0, 1000000000, false);
    minVal = Number(query[minKey]);
  }
  if (query[maxKey] !== undefined) {
    validateNumber(query[maxKey], maxKey, errors, 0, 1000000000, false);
    maxVal = Number(query[maxKey]);
  }

  if (minVal !== null && maxVal !== null && !isNaN(minVal) && !isNaN(maxVal)) {
    if (minVal > maxVal) {
      errors.push({ field: minKey, message: `${minKey} không được lớn hơn ${maxKey}` });
    }
  }
};

/**
 * Validates range date queries (e.g. dateFrom and dateTo).
 */
const validateDateRangeQuery = (query, fromKey, toKey, errors) => {
  let fromVal = null;
  let toVal = null;

  if (query[fromKey] !== undefined) {
    validateDate(query[fromKey], fromKey, errors, false);
    fromVal = Date.parse(query[fromKey]);
  }
  if (query[toKey] !== undefined) {
    validateDate(query[toKey], toKey, errors, false);
    toVal = Date.parse(query[toKey]);
  }

  if (fromVal !== null && toVal !== null && !isNaN(fromVal) && !isNaN(toVal)) {
    if (fromVal > toVal) {
      errors.push({ field: fromKey, message: `${fromKey} không được lớn hơn ${toKey}` });
    }
  }
};

/**
 * Validates search keyword input to avoid regex execution block or resource exhaustion.
 */
const validateSearchQuery = (query, key, errors, maxLen = 100) => {
  if (query[key] === undefined) return;
  if (!isString(query[key])) {
    errors.push({ field: key, message: `Từ khóa tìm kiếm phải là chuỗi ký tự` });
    return;
  }
  const trimmed = query[key].trim();
  if (trimmed.length === 0) {
    errors.push({ field: key, message: `Từ khóa tìm kiếm không được để trống` });
    return;
  }
  if (trimmed.length > maxLen) {
    errors.push({ field: key, message: `Từ khóa tìm kiếm không được vượt quá ${maxLen} ký tự` });
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
  escapeRegExp,
  validateRequiredString,
  validateOptionalString,
  validateEnum,
  validateNumber,
  validateInteger,
  validateArrayOfStrings,
  validateDate,
  validateAllowedQueryKeys,
  validatePaginationStrict,
  validateSortStrict,
  validateRangeQuery,
  validateDateRangeQuery,
  validateSearchQuery,
  sendValidationError
};
