const adminEmail = process.env.ADMIN_EMAIL || 'owner@dienlanh247.vn';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

const adminUsers = [
  {
    id: 'ADM-001',
    name: 'Owner Điện Lạnh 247',
    email: adminEmail,
    password: adminPassword,
    role: 'owner',
    status: 'active'
  }
];

const adminSessions = [];

const parseCookies = (cookieHeader) => {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    let parts = cookie.split('=');
    list[parts.shift().trim()] = decodeURI(parts.join('='));
  });
  return list;
};

const requireAdminAuth = (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    token = cookies['accessToken'];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Yêu cầu xác thực admin',
      error: 'UNAUTHORIZED'
    });
  }

  const session = adminSessions.find(s => s.token === token);

  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Phiên làm việc không tồn tại hoặc đã đăng xuất',
      error: 'INVALID_TOKEN'
    });
  }

  if (Date.now() > session.expiresAt) {
    const index = adminSessions.findIndex(s => s.token === token);
    if (index !== -1) {
      adminSessions.splice(index, 1);
    }
    return res.status(401).json({
      success: false,
      message: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
      error: 'TOKEN_EXPIRED'
    });
  }

  const admin = adminUsers.find(u => u.id === session.adminId);
  req.admin = admin;
  next();
};

module.exports = {
  adminUsers,
  adminSessions,
  requireAdminAuth,
  parseCookies
};
