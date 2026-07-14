import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (file) => readFileSync(resolve(root, file), 'utf8');

test('admin design system exposes required operational components', () => {
  const source = read('src/design-system/index.tsx');
  const requiredExports = [
    'Button',
    'Input',
    'Select',
    'Textarea',
    'Modal',
    'Drawer',
    'Tabs',
    'Badge',
    'Alert',
    'Skeleton',
    'StatePanel',
    'DataTable',
    'FilterBar',
    'ConfirmDialog',
    'FormLayout',
    'AdminSidebar',
    'AdminHeader',
    'AdminToastProvider',
  ];

  for (const component of requiredExports) {
    assert.match(source, new RegExp(`export (?:const|function) ${component}`), `Missing ${component}`);
  }
});

test('admin data table has desktop table and mobile card rendering', () => {
  const source = read('src/design-system/index.tsx');
  assert.match(source, /<table/);
  assert.match(source, /md:hidden/);
  assert.match(source, /overflow-x-auto/);
  assert.match(source, /onKeyDown/);
  assert.match(source, /event\.key === 'Enter'/);
});

test('admin overlays and feedback include accessibility semantics', () => {
  const source = read('src/design-system/index.tsx');
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /role="tablist"/);
});

test('admin design system includes touch, focus, overflow and reduced-motion safeguards', () => {
  const styles = read('src/styles/design-system.css');
  assert.match(styles, /\.admin-focus-ring:focus-visible/);
  assert.match(styles, /@media \(pointer: coarse\)/);
  assert.match(styles, /min-height: 44px/);
  assert.match(styles, /overflow-wrap: anywhere/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test('admin demo page and layout integration are available', () => {
  assert.equal(existsSync(resolve(root, 'src/pages/DesignSystem.tsx')), true);
  assert.match(read('src/router/AppRouter.tsx'), /path="design-system"/);
  assert.match(read('src/main.tsx'), /styles\/design-system\.css/);
  assert.match(read('src/layouts/AdminLayout.tsx'), /admin-skip-link/);
  assert.match(read('src/layouts/AdminLayout.tsx'), /Thư viện giao diện/);
});
