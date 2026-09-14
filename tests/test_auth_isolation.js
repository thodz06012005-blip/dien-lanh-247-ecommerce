const assert = require('assert');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '../mock-api/mock-db.json');
const originalDb = fs.readFileSync(dbPath, 'utf8');

const port = 3201;
const base = `http://localhost:${port}/api/v1`;
const server = spawn(process.execPath, ['mock-api/server.js'], {
  cwd: path.join(__dirname, '..'),
  env: { ...process.env, PORT: String(port), NODE_ENV: 'development', SERVICE_ONLY: 'true', ENABLE_DEMO_ACCOUNTS: 'true', DEMO_ADMIN_EMAIL: 'owner@dienlanh247.vn', DEMO_ADMIN_PASSWORD: 'Admin@123456', DEMO_ADMIN2_EMAIL: 'admin@dienlanh247.vn', DEMO_ADMIN2_PASSWORD: 'Admin@456789', DEMO_STAFF_EMAIL: 'staff@dienlanh247.vn', DEMO_STAFF_PASSWORD: 'Staff@789012' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const cookies = new Map();
const updateCookies = (response) => {
  const values = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
  for (const value of values) {
    const [pair] = value.split(';');
    const [name, ...rest] = pair.split('=');
    cookies.set(name, rest.join('='));
  }
};
const request = async (url, options = {}) => {
  const response = await fetch(base + url, { ...options, headers: { 'Content-Type': 'application/json', Cookie: Array.from(cookies).map(([key, value]) => `${key}=${value}`).join('; '), ...options.headers } });
  updateCookies(response);
  return { status: response.status, body: await response.json() };
};

async function run() {
  try {
    for (let i = 0; i < 30; i += 1) { try { if ((await request('/health')).status === 200) break; } catch { await wait(100); } }
    const credential = await request('/dev/demo-credentials');
    assert.strictEqual(credential.status, 200);
    const adminLogin = await request('/admin/auth/login', { method: 'POST', body: JSON.stringify(credential.body.data) });
    assert.strictEqual(adminLogin.status, 200);
    assert.ok(cookies.has('admin_access') && cookies.has('admin_refresh'));
    const customerLogin = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'customer@example.com', password: 'Customer@123' }) });
    assert.strictEqual(customerLogin.status, 200);
    assert.ok(cookies.has('customer_access') && cookies.has('customer_refresh'));
    assert.strictEqual((await request('/admin/auth/me')).status, 200);
    assert.strictEqual((await request('/auth/me')).status, 200);
    assert.strictEqual((await request('/admin/auth/refresh', { method: 'POST', body: '{}' })).status, 200);
    assert.strictEqual((await request('/admin/auth/logout', { method: 'POST', body: '{}' })).status, 200);
    assert.strictEqual((await request('/auth/me')).status, 200, 'admin logout must not clear customer session');
    assert.strictEqual((await request('/admin/auth/me')).status, 401);

    const roleLogin = async (email, password) => {
      const response = await fetch(base + '/admin/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const body = await response.json();
      return body.data.token;
    };
    const withRole = async (token, url, options = {}) => {
      const response = await fetch(base + url, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
      return response.status;
    };
    const staff = await roleLogin('staff@dienlanh247.vn', 'Staff@789012');
    assert.strictEqual(await withRole(staff, '/admin/service-requests'), 200);
    assert.strictEqual(await withRole(staff, '/admin/technicians'), 200);
    assert.strictEqual(await withRole(staff, '/admin/finance/report'), 403);
    assert.strictEqual(await withRole(staff, '/admin/customers'), 403);
    assert.strictEqual(await withRole(staff, '/admin/service-requests/unknown/assign-technician', { method: 'PATCH', body: JSON.stringify({ technicianId: 'TECH-001' }) }), 403);
    const admin = await roleLogin('admin@dienlanh247.vn', 'Admin@456789');
    assert.strictEqual(await withRole(admin, '/admin/finance/report'), 200);
    assert.strictEqual(await withRole(admin, '/admin/settings'), 403);
    const owner = await roleLogin('owner@dienlanh247.vn', 'Admin@123456');
    assert.strictEqual(await withRole(owner, '/admin/settings'), 200);
    assert.strictEqual(await withRole(owner, '/admin/finance/audit-logs'), 200);
    console.log('PASS: session isolation, refresh and STAFF/ADMIN/SUPERADMIN endpoint matrix');
  } finally { server.kill('SIGTERM'); fs.writeFileSync(dbPath, originalDb); }
}
server.stderr.on('data', data => process.stderr.write(data));
run().catch(error => { console.error(error); process.exitCode = 1; });
