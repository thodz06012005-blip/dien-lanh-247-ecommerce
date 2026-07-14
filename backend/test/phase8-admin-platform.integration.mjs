import assert from 'node:assert/strict';

const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:3000/api/v1';
const email = process.env.ADMIN_TEST_EMAIL || 'admin@dienlanh247.vn';
const password = process.env.ADMIN_TEST_PASSWORD || 'Phase8Admin@12345';

function setCookies(response) {
  if (typeof response.headers.getSetCookie === 'function') return response.headers.getSetCookie();
  const value = response.headers.get('set-cookie');
  return value ? value.split(/,(?=[^;,]+=)/g) : [];
}

function cookieFrom(response, name) {
  const cookie = setCookies(response).find((value) => value.startsWith(`${name}=`));
  assert.ok(cookie, `missing ${name} cookie`);
  return cookie.split(';')[0];
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  let body = null;
  try { body = await response.json(); } catch { body = null; }
  return { response, body };
}

async function login() {
  const result = await request('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assert.equal(result.response.status, 200, JSON.stringify(result.body));
  assert.equal(result.body?.success, true);
  assert.equal(result.body?.data?.admin?.role, 'admin');
  assert.ok(result.body?.data?.permissions?.includes('dashboard.view'));
  assert.ok(result.body?.data?.permissions?.includes('settings.view'));
  assert.equal(result.body?.data?.permissions?.includes('settings.manage'), false);
  assert.equal('token' in (result.body?.data || {}), false, 'raw access token must not be in JSON');
  assert.equal('refreshToken' in (result.body?.data || {}), false, 'raw refresh token must not be in JSON');
  const access = cookieFrom(result.response, 'adminAccessToken');
  const refresh = cookieFrom(result.response, 'adminRefreshToken');
  const allCookies = setCookies(result.response).join('\n');
  assert.match(allCookies, /adminAccessToken=.*HttpOnly/i);
  assert.match(allCookies, /adminRefreshToken=.*HttpOnly/i);
  assert.doesNotMatch(allCookies, /(?:^|\s)accessToken=/);
  return { access, refresh };
}

console.log('Phase 8 admin integration: unauthenticated dashboard');
{
  const result = await request('/admin/dashboard');
  assert.equal(result.response.status, 401);
}

console.log('Phase 8 admin integration: login and permission payload');
const firstSession = await login();

console.log('Phase 8 admin integration: current profile');
{
  const result = await request('/admin/auth/me', { headers: { Cookie: firstSession.access } });
  assert.equal(result.response.status, 200, JSON.stringify(result.body));
  assert.ok(result.body?.data?.admin?.permissions?.includes('profile.view'));
}

console.log('Phase 8 admin integration: real dashboard snapshot');
{
  const result = await request('/admin/dashboard', { headers: { Cookie: firstSession.access } });
  assert.equal(result.response.status, 200, JSON.stringify(result.body));
  const data = result.body?.data;
  assert.equal(typeof data?.kpis?.totalOrders, 'number');
  assert.equal(typeof data?.kpis?.totalProducts, 'number');
  assert.ok(Array.isArray(data?.charts?.revenue7d));
  assert.equal(data.charts.revenue7d.length, 7);
  assert.ok(Array.isArray(data?.charts?.orderStatus));
  assert.ok(Array.isArray(data?.charts?.serviceStatus));
  assert.ok(Array.isArray(data?.attention));
  assert.ok(Array.isArray(data?.recentOrders));
}

console.log('Phase 8 admin integration: backend permission denial');
{
  const result = await request('/admin/settings', {
    method: 'PATCH',
    headers: { Cookie: firstSession.access },
    body: JSON.stringify({}),
  });
  assert.equal(result.response.status, 403, JSON.stringify(result.body));
}

console.log('Phase 8 admin integration: profile and session list');
{
  const profile = await request('/admin/auth/profile', {
    method: 'PATCH',
    headers: { Cookie: firstSession.access },
    body: JSON.stringify({ firstName: 'Quản trị', lastName: 'Điện Lạnh', phone: '0912345678' }),
  });
  assert.equal(profile.response.status, 200, JSON.stringify(profile.body));
  assert.equal(profile.body?.data?.admin?.firstName, 'Quản trị');

  const sessions = await request('/admin/auth/sessions', { headers: { Cookie: firstSession.access } });
  assert.equal(sessions.response.status, 200, JSON.stringify(sessions.body));
  assert.ok(Array.isArray(sessions.body?.data));
  assert.ok(sessions.body.data.some((session) => session.current && session.active));
}

console.log('Phase 8 admin integration: refresh rotation and reuse detection');
let rotatedRefresh = '';
{
  const refreshed = await request('/admin/auth/refresh', {
    method: 'POST',
    headers: { Cookie: firstSession.refresh },
  });
  assert.equal(refreshed.response.status, 200, JSON.stringify(refreshed.body));
  rotatedRefresh = cookieFrom(refreshed.response, 'adminRefreshToken');
  assert.notEqual(rotatedRefresh, firstSession.refresh);

  const reused = await request('/admin/auth/refresh', {
    method: 'POST',
    headers: { Cookie: firstSession.refresh },
  });
  assert.equal(reused.response.status, 403, JSON.stringify(reused.body));

  const familyRevoked = await request('/admin/auth/refresh', {
    method: 'POST',
    headers: { Cookie: rotatedRefresh },
  });
  assert.equal(familyRevoked.response.status, 403, JSON.stringify(familyRevoked.body));
}

console.log('Phase 8 admin integration: per-session logout');
{
  const session = await login();
  const logout = await request('/admin/auth/logout', {
    method: 'POST',
    headers: { Cookie: session.access },
  });
  assert.equal(logout.response.status, 200, JSON.stringify(logout.body));

  const afterLogout = await request('/admin/auth/me', { headers: { Cookie: session.access } });
  assert.equal(afterLogout.response.status, 401);
}

console.log('Phase 8 admin platform integration passed.');
