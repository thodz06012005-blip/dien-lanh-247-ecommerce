import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (file) => readFileSync(resolve(root, file), 'utf8');

test('admin application exposes the required architecture files', () => {
  const requiredFiles = [
    '.env.example',
    'src/app/AppProviders.tsx',
    'src/components/errors/AppErrorBoundary.tsx',
    'src/config/env.ts',
    'src/router/AppRouter.tsx',
    'src/services/api.ts',
    'src/types/api.ts',
  ];

  for (const file of requiredFiles) {
    assert.equal(existsSync(resolve(root, file)), true, `Missing ${file}`);
  }
});

test('admin TypeScript and Vite resolve the same source alias', () => {
  const tsconfig = JSON.parse(read('tsconfig.app.json'));
  assert.deepEqual(tsconfig.compilerOptions.paths['@/*'], ['./src/*']);
  assert.match(read('vite.config.ts'), /alias:\s*\{[\s\S]*['"]@['"]/);
});

test('admin API client includes request correlation and dangerous action confirmation', () => {
  const apiClient = read('src/services/api.ts');
  assert.match(apiClient, /env\.apiBaseUrl/);
  assert.match(apiClient, /X-Request-Id/);
  assert.match(apiClient, /X-Confirm-Dangerous-Action/);
});

test('admin environment example contains no server-side secret names', () => {
  const environment = read('.env.example');
  assert.doesNotMatch(environment, /JWT_(?:ACCESS|REFRESH)_SECRET\s*=/);
  assert.doesNotMatch(environment, /DATABASE_URL\s*=/);
  assert.doesNotMatch(environment, /PRIVATE_KEY\s*=/);
});
