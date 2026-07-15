import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const required = [
  'backend/prisma/migrations/20260715090000_phase10_operations_dispatch/migration.sql',
  'backend/prisma/seed-operations-dispatch.ts',
  'backend/src/modules/operations/operations.module.ts',
  'backend/src/modules/operations/operations.controller.ts',
  'backend/src/modules/operations/operations.service.ts',
  'backend/src/modules/operations/quote-calculator.ts',
  'frontend-admin/src/pages/Operations.tsx',
  'frontend-admin/src/services/operationsApi.ts',
  'frontend-user/src/pages/QuoteConfirmation.tsx',
];

test('Phase 10 operations files exist', () => {
  for (const path of required) assert.equal(existsSync(resolve(root, path)), true, `missing ${path}`);
});

test('Phase 10 migration is additive and covers dispatch commercial workflow', () => {
  const migration = read(required[0]);
  for (const table of [
    'CustomerDevice',
    'TechnicianSchedule',
    'SlaPolicy',
    'ServiceRequestSla',
    'DispatchAssignment',
    'ServiceRequestInternalNote',
    'ServiceQuote',
    'ServiceQuoteLine',
    'ServicePaymentRecord',
    'CompletionReport',
    'WarrantyRecord',
    'WarrantyEvent',
  ]) assert.equal(migration.includes(`CREATE TABLE \`${table}\``), true, `missing ${table}`);
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|RENAME TABLE/i);
  assert.match(migration, /TechnicianSchedule_time_check/);
  assert.match(migration, /DispatchAssignment_time_check/);
});

test('backend enforces schedule overlap and exact quote calculation', () => {
  const service = read('backend/src/modules/operations/operations.service.ts');
  const calculator = read('backend/src/modules/operations/quote-calculator.ts');
  assert.match(service, /startAt < \? AND endAt > \?/);
  assert.match(service, /Kỹ thuật viên đã có lịch trùng/);
  assert.match(service, /ServiceRequestAudit/);
  assert.match(service, /ServiceRequestStatusEvent/);
  assert.match(calculator, /toCents/);
  assert.match(calculator, /quantityMilli/);
  assert.match(calculator, /discountCents/);
  assert.match(calculator, /taxCents/);
});

test('operations APIs require permission except customer quote confirmation', () => {
  const controller = read('backend/src/modules/operations/operations.controller.ts');
  assert.match(controller, /operations\/quotes\/confirm/);
  assert.match(controller, /ADMIN_PERMISSIONS\.OPERATIONS_VIEW/);
  assert.match(controller, /ADMIN_PERMISSIONS\.OPERATIONS_MANAGE/);
  assert.match(controller, /JwtAuthGuard, RolesGuard, PermissionsGuard/);
});

test('admin and customer routes expose modern operations workflow', () => {
  const adminRouter = read('frontend-admin/src/router/AppRouter.tsx');
  const adminNav = read('frontend-admin/src/config/adminNavigation.ts');
  const page = read('frontend-admin/src/pages/Operations.tsx');
  const customerRouter = read('frontend-user/src/router/AppRouter.tsx');
  assert.match(adminRouter, /path="operations"/);
  assert.match(adminNav, /Trung tâm điều phối/);
  assert.match(page, /SLA & cảnh báo/);
  assert.match(page, /Tạo báo giá/);
  assert.match(page, /Biên bản hoàn thành/);
  assert.match(page, /Tạo bảo hành/);
  assert.match(customerRouter, /quote-confirmation/);
});
