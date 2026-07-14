import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (file) => readFileSync(resolve(root, file), 'utf8');

test('customer application exposes the required architecture files', () => {
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

test('customer TypeScript and Vite resolve the same source alias', () => {
  const tsconfig = JSON.parse(read('tsconfig.app.json'));
  assert.deepEqual(tsconfig.compilerOptions.paths['@/*'], ['src/*']);
  assert.match(read('vite.config.ts'), /alias:\s*\{[\s\S]*['"]@['"]/);
});

test('customer API client reads validated environment configuration', () => {
  const apiClient = read('src/services/api.ts');
  assert.match(apiClient, /env\.apiBaseUrl/);
  assert.match(apiClient, /env\.apiTimeoutMs/);
  assert.match(apiClient, /X-Request-Id/);
});

test('customer environment example contains no server-side secret names', () => {
  const environment = read('.env.example');
  assert.doesNotMatch(environment, /JWT_(?:ACCESS|REFRESH)_SECRET\s*=/);
  assert.doesNotMatch(environment, /DATABASE_URL\s*=/);
  assert.doesNotMatch(environment, /PRIVATE_KEY\s*=/);
});
