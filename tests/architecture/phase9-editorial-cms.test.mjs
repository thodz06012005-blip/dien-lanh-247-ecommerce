import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const required = [
  'backend/prisma/migrations/20260714210000_phase9_editorial_cms/migration.sql',
  'backend/prisma/seed-editorial-cms.ts',
  'backend/src/modules/content/editorial-cms.controller.ts',
  'backend/src/modules/content/editorial-cms.service.ts',
  'backend/src/modules/content/content-media.service.ts',
  'backend/src/modules/content/content-revision.service.ts',
  'frontend-admin/src/pages/EditorialCms.tsx',
  'frontend-admin/src/components/cms/CmsEditorDrawer.tsx',
  'frontend-admin/src/components/cms/RichContentEditor.tsx',
  'frontend-admin/src/components/cms/MediaLibrary.tsx',
  'frontend-admin/src/components/cms/CmsPreviewModal.tsx',
  'frontend-admin/src/components/cms/CmsHistoryDrawer.tsx',
  'frontend-user/src/components/cms/CmsManagedHomepage.tsx',
];

test('Phase 9 editorial CMS files exist', () => {
  for (const path of required) assert.equal(existsSync(resolve(root, path)), true, `missing ${path}`);
});

test('Phase 9 migration is additive and provides editorial entities', () => {
  const migration = read(required[0]);
  for (const table of ['AuthorProfile', 'Banner', 'Partner', 'Testimonial', 'SiteSection', 'ContentRevision']) {
    assert.match(migration, new RegExp(`CREATE TABLE \\`${table}\\``));
  }
  for (const column of ['socialImageMediaId', 'updatedById', 'publishedById', 'deletedAt', 'version']) {
    assert.match(migration, new RegExp(`ADD COLUMN \\`${column}\\``));
  }
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|RENAME TABLE/i);
});

test('editorial workflow records actor history and never hard deletes content', () => {
  const service = read('backend/src/modules/content/editorial-cms.service.ts');
  const revisions = read('backend/src/modules/content/content-revision.service.ts');
  assert.match(service, /revisions\.record/);
  assert.match(service, /deletedAt = NOW\(3\)/);
  assert.match(service, /status = 'ARCHIVED'/);
  assert.match(service, /version = version \+ 1/);
  assert.doesNotMatch(service, /DELETE FROM/);
  assert.match(revisions, /actorEmail/);
  assert.match(revisions, /snapshot/);
});

test('CMS admin client is cookie backed and exposes full workflow', () => {
  const client = read('frontend-admin/src/services/cmsApi.ts');
  const page = read('frontend-admin/src/pages/EditorialCms.tsx');
  assert.doesNotMatch(client, /localStorage|sessionStorage|Authorization/);
  for (const operation of ['publishCms', 'unpublishCms', 'archiveCms', 'restoreCms', 'getCmsHistory', 'uploadCmsMedia']) {
    assert.match(client, new RegExp(operation));
  }
  assert.match(page, /AdminDataTable/);
  assert.match(page, /CmsEditorDrawer/);
  assert.match(page, /CmsPreviewModal/);
  assert.match(page, /CmsHistoryDrawer/);
  assert.match(page, /CONTENT_MANAGE/);
});

test('content editor supports rich content, media, SEO and publish settings', () => {
  const editor = read('frontend-admin/src/components/cms/CmsEditorDrawer.tsx');
  const rich = read('frontend-admin/src/components/cms/RichContentEditor.tsx');
  const media = read('frontend-admin/src/components/cms/MediaLibrary.tsx');
  for (const tab of ['content', 'media', 'seo', 'settings']) assert.match(editor, new RegExp(`'${tab}'`));
  assert.match(editor, /Bảng giá JSON/);
  assert.match(editor, /Chính sách bảo hành/);
  assert.match(editor, /Social Image Media ID/);
  assert.match(rich, /sandbox=""/);
  assert.match(rich, /wrapSelection/);
  assert.match(media, /multipart\/form-data/);
  assert.match(media, /Alt text/);
});

test('public site consumes CMS bundles with stable fallback content', () => {
  const api = read('frontend-user/src/services/contentApi.ts');
  const home = read('frontend-user/src/pages/Home.tsx');
  const managed = read('frontend-user/src/components/cms/CmsManagedHomepage.tsx');
  const footer = read('frontend-user/src/components/layout/Footer.tsx');
  assert.match(api, /getSiteContent/);
  assert.match(home, /CmsManagedHomepage/);
  assert.match(managed, /fallbackTestimonials/);
  assert.match(managed, /bundle\?\.partners/);
  assert.match(footer, /FOOTER_MAIN/);
  assert.match(footer, /fallbackServiceLinks/);
});

test('media upload rejects unsafe formats and supports local CI storage', () => {
  const service = read('backend/src/modules/content/content-media.service.ts');
  const main = read('backend/src/main.ts');
  assert.match(service, /MEDIA_STORAGE_DRIVER/);
  assert.match(service, /image\/webp/);
  assert.doesNotMatch(service, /image\/svg/);
  assert.match(service, /MEDIA_MAX_BYTES/);
  assert.match(main, /serveStatic/);
  assert.match(main, /\/uploads/);
});
