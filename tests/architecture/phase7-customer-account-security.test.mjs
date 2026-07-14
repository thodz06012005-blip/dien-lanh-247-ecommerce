import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const migrationPath = 'backend/prisma/migrations/20260714100000_phase7_customer_account_security/migration.sql';

test('Phase 7 migration is additive and introduces customer security records', () => {
  assert.equal(existsSync(resolve(root, migrationPath)), true);
  const migration = read(migrationPath);
  for (const table of ['AuthSession', 'PasswordResetToken', 'EmailVerificationToken', 'CustomerNotification', 'ServiceRequestReview']) {
    assert.equal(migration.includes(`CREATE TABLE \`${table}\``), true, `missing table ${table}`);
  }
  for (const column of ['normalizedPhone', 'emailVerifiedAt', 'phoneVerifiedAt', 'tokenVersion', 'customerUserId']) {
    assert.equal(migration.includes(`ADD COLUMN \`${column}\``), true, `missing column ${column}`);
  }
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|RENAME TABLE/i);
});

test('refresh tokens are rotated per session and raw tokens are not persisted', () => {
  const service = read('backend/src/modules/auth/auth.service.ts');
  assert.match(service, /AuthSession/);
  assert.match(service, /refreshTokenHash/);
  assert.match(service, /TOKEN_REUSE_DETECTED/);
  assert.match(service, /tokenVersion/);
  assert.match(service, /hashSecret\(tokens\.refreshToken\)/);
  assert.doesNotMatch(service, /data:\s*\{\s*refreshToken:\s*tokens\.refreshToken/);
});

test('customer login, recovery and account endpoints are complete', () => {
  const auth = read('backend/src/modules/auth/auth.controller.ts');
  const account = read('backend/src/modules/users/users.controller.ts');
  for (const route of ['register', 'login', 'refresh', 'logout', 'logout-all', 'forgot-password', 'reset-password', 'verify-email']) {
    assert.equal(auth.includes(`'${route}'`), true, `missing auth route ${route}`);
  }
  assert.match(account, /@Controller\('account'\)[\s\S]*@UseGuards\(JwtAuthGuard\)/);
  for (const route of ['profile', 'addresses', 'change-password', 'orders', 'service-requests', 'notifications', 'sessions']) {
    assert.equal(account.includes(`'${route}`), true, `missing account route ${route}`);
  }
});

test('account ownership is determined by JWT userId, not URL phone data', () => {
  const usersService = read('backend/src/modules/users/users.service.ts');
  assert.match(usersService, /WHERE sr\.id = \? AND sr\.customerUserId = \?/);
  assert.match(usersService, /where:\s*\{\s*id,\s*userId\s*\}/);
  assert.match(usersService, /WHERE id = \? AND userId = \?/);
  assert.doesNotMatch(usersService, /getOrder\([^)]*phone/);
  assert.doesNotMatch(usersService, /listOrders\([^)]*phone/);
});

test('frontend session is cookie-backed and protected routes are guarded', () => {
  const store = read('frontend-user/src/store/authStore.ts');
  const api = read('frontend-user/src/services/api.ts');
  const router = read('frontend-user/src/router/AppRouter.tsx');
  assert.doesNotMatch(store, /localStorage|sessionStorage/);
  assert.match(api, /withCredentials:\s*true/);
  assert.match(api, /refreshPromise/);
  assert.match(router, /function ProtectedRoute/);
  assert.match(router, /api\.get\('\/auth\/me'\)/);
  assert.match(router, /path="account"/);
  assert.match(router, /path="my-services\/:id"/);
});

test('customer pages no longer use phone-only order ownership', () => {
  const orders = read('frontend-user/src/pages/Orders.tsx');
  const services = read('frontend-user/src/pages/MyServices.tsx');
  assert.match(orders, /\/account\/orders/);
  assert.doesNotMatch(orders, /params:\s*\{\s*phone/);
  assert.doesNotMatch(orders, /phoneLookup|activePhone/);
  assert.match(services, /\/account\/service-requests/);
});

test('password and verification links are not logged by mail service', () => {
  const mail = read('backend/src/integrations/mail/mail.service.ts');
  assert.match(mail, /Never print reset\/verification links or tokens to logs/);
  assert.doesNotMatch(mail, /console\.log\([^\n]*(resetUrl|verificationUrl|token)/);
});
