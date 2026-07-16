import assert from 'node:assert/strict';

const userUrl = (process.env.USER_SMOKE_URL || 'https://dienlanh247.local').replace(/\/$/, '');
const adminUrl = (process.env.ADMIN_SMOKE_URL || 'https://admin.dienlanh247.local').replace(/\/$/, '');
const apiUrl = (process.env.API_SMOKE_URL || `${userUrl}/api/v1`).replace(/\/$/, '');
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 15_000);

async function get(url, options = {}) {
  const response = await fetch(url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Accept: options.accept || '*/*', 'User-Agent': 'dl247-production-smoke/1.0' },
  });
  const body = await response.text();
  return { response, body };
}

const live = await get(`${apiUrl}/health/live`, { accept: 'application/json' });
assert.equal(live.response.status, 200);
assert.match(live.body, /"status":"ok"/);

const ready = await get(`${apiUrl}/health/ready`, { accept: 'application/json' });
assert.equal(ready.response.status, 200);
assert.match(ready.body, /"database":\{"status":"up"/);

for (const [name, url] of [
  ['customer', userUrl],
  ['admin', adminUrl],
]) {
  const page = await get(url, { accept: 'text/html' });
  assert.equal(page.response.status, 200, `${name} portal must return 200`);
  assert.match(page.body, /<!doctype html>/i, `${name} portal must return HTML`);
  assert.equal(
    page.response.headers.get('x-content-type-options'),
    'nosniff',
    `${name} portal must send no-sniff`,
  );
  if (url.startsWith('https://')) {
    assert.match(
      page.response.headers.get('strict-transport-security') || '',
      /max-age=/,
      `${name} portal must send HSTS`,
    );
  }
}

const missing = await get(`${apiUrl}/__phase15_missing__`, { accept: 'application/json' });
assert.equal(missing.response.status, 404);
assert.match(missing.body, /"success":false/);
assert.match(missing.body, /"requestId":/);

console.log('Phase 15 production smoke test passed.');
