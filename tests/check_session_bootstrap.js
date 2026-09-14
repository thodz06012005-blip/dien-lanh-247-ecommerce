const assert = require('assert');
const fs = require('fs');
const read = file => fs.readFileSync(file, 'utf8');
for (const [name, store, app, me] of [
  ['customer', read('frontend-user/src/store/authStore.ts'), read('frontend-user/src/App.tsx'), '/auth/me'],
  ['admin', read('frontend-admin/src/store/adminAuthStore.ts'), read('frontend-admin/src/App.tsx'), '/admin/auth/me'],
]) {
  assert.match(store, /status: 'unknown'/, `${name} must begin unknown`);
  assert.match(store, new RegExp(`api\\.get\\('${me}'\\)`), `${name} must bootstrap from me`);
  assert.doesNotMatch(store, /isAuthenticated: !!initial/, `${name} must not trust local cache`);
  assert.match(app, /AuthBootstrap/);
  assert.match(store, /clear.*Queries\(\)/);
}
const permissions = read('frontend-admin/src/auth/permissions.ts');
assert.match(permissions, /staff: \['dashboard\.read', 'requests\.read', 'requests\.update', 'technicians\.read'\]/);
assert.match(permissions, /finance\.correct.*settings\.manage.*audit\.read/);
const layout = read('frontend-admin/src/layouts/AdminLayout.tsx');
assert.match(layout, /filter\(item => can\(admin\?\.role, item\.permission\)\)/);
console.log('PASS: server bootstrap, cache clearing and frontend permission matrix');
