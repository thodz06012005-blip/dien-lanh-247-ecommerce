import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const docs = [
  'docs/phase-9/README.md',
  'docs/phase-9/DATA_MODEL.md',
  'docs/phase-9/API_CONTRACT.md',
  'docs/phase-9/EDITORIAL_WORKFLOW.md',
  'docs/phase-9/MEDIA_AND_SECURITY.md',
  'docs/phase-9/CI_ACCEPTANCE.md',
  'docs/phase-9/PHASE_9_HANDOVER.md',
];

test('Phase 9 handover documentation is complete and cross-linked', () => {
  for (const path of docs) {
    assert.equal(existsSync(resolve(root, path)), true, `missing ${path}`);
    assert.ok(readFileSync(resolve(root, path), 'utf8').trim().length > 200, `incomplete ${path}`);
  }
  const overview = readFileSync(resolve(root, docs[0]), 'utf8');
  for (const filename of docs.slice(1).map((path) => path.split('/').at(-1))) {
    assert.match(overview, new RegExp(filename.replaceAll('.', '\\.')));
  }
});

test('Phase 9 handover preserves stacked merge and non-destructive archive requirements', () => {
  const handover = readFileSync(resolve(root, 'docs/phase-9/PHASE_9_HANDOVER.md'), 'utf8');
  const workflow = readFileSync(resolve(root, 'docs/phase-9/EDITORIAL_WORKFLOW.md'), 'utf8');
  assert.match(handover, /PR #10/);
  assert.match(handover, /PR #11/);
  assert.match(handover, /agent\/phase-8-admin-platform-foundation/);
  assert.match(workflow, /soft (?:delete|archive)|không.*hard delete/i);
  assert.match(workflow, /Restore → DRAFT/);
});
