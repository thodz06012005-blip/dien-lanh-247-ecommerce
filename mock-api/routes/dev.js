const express = require('express');
const router = express.Router();
const { writeDB } = require('../utils/db');
const { respondSuccess } = require('../utils/response');
const { getInitialData } = require('../seed/initialData');
const { requireDevOnly } = require('../utils/auth');
const { auditSuccess } = require('../utils/auditLog');

// POST /dev/reset-db — dev only, yields 404 in production
router.post('/dev/reset-db', requireDevOnly, (req, res) => {
  const data = getInitialData();
  writeDB(data);
  auditSuccess(req, 'DEV_RESET_DB', 'system', 'database', null, 'Database reset to default template');
  return respondSuccess(res, {}, 'Đã khôi phục cơ sở dữ liệu mẫu về mặc định thành công!');
});

module.exports = router;
