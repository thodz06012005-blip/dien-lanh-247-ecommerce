import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('Phase 9 final candidate includes code, CI and complete operating handover', () => {
  const required = [
    'backend/prisma/migrations/20260714210000_phase9_editorial_cms/migration.sql',
    'backend/src/modules/content/editorial-cms.service.ts',
    'frontend-admin/src/pages/EditorialCms.tsx',
    'frontend-user/src/components/cms/CmsManagedHomepage.tsx',
    '.github/workflows/phase9-quality.yml',
    '.github/workflows/phase9-editorial-cms-integration.yml',
    'docs/phase-9/PHASE_9_HANDOVER.md',
    'docs/phase-9/ACCEPTANCE_MARKER.md',
  ];
  for (const path of required) assert.equal(existsSync(resolve(root, path)), true, `missing ${path}`);
});

test('Phase 9 final handover records compatibility and safe merge order', () => {
  const handover = read('docs/phase-9/PHASE_9_HANDOVER.md');
  const acceptance = read('docs/phase-9/CI_ACCEPTANCE.md');
  assert.match(handover, /Không thay đổi business logic/);
  assert.match(handover, /Merge PR #10/);
  assert.match(handover, /Retarget PR #11 về main/);
  assert.match(acceptance, /Phase 8 Admin Integration/);
  assert.match(acceptance, /Phase 9 Editorial CMS Integration/);
});
