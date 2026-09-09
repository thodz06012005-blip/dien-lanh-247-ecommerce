const assert = require('node:assert/strict');
const { DEFAULT_BUSINESS_CONFIG } = require('../mock-api/businessConfig');
async function run() {
  const { publicSettingsSchema } = await import('../frontend-user/src/hooks/publicSettingsSchema.ts');
  const valid = { hotline: '', zalo: '', email: '', address: '', shippingFee: 0, freeShippingThreshold: 0, businessConfig: structuredClone(DEFAULT_BUSINESS_CONFIG) };
  const parsed = publicSettingsSchema.parse(valid);
  assert.equal(parsed.businessConfig.finance, undefined);
  assert.equal(parsed.businessConfig.appliances.length, valid.businessConfig.appliances.length);
  for (const value of [null, {}, { ...valid, businessConfig: undefined }, { ...valid, businessConfig: {} }, { ...valid, businessConfig: { ...valid.businessConfig, appliances: [null] } }, { ...valid, shippingFee: '0' }, { ...valid, shippingFee: Infinity }, { ...valid, businessConfig: { ...valid.businessConfig, appliances: [{ ...valid.businessConfig.appliances[0], priceMin: 200, priceMax: 100 }] } }]) assert.equal(publicSettingsSchema.safeParse(value).success, false);
  const empty = { ...valid, businessConfig: { ...valid.businessConfig, appliances: [], serviceAreas: [], timeSlots: [] } };
  assert.deepEqual(publicSettingsSchema.parse(empty).businessConfig.appliances, []);
  console.log('P0 frontend settings schema: valid/empty config, missing fields, malformed arrays, invalid amounts PASS');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
