import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRepository } from '../../scripts/validate-repository.mjs';

const repositoryRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));

test('repository satisfies the Phase 2 architecture contract', () => {
  const result = validateRepository(repositoryRoot);
  assert.deepEqual(result.errors, [], result.errors.join('\n'));
});
