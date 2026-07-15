import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');

test('public router uses crawlable URLs and route-aware SEO', () => {
  const router = read('src/router/AppRouter.tsx');
  assert.match(router, /BrowserRouter/);
  assert.doesNotMatch(router, /HashRouter/);
  assert.match(router, /SeoManager/);
});

test('SEO manager provides canonical, Open Graph, robots and structured data', () => {
  const seo = read('src/seo/SeoManager.tsx');
  for (const marker of ['canonical', 'og:title', 'og:description', 'BreadcrumbList', 'LocalBusiness', 'Service', 'Product', 'Article']) {
    assert.match(seo, new RegExp(marker));
  }
});

test('robots and sitemap contain production URLs only', () => {
  const robots = read('public/robots.txt');
  const sitemap = read('public/sitemap.xml');
  assert.match(robots, /Sitemap: https:\/\/dienlanh247\.vn\/sitemap\.xml/);
  assert.doesNotMatch(robots, /localhost|#\//);
  assert.doesNotMatch(sitemap, /localhost|#\//);
  assert.match(sitemap, /https:\/\/dienlanh247\.vn\/services/);
});

test('optimized images support AVIF, WebP, responsive widths and lazy loading', () => {
  const image = read('src/components/common/OptimizedImage.tsx');
  for (const marker of ['image/avif', 'image/webp', 'srcSet', 'sizes', "loading={priority ? 'eager' : 'lazy'}", 'fetchPriority']) {
    assert.match(image, new RegExp(marker.replace(/[{}?]/g, '\\$&')));
  }
});
