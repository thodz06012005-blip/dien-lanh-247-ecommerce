'use strict';
const businessDate = value => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
};
const requestDate = (request) => request.completedAt || request.updatedAt || request.createdAt || '';
const requestRevenue = (request) => Number(request.finalPrice || 0);
const requestPartsCost = (request) => Number(request.partsCost || 0);

function normalizePolicy(finance) {
  const rate = Number(finance.technicianPayRate ?? 0);
  if (!Number.isFinite(rate) || rate < 0 || !['fixed', 'percentage'].includes(finance.technicianPayType) || (finance.technicianPayType === 'percentage' && rate > 100) || typeof finance.includePartsInCommission !== 'boolean') throw new Error('Invalid technician pay policy');
  return { technicianPayType: finance.technicianPayType, technicianPayRate: rate, includePartsInCommission: finance.includePartsInCommission, revenueRecognition: finance.revenueRecognition || 'completed' };
}

function createFinanceSnapshot(request, finance, recordedAt = new Date().toISOString(), source = 'completion') {
  const policy = normalizePolicy(finance);
  const revenue = requestRevenue(request), partsCost = requestPartsCost(request);
  if (![revenue, partsCost].every(value => Number.isFinite(value) && value >= 0)) throw new Error('Invalid financial amounts');
  const commissionBase = policy.includePartsInCommission ? revenue : Math.max(0, revenue - partsCost);
  const technicianPay = policy.technicianPayType === 'fixed' ? policy.technicianPayRate : Math.round(commissionBase * policy.technicianPayRate / 100);
  return { version: 1, recordedAt, source, policy, revenue, partsCost, commissionBase, technicianPay };
}

function calculateTechnicianPay(request, finance) {
  return request.financeSnapshot?.technicianPay ?? createFinanceSnapshot(request, finance).technicianPay;
}

function ensureFinanceSnapshots(db, now = new Date().toISOString()) {
  let changed = false;
  for (const job of db.serviceRequests || []) {
    if (job.status === 'completed' && !job.financeSnapshot) {
      job.completedAt = job.completedAt || job.updatedAt || job.createdAt || null;
      job.financeSnapshot = createFinanceSnapshot(job, db.settings?.businessConfig?.finance || {}, now, 'legacy-baseline');
      changed = true;
    }
  }
  return changed;
}

function buildReport(db, month) {
  const finance = db.settings?.businessConfig?.finance || {};
  const technicians = new Map((db.technicians || []).map(item => [item.id, item]));
  const completed = (db.serviceRequests || [])
    .filter(item => item.status === 'completed' && (finance.revenueRecognition === 'paid' ? item.paymentStatus === 'paid' && businessDate(item.paidAt).startsWith(month) : businessDate(requestDate(item)).startsWith(month)))
    .map(item => {
      const revenue = requestRevenue(item);
      const partsCost = requestPartsCost(item);
      const technicianPay = calculateTechnicianPay(item, finance);
      const collected = item.paymentStatus === 'paid'
        ? revenue
        : item.paymentStatus === 'partial' ? Math.min(revenue, Number(item.amountCollected || 0)) : 0;
      return {
        id: item.id,
        completedAt: requestDate(item),
        paidAt: item.paidAt || null,
        customerName: item.customerName,
        applianceType: item.applianceType || 'Dịch vụ khác',
        technicianId: item.assignedTechnicianId || null,
        technicianName: technicians.get(item.assignedTechnicianId)?.name || 'Chưa xác định',
        revenue,
        collected,
        debt: Math.max(0, revenue - collected),
        partsCost,
        technicianPay,
        estimatedProfit: revenue - partsCost - technicianPay,
        paymentStatus: item.paymentStatus || 'unpaid',
        settlementStatus: item.technicianSettlementStatus || 'pending'
      };
    });

  const totals = completed.reduce((sum, item) => ({
    revenue: sum.revenue + item.revenue,
    collected: sum.collected + item.collected,
    debt: sum.debt + item.debt,
    partsCost: sum.partsCost + item.partsCost,
    technicianPay: sum.technicianPay + item.technicianPay,
    estimatedProfit: sum.estimatedProfit + item.estimatedProfit
  }), { revenue: 0, collected: 0, debt: 0, partsCost: 0, technicianPay: 0, estimatedProfit: 0 });

  const group = (key, labelKey) => Array.from(completed.reduce((map, item) => {
    const id = item[key] || 'unknown';
    const current = map.get(id) || { id, label: item[labelKey] || id, jobs: 0, revenue: 0, collected: 0, technicianPay: 0, estimatedProfit: 0 };
    current.jobs += 1; current.revenue += item.revenue; current.collected += item.collected; current.technicianPay += item.technicianPay; current.estimatedProfit += item.estimatedProfit;
    map.set(id, current); return map;
  }, new Map()).values()).sort((a, b) => b.revenue - a.revenue);

  const byDay = Array.from(completed.reduce((map, item) => {
    const day = businessDate(finance.revenueRecognition === 'paid' ? item.paidAt : item.completedAt);
    const current = map.get(day) || { date: day, revenue: 0, collected: 0, jobs: 0 };
    current.revenue += item.revenue; current.collected += item.collected; current.jobs += 1; map.set(day, current); return map;
  }, new Map()).values()).sort((a, b) => a.date.localeCompare(b.date));

  return {
    month,
    recognitionPolicy: finance.revenueRecognition || 'completed',
    totals: { ...totals, jobs: completed.length },
    byDay,
    byTechnician: group('technicianId', 'technicianName'),
    byService: group('applianceType', 'applianceType'),
    requests: completed.sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
    generatedAt: new Date().toISOString()
  };
}

const xmlEscape = value => String(value ?? '').replace(/[<>&'\"]/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char]));

function exportFinanceXml(report, month) {
  const headings = ['Mã yêu cầu', 'Ngày hoàn thành', 'Khách hàng', 'Dịch vụ', 'Kỹ thuật viên', 'Doanh thu', 'Đã thu', 'Công nợ', 'Linh kiện', 'Công thợ', 'Lợi nhuận', 'Thanh toán', 'Đối soát'];
  const rows = report.requests.map(item => [item.id, businessDate(item.completedAt), item.customerName, item.applianceType, item.technicianName, item.revenue, item.collected, item.debt, item.partsCost, item.technicianPay, item.estimatedProfit, item.paymentStatus, item.settlementStatus]);
  const rowXml = [headings, ...rows].map(row => `<Row>${row.map(value => `<Cell><Data ss:Type="${typeof value === 'number' ? 'Number' : 'String'}">${xmlEscape(value)}</Data></Cell>`).join('')}</Row>`).join('');
  return `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Doanh thu ${xmlEscape(month)}"><Table>${rowXml}</Table></Worksheet></Workbook>`;
}

module.exports = { businessDate, createFinanceSnapshot, calculateTechnicianPay, ensureFinanceSnapshots, buildReport, exportFinanceXml };
