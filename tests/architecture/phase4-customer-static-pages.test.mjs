import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const requiredFiles = [
  'docs/phase-4/README.md',
  'docs/phase-4/CONTENT_AND_NAVIGATION.md',
  'docs/phase-4/PERFORMANCE_ACCESSIBILITY.md',
  'docs/phase-4/PHASE_4_HANDOVER.md',
  'frontend-user/src/data/phase4Content.ts',
  'frontend-user/src/components/common/OptimizedImage.tsx',
  'frontend-user/src/components/contact/QuickContactForm.tsx',
  'frontend-user/src/components/layout/FloatingContactActions.tsx',
  'frontend-user/src/pages/Projects.tsx',
  'frontend-user/src/pages/ProjectDetail.tsx',
  'frontend-user/src/pages/Articles.tsx',
  'frontend-user/src/pages/ArticleDetail.tsx',
  'frontend-user/src/pages/NotFound.tsx',
  'frontend-user/tests/phase4-static-pages.test.mjs',
];

test('Phase 4 repository deliverables exist', () => {
  for (const file of requiredFiles) {
    assert.equal(existsSync(resolve(root, file)), true, `Missing ${file}`);
  }
});

test('Phase 4 documentation covers routes, images, Lighthouse and merge order', () => {
  const overview = read('docs/phase-4/README.md');
  const performance = read('docs/phase-4/PERFORMANCE_ACCESSIBILITY.md');
  const handover = read('docs/phase-4/PHASE_4_HANDOVER.md');

  for (const route of ['/services', '/projects', '/articles', '/about', '/contact', '/policy/warranty', '/policy/privacy', '/policy/terms']) {
    assert.match(overview, new RegExp(route.replace('/', '\\/')), `Overview missing ${route}`);
  }
  assert.match(performance, /Lighthouse/);
  assert.match(performance, /loading="lazy"/);
  assert.match(performance, /srcSet/);
  assert.match(handover, /stacked branch/);
  assert.match(handover, /frontend-admin/);
  assert.match(handover, /backend/);
});

test('Phase 4 remains scoped to customer static presentation contracts', () => {
  const handover = read('docs/phase-4/PHASE_4_HANDOVER.md');
  assert.match(handover, /không thay đổi/i);
  assert.match(handover, /Prisma schema/);
  assert.match(handover, /Mock API business routes/);
  assert.match(handover, /Auth store/);
  assert.match(handover, /Cart store/);
});
