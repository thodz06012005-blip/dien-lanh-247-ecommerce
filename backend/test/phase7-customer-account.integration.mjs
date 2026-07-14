import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const baseUrl = process.env.PHASE7_API_URL || 'http://127.0.0.1:3000/api/v1';
const emailLogPath = process.env.SMTP_CAPTURE_FILE || 'phase7-emails.log';
const apiLogPath = process.env.PHASE7_API_LOG || 'phase7-api.log';
const prisma = new PrismaClient();

class CookieJar {
  constructor(source) {
    this.values = new Map(source ? source.values : undefined);
  }
  absorb(headers) {
    const setCookies = typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : [headers.get('set-cookie')].filter(Boolean);
    for (const cookie of setCookies) {
      const [pair, ...attributes] = cookie.split(';');
      const separator = pair.indexOf('=');
      if (separator < 1) continue;
      const name = pair.slice(0, separator).trim();
      const value = pair.slice(separator + 1).trim();
      const expired = attributes.some((item) => /max-age=0|expires=thu, 01 jan 1970/i.test(item));
      if (expired || !value) this.values.delete(name);
      else this.values.set(name, value);
    }
  }
  header(only) {
    const entries = only
      ? only.map((name) => [name, this.values.get(name)]).filter(([, value]) => value)
      : Array.from(this.values.entries());
    return entries.map(([name, value]) => `${name}=${value}`).join('; ');
  }
  get(name) { return this.values.get(name); }
  clone() { return new CookieJar(this); }
}

async function request(path, { method = 'GET', body, jar, cookieHeader } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const cookies = cookieHeader ?? jar?.header();
  if (cookies) headers.Cookie = cookies;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  jar?.absorb(response.headers);
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { status: response.status, json, headers: response.headers };
}

function decodeQuotedPrintable(input) {
  return input
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-F]{2})/gi, (_match, value) => String.fromCharCode(Number.parseInt(value, 16)));
}

