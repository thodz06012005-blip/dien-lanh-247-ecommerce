import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');

test('Phase 13 uses crawlable routes and dynamic editorial metadata', () => {
  const router = read('frontend-user/src/router/AppRouter.tsx');
  const seo = read('frontend-user/src/seo/SeoManager.tsx');
  assert.match(router, /BrowserRouter/);
  assert.doesNotMatch(router, /HashRouter/);
  for (const marker of [
    'getService',
    'getProject',
    'getPost',
    "queryKey: ['product'",
    'seoTitle',
    'seoDescription',
    'socialImageUrl',
    'canonical',
    'og:title',
    'twitter:card',
  ]) {
    assert.match(seo, new RegExp(marker.replace(/[\[\]]/g, '\\$&')));
  }
});

test('Phase 13 structured data covers business, content and breadcrumbs', () => {
  const seo = read('frontend-user/src/seo/SeoManager.tsx');
  for (const schema of ['LocalBusiness', 'Service', 'Product', 'Article', 'BreadcrumbList']) {
    assert.match(seo, new RegExp(schema));
  }
  assert.match(seo, /noindex,nofollow/);
});

test('Phase 13 sitemap and robots are generated from environment and published APIs', () => {
  const packageJson = read('frontend-user/package.json');
  const sitemapGenerator = read('frontend-user/scripts/generate-sitemap.mjs');
  const robotsGenerator = read('frontend-user/scripts/generate-robots.mjs');
  assert.match(packageJson, /"prebuild": "npm run sitemap:generate && npm run robots:generate"/);
  for (const endpoint of ['/services', '/projects', '/posts', '/products']) {
    assert.match(sitemapGenerator, new RegExp(endpoint));
  }
  assert.match(sitemapGenerator, /totalPages/);
  assert.match(sitemapGenerator, /SITEMAP_API_URL/);
  assert.match(robotsGenerator, /VITE_SITE_URL/);
  assert.match(robotsGenerator, /service-booking\/success/);
});

test('Phase 13 public APIs publish CDN cache policy without caching admin writes', () => {
  const contentController = read('backend/src/modules/content/content.controller.ts');
  const productController = read('backend/src/modules/products/products.controller.ts');
  for (const source of [contentController, productController]) {
    assert.match(source, /stale-while-revalidate/);
    assert.match(source, /Cache-Control/);
    assert.match(source, /Vary/);
  }
  assert.doesNotMatch(contentController.match(/@Post[\s\S]*$/)?.[0] || '', /PUBLIC_DETAIL_CACHE/);
});

test('Phase 13 measures mobile routes, desktop home and field web vitals', () => {
  const workflow = read('.github/workflows/customer-lighthouse.yml');
  const vitals = read('frontend-user/src/performance/webVitals.ts');
  const verifier = read('scripts/verify-lighthouse.mjs');
  for (const route of [
    'home / mobile',
    'services /services mobile',
    'products /products mobile',
    'articles /articles mobile',
    'booking /service-booking mobile',
    'home / desktop',
  ]) {
    assert.match(workflow, new RegExp(route.replaceAll('/', '\\/')));
  }
  for (const metric of ['LCP', 'CLS', 'INP']) assert.match(vitals, new RegExp(metric));
  assert.match(verifier, /performance: 0\.85/);
  assert.match(verifier, /seo: 0\.95/);
  assert.match(verifier, /largest-contentful-paint': 3_000/);
});
