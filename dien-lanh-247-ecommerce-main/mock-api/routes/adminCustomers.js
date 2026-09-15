const express = require('express');
const router = express.Router();
const { readDB } = require('../utils/db');
const { respondSuccess } = require('../utils/response');
const { requirePermission } = require('../utils/auth');
const {
  validatePaginationStrict,
  validateSortStrict,
  validateAllowedQueryKeys,
  validateSearchQuery,
  sendValidationError
} = require('../utils/validation');

// GET /admin/customers — requires: customers:read (superadmin, admin)
router.get('/admin/customers', requirePermission('customers:read'), (req, res) => {
  const errors = [];
  
  validateAllowedQueryKeys(req.query, [
    'page', 'limit', 'q', 'search', 'sortBy', 'sortOrder'
  ], errors);

  validatePaginationStrict(req.query, errors);
  validateSortStrict(req.query, ['name', 'phone', 'email', 'orderCount', 'totalOrders', 'totalSpent', 'createdAt'], errors);

  if (req.query.q !== undefined) validateSearchQuery(req.query, 'q', errors, 100);
  if (req.query.search !== undefined) validateSearchQuery(req.query, 'search', errors, 100);

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const db = readDB();
  return respondSuccess(res, db.customers);
});

module.exports = router;
