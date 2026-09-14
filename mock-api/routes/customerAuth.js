const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const { respondSuccess, respondCreated, respondError } = require('../utils/response');
const { parseCookies } = require('../utils/auth');

const sessions = [];
const customerIds = new Map([['khachhang@gmail.com', 1]]);
const cookieOptions = {
  access: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/v1', maxAge: 15 * 60 * 1000 },
  refresh: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/v1/auth/refresh', maxAge: 7 * 24 * 60 * 60 * 1000 },
};
const issueSession = (user) => {
  const session = { access: `customer_access_${crypto.randomBytes(16).toString('hex')}`, refresh: `customer_refresh_${crypto.randomBytes(24).toString('hex')}`, user, accessExpiresAt: Date.now() + 15 * 60 * 1000, refreshExpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  sessions.push(session);
  return session;
};
const setCookies = (res, session) => {
  res.cookie('customer_access', session.access, cookieOptions.access);
  res.cookie('customer_refresh', session.refresh, cookieOptions.refresh);
};
const clearCookies = (res) => {
  res.clearCookie('customer_access', { ...cookieOptions.access, maxAge: undefined });
  res.clearCookie('customer_refresh', { ...cookieOptions.refresh, maxAge: undefined });
};
const requireCustomer = (req, res, next) => {
  const token = parseCookies(req.headers.cookie).customer_access;
  const session = sessions.find(item => item.access === token && item.accessExpiresAt > Date.now());
  if (!session) return respondError(res, 401, 'Unauthorized', 'UNAUTHORIZED');
  req.customer = session.user;
  next();
};
const getCustomerFromRequest = (req) => {
  const token = parseCookies(req.headers.cookie).customer_access;
  return sessions.find(item => item.access === token && item.accessExpiresAt > Date.now())?.user || null;
};
const userFromBody = (body) => {
  const email = String(body.email || 'khachhang@gmail.com').toLowerCase();
  if (!customerIds.has(email)) customerIds.set(email, customerIds.size + 1);
  return { id: customerIds.get(email), email, role: 'user', firstName: body.firstName || email.split('@')[0] || 'Khách Hàng', lastName: body.lastName || 'Demo', phone: body.phone || '0987654321', city: '', district: '', addressDetail: '' };
};

router.post('/auth/login', (req, res) => {
  const user = userFromBody(req.body);
  const session = issueSession(user);
  setCookies(res, session);
  return respondSuccess(res, user, 'Đăng nhập thành công');
});
router.post('/auth/register', (req, res) => {
  const user = userFromBody(req.body);
  const session = issueSession(user);
  setCookies(res, session);
  return respondCreated(res, user, 'Đăng ký thành công');
});
router.post('/auth/refresh', (req, res) => {
  const token = parseCookies(req.headers.cookie).customer_refresh;
  const index = sessions.findIndex(item => item.refresh === token && item.refreshExpiresAt > Date.now());
  if (index < 0) { clearCookies(res); return respondError(res, 401, 'Phiên làm việc đã hết hạn', 'INVALID_REFRESH_TOKEN'); }
  const current = sessions[index];
  sessions.splice(index, 1);
  const replacement = issueSession(current.user);
  setCookies(res, replacement);
  return respondSuccess(res, null, 'Làm mới phiên khách hàng thành công');
});
router.post('/auth/logout', (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const index = sessions.findIndex(item => item.access === cookies.customer_access || item.refresh === cookies.customer_refresh);
  if (index >= 0) sessions.splice(index, 1);
  clearCookies(res);
  return respondSuccess(res, null, 'Đăng xuất thành công');
});
router.get('/auth/me', requireCustomer, (req, res) => respondSuccess(res, req.customer));

module.exports = { router, requireCustomer, getCustomerFromRequest };
