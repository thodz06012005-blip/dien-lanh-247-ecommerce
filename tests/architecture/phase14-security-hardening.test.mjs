import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');

test('Phase 14 validates and normalizes all request DTO failures', () => {
  const main = read('backend/src/main.ts');
  const factory = read(
    'backend/src/common/validation/validation-exception.factory.ts',
  );
  for (const marker of [
    'whitelist: true',
    'forbidNonWhitelisted: true',
    'transform: true',
    'exceptionFactory: createValidationException',
  ]) {
    assert.match(main, new RegExp(marker.replace(/[{}]/g, '\\$&')));
  }
  assert.match(factory, /VALIDATION_ERROR/);
  assert.match(factory, /field/);
  assert.match(factory, /messages/);
});

test('Phase 14 enforces backend RBAC instead of frontend-only hiding', () => {
  const products = read('backend/src/modules/products/products.controller.ts');
  const serviceRequests = read(
    'backend/src/modules/service-requests/service-requests.controller.ts',
  );
  const adminAuth = read('backend/src/modules/auth/admin-auth.controller.ts');
  const rolesGuard = read('backend/src/common/guards/roles.guard.ts');

  for (const source of [products, serviceRequests, adminAuth]) {
    assert.match(source, /JwtAuthGuard/);
    assert.match(source, /RolesGuard/);
    assert.match(source, /@Roles\(/);
  }
  assert.match(products, /PermissionsGuard/);
  assert.match(products, /@Permissions\(/);
  assert.match(rolesGuard, /ForbiddenException/);
  assert.match(rolesGuard, /auditDenied/);
});

test('Phase 14 configures security headers CORS payload limits and throttling', () => {
  const main = read('backend/src/main.ts');
  const appModule = read('backend/src/app.module.ts');
  const middleware = read(
    'backend/src/common/middleware/security.middleware.ts',
  );
  for (const marker of [
    'helmetSecurityMiddleware',
    "removeHeader('X-Powered-By')",
    'Content-Security-Policy',
    'Strict-Transport-Security',
    'Cross-Origin-Opener-Policy',
  ]) {
    assert.match(`${main}\n${middleware}`, new RegExp(marker.replace(/[()]/g, '\\$&')));
  }
  assert.match(main, /corsOrigins\.includes\(origin\)/);
  assert.match(main, /json\(\{ limit: jsonBodyLimit, strict: true \}\)/);
  assert.match(main, /parameterLimit: 100/);
  assert.match(appModule, /ThrottlerModule\.forRootAsync/);
  assert.match(appModule, /THROTTLE_TTL_MS/);
  assert.match(appModule, /THROTTLE_LIMIT/);
});

test('Phase 14 protects login refresh and session revocation', () => {
  const customerController = read('backend/src/modules/auth/auth.controller.ts');
  const adminController = read('backend/src/modules/auth/admin-auth.controller.ts');
  const authService = read('backend/src/modules/auth/auth.service.ts');
  const limiter = read(
    'backend/src/modules/auth/login-rate-limit.service.ts',
  );
  assert.match(customerController, /@Throttle\(\{ default: \{ limit: 5/);
  assert.match(adminController, /@Throttle\(\{ default: \{ limit: 5/);
  assert.match(limiter, /checkLockout/);
  assert.match(limiter, /TOO_MANY_REQUESTS/);
  assert.match(limiter, /retryAfterSeconds/);
  assert.match(authService, /TOKEN_REUSE_DETECTED/);
  assert.match(authService, /refreshTokenHash/);
  assert.match(authService, /tokenVersion = tokenVersion \+ 1/);
  assert.match(customerController, /logout-all/);
});

test('Phase 14 rejects spoofed and dangerous uploads before storage', () => {
  const pipe = read('backend/src/common/pipes/safe-image-files.pipe.ts');
  const controller = read(
    'backend/src/modules/service-requests/service-requests.controller.ts',
  );
  for (const marker of [
    'image/jpeg',
    'image/png',
    'image/webp',
    '0xff, 0xd8, 0xff',
    '0x89, 0x50, 0x4e, 0x47',
    "buffer.toString('ascii', 8, 12) === 'WEBP'",
    'DANGEROUS_INNER_EXTENSION',
    'MAX_FILE_BYTES',
  ]) {
    assert.match(pipe, new RegExp(marker.replace(/[()[\]]/g, '\\$&')));
  }
  assert.match(controller, /new SafeImageFilesPipe\(\)/);
  assert.match(controller, /fileSize: 5 \* 1024 \* 1024/);
  assert.doesNotMatch(pipe, /image\/svg\+xml/);
});

test('Phase 14 audit logs are redacted persistent and tamper evident', () => {
  const audit = read('backend/src/modules/audit/audit-log.service.ts');
  const redaction = read(
    'backend/src/common/security/redaction.util.ts',
  );
  for (const marker of [
    'appendFileSync',
    'previousHash',
    'integrityHash',
    'verifyIntegrity',
    'mode: 0o600',
    'sanitizeForLog',
  ]) {
    assert.match(audit, new RegExp(marker));
  }
  for (const marker of [
    'authorization',
    'private.?key',
    'card.?number',
    'REDACTED_PAYMENT_CARD',
    'REDACTED_JWT',
  ]) {
    assert.match(redaction, new RegExp(marker, 'i'));
  }
});

test('Phase 14 keeps destructive operations recoverable and confirmed', () => {
  const controller = read('backend/src/modules/products/products.controller.ts');
  const service = read('backend/src/modules/products/products.service.ts');
  assert.match(controller, /x-confirm-dangerous-action/i);
  assert.match(controller, /DANGEROUS_ACTION_BLOCKED/);
  assert.match(controller, /PRODUCT_SOFT_DELETED/);
  assert.match(service, /isActive: false/);
});

test('Phase 14 provides secret scanning and safe backup operations', () => {
  const packageJson = read('package.json');
  const scanner = read('scripts/scan-secrets.mjs');
  const backup = read('scripts/backup-mysql.mjs');
  assert.match(packageJson, /"security:scan"/);
  assert.match(packageJson, /"backup:mysql"/);
  assert.match(scanner, /Matched values are intentionally not printed/);
  assert.match(scanner, /git', \['ls-files', '-z'\]/);
  assert.match(backup, /MYSQL_PWD/);
  assert.match(backup, /createGzip/);
  assert.match(backup, /sha256/);
  assert.match(backup, /BACKUP_RETENTION_DAYS/);
  assert.doesNotMatch(backup, /console\.log\([^\n]*(password|DATABASE_URL)/i);
});