async function waitForEmailToken(routeName, previousCount = 0) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const raw = readFileSync(emailLogPath, 'utf8');
    const messages = raw.split('\n---MESSAGE---\n').filter(Boolean);
    if (messages.length > previousCount) {
      for (const message of messages.slice(previousCount).reverse()) {
        const decoded = decodeQuotedPrintable(message);
        const match = decoded.match(new RegExp(`#/${routeName}\\?token=([A-Za-z0-9_-]+)`));
        if (match) return { token: match[1], count: messages.length };
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Did not receive ${routeName} email`);
}

function futureDate(days = 3) {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

const firstEmail = `phase7.owner.${Date.now()}@example.com`;
const secondEmail = `phase7.other.${Date.now()}@example.com`;
const firstPhone = '0912345678';
const secondPhone = '0987654321';
const firstPassword = 'PhaseSeven123';
const changedPassword = 'ChangedPhase789';
let emailCount = 0;

try {
  const categories = await request('/service-categories');
  assert.equal(categories.status, 200);
  const categoryId = categories.json?.data?.[0]?.id ?? categories.json?.data?.data?.[0]?.id;
  assert.ok(categoryId, 'service category seed is required');

  const createRequest = await request('/service-requests', {
    method: 'POST',
    body: {
      customerName: 'Nguyễn Chủ Yêu Cầu',
      customerPhone: firstPhone,
      customerEmail: firstEmail,
      customerAddress: '12 Trần Thái Tông',
      district: 'Quận Cầu Giấy',
      serviceCategoryId: categoryId,
      applianceType: 'Điều hòa treo tường',
      issueDescription: 'Điều hòa không làm lạnh và phát tiếng ồn bất thường.',
      preferredDate: futureDate(),
      preferredTimeSlot: '08:00 - 10:00',
      priority: 'medium',
      note: 'Yêu cầu được tạo trước tài khoản để kiểm tra liên kết.',
    },
  });
  assert.equal(createRequest.status, 201);
  const serviceRequestId = createRequest.json?.data?.code;
  assert.match(serviceRequestId, /^DL247-/);

  const ownerJar = new CookieJar();
  const registerOwner = await request('/auth/register', {
    method: 'POST',
    jar: ownerJar,
    body: {
      email: firstEmail,
      password: firstPassword,
      firstName: 'An',
      lastName: 'Nguyễn',
      phone: firstPhone,
    },
  });
  assert.equal(registerOwner.status, 201);
  assert.ok(ownerJar.get('accessToken'));
  assert.ok(ownerJar.get('refreshToken'));
  const ownerId = registerOwner.json?.data?.user?.id;
  assert.ok(Number.isInteger(ownerId));
  assert.equal(registerOwner.json?.data?.user?.password, undefined);
  assert.equal(registerOwner.json?.data?.user?.refreshToken, undefined);

  const verificationMail = await waitForEmailToken('verify-email', emailCount);
  emailCount = verificationMail.count;
  const verify = await request('/auth/verify-email', {
    method: 'POST',
    body: { token: verificationMail.token },
  });
  assert.equal(verify.status, 200);
  assert.equal(verify.json?.data?.user?.emailVerified, true);
  assert.ok(Number(verify.json?.data?.linkedCount) >= 1);

  const ownerServices = await request('/account/service-requests', { jar: ownerJar });
  assert.equal(ownerServices.status, 200);
  assert.ok(ownerServices.json?.data?.some((item) => item.id === serviceRequestId));

  const address = await request('/account/addresses', {
    method: 'POST',
    jar: ownerJar,
    body: {
      label: 'Nhà riêng',
      fullName: 'Nguyễn An',
      phone: firstPhone,
      province: 'Hà Nội',
      district: 'Cầu Giấy',
      ward: 'Dịch Vọng Hậu',
      streetAddress: '12 Trần Thái Tông',
      note: 'Gọi trước khi giao',
      isDefault: true,
    },
  });
  assert.equal(address.status, 201);
  assert.equal(Boolean(address.json?.data?.isDefault), true);
  const addressId = Number(address.json?.data?.id);

  const variant = await prisma.variant.findFirst({ include: { product: true } });
  assert.ok(variant, 'variant seed is required');
  const order = await prisma.order.create({
    data: {
      orderNumber: `P7-${Date.now()}`,
      userId: ownerId,
      addressId,
      subtotal: variant.price,
      shippingFee: 0,
      discount: 0,
      totalAmount: variant.price,
      status: 'PENDING',
      items: {
        create: {
          variantId: variant.id,
          productName: variant.product.name,
          variantName: variant.name,
          price: variant.price,
          quantity: 1,
        },
      },
    },
  });

  const ownerOrders = await request('/account/orders', { jar: ownerJar });
  assert.equal(ownerOrders.status, 200);
  assert.ok(ownerOrders.json?.data?.some((item) => item.id === order.id));

  const otherJar = new CookieJar();
  const registerOther = await request('/auth/register', {
    method: 'POST',
    jar: otherJar,
    body: {
      email: secondEmail,
      password: 'OtherAccount123',
      firstName: 'Bình',
      lastName: 'Trần',
      phone: secondPhone,
    },
  });
  assert.equal(registerOther.status, 201);
  const foreignService = await request(`/account/service-requests/${serviceRequestId}`, { jar: otherJar });
  assert.equal(foreignService.status, 404);
  const foreignOrder = await request(`/account/orders/${order.id}`, { jar: otherJar });
  assert.equal(foreignOrder.status, 404);

  const attackEmail = `missing.${Date.now()}@example.com`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const failed = await request('/auth/login', {
      method: 'POST',
      body: { email: attackEmail, password: 'WrongPassword123' },
    });
    assert.equal(failed.status, 401);
  }
  const rateLimited = await request('/auth/login', {
    method: 'POST',
    body: { email: attackEmail, password: 'WrongPassword123' },
  });
  assert.equal(rateLimited.status, 429);

  const originalRefresh = ownerJar.get('refreshToken');
  assert.ok(originalRefresh);
  await new Promise((resolve) => setTimeout(resolve, 2500));
  const expiredAccess = await request('/account', { jar: ownerJar });
  assert.equal(expiredAccess.status, 401);

  const refresh = await request('/auth/refresh', { method: 'POST', jar: ownerJar });
  assert.equal(refresh.status, 200);
  const rotatedRefresh = ownerJar.get('refreshToken');
  assert.ok(rotatedRefresh && rotatedRefresh !== originalRefresh);
  const accountAfterRefresh = await request('/account', { jar: ownerJar });
  assert.equal(accountAfterRefresh.status, 200);

  const reused = await request('/auth/refresh', {
    method: 'POST',
    cookieHeader: `refreshToken=${originalRefresh}`,
  });
  assert.equal(reused.status, 403);
  const revokedFamily = await request('/auth/refresh', {
    method: 'POST',
    cookieHeader: `refreshToken=${rotatedRefresh}`,
  });
  assert.equal(revokedFamily.status, 403);

  const loginAgainJar = new CookieJar();
  const loginAgain = await request('/auth/login', {
    method: 'POST',
    jar: loginAgainJar,
    body: { email: firstEmail, password: firstPassword },
  });
  assert.equal(loginAgain.status, 200);

  const forgot = await request('/auth/forgot-password', {
    method: 'POST',
    body: { email: firstEmail },
  });
  assert.equal(forgot.status, 200);
  assert.equal(forgot.json?.message, 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi.');
  const resetMail = await waitForEmailToken('reset-password', emailCount);
  emailCount = resetMail.count;

  const reset = await request('/auth/reset-password', {
    method: 'POST',
    body: { token: resetMail.token, newPassword: changedPassword },
  });
  assert.equal(reset.status, 200);
  const oldSessionAfterReset = await request('/account', { jar: loginAgainJar });
  assert.equal(oldSessionAfterReset.status, 401);

  const oldPasswordLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: firstEmail, password: firstPassword },
  });
  assert.equal(oldPasswordLogin.status, 401);
  const finalJar = new CookieJar();
  const newPasswordLogin = await request('/auth/login', {
    method: 'POST',
    jar: finalJar,
    body: { email: firstEmail, password: changedPassword },
  });
  assert.equal(newPasswordLogin.status, 200);

  const sessions = await request('/account/sessions', { jar: finalJar });
  assert.equal(sessions.status, 200);
  assert.ok(sessions.json?.data?.some((session) => session.current === true));

  const sessionRows = await prisma.$queryRawUnsafe(
    'SELECT refreshTokenHash FROM AuthSession WHERE userId = ?',
    ownerId,
  );
  assert.ok(sessionRows.length >= 1);
  for (const session of sessionRows) {
    assert.match(session.refreshTokenHash, /^[a-f0-9]{64}$/);
    assert.equal(session.refreshTokenHash.includes('.'), false);
  }
  const userSecrets = await prisma.user.findUnique({ where: { id: ownerId }, select: { refreshToken: true } });
  assert.equal(userSecrets?.refreshToken, null);

  const logout = await request('/auth/logout', { method: 'POST', jar: finalJar });
  assert.equal(logout.status, 200);
  const afterLogout = await request('/account', { jar: finalJar });
  assert.equal(afterLogout.status, 401);

  const apiLog = readFileSync(apiLogPath, 'utf8');
  for (const secret of [verificationMail.token, resetMail.token, originalRefresh, rotatedRefresh]) {
    assert.equal(apiLog.includes(secret), false, 'sensitive token leaked into API log');
  }

  console.log('Phase 7 customer account integration passed.');
} finally {
  await prisma.$disconnect();
}
