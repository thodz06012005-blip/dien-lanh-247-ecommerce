const express = require('express');
const router = express.Router();
const { readDB } = require('../utils/db');
const { respondSuccess } = require('../utils/response');
const { requirePermission } = require('../utils/auth');
const {
  validatePagination,
  validateSort,
  sendValidationError
} = require('../utils/validation');

// GET /admin/customers — requires: customers:read (superadmin, admin)
router.get('/admin/customers', requirePermission('customers:read'), (req, res) => {
  const errors = [];
  validatePagination(req.query, errors);
  validateSort(req.query, ['name', 'phone', 'email', 'orderCount', 'totalSpent', 'createdAt'], errors);

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const db = readDB();
  return respondSuccess(res, db.customers);
});

module.exports = router;
