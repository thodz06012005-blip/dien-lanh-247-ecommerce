const express = require('express');
const router = express.Router();
const { readDB } = require('../utils/db');
const { respondSuccess } = require('../utils/response');
const { requireAdminAuth } = require('../utils/auth');

// GET /admin/customers
router.get('/admin/customers', requireAdminAuth, (req, res) => {
  const db = readDB();
  return respondSuccess(res, db.customers);
});

module.exports = router;
