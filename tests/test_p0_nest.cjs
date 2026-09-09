// Runs the actual compiled Nest application against an EMPTY, disposable MySQL database.
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const path = require('node:path');
const { createRequire } = require('node:module');
const backendRequire = createRequire(path.join(__dirname, '../backend/package.json'));
const url = new URL(process.env.DATABASE_URL || 'mysql://invalid/invalid');
if (!url.pathname.endsWith('_p0_test')) throw new Error('P0 integration requires a disposable database ending in _p0_test');
process.env.JWT_ACCESS_SECRET = randomBytes(32).toString('hex');
process.env.JWT_REFRESH_SECRET = randomBytes(32).toString('hex');
process.env.NODE_ENV = 'test';
backendRequire('reflect-metadata');
const { NestFactory } = backendRequire('@nestjs/core');
const { ValidationPipe } = backendRequire('@nestjs/common');
const cookieParser = backendRequire('cookie-parser');
const bcrypt = backendRequire('bcrypt');
const { AppModule } = require('../backend/dist/app.module');
const { PrismaService } = require('../backend/dist/core/database/prisma.service');
const { HttpErrorFilter } = require('../backend/dist/common/filters/http-exception.filter');
const { DEFAULT_BUSINESS_CONFIG } = require('../mock-api/businessConfig');
async function run() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  app.setGlobalPrefix('api/v1'); app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new HttpErrorFilter());
  await app.listen(0, '127.0.0.1');
  const prisma = app.get(PrismaService); const base = `${await app.getUrl()}/api/v1`;
  async function call(method, endpoint, body, token, expected = 200) {
    const response = await fetch(base + endpoint, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await response.text(); let data; try { data = JSON.parse(text); } catch { data = text; }
    assert.equal(response.status, expected, `${method} ${endpoint}: ${text}`);
    if (expected >= 400) assert.equal(data.success, false, `${endpoint}: error envelope`);
    return data;
  }
  try {
    assert.equal(await prisma.serviceRequest.count(), 0, 'Use an empty disposable database');
    // A brand-new installation returns a valid but inactive config, never demo service areas/prices.
    const empty = (await call('GET', '/settings/public')).data;
    assert.deepEqual(empty.businessConfig.appliances, []); assert.equal(empty.hotline, '');
    const password = 'P0-test-password-Only!';
    const hash = await bcrypt.hash(password, 10);
    for (const [email, role] of [['owner-p0@example.test', 'SUPERADMIN'], ['staff-p0@example.test', 'STAFF'], ['customer-p0@example.test', 'CUSTOMER']]) await prisma.user.create({ data: { email, password: hash, role } });
    const owner = (await call('POST', '/admin/auth/login', { email: 'owner-p0@example.test', password })).data.token;
    // STAFF is not an admin-login role; use the existing general login cookie.
    await call('POST', '/admin/auth/login', { email: 'staff-p0@example.test', password }, undefined, 403);
    const staffLogin = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'staff-p0@example.test', password }) });
    assert.equal(staffLogin.status, 200);
    const staffCookie = staffLogin.headers.getSetCookie().find(value => value.startsWith('accessToken='));
    assert.ok(staffCookie, 'General login issues an access token cookie');
    const staff = staffCookie.split(';')[0].slice('accessToken='.length);
    const config = structuredClone(DEFAULT_BUSINESS_CONFIG);
    await call('PATCH', '/admin/settings', { businessConfig: config }, owner);
    const settings = (await call('GET', '/settings/public')).data;
    assert.equal(settings.businessConfig.appliances[0].priceMin, config.appliances[0].priceMin);
    assert.equal(settings.businessConfig.finance, undefined);
    await call('PATCH', '/admin/settings', { businessConfig: { ...config, appliances: [null] } }, owner, 400);
    await call('PATCH', '/admin/settings', { businessConfig: config }, staff, 403);
    await prisma.serviceCategory.create({ data: { id: 'p0-repair', name: 'Sửa chữa thử nghiệm', slug: 'p0-repair' } });
    for (const [id, phone] of [['TECH-P0', '0981112222'], ['TECH-OTHER', '0983334444']]) await prisma.technician.create({ data: { id, name: id, phone, email: `${id}@example.test`, skills: ['p0-repair'], workingAreas: ['Quận Cầu Giấy'] } });
    // New technicians have no shared/default PIN.
    await call('POST', '/technician/auth/login', { phone: '0981112222', pin: '123456' }, undefined, 401);
    await call('PATCH', '/admin/technicians/TECH-P0/access', { pin: '542321' }, staff, 403);
    await call('PATCH', '/admin/technicians/TECH-P0/access', { pin: '542321' }, owner);
    await call('PATCH', '/admin/technicians/TECH-OTHER/access', { pin: '642321' }, owner);
    const token = (await call('POST', '/technician/auth/login', { phone: '0981112222', pin: '542321' }, undefined, 201)).data.token;
    const other = (await call('POST', '/technician/auth/login', { phone: '0983334444', pin: '642321' }, undefined, 201)).data.token;
    assert.ok((await prisma.technician.findUnique({ where: { id: 'TECH-P0' } })).pinHash.startsWith('$2'));
    const session = await prisma.technicianSession.findFirst({ where: { technicianId: 'TECH-P0' } });
    assert.notEqual(session.tokenHash, token);
    assert.equal((await call('GET', '/technician/me', undefined, token)).data.pinHash, undefined);
    assert.equal((await call('GET', '/admin/technicians/TECH-P0', undefined, owner)).data.pinHash, undefined);
    await call('GET', '/admin/finance/report', undefined, token, 401);
    await call('GET', '/admin/finance/report', undefined, staff, 403);
    const nextDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const input = { customerName: 'Khách thử nghiệm', customerPhone: '0912345678', customerAddress: 'Địa chỉ kiểm thử', district: 'Quận Cầu Giấy', applianceType: 'Điều hòa', serviceCategoryId: 'p0-repair', issueDescription: 'Không mát', preferredDate: nextDate, preferredTimeSlot: '08:00 - 10:00', images: [], mediaMetadata: [] };
    await call('POST', '/service-requests', { ...input, district: 'Ngoài vùng phục vụ' }, undefined, 400);
    const job = (await call('POST', '/service-requests', input, undefined, 201)).data;
    assert.equal(typeof job.finalPrice, 'number');
    const id = job.id;
    await call('GET', `/service-requests/lookup/${id}?phone=0912345678`);
    await call('GET', `/service-requests/lookup/${id}`, undefined, undefined, 400);
    await call('GET', `/service-requests/lookup/${id}?phone=0999999999`, undefined, undefined, 404);
    await call('PATCH', `/admin/service-requests/${id}/status`, { status: 'confirmed' }, owner);
    await call('PATCH', `/admin/service-requests/${id}/assign-technician`, { technicianId: 'TECH-P0' }, owner);
    const looked = (await call('GET', `/service-requests/lookup/${id}?phone=0912345678`)).data;
    assert.equal(typeof looked.technician.rating, 'number'); assert.equal(looked.financeSnapshot, undefined);
    await call('GET', `/technician/jobs/${id}`, undefined, other, 404);
    await call('PATCH', `/technician/jobs/${id}/decision`, { decision: 'accepted' }, other, 404);
    await call('PATCH', `/technician/jobs/${id}/progress`, { status: 'in_progress' }, token, 409);
    // Refusal then reassignment must clear the old decision.
    await call('PATCH', `/technician/jobs/${id}/decision`, { decision: 'rejected', reason: 'Không thể nhận' }, token);
    await call('PATCH', `/admin/service-requests/${id}/assign-technician`, { technicianId: 'TECH-P0' }, owner);
    assert.equal((await call('GET', `/technician/jobs/${id}`, undefined, token)).data.technicianDecision, null);
    await call('PATCH', `/technician/jobs/${id}/decision`, { decision: 'accepted' }, token);
    await call('PATCH', `/technician/jobs/${id}/progress`, { status: 'in_progress' }, token);
    await call('PATCH', `/technician/jobs/${id}/inspection`, { diagnosis: 'Kiểm tra linh kiện', estimatedPrice: 1000000, customerApprovalStatus: 'pending' }, token);
    const completion = { finalPrice: 1000000, completionNote: 'Đã sửa xong', paymentStatus: 'unpaid', photos: [] };
    await call('PATCH', `/technician/jobs/${id}/complete`, completion, token, 409);
    await call('PATCH', `/admin/service-requests/${id}/inspection`, { inspectionNote: 'Khách đã xác nhận báo giá', estimatedPrice: 1000000, customerApprovalStatus: 'approved' }, owner);
    await call('PATCH', `/technician/jobs/${id}/complete`, { ...completion, finalPrice: 1100000 }, token, 409);
    // Seed only the cost for the known arithmetic fixture; all lifecycle actions are HTTP.
    await prisma.serviceRequest.update({ where: { id }, data: { partsCost: 400000 } });
    const results = await Promise.all([fetch(base + `/technician/jobs/${id}/complete`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(completion) }), fetch(base + `/technician/jobs/${id}/complete`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(completion) })]);
    assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
    assert.equal((await prisma.technician.findUnique({ where: { id: 'TECH-P0' } })).completedCount, 1);
    const month = new Date().toISOString().slice(0, 7);
    assert.equal((await call('GET', `/admin/finance/report?month=${month}`, undefined, owner)).data.totals.technicianPay, 240000);
    assert.equal((await call('GET', '/technician/earnings', undefined, token)).data.total, 240000);
    config.finance.technicianPayRate = 80;
    await call('PATCH', '/admin/settings', { businessConfig: config }, owner);
    assert.equal((await call('GET', '/technician/earnings', undefined, token)).data.total, 240000);
    await call('PATCH', `/admin/finance/requests/${id}`, { partsCost: 500000, amountCollected: 1000000, paymentStatus: 'paid', note: 'Hiệu chỉnh chi phí' }, owner);
    assert.equal((await call('GET', '/technician/earnings', undefined, token)).data.total, 200000);
    await call('PATCH', `/admin/finance/requests/${id}/settlement`, { status: 'settled' }, owner);
    await call('PATCH', `/admin/finance/requests/${id}`, { partsCost: 0, amountCollected: 0, paymentStatus: 'unpaid' }, owner, 409);
    const audit = (await call('GET', `/admin/finance/audit-logs?month=${month}`, undefined, owner)).data;
    assert.ok(audit.some(x => x.action === 'UPDATE_FINANCIALS' && x.before && x.after));
    assert.ok((await call('GET', `/admin/finance/export?month=${month}`, undefined, owner)).includes(id));
    await call('GET', '/admin/finance/report?month=invalid', undefined, owner, 400);
    await call('POST', '/technician/auth/logout', {}, token, 201);
    await call('GET', '/technician/me', undefined, token, 401);
    await call('PATCH', '/admin/technicians/TECH-OTHER/access', { pin: '111222' }, owner);
    await call('GET', '/technician/me', undefined, other, 401);
    console.log('P0 Nest/MySQL HTTP: settings, RBAC, PIN sessions, lookup, lifecycle, concurrent completion, snapshots, finance/export PASS');
  } finally { await app.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
