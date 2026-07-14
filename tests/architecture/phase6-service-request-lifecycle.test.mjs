import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const requiredStatuses = [
  'NEW',
  'CONFIRMED',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_PARTS',
  'COMPLETED',
  'WARRANTY',
  'CLOSED',
  'CANCELLED',
  'REJECTED',
  'RESCHEDULED',
];

test('Phase 6 migration is additive and normalizes history, media and audit data', () => {
  const path = 'backend/prisma/migrations/20260714060000_phase6_service_request_lifecycle/migration.sql';
  assert.equal(existsSync(resolve(root, path)), true);
  const migration = read(path);
  for (const table of ['ServiceRequestStatusEvent', 'ServiceRequestMedia', 'ServiceRequestAudit']) {
    assert.equal(migration.includes(`CREATE TABLE \`${table}\``), true);
  }
  for (const column of ['customerEmail', 'workflowStatus', 'requestVersion', 'scheduledAt', 'lookupLastFour']) {
    assert.equal(migration.includes(`ADD COLUMN \`${column}\``), true);
  }
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|RENAME TABLE/i);
  assert.equal(existsSync(resolve(root, 'backend/prisma/seed-service-request-workflow.ts')), true);
});

test('workflow contract includes complete statuses and rejects undocumented shortcuts', () => {
  const workflow = read('backend/src/modules/service-requests/service-request-workflow.ts');
  for (const status of requiredStatuses) assert.equal(workflow.includes(`'${status}'`), true);
  assert.match(workflow, /NEW:\s*\['CONFIRMED', 'RESCHEDULED', 'REJECTED', 'CANCELLED'\]/);
  assert.match(workflow, /ASSIGNED:\s*\['IN_PROGRESS', 'RESCHEDULED', 'CANCELLED'\]/);
  assert.match(workflow, /IN_PROGRESS:\s*\['WAITING_PARTS', 'COMPLETED', 'CANCELLED'\]/);
  assert.match(workflow, /COMPLETED:\s*\['WARRANTY', 'CLOSED'\]/);
  assert.doesNotMatch(workflow, /NEW:\s*\[[^\]]*COMPLETED/);
  assert.doesNotMatch(workflow, /ASSIGNED:\s*\[[^\]]*COMPLETED/);
});

test('public API requires code and phone and returns a masked customer view', () => {
  const controller = read('backend/src/modules/service-requests/service-requests.controller.ts');
  const service = read('backend/src/modules/service-requests/service-requests.service.ts');
  assert.match(controller, /Post\('service-requests\/lookup'\)/);
  assert.match(controller, /LookupServiceRequestDto/);
  assert.match(service, /getRawRequest\(normalizedCode, phone\)/);
  assert.match(service, /maskPhone/);
  assert.match(service, /maskEmail/);
  assert.match(service, /maskName/);
  assert.doesNotMatch(service, /toCustomerView[\s\S]{0,3000}customerAddress:/);
  assert.match(controller, /UseGuards\(JwtAuthGuard\)[\s\S]*findMyRequests/);
});

test('status updates and assignment are transactional and audited', () => {
  const service = read('backend/src/modules/service-requests/service-requests.service.ts');
  assert.match(service, /SELECT workflowStatus[^']*FOR UPDATE/);
  assert.match(service, /assertTransitionAllowed/);
  assert.match(service, /writeStatusEvent/);
  assert.match(service, /writeAudit/);
  assert.match(service, /SERVICE_REQUEST_STATUS_CHANGED/);
  assert.match(service, /SERVICE_REQUEST_ASSIGNED/);
});

test('customer and admin interfaces expose the Phase 6 workflow', () => {
  const booking = read('frontend-user/src/pages/ServiceBooking.tsx');
  const lookup = read('frontend-user/src/pages/ServiceRequestLookup.tsx');
  const adminList = read('frontend-admin/src/pages/ServiceRequests.tsx');
  const adminDetail = read('frontend-admin/src/pages/ServiceRequestDetail.tsx');
  const router = read('frontend-user/src/router/AppRouter.tsx');

  for (const field of ['customerName', 'customerPhone', 'customerEmail', 'customerAddress', 'applianceType', 'serviceCategoryId', 'issueDescription', 'priority', 'preferredDate', 'preferredTimeSlot', 'note']) {
    assert.equal(booking.includes(field), true);
  }
  assert.match(booking, /type="file"/);
  assert.match(lookup, /lookupServiceRequest/);
  assert.match(router, /path="service-lookup"/);
  assert.match(adminList, /refetchInterval:\s*15_000/);
  assert.match(adminList, /quickFilters/);
  assert.match(adminDetail, /allowedTransitions/);
  assert.match(adminDetail, /uploadServiceRequestMedia/);
  assert.match(adminDetail, /AuditList/);
});
