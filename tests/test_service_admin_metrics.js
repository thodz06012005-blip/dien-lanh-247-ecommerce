const assert = require('assert');
const customersRouter = require('../mock-api/routes/adminCustomers');
const dashboardRouter = require('../mock-api/routes/adminDashboard');

const now = new Date('2026-09-14T12:00:00.000Z');
const db = {
  customers: [
    { id: 'legacy', name: 'Legacy Order Only', phone: '0900000001', email: 'legacy@example.com' },
    { id: 'service', name: 'Service Contact', phone: '0900000002', email: 'service@example.com' },
  ],
  orders: [{ id: 'order-legacy', customerPhone: '0900000001', total: 999999999 }],
  technicians: [{ status: 'available' }, { status: 'busy' }],
  serviceRequests: [
    { customerName: 'Khách dịch vụ', customerPhone: '0900000002', status: 'completed', finalPrice: 500000, paymentStatus: 'paid', assignedTechnicianId: 'tech-1', createdAt: '2026-09-10T08:00:00.000Z', updatedAt: '2026-09-14T09:00:00.000Z' },
    { customerName: 'Khách dịch vụ', customerPhone: '0900000002', status: 'pending', finalPrice: 0, paymentStatus: 'unpaid', assignedTechnicianId: null, createdAt: '2026-09-14T10:00:00.000Z', updatedAt: '2026-09-14T10:00:00.000Z' },
  ],
};

const customers = customersRouter.buildServiceCustomers(db);
assert.strictEqual(customers.length, 1, 'legacy order-only customer must not enter active service customers');
assert.strictEqual(customers[0].phone, '0900000002');
assert.strictEqual(customers[0].serviceRequestCount, 2);
assert.strictEqual(customers[0].completedServiceCount, 1);
assert.strictEqual(customers[0].serviceRevenue, 500000);

const metrics = dashboardRouter.buildServiceDashboard(db, now.getTime());
assert.deepStrictEqual(metrics, {
  pending: 1,
  overdue: 1,
  unassigned: 0,
  inProgress: 0,
  completedToday: 1,
  serviceRevenueToday: 500000,
  collectedToday: 500000,
  techniciansAvailable: 1,
});
assert.ok(!('totalProducts' in metrics));
assert.ok(!('pendingOrders' in metrics));
console.log('PASS: admin dashboard and customers use service-only metrics');
