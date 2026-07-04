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
      message: 'Unauthorized'
    });
  }

  const session = adminSessions.find(s => s.token === token);

  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  if (Date.now() > session.expiresAt) {
    const index = adminSessions.findIndex(s => s.token === token);
    if (index !== -1) {
      adminSessions.splice(index, 1);
    }
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  const adminRaw = adminUsers.find(u => u.id === session.adminId);
  // Strip password from req.admin — never expose credentials to route handlers
  const { password: _, ...adminSafe } = adminRaw;
  req.admin = adminSafe;
  next();
};

module.exports = {
  adminUsers,
  adminSessions,
  requireAdminAuth,
  parseCookies
};
