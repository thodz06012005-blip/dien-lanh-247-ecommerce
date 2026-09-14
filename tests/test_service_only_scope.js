const { spawn } = require('child_process');

const port = 3199;
const base = `http://localhost:${port}/api/v1`;
const server = spawn(process.execPath, ['mock-api/server.js'], {
  cwd: require('path').join(__dirname, '..'),
  env: { ...process.env, PORT: String(port), SERVICE_ONLY: 'true' },
  stdio: ['ignore', 'pipe', 'pipe']
});

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function request(path, options) {
  const response = await fetch(`${base}${path}`, options);
  return { status: response.status, body: await response.json(), headers: response.headers };
}

async function run() {
  try {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try { if ((await request('/health')).status === 200) break; } catch { await wait(100); }
    }
    const health = await request('/health');
    if (health.status !== 200 || health.body.data?.backendMode !== 'MOCK' || health.body.data?.serviceOnly !== true) throw new Error('Health mode metadata is incorrect');
    if (health.headers.get('x-dl247-backend') !== 'MOCK' || health.headers.get('x-dl247-service-only') !== 'true') throw new Error('Mode headers are incorrect');

    const services = await request('/service-categories');
    if (services.status !== 200 || !services.body.success) throw new Error('Service API must stay enabled');

    for (const path of ['/products', '/categories', '/brands', '/cart', '/orders', '/admin/products', '/admin/orders']) {
      const response = await request(path);
      if (response.status !== 404 || response.body.error !== 'FEATURE_DISABLED') throw new Error(`${path} must be disabled, received ${response.status}`);
    }
    for (const path of ['/orders', '/cart', '/admin/products']) {
      const response = await request(path, { method: 'POST' });
      if (response.status !== 404 || response.body.error !== 'FEATURE_DISABLED') throw new Error(`POST ${path} must be disabled, received ${response.status}`);
    }
    console.log('SERVICE-ONLY RUNTIME CONTRACT PASSED');
  } finally {
    server.kill('SIGTERM');
  }
}

server.stderr.on('data', data => process.stderr.write(data));
run().catch(error => { console.error(error); process.exitCode = 1; });
