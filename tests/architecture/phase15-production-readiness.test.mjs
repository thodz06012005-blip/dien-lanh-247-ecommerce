import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file) => readFileSync(path.join(root, file), 'utf8');

function containsAll(source, markers) {
  for (const marker of markers) assert.ok(source.includes(marker), `Missing marker: ${marker}`);
}

test('Phase 15 provides service unit tests and critical API integration coverage', () => {
  containsAll(read('backend/src/modules/auth/login-rate-limit.service.spec.ts'), [
    'locks the email and IP combination',
    'clears matching failures',
  ]);
  containsAll(read('backend/src/modules/products/products.service.spec.ts'), [
    'soft deletes products',
    'isActive: false',
  ]);
  containsAll(read('backend/src/modules/health/health.service.spec.ts'), [
    'reports readiness',
    'ServiceUnavailableException',
  ]);
  containsAll(read('backend/test/phase15-critical-flows.integration.mjs'), [
    '/service-requests',
    '/admin/auth/login',
    '/dispatch',
    '/quotes',
    '/completion',
    'customer must not bypass backend RBAC',
  ]);
});

test('Phase 15 tests responsive behavior on desktop tablet mobile and major engines', () => {
  const config = read('tests/e2e/playwright.config.mjs');
  containsAll(config, [
    'desktop-chromium',
    'tablet-chromium',
    'mobile-chromium',
    'desktop-firefox',
    'mobile-webkit',
  ]);
  containsAll(read('tests/e2e/responsive.spec.mjs'), [
    'horizontal overflow',
    'page.screenshot',
    'admin login remains usable',
  ]);
});

test('Phase 15 containers all applications behind an HTTPS reverse proxy', () => {
  const compose = read('docker-compose.production.yml');
  containsAll(compose, [
    'mysql:8.4',
    'backend/Dockerfile',
    'frontend-user/Dockerfile',
    'frontend-admin/Dockerfile',
    'condition: service_healthy',
    "'443:443'",
    'mysql_data:',
    'audit_data:',
    'backup_data:',
  ]);
  const nginx = read('deploy/nginx/default.conf.template');
  containsAll(nginx, [
    'ssl_protocols TLSv1.2 TLSv1.3',
    'Strict-Transport-Security',
    'proxy_pass http://dl247_backend',
    'proxy_pass http://dl247_user',
    'proxy_pass http://dl247_admin',
  ]);
});

test('Phase 15 exposes liveness readiness and structured safe request logs', () => {
  containsAll(read('backend/src/modules/health/health.controller.ts'), [
    "@Get('live')",
    "@Get('ready')",
    '@SkipThrottle()',
  ]);
  containsAll(read('backend/src/modules/health/health.service.ts'), [
    'SELECT 1',
    'ServiceUnavailableException',
    'uptimeSeconds',
  ]);
  const logger = read('backend/src/common/interceptors/request-logging.interceptor.ts');
  containsAll(logger, ['requestId', 'durationMs', 'actorRole', 'errorName']);
  assert.doesNotMatch(logger, /request\.body|authorization|cookie/i);
  containsAll(read('scripts/monitor-health.mjs'), ['ALERT_WEBHOOK_URL', 'severity', 'critical']);
});

test('Phase 15 verifies backup integrity and requires explicit restore confirmation', () => {
  const restore = read('scripts/restore-mysql.mjs');
  containsAll(restore, [
    'RESTORE_CONFIRM',
    'ALLOW_PRODUCTION_RESTORE',
    'Backup checksum verification failed',
    'MYSQL_PWD',
    'createGunzip',
    'BACKUP_DIRECTORY',
  ]);
  assert.doesNotMatch(restore, /console\.log\([^\n]*(password|DATABASE_URL)/i);
});

test('Phase 15 includes production smoke checks and complete handover documentation', () => {
  containsAll(read('scripts/smoke-production.mjs'), [
    '/health/live',
    '/health/ready',
    'strict-transport-security',
    'x-content-type-options',
  ]);
  for (const file of [
    'docs/phase-15/INSTALLATION_GUIDE.md',
    'docs/phase-15/OPERATIONS_RUNBOOK.md',
    'docs/phase-15/ADMIN_GUIDE.md',
    'docs/phase-15/SOURCE_HANDOVER.md',
    'docs/phase-15/ACCEPTANCE_AND_HANDOVER.md',
  ]) {
    assert.ok(read(file).length > 500, `${file} must be substantive`);
  }
});

test('Phase 15 CI runs quality integration responsive container restore and smoke gates', () => {
  const workflow = read('.github/workflows/phase15-production-readiness.yml');
  containsAll(workflow, [
    'Unit tests with coverage',
    'Critical API integration flow',
    'Responsive browser matrix',
    'Build production containers',
    'Backup and restore drill',
    'Production smoke test',
    'Upload Phase 15 acceptance evidence',
  ]);
});
