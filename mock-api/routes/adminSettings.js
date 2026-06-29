const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../utils/db');
const { respondSuccess } = require('../utils/response');
const { requireAdminAuth } = require('../utils/auth');

// GET /admin/settings
router.get('/admin/settings', requireAdminAuth, (req, res) => {
  const db = readDB();
  return respondSuccess(res, db.settings);
});

// PATCH /admin/settings
router.patch('/admin/settings', requireAdminAuth, (req, res) => {
  const db = readDB();
  db.settings = {
    ...db.settings,
    ...req.body
  };
  writeDB(db);
  return respondSuccess(res, db.settings, 'Cập nhật cài đặt hệ thống thành công');
});

module.exports = router;
