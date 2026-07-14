import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (file) => readFileSync(resolve(root, file), 'utf8');

test('customer design system exposes required reusable components', () => {
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
    'Card',
    'Breadcrumb',
    'Pagination',
    'DesignSystemToastProvider',
  ];

  for (const component of requiredExports) {
    assert.match(source, new RegExp(`export (?:const|function) ${component}`), `Missing ${component}`);
  }
});

test('customer overlays and tabs include keyboard and dialog semantics', () => {
  const source = read('src/design-system/index.tsx');
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /role="tablist"/);
  assert.match(source, /event\.key === 'ArrowRight'/);
  assert.match(source, /aria-live="polite"/);
});

test('customer design system includes touch, focus, overflow and reduced-motion safeguards', () => {
  const styles = read('src/styles/design-system.css');
  assert.match(styles, /\.ds-focus-ring:focus-visible/);
  assert.match(styles, /@media \(pointer: coarse\)/);
  assert.match(styles, /min-height: 44px/);
  assert.match(styles, /overflow-wrap: anywhere/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test('customer demo page and route are available', () => {
  assert.equal(existsSync(resolve(root, 'src/pages/DesignSystem.tsx')), true);
  assert.match(read('src/router/AppRouter.tsx'), /path="design-system"/);
  assert.match(read('src/main.tsx'), /styles\/design-system\.css/);
  assert.match(read('src/layouts/MainLayout.tsx'), /ds-skip-link/);
});
