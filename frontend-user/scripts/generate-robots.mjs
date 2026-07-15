import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const directory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(directory, '..');
const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const fileEnvironment = loadEnv(mode, projectDirectory, '');
const environment = { ...fileEnvironment, ...process.env };
const siteUrl = (environment.VITE_SITE_URL || environment.SITE_URL || 'https://dienlanh247.vn').replace(/\/$/, '');

const privatePaths = [
  '/account',
  '/orders',
  '/my-services',
  '/cart',
  '/checkout',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/service-lookup',
  '/quote-confirmation',
  '/service-booking/success',
  '/design-system',
];

const content = [
  'User-agent: *',
  'Allow: /',
  ...privatePaths.map((route) => `Disallow: ${route}`),
  '',
  `Sitemap: ${siteUrl}/sitemap.xml`,
  '',
].join('\n');

const outputPath = path.join(projectDirectory, 'public', 'robots.txt');
await writeFile(outputPath, content, 'utf8');
console.log(`[robots] Wrote crawler policy for ${siteUrl} to ${outputPath}.`);
