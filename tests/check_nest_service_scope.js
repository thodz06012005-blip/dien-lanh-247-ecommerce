const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const appModule = fs.readFileSync(path.join(root, 'backend/src/app.module.ts'), 'utf8');
const schema = fs.readFileSync(path.join(root, 'backend/prisma/schema.prisma'), 'utf8');

assert.match(appModule, /const serviceOnly = process\.env\.SERVICE_ONLY !== 'false'/);
assert.match(appModule, /const commerceModules = serviceOnly\s*\? \[\]/);
assert.doesNotMatch(appModule, /^import .*modules\/(products|orders|cart)/m, 'commerce modules must not be eagerly imported');
assert.match(schema, /model Product\s*{/);
assert.match(schema, /model Order\s*{/);
assert.match(schema, /model Cart\s*{/);
for (const directory of ['service-requests', 'technicians', 'settings', 'auth']) {
  const files = fs.readdirSync(path.join(root, 'backend/src/modules', directory), { recursive: true });
  for (const file of files.filter((name) => name.endsWith('.ts'))) {
    const source = fs.readFileSync(path.join(root, 'backend/src/modules', directory, file), 'utf8');
    assert.doesNotMatch(source, /modules\/(products|orders|cart)|integrations\/payment\/vnpay/, `${directory}/${file} imports commerce runtime`);
  }
}
console.log('PASS: Nest service-only module graph is isolated and legacy Prisma tables are retained');
