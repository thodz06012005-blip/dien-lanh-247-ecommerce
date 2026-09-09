// Shared validation for the real backend and the mock API. No sample service area is activated.
const EMPTY_BUSINESS_CONFIG = {
  appliances: [], serviceAreas: [], timeSlots: [],
  pricing: { inspectionFee: 0, emergencySurcharge: 0, showPriceRanges: false, disclaimer: 'Chi phí được thông báo sau khi kiểm tra và trước khi sửa chữa.' },
  requestStatuses: ['pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled'].map(id => ({ id, label: id, color: 'slate', active: true })),
  roles: [
    { id: 'owner', name: 'Chủ cửa hàng', description: 'Quản lý cấu hình và tài chính' },
    { id: 'dispatcher', name: 'Điều phối', description: 'Tiếp nhận và phân công' },
    { id: 'technician', name: 'Kỹ thuật viên', description: 'Công việc được giao' },
  ],
  finance: { revenueRecognition: 'completed', technicianPayType: 'percentage', technicianPayRate: 0, includePartsInCommission: false },
};
function validateBusinessConfig(config) {
  const fail = field => { throw new Error(`Cấu hình nghiệp vụ không hợp lệ: ${field}`); };
  const obj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const string = x => typeof x === 'string' && x.trim().length > 0 && x.length <= 1000;
  const money = x => typeof x === 'number' && Number.isSafeInteger(x) && x >= 0 && x <= 9999999999;
  if (!obj(config)) fail('businessConfig');
  for (const key of ['appliances', 'serviceAreas', 'timeSlots', 'requestStatuses', 'roles']) {
    const items = config[key];
    if (!Array.isArray(items) || items.length > 50) fail(key);
    const ids = new Set(); const names = new Set();
    for (const item of items) {
      if (!obj(item) || !string(item.id) || ids.has(item.id)) fail(`${key}.id`);
      ids.add(item.id);
      const label = item.name ?? item.label;
      if (!string(label) || names.has(label)) fail(`${key}.name/label`);
      names.add(label);
      if (key !== 'roles' && typeof item.active !== 'boolean') fail(`${key}.active`);
      if (key === 'appliances') {
        if (!Array.isArray(item.issues) || !item.issues.length || item.issues.length > 50 || !item.issues.every(string)) fail('appliances.issues');
        if (!money(item.priceMin) || !money(item.priceMax) || item.priceMax < item.priceMin) fail('appliances.price');
      }
      if (key === 'serviceAreas' && !money(item.travelFee)) fail('serviceAreas.travelFee');
    }
  }
  const p = config.pricing; const f = config.finance;
  if (!obj(p) || !money(p.inspectionFee) || !money(p.emergencySurcharge) || typeof p.showPriceRanges !== 'boolean' || !string(p.disclaimer)) fail('pricing');
  if (!obj(f) || !['completed', 'paid'].includes(f.revenueRecognition) || !['percentage', 'fixed'].includes(f.technicianPayType) || !money(f.technicianPayRate) || (f.technicianPayType === 'percentage' && f.technicianPayRate > 100) || typeof f.includePartsInCommission !== 'boolean') fail('finance');
  return config;
}
module.exports = { EMPTY_BUSINESS_CONFIG, validateBusinessConfig };
