const express = require('express');
const router = express.Router();
const { DEFAULT_BUSINESS_CONFIG } = require('../businessConfig');
const { readDB } = require('../utils/db');
const { respondSuccess } = require('../utils/response');

router.get('/', (req, res) => res.json({ success: true, message: 'Điện Lạnh 247 Mock API v1 đang hoạt động ổn định!' }));
router.get('/health', (req, res) => res.status(200).json({
  success: true,
  message: 'Mock API is running',
  data: { service: 'dl247-mock-api', backendMode: 'MOCK', serviceOnly: process.env.SERVICE_ONLY !== 'false', time: new Date().toISOString() },
}));
router.get('/settings/public', (req, res) => {
  const db = readDB();
  return respondSuccess(res, {
    hotline: db.settings.hotline,
    zalo: db.settings.zalo,
    email: db.settings.email,
    address: db.settings.address,
    businessConfig: db.settings.businessConfig || DEFAULT_BUSINESS_CONFIG,
  });
});
router.get('/service-categories', (req, res) => respondSuccess(res, readDB().serviceCategories || []));

module.exports = router;
