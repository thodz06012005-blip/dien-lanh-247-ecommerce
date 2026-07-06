const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../utils/db');
const { respondSuccess } = require('../utils/response');
const { requirePermission } = require('../utils/auth');
const { isValidEmail } = require('../utils/validators');
const {
  validateOptionalString,
  validateNumber,
  sendValidationError
} = require('../utils/validation');

// GET /admin/settings — requires: settings:read (superadmin, admin)
router.get('/admin/settings', requirePermission('settings:read'), (req, res) => {
  const errors = [];
  const { validateAllowedQueryKeys, sendValidationError } = require('../utils/validation');
  validateAllowedQueryKeys(req.query, [], errors);
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }
  const db = readDB();
  return respondSuccess(res, db.settings);
});

// PATCH /admin/settings — requires: settings:update (superadmin ONLY)
router.patch('/admin/settings', requirePermission('settings:update'), (req, res) => {
  const body = req.body;
  const errors = [];

  const allowedKeys = [
    'storeName',
    'hotline',
    'zalo',
    'email',
    'address',
    'shippingFee',
    'freeShippingThreshold'
  ];

  // Forbid non-whitelisted keys
  const bodyKeys = Object.keys(body);
  for (const key of bodyKeys) {
    if (!allowedKeys.includes(key)) {
      errors.push({ field: key, message: `Trường ${key} không được phép cập nhật` });
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  if (body.storeName !== undefined) validateOptionalString(body.storeName, 'storeName', errors, 100);
  if (body.hotline !== undefined) validateOptionalString(body.hotline, 'hotline', errors, 20);
  if (body.zalo !== undefined) validateOptionalString(body.zalo, 'zalo', errors, 20);
  if (body.address !== undefined) validateOptionalString(body.address, 'address', errors, 200);
  if (body.shippingFee !== undefined) validateNumber(body.shippingFee, 'shippingFee', errors, 0, 1000000);
  if (body.freeShippingThreshold !== undefined) {
    validateNumber(body.freeShippingThreshold, 'freeShippingThreshold', errors, 0, 100000000);
  }

  if (body.email !== undefined && body.email !== '') {
    validateOptionalString(body.email, 'email', errors, 100);
    if (!isValidEmail(body.email.trim())) {
      errors.push({ field: 'email', message: 'Email không đúng định dạng' });
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const db = readDB();
  db.settings = {
    ...db.settings,
    ...body
  };
  writeDB(db);
  return respondSuccess(res, db.settings, 'Cập nhật cài đặt hệ thống thành công');
});

module.exports = router;
