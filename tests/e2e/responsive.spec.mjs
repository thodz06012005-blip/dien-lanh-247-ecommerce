import { expect, test } from '@playwright/test';

const userBase = (process.env.PHASE15_USER_URL || 'http://localhost:5173').replace(/\/$/, '');
const adminBase = (process.env.PHASE15_ADMIN_URL || 'http://localhost:5174').replace(/\/$/, '');

const customerPages = [
  ['home', '/'],
  ['services', '/services'],
  ['products', '/products'],
  ['service-booking', '/service-booking'],
  ['login', '/login'],
];

async function verifyResponsivePage(page, url, testInfo, label) {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  expect(response?.status(), `${label} must load`).toBeLessThan(400);
  await expect(page.locator('body')).toBeVisible();
  await expect
    .poll(
      () => page.evaluate(() => document.body.innerText.trim().length),
      { message: `${label} must finish loading meaningful content`, timeout: 15_000 },
    )
    .toBeGreaterThan(40);

  const viewport = page.viewportSize();
  expect(viewport?.width).toBeGreaterThan(300);
  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyText: document.body.innerText.trim().length,
    title: document.title,
  }));

  expect(layout.bodyText, `${label} must render meaningful content`).toBeGreaterThan(40);
  expect(layout.title, `${label} must set a document title`).not.toBe('');
  expect(
    layout.scrollWidth,
    `${label} must not cause horizontal overflow`,
  ).toBeLessThanOrEqual(layout.clientWidth + 2);
  expect(pageErrors, `${label} must not throw runtime errors`).toEqual([]);

  await page.screenshot({
    path: testInfo.outputPath(`${label}.png`),
    fullPage: false,
  });
}

test.describe('customer portal responsive acceptance', () => {
  for (const [name, path] of customerPages) {
    test(`${name} remains usable`, async ({ page }, testInfo) => {
      await verifyResponsivePage(page, `${userBase}${path}`, testInfo, `customer-${name}`);
    });
  }
});

test('admin login remains usable', async ({ page }, testInfo) => {
  await verifyResponsivePage(page, `${adminBase}/login`, testInfo, 'admin-login');
  await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
  await expect(page.locator('input[type="password"]').first()).toBeVisible();
});
