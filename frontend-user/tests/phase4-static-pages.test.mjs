import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (file) => readFileSync(resolve(root, file), 'utf8');

const requiredPages = [
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
];

test('Phase 4 provides all required customer static pages', () => {
  for (const file of requiredPages) {
    assert.equal(existsSync(resolve(root, file)), true, `Missing ${file}`);
  }
});

test('customer router registers static list, detail, policy and fallback routes', () => {
  const router = read('src/router/AppRouter.tsx');
  for (const route of [
    'path="services"',
    'path="projects"',
    'path="projects/:slug"',
    'path="articles"',
    'path="articles/:slug"',
    'path="about"',
    'path="contact"',
    'path="policy/:slug"',
    'path="*"',
  ]) {
    assert.match(router, new RegExp(route.replace(/[/:*]/g, '\\$&')), `Missing route ${route}`);
  }
  assert.match(router, /lazy\(\(\) => import\(/, 'Secondary pages should be code split');
  assert.match(router, /Suspense/, 'Lazy routes require Suspense');
});

test('header and footer contain only intentional customer navigation targets', () => {
  const navigation = `${read('src/components/layout/Header.tsx')}\n${read('src/components/layout/Footer.tsx')}`;
  assert.doesNotMatch(navigation, /(?:to|href)=["']#["']/, 'Placeholder hash links are not allowed');
  for (const path of ['/services', '/projects', '/articles', '/about', '/contact', '/policy/warranty', '/policy/privacy', '/policy/terms']) {
    assert.match(navigation, new RegExp(path.replace('/', '\\/')), `Navigation is missing ${path}`);
  }
});

test('static content has unique service, project and article slugs', () => {
  const content = read('src/data/phase4Content.ts');
  const slugs = [...content.matchAll(/slug:\s*'([^']+)'/g)].map((match) => match[1]);
  assert.ok(slugs.length >= 14, 'Expected structured content records');
  assert.equal(new Set(slugs).size, slugs.length, 'Static content slugs must be unique');
  assert.doesNotMatch(content, /http:\/\//, 'Content images must use HTTPS');
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
    'Khách hàng chia sẻ',
    'Góc kiến thức',
    'Gửi yêu cầu liên hệ',
  ]) {
    assert.match(home, new RegExp(marker), `Homepage missing section: ${marker}`);
  }
  assert.match(home, /QuickContactForm/);
});

test('document metadata avoids development-only canonical values', () => {
  const html = read('index.html');
  assert.match(html, /name="description"/);
  assert.match(html, /name="theme-color"/);
  assert.match(html, /preconnect/);
  assert.doesNotMatch(html, /og:url[^>]+localhost/);
});
