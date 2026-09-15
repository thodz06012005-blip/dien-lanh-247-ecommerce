const express = require('express');
const router = express.Router();
const { readDB } = require('../utils/db');
const { respondSuccess } = require('../utils/response');
const { requirePermission } = require('../utils/auth');

// GET /admin/dashboard — requires: dashboard:read (superadmin, admin, staff)
router.get('/admin/dashboard', requirePermission('dashboard:read'), (req, res) => {
  const db = readDB();
  const todayStr = new Date().toISOString().split('T')[0];

  const todayRevenue = db.orders
    .filter(o => o.status === 'delivered' && o.deliveredAt && o.deliveredAt.startsWith(todayStr))
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = db.orders.filter(o => o.status === 'pending').length;

  const newCustomers = db.customers.filter(c => c.createdAt && c.createdAt.startsWith(todayStr)).length;

  const totalProducts = db.products.length;
  const totalOrders = db.orders.length;

  const recentOrders = db.orders.slice(0, 5).map(o => ({
    key: o.id,
    orderNumber: o.code,
    customer: o.customerName,
    total: o.total,
    status: o.status,
    date: new Date(o.createdAt).toLocaleDateString('vi-VN')
  }));

  const stats = {
    todayRevenue,
    pendingOrders,
    newCustomers,
    totalProducts,
    totalOrders,
    recentOrders
  };

  return respondSuccess(res, stats);
});

module.exports = router;
