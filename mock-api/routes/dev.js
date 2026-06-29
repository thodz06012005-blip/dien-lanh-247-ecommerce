const express = require('express');
const router = express.Router();
const { writeDB } = require('../utils/db');
const { respondSuccess, respondError } = require('../utils/response');
const { getInitialData } = require('../seed/initialData');

// POST /dev/reset-db
router.post('/dev/reset-db', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return respondError(res, 403, 'Không được phép thực hiện hành động này trong môi trường sản xuất', 'FORBIDDEN');
  }
  const data = getInitialData();
  writeDB(data);
  return respondSuccess(res, {}, 'Đã khôi phục cơ sở dữ liệu mẫu về mặc định thành công!');
});

module.exports = router;
