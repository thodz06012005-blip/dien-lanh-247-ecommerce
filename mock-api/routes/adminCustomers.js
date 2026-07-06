const express = require('express');
const router = express.Router();
const { readDB } = require('../utils/db');
const { respondSuccess } = require('../utils/response');
const { requirePermission } = require('../utils/auth');

// GET /admin/customers — requires: customers:read (superadmin, admin)
router.get('/admin/customers', requirePermission('customers:read'), (req, res) => {
  const db = readDB();
  return respondSuccess(res, db.customers);
});

module.exports = router;
