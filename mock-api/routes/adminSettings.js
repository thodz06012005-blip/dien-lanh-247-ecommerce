const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../utils/db');
const { respondSuccess } = require('../utils/response');
const { requirePermission } = require('../utils/auth');

// GET /admin/settings — requires: settings:read (superadmin, admin)
router.get('/admin/settings', requirePermission('settings:read'), (req, res) => {
  const db = readDB();
  return respondSuccess(res, db.settings);
});

// PATCH /admin/settings — requires: settings:update (superadmin ONLY)
router.patch('/admin/settings', requirePermission('settings:update'), (req, res) => {
  const db = readDB();
  db.settings = {
    ...db.settings,
    ...req.body
  };
  writeDB(db);
  return respondSuccess(res, db.settings, 'Cập nhật cài đặt hệ thống thành công');
});

module.exports = router;
