import assert from 'node:assert/strict';

const baseUrl = process.env.PHASE9_API_URL || 'http://127.0.0.1:3000/api/v1';
const email = process.env.ADMIN_TEST_EMAIL || 'admin@dienlanh247.vn';
const password = process.env.ADMIN_TEST_PASSWORD || 'Phase9Admin@12345';

function setCookies(response) {
  if (typeof response.headers.getSetCookie === 'function') return response.headers.getSetCookie();
  const value = response.headers.get('set-cookie');
  return value ? value.split(/,(?=[^;,]+=)/g) : [];
}
function cookieFrom(response, name) {
  const cookie = setCookies(response).find((value) => value.startsWith(`${name}=`));
  assert.ok(cookie, `missing ${name} cookie`);
  return cookie.split(';')[0];
}
async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  let body = null;
  try { body = await response.json(); } catch { body = null; }
  return { response, body };
}
async function login() {
  const result = await request('/admin/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  assert.equal(result.response.status, 200, JSON.stringify(result.body));
  assert.ok(result.body?.data?.permissions?.includes('content.manage'));
  return cookieFrom(result.response, 'adminAccessToken');
}

const access = await login();
const auth = { Cookie: access };
const unique = Date.now();
const sectionKey = `HOME_PHASE9_${unique}`;

console.log('Phase 9 CMS: unauthenticated admin access');
assert.equal((await request('/admin/cms/site-sections')).response.status, 401);

console.log('Phase 9 CMS: create sanitized draft');
const created = await request('/admin/cms/site-sections', {
  method: 'POST', headers: auth,
  body: JSON.stringify({
    sectionKey,
    name: 'Phase 9 integration section',
    eyebrow: 'Integration',
    title: 'CMS phản ánh nội dung thật',
    content: '<h2>Nội dung an toàn</h2><script>unsafe()</script><p onclick="evil()">Được kiểm duyệt.</p>',
    config: { tone: 'light', source: 'phase9-integration' },
    seoTitle: 'Phase 9 CMS integration',
    seoDescription: 'Kiểm tra preview, publish, soft delete và history.',
    isActive: true,
  }),
});
assert.equal(created.response.status, 201, JSON.stringify(created.body));
const sectionId = created.body?.data?.id;
assert.ok(sectionId);
assert.equal(created.body?.data?.status, 'DRAFT');
assert.doesNotMatch(String(created.body?.data?.content), /<script|onclick=/i);

console.log('Phase 9 CMS: draft preview and public isolation');
const preview = await request(`/admin/cms/site-sections/${sectionId}/preview`, { headers: auth });
assert.equal(preview.response.status, 200, JSON.stringify(preview.body));
assert.equal(preview.body?.data?.sectionKey, sectionKey);
let publicHome = await request('/site-content/home');
assert.equal(publicHome.response.status, 200, JSON.stringify(publicHome.body));
assert.equal(publicHome.body?.data?.sections?.some((item) => item.sectionKey === sectionKey), false);

console.log('Phase 9 CMS: publish and website reflection');
const published = await request(`/admin/cms/site-sections/${sectionId}/publish`, {
  method: 'POST', headers: auth, body: JSON.stringify({ summary: 'Publish from integration' }),
});
assert.equal(published.response.status, 201, JSON.stringify(published.body));
assert.equal(published.body?.data?.status, 'PUBLISHED');
publicHome = await request('/site-content/home');
assert.ok(publicHome.body?.data?.sections?.some((item) => item.sectionKey === sectionKey));

console.log('Phase 9 CMS: update version and history actor');
const updated = await request(`/admin/cms/site-sections/${sectionId}`, {
  method: 'PATCH', headers: auth,
  body: JSON.stringify({ title: 'CMS đã cập nhật không cần sửa code', config: { tone: 'brand', updated: true } }),
});
assert.equal(updated.response.status, 200, JSON.stringify(updated.body));
assert.ok(Number(updated.body?.data?.version) >= 3);
const history = await request(`/admin/cms/site-sections/${sectionId}/history`, { headers: auth });
assert.equal(history.response.status, 200, JSON.stringify(history.body));
const actions = history.body?.data?.map((item) => item.action) || [];
for (const action of ['CREATE', 'PUBLISH', 'UPDATE']) assert.ok(actions.includes(action), action);
assert.ok(history.body.data.every((item) => item.actorEmail === email));

console.log('Phase 9 CMS: unpublish removes public content');
const unpublished = await request(`/admin/cms/site-sections/${sectionId}/unpublish`, { method: 'POST', headers: auth });
assert.equal(unpublished.response.status, 201, JSON.stringify(unpublished.body));
publicHome = await request('/site-content/home');
assert.equal(publicHome.body?.data?.sections?.some((item) => item.sectionKey === sectionKey), false);

console.log('Phase 9 CMS: local media upload');
const mediaBody = new FormData();
mediaBody.append('file', new Blob(['phase9-media-content'], { type: 'image/png' }), `phase9-${unique}.png`);
mediaBody.append('name', 'Phase 9 integration image');
mediaBody.append('altText', 'Ảnh kiểm thử CMS Giai đoạn 9');
mediaBody.append('folder', 'integration');
const media = await request('/admin/cms/media/upload', { method: 'POST', headers: auth, body: mediaBody });
assert.equal(media.response.status, 201, JSON.stringify(media.body));
assert.equal(media.body?.data?.provider, 'local');
assert.match(media.body?.data?.url, /^\/uploads\/integration\//);

console.log('Phase 9 CMS: partner publish, soft archive and restore');
const partner = await request('/admin/cms/partners', {
  method: 'POST', headers: auth,
  body: JSON.stringify({ name: `Phase 9 Partner ${unique}`, description: 'Referenced partner', isFeatured: true }),
});
assert.equal(partner.response.status, 201, JSON.stringify(partner.body));
const partnerId = partner.body?.data?.id;
assert.ok(partnerId);
assert.equal((await request(`/admin/cms/partners/${partnerId}/publish`, { method: 'POST', headers: auth, body: '{}' })).response.status, 201);
publicHome = await request('/site-content/home');
assert.ok(publicHome.body?.data?.partners?.some((item) => Number(item.id) === Number(partnerId)));
const archivedPartner = await request(`/admin/cms/partners/${partnerId}`, { method: 'DELETE', headers: auth });
assert.equal(archivedPartner.response.status, 200, JSON.stringify(archivedPartner.body));
assert.ok(archivedPartner.body?.data?.deletedAt);
const partnerList = await request('/admin/cms/partners?includeDeleted=true&limit=100', { headers: auth });
assert.ok(partnerList.body?.data?.some((item) => Number(item.id) === Number(partnerId) && item.deletedAt));
const restoredPartner = await request(`/admin/cms/partners/${partnerId}/restore`, { method: 'POST', headers: auth });
assert.equal(restoredPartner.response.status, 201, JSON.stringify(restoredPartner.body));
assert.equal(restoredPartner.body?.data?.status, 'DRAFT');
assert.equal(restoredPartner.body?.data?.deletedAt, null);

console.log('Phase 9 CMS: archived section remains restorable');
const archivedSection = await request(`/admin/cms/site-sections/${sectionId}`, { method: 'DELETE', headers: auth });
assert.equal(archivedSection.response.status, 200, JSON.stringify(archivedSection.body));
assert.ok(archivedSection.body?.data?.deletedAt);
const retained = await request(`/admin/cms/site-sections/${sectionId}`, { headers: auth });
assert.equal(retained.response.status, 200, JSON.stringify(retained.body));
const restoredSection = await request(`/admin/cms/site-sections/${sectionId}/restore`, { method: 'POST', headers: auth });
assert.equal(restoredSection.response.status, 201, JSON.stringify(restoredSection.body));
assert.equal(restoredSection.body?.data?.status, 'DRAFT');
assert.equal(restoredSection.body?.data?.deletedAt, null);

console.log(`Phase 9 editorial CMS integration passed. section=${sectionId} media=${media.body?.data?.id} partner=${partnerId}`);
