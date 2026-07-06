const adminEmail = process.env.ADMIN_EMAIL || 'owner@dienlanh247.vn';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

// ================================================================
// ENV HELPERS FOR SECURITY & PRODUCTION SAFETY
// ================================================================
const isProduction = () => process.env.NODE_ENV === 'production';

const isDevFeatureEnabled = () => {
  return process.env.ENABLE_DEV_ENDPOINTS === 'true' && !isProduction();
};

const isDemoAccountsEnabled = () => {
  if (isProduction()) return false;
  return process.env.ENABLE_DEMO_ACCOUNTS === 'true' || process.env.MOCK_ENABLE_DEMO_ACCOUNTS === 'true';
};

// ================================================================
// ADMIN USER REGISTRY (mock — replace with DB in production)
// Role hierarchy: superadmin > admin > staff
// ================================================================
const adminUsers = [
  {
    id: 'ADM-001',
    name: 'Owner Điện Lạnh 247',
    email: adminEmail,
    password: adminPassword,
    role: 'superadmin', // upgraded from 'owner' to align with RBAC
    status: 'active'
  },
  {
    id: 'ADM-002',
    name: 'Admin Vận hành',
    email: 'admin@dienlanh247.vn',
    password: process.env.ADMIN2_PASSWORD || 'Admin@456',
    role: 'admin',
    status: 'active'
  },
  {
    id: 'ADM-003',
    name: 'Staff Chăm sóc khách hàng',
    email: 'staff@dienlanh247.vn',
    password: process.env.STAFF_PASSWORD || 'Staff@789',
    role: 'staff',
    status: 'active'
  }
];

const adminSessions = [];

// ================================================================
// PERMISSION MAP
// Defines which permissions each role has.
// Permissions are of the form "resource:action".
// ================================================================
const ROLE_PERMISSIONS = {
  superadmin: [
    'dashboard:read',
    'products:read',
    'products:create',
    'products:update',
    'products:delete',
    'orders:read',
    'orders:update',
    'customers:read',
    'customers:update',
    'settings:read',
    'settings:update',
    'serviceRequests:read',
    'serviceRequests:update',
    'technicians:read',
    'technicians:create',
    'technicians:update',
    'technicians:delete',
    'technicians:assign',
    'adminUsers:manage'
  ],
  admin: [
    'dashboard:read',
    'products:read',
    'products:create',
    'products:update',
    'orders:read',
    'orders:update',
    'customers:read',
    'settings:read',
    'serviceRequests:read',
    'serviceRequests:update',
    'technicians:read',
    'technicians:create',
    'technicians:update',
    'technicians:assign'
  ],
  staff: [
    'dashboard:read',
    'products:read',
    'orders:read',
    'orders:update',
    'serviceRequests:read',
    'serviceRequests:update',
    'technicians:read'
  ]
};

/**
 * Check if a role has the given permission.
 * @param {string} role - 'superadmin' | 'admin' | 'staff'
 * @param {string} permission - e.g. 'products:delete'
 */
const hasPermission = (role, permission) => {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission);
};

// ================================================================
// COOKIE PARSER
// ================================================================
const parseCookies = (cookieHeader) => {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    let parts = cookie.split('=');
    list[parts.shift().trim()] = decodeURI(parts.join('='));
  });
  return list;
};

// ================================================================
// MIDDLEWARE: requireAdminAuth
// Verifies the session cookie / bearer token and attaches req.admin.
// ================================================================
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
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const session = adminSessions.find(s => s.token === token);
  if (!session) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (Date.now() > session.expiresAt) {
    const index = adminSessions.findIndex(s => s.token === token);
    if (index !== -1) adminSessions.splice(index, 1);
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const adminRaw = adminUsers.find(u => u.id === session.adminId);
  // Strip password from req.admin — never expose credentials to route handlers
  const { password: _, ...adminSafe } = adminRaw;
  req.admin = adminSafe;
  next();
};

// ================================================================
// MIDDLEWARE FACTORY: requirePermission(permission)
// Returns a middleware that checks requireAdminAuth + the permission.
// Usage: router.get('/admin/foo', requirePermission('resource:action'), handler)
// ================================================================
const requirePermission = (permission) => {
  return [
    requireAdminAuth,
    (req, res, next) => {
      if (!hasPermission(req.admin.role, permission)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      next();
    }
  ];
};

// ================================================================
// MIDDLEWARE: requireDevOnly
// Safe guard that yields 404 for dev-only endpoints in production.
// ================================================================
const requireDevOnly = (req, res, next) => {
  if (!isDevFeatureEnabled()) {
    return res.status(404).json({ success: false, message: 'Not Found' });
  }
  next();
};

module.exports = {
  adminUsers,
  adminSessions,
  requireAdminAuth,
  requirePermission,
  hasPermission,
  ROLE_PERMISSIONS,
  parseCookies,
  isProduction,
  isDevFeatureEnabled,
  isDemoAccountsEnabled,
  requireDevOnly
};
