import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const directory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(directory, '..');
const publicDirectory = path.join(projectDirectory, 'public');
const outputPath = path.join(publicDirectory, 'sitemap.xml');
const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const fileEnvironment = loadEnv(mode, projectDirectory, '');
const environment = { ...fileEnvironment, ...process.env };
const siteUrl = (environment.VITE_SITE_URL || environment.SITE_URL || 'https://dienlanh247.vn').replace(/\/$/, '');
const apiUrl = (
  environment.SITEMAP_API_URL ||
  environment.VITE_CONTENT_API_BASE_URL ||
  environment.VITE_API_BASE_URL ||
  ''
).replace(/\/$/, '');

const staticEntries = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/services', changefreq: 'weekly', priority: '0.9' },
  { path: '/products', changefreq: 'daily', priority: '0.9' },
  { path: '/projects', changefreq: 'weekly', priority: '0.8' },
  { path: '/articles', changefreq: 'daily', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'monthly', priority: '0.6' },
  { path: '/service-booking', changefreq: 'monthly', priority: '0.7' },
  { path: '/policy/warranty', changefreq: 'yearly', priority: '0.4' },
  { path: '/policy/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/policy/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/policy/shipping', changefreq: 'yearly', priority: '0.3' },
  { path: '/policy/returns', changefreq: 'yearly', priority: '0.3' },
  { path: '/policy/payment', changefreq: 'yearly', priority: '0.3' },
];

const dynamicSources = [
  { endpoint: '/services', route: '/services', priority: '0.8', changefreq: 'weekly' },
  { endpoint: '/projects', route: '/projects', priority: '0.7', changefreq: 'monthly' },
  { endpoint: '/posts', route: '/articles', priority: '0.7', changefreq: 'weekly' },
  { endpoint: '/products', route: '/products', priority: '0.8', changefreq: 'daily' },
];

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function unwrap(payload) {
  let value = payload;
  for (let depth = 0; depth < 3; depth += 1) {
    if (!value || typeof value !== 'object') break;
    if (Array.isArray(value.data)) return value;
    if (value.data && typeof value.data === 'object') value = value.data;
    else break;
  }
  return value;
}

async function fetchPage(endpoint, page) {
  const separator = endpoint.includes('?') ? '&' : '?';
  const response = await fetch(`${apiUrl}${endpoint}${separator}page=${page}&limit=100`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return unwrap(await response.json());
}

async function fetchAll(source) {
  const records = [];
  let page = 1;
  let totalPages = 1;
  do {
    const payload = await fetchPage(source.endpoint, page);
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    records.push(...rows);
    totalPages = Math.min(
      100,
      Math.max(1, Number(payload?.meta?.totalPages || payload?.pagination?.totalPages || 1)),
    );
    page += 1;
  } while (page <= totalPages);
  return records;
}

function toIsoDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

async function buildEntries() {
  const entries = [...staticEntries];
  if (!apiUrl) {
    console.log('[sitemap] SITEMAP_API_URL is not configured; writing static public routes only.');
    return entries;
  }

  for (const source of dynamicSources) {
    try {
      const records = await fetchAll(source);
      for (const record of records) {
        const identifier = record?.slug || record?.id;
        if (!identifier) continue;
        entries.push({
          path: `${source.route}/${encodeURIComponent(String(identifier))}`,
          changefreq: source.changefreq,
          priority: source.priority,
          lastmod: toIsoDate(record.updatedAt || record.publishedAt || record.createdAt),
        });
      }
      console.log(`[sitemap] Added ${records.length} records from ${source.endpoint}.`);
    } catch (error) {
      console.warn(
        `[sitemap] Could not load ${source.endpoint}; keeping safe static sitemap.`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  return entries;
}

function render(entries) {
  const unique = new Map();
  for (const entry of entries) unique.set(entry.path, entry);
  const urls = [...unique.values()]
    .sort((left, right) => left.path.localeCompare(right.path))
    .map((entry) => {
      const location = entry.path === '/' ? `${siteUrl}/` : `${siteUrl}${entry.path}`;
      return [
        '  <url>',
        `    <loc>${escapeXml(location)}</loc>`,
        ...(entry.lastmod ? [`    <lastmod>${entry.lastmod}</lastmod>`] : []),
        `    <changefreq>${entry.changefreq}</changefreq>`,
        `    <priority>${entry.priority}</priority>`,
        '  </url>',
      ].join('\n');
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

await mkdir(publicDirectory, { recursive: true });
const entries = await buildEntries();
await writeFile(outputPath, render(entries), 'utf8');
console.log(`[sitemap] Wrote ${entries.length} public URLs to ${outputPath}.`);
