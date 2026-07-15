import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');

test('Phase 4 customer website files exist', () => {
  for (const relativePath of [
    'src/pages/Home.tsx',
    'src/pages/About.tsx',
    'src/pages/Contact.tsx',
    'src/pages/Services.tsx',
    'src/pages/Projects.tsx',
    'src/pages/ProjectDetail.tsx',
    'src/pages/Articles.tsx',
    'src/pages/ArticleDetail.tsx',
    'src/pages/Policy.tsx',
    'src/pages/NotFound.tsx',
    'src/components/common/OptimizedImage.tsx',
    'src/components/contact/QuickContactForm.tsx',
    'src/components/layout/FloatingContactActions.tsx',
    'src/data/phase4Content.ts',
  ]) {
    assert.doesNotThrow(() => read(relativePath), `Missing ${relativePath}`);
  }
});

test('customer router registers static list, detail, policy and fallback routes', () => {
  const router = read('src/router/AppRouter.tsx');
  for (const route of [
    '/services',
    '/projects',
    '/projects/:slug',
    '/articles',
    '/articles/:slug',
    '/about',
    '/contact',
    '/policy/warranty',
    '/policy/privacy',
    '/policy/terms',
  ]) {
    assert.match(router, new RegExp(route.replaceAll('/', '\\/')));
  }
  assert.match(router, /path="\*"/);
});

test('header and footer contain only intentional customer navigation targets', () => {
  const source = `${read('src/components/layout/Header.tsx')}\n${read('src/components/layout/Footer.tsx')}`;
  assert.doesNotMatch(source, /href="#"/);
  assert.doesNotMatch(source, /to="#"/);
  assert.doesNotMatch(source, /to=""/);
});

test('static content has unique service, project and article slugs', () => {
  const content = read('src/data/phase4Content.ts');
  const matches = [...content.matchAll(/slug:\s*'([^']+)'/g)].map((match) => match[1]);
  assert.ok(matches.length >= 10);
  assert.equal(new Set(matches).size, matches.length);
});

test('optimized images reserve space and support responsive lazy loading', () => {
  const image = read('src/components/common/OptimizedImage.tsx');
  assert.match(image, /srcSet=/);
  assert.match(image, /sizes=/);
  assert.match(image, /loading=\{priority \? 'eager' : 'lazy'\}/);
  assert.match(image, /decoding="async"/);
  assert.match(image, /width=\{width\}/);
  assert.match(image, /height=\{height\}/);
  assert.match(image, /fetchPriority=/);
});

test('homepage includes all required business sections and contact form', () => {
  const home = read('src/pages/Home.tsx');
  for (const marker of [
    'Dịch vụ nổi bật',
    'Về Điện Lạnh 247',
    'Dự án tiêu biểu',
    'Lý do lựa chọn',
    'Quy trình phục vụ',
    'Góc kiến thức',
    'Gửi yêu cầu liên hệ',
  ]) {
    assert.match(home, new RegExp(marker), `Homepage missing section: ${marker}`);
  }
  assert.match(home, /QuickContactForm/);
  assert.match(home, /CmsManagedHomepage|Khách hàng chia sẻ/, 'Homepage missing CMS-managed testimonial section');
});

test('document metadata avoids development-only canonical values', () => {
  const html = read('index.html');
  assert.match(html, /name="description"/);
  assert.match(html, /name="theme-color"/);
  assert.doesNotMatch(html, /localhost/);
});
