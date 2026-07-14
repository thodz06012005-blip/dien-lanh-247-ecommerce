import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const requiredFiles = [
  'backend/src/common/auth/admin-permissions.ts',
  'backend/src/common/decorators/permissions.decorator.ts',
  'backend/src/common/guards/permissions.guard.ts',
  'backend/src/modules/auth/strategies/jwt-admin-refresh.strategy.ts',
  'frontend-admin/src/components/admin/AdminDataTable.tsx',
  'frontend-admin/src/components/admin/AdminFormShell.tsx',
  'frontend-admin/src/hooks/useUnsavedChanges.ts',
  'frontend-admin/src/pages/AdminProfile.tsx',
  'frontend-admin/src/pages/NotFound.tsx',
  'frontend-admin/src/pages/SystemError.tsx',
];

test('Phase 8 foundation files exist', () => {
  for (const path of requiredFiles) assert.equal(existsSync(resolve(root, path)), true, `missing ${path}`);
});

test('admin session is cookie-backed and isolated from customer session', () => {
  const store = read('frontend-admin/src/store/adminAuthStore.ts');
  const api = read('frontend-admin/src/services/api.ts');
  const controller = read('backend/src/modules/auth/admin-auth.controller.ts');
  assert.doesNotMatch(store, /localStorage|sessionStorage/);
  assert.match(api, /refreshPromise/);
  assert.match(api, /\/admin\/auth\/refresh/);
  assert.match(controller, /adminAccessToken/);
  assert.match(controller, /adminRefreshToken/);
  assert.match(controller, /path: '\/api\/v1\/admin'/);
  assert.doesNotMatch(controller, /data:\s*responsePayload/);
});

test('permission catalog controls backend and direct frontend routes', () => {
  const permissionGuard = read('backend/src/common/guards/permissions.guard.ts');
  const router = read('frontend-admin/src/router/AppRouter.tsx');
  const layout = read('frontend-admin/src/layouts/AdminLayout.tsx');
  assert.match(permissionGuard, /hasAdminPermissions/);
  assert.match(permissionGuard, /PERMISSION_FORBIDDEN/);
  assert.match(router, /permission=\{ADMIN_PERMISSIONS\.SETTINGS_VIEW\}/);
  assert.match(router, /permission=\{ADMIN_PERMISSIONS\.PROFILE_VIEW\}/);
  assert.match(layout, /filter\(\(item\) => canAccess\(permissions, item\.permission\)\)/);
  assert.match(layout, /allowedSearchItems/);
});

test('dashboard consumes a single real backend snapshot', () => {
  const page = read('frontend-admin/src/pages/Dashboard.tsx');
  const service = read('backend/src/modules/dashboard/dashboard.service.ts');
  assert.match(page, /api\.get\('\/admin\/dashboard'\)/);
  assert.doesNotMatch(page, /api\.get\('\/admin\/orders'\)/);
  assert.doesNotMatch(page, /api\.get\('\/admin\/products'\)/);
  for (const contract of ['revenue7d', 'orderStatus', 'serviceStatus', 'attention', 'recentOrders']) {
    assert.match(service, new RegExp(contract));
  }
  assert.match(service, /FROM ServiceRequest/);
  assert.match(service, /prisma\.order/);
  assert.match(service, /prisma\.variant/);
});

test('standard data table supports all required administration operations', () => {
  const table = read('frontend-admin/src/components/admin/AdminDataTable.tsx');
  for (const capability of ['searchFields', 'filters', 'toggleSort', 'togglePage', 'selectedRows', 'exportCsv', 'pageSize']) {
    assert.match(table, new RegExp(capability));
  }
  assert.match(table, /text\/csv/);
});

test('admin forms warn before discarding unsaved changes', () => {
  const hook = read('frontend-admin/src/hooks/useUnsavedChanges.ts');
  const shell = read('frontend-admin/src/components/admin/AdminFormShell.tsx');
  assert.match(hook, /useBlocker/);
  assert.match(hook, /beforeunload/);
  assert.match(shell, /useUnsavedChanges/);
  assert.match(shell, /Chưa lưu/);
});

test('403, 404 and system error surfaces are routed and reusable', () => {
  const router = read('frontend-admin/src/router/AppRouter.tsx');
  const app = read('frontend-admin/src/App.tsx');
  assert.match(router, /path="\/403"/);
  assert.match(router, /path="\/500"/);
  assert.match(router, /path="\*"/);
  assert.match(app, /AdminErrorBoundary/);
});
