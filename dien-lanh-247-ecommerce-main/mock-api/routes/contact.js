const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../utils/db');
const { respondSuccess } = require('../utils/response');

// POST /contact
router.post('/contact', (req, res) => {
  const db = readDB();
  const body = req.body;
  const newContact = {
    id: `contact-${Date.now()}`,
    name: body.name || '',
    phone: body.phone || '',
    email: body.email || '',
    message: body.message || '',
    createdAt: new Date().toISOString()
  };
  db.contacts.push(newContact);
  writeDB(db);
  return respondSuccess(res, {}, 'Gửi yêu cầu tư vấn thành công. Điện Lạnh 247 sẽ liên hệ với bạn trong vòng 15 phút!');
});

module.exports = router;
