const express = require('express');
const router = express.Router();
const { respondSuccess, respondCreated } = require('../utils/response');

// Mock Authentication (matching User client logins)
router.post('/auth/login', (req, res) => {
  const { email } = req.body;
  const mockUser = {
    id: 1,
    email: email || 'khachhang@gmail.com',
    role: 'user',
    firstName: email ? email.split('@')[0] : 'Khách Hàng',
    lastName: 'Demo',
    phone: '0987654321',
    city: 'Hà Nội',
    district: 'Cầu Giấy',
    addressDetail: 'Số 12 Ngõ 34 Trần Thái Tông',
  };
  return respondSuccess(res, mockUser, 'Đăng nhập thành công');
});

router.post('/auth/register', (req, res) => {
  const { email, firstName, lastName } = req.body;
  const mockUser = {
    id: 2,
    email: email || 'khachhang2@gmail.com',
    role: 'user',
    firstName: firstName || 'Khách',
    lastName: lastName || 'Mới',
    phone: '',
    city: '',
    district: '',
    addressDetail: '',
  };
  return respondCreated(res, mockUser, 'Đăng ký thành công');
});

router.post('/auth/logout', (req, res) => {
  return respondSuccess(res, null, 'Đăng xuất thành công');
});

router.get('/auth/me', (req, res) => {
  const mockUser = {
    id: 1,
    email: 'khachhang@gmail.com',
    role: 'user',
    firstName: 'Khách Hàng',
    lastName: 'Demo',
    phone: '0987654321',
    city: 'Hà Nội',
    district: 'Cầu Giấy',
    addressDetail: 'Số 12 Ngõ 34 Trần Thái Tông',
  };
  return respondSuccess(res, mockUser);
});

module.exports = router;
