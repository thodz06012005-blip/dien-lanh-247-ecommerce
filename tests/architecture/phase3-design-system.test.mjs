import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = (file) => readFileSync(resolve(root, file), 'utf8');

test('phase 3 documentation and implementation files exist', () => {
  const required = [
    'docs/phase-3/README.md',
    'docs/phase-3/UI_GUIDELINE.md',
    'docs/phase-3/COMPONENT_LIBRARY.md',
    'docs/phase-3/ACCESSIBILITY_RESPONSIVE.md',
    'docs/phase-3/PHASE_3_HANDOVER.md',
    'frontend-user/src/design-system/index.tsx',
    'frontend-user/src/styles/design-system.css',
    'frontend-user/src/pages/DesignSystem.tsx',
    'frontend-admin/src/design-system/index.tsx',
    'frontend-admin/src/styles/design-system.css',
    'frontend-admin/src/pages/DesignSystem.tsx',
  ];

  for (const file of required) {
    assert.equal(existsSync(resolve(root, file)), true, `Missing ${file}`);
  }
});

test('phase 3 guideline defines brand, typography, spacing and breakpoints', () => {
  const guideline = read('docs/phase-3/UI_GUIDELINE.md');
  for (const term of ['#061527', '#2563EB', '#06B6D4', '#F97316', 'Be Vietnam Pro', 'Inter', '640px', '768px', '1024px', '1280px']) {
    assert.match(guideline, new RegExp(term.replace('#', '\\#'), 'i'), `Guideline missing ${term}`);
  }
});

test('phase 3 accessibility checklist covers keyboard, contrast and touch target rules', () => {
  const document = read('docs/phase-3/ACCESSIBILITY_RESPONSIVE.md');
  assert.match(document, /keyboard/i);
  assert.match(document, /contrast/i);
  assert.match(document, /44px/i);
  assert.match(document, /prefers-reduced-motion/i);
  assert.match(document, /mobile/i);
  assert.match(document, /tablet/i);
  assert.match(document, /desktop/i);
});
