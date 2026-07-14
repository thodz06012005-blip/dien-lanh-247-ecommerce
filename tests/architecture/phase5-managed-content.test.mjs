import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('Phase 5 includes additive migration and idempotent content seed', () => {
  const migrationPath = 'backend/prisma/migrations/20260714050000_phase5_managed_content/migration.sql';
  assert.equal(existsSync(resolve(root, migrationPath)), true);
  const migration = read(migrationPath);
  for (const table of ['Media', 'Service', 'Project', 'ProjectMedia', 'Tag', 'Post', 'PostTag']) {
    assert.match(migration, new RegExp(`CREATE TABLE \\`${table}\\``));
  }
  assert.match(migration, /UNIQUE INDEX `Service_slug_key`/);
  assert.match(migration, /UNIQUE INDEX `Project_slug_key`/);
  assert.match(migration, /UNIQUE INDEX `Post_slug_key`/);
  assert.match(migration, /UNIQUE INDEX `Tag_slug_key`/);
  assert.match(migration, /ALTER TABLE `ServiceCategory`/);
  assert.match(migration, /ALTER TABLE `Category`/);
  assert.doesNotMatch(migration, /INSERT IGNORE/);
  assert.equal(existsSync(resolve(root, 'backend/prisma/seed-content.ts')), true);
});

test('NestJS content module exposes public and protected admin APIs', () => {
  const controller = read('backend/src/modules/content/content.controller.ts');
  const service = read('backend/src/modules/content/content.service.ts');
  const appModule = read('backend/src/app.module.ts');
  for (const route of ["'services'", "'services/:slug'", "'projects'", "'projects/:slug'", "'posts'", "'posts/:slug'", "'admin/content/:type'"]) {
    assert.match(controller, new RegExp(route.replace(/[/:]/g, (char) => `\\${char}`)));
  }
  assert.match(controller, /JwtAuthGuard, RolesGuard/);
  assert.match(controller, /UserRole\.ADMIN/);
  assert.match(service, /status = 'PUBLISHED'/);
  assert.match(service, /Slug already exists/);
  assert.match(service, /ARCHIVED/);
  assert.match(appModule, /ContentModule/);
});

test('customer lists and details use the managed API rather than Phase 4 static arrays', () => {
  const pages = ['Services.tsx', 'ServiceDetail.tsx', 'Projects.tsx', 'ProjectDetail.tsx', 'Articles.tsx', 'ArticleDetail.tsx'];
  for (const page of pages) {
    const source = read(`frontend-user/src/pages/${page}`);
    assert.match(source, /contentApi|getServices|getService|getProjects|getProject|getPosts|getPost/);
    assert.doesNotMatch(source, /phase4Content/);
  }
  const router = read('frontend-user/src/router/AppRouter.tsx');
  assert.match(router, /path="services\/:slug"/);
  assert.match(read('frontend-user/.env.example'), /VITE_CONTENT_API_BASE_URL/);
});

test('admin exposes CRUD, preview, archive and seven content groups', () => {
  const page = read('frontend-admin/src/pages/Content.tsx');
  const client = read('frontend-admin/src/services/contentApi.ts');
  const router = read('frontend-admin/src/router/AppRouter.tsx');
  for (const type of ['services', 'service-categories', 'projects', 'posts', 'categories', 'tags', 'media']) {
    assert.match(page, new RegExp(`'${type}'`));
  }
  assert.match(client, /createContent/);
  assert.match(client, /updateContent/);
  assert.match(client, /archiveContent/);
  assert.match(client, /previewContent/);
  assert.match(router, /path="content"/);
  assert.match(read('frontend-admin/.env.example'), /VITE_CONTENT_API_BASE_URL/);
});
