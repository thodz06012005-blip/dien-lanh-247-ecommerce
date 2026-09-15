const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { DEFAULT_BUSINESS_CONFIG } = require('../mock-api/businessConfig');
async function run() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dl247-p0-'));
  const dbPath = path.join(dir, 'test.json');
  const db = JSON.parse(fs.readFileSync(path.join(__dirname, '../mock-api/mock-db.json')));
  db.serviceRequests = []; db.financeAuditLogs = []; db.settings.businessConfig = structuredClone(DEFAULT_BUSINESS_CONFIG);
  const category = db.serviceCategories[0];
  db.technicians = [{ id: 'TECH-P0', name: 'Thợ kiểm thử', phone: '0981112222', email: 'p0@example.test', rating: 5, skills: [category.id], workingAreas: ['Quận Cầu Giấy'], status: 'available', completedCount: 0 }];
  fs.writeFileSync(dbPath, JSON.stringify(db));
  const port = await new Promise(resolve => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
  const child = spawn(process.execPath, ['mock-api/server.js'], { cwd: path.join(__dirname, '..'), env: { ...process.env, NODE_ENV: 'test', MOCK_DB_PATH: dbPath, PORT: String(port), ENABLE_DEMO_ACCOUNTS: 'true', TECHNICIAN_DEMO_PIN: '123456' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = ''; child.stdout.on('data', c => logs += c); child.stderr.on('data', c => logs += c);
  const base = `http://127.0.0.1:${port}/api/v1`;
  async function call(method, endpoint, body, token, expected = 200) {
    const response = await fetch(base + endpoint, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await response.text(); let data; try { data = JSON.parse(text); } catch { data = text; }
    assert.equal(response.status, expected, `${method} ${endpoint}: ${text}`); return data;
  }
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) { try { await fetch(base + '/settings/public'); ready = true; break; } catch { await new Promise(r => setTimeout(r, 100)); } }
    assert.ok(ready, logs);
    const owner = (await call('POST', '/admin/auth/login', { email: 'owner@dienlanh247.vn', password: 'Admin@123' })).data.token;
    await call('GET', '/admin/finance/report', undefined, undefined, 401);
    const nextDay = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const created = (await call('POST', '/service-requests', { customerName: 'Khách kiểm thử', customerPhone: '0912345678', customerAddress: 'Địa chỉ kiểm thử', district: 'Quận Cầu Giấy', applianceType: 'Điều hòa', serviceCategoryId: category.id, issueDescription: 'Không mát', images: [], mediaMetadata: [], preferredDate: nextDay, preferredTimeSlot: '08:00 - 10:00' }, undefined, 201)).data;
    const id = created.id;
    await call('GET', `/service-requests/lookup/${id}?phone=0912345678`);
    await call('GET', `/service-requests/lookup/${id}?phone=0999999999`, undefined, undefined, 404);
    await call('PATCH', `/admin/service-requests/${id}/status`, { status: 'confirmed' }, owner);
    await call('PATCH', `/admin/service-requests/${id}/assign-technician`, { technicianId: 'TECH-P0' }, owner);
    const token = (await call('POST', '/technician/auth/login', { phone: '0981112222', pin: '123456' })).data.token;
    await call('PATCH', `/technician/jobs/${id}/decision`, { decision: 'accepted' }, token);
    await call('PATCH', `/technician/jobs/${id}/progress`, { status: 'in_progress' }, token);
    await call('PATCH', `/technician/jobs/${id}/complete`, { finalPrice: 1000000, completionNote: 'Đã sửa xong', paymentStatus: 'unpaid' }, token, 400);
    await call('PATCH', `/technician/jobs/${id}/inspection`, { diagnosis: 'Thay linh kiện', estimatedPrice: 1000000, customerApprovalStatus: 'approved' }, token);
    const stored = JSON.parse(fs.readFileSync(dbPath)); stored.serviceRequests.find(x => x.id === id).partsCost = 400000; fs.writeFileSync(dbPath, JSON.stringify(stored));
    await call('PATCH', `/technician/jobs/${id}/complete`, { finalPrice: 1000000, completionNote: 'Đã sửa xong', paymentStatus: 'unpaid' }, token);
    await call('PATCH', `/technician/jobs/${id}/complete`, { finalPrice: 1000000, completionNote: 'Gửi lại', paymentStatus: 'unpaid' }, token, 409);
    const month = new Date().toISOString().slice(0, 7);
    const report = (await call('GET', `/admin/finance/report?month=${month}`, undefined, owner)).data;
    assert.equal(report.totals.technicianPay, 240000);
    assert.equal((await call('GET', '/technician/earnings', undefined, token)).data.total, 240000);
    const config = structuredClone(DEFAULT_BUSINESS_CONFIG); config.finance.technicianPayRate = 80;
    await call('PATCH', '/admin/settings', { businessConfig: config }, owner);
    assert.equal((await call('GET', '/technician/earnings', undefined, token)).data.total, 240000);
    await call('PATCH', `/admin/finance/requests/${id}`, { partsCost: 500000, amountCollected: 1000000, paymentStatus: 'paid', note: 'Chốt lại linh kiện' }, owner);
    assert.equal((await call('GET', '/technician/earnings', undefined, token)).data.total, 200000);
    await call('PATCH', `/admin/finance/requests/${id}/settlement`, { status: 'settled' }, owner);
    await call('PATCH', `/admin/finance/requests/${id}`, { partsCost: 1, amountCollected: 0, paymentStatus: 'unpaid' }, owner, 409);
    const persisted = JSON.parse(fs.readFileSync(dbPath)); assert.equal(persisted.technicians[0].completedCount, 1);
    assert.ok((await call('GET', `/admin/finance/export?month=${month}`, undefined, owner)).includes(id));
    console.log('P0 mock HTTP: booking → dispatch → technician → completion → finance/export; immutable policy and double-submit protection PASS');
  } finally { child.kill(); await new Promise(resolve => child.once('exit', resolve)); fs.rmSync(dir, { recursive: true, force: true }); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
