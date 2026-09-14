const express = require('express');
const router = express.Router();
const { readDB } = require('../utils/db');
const { respondSuccess } = require('../utils/response');
const { requirePermission } = require('../utils/auth');

function buildServiceDashboard(db, now = Date.now()) {
  const requests = db.serviceRequests || [];
  const today = new Date(now).toISOString().slice(0, 10);
  const completedToday = requests.filter((request) => request.status === 'completed' && String(request.updatedAt).startsWith(today));
  const serviceRevenueToday = completedToday.reduce((sum, request) => sum + Number(request.finalPrice || 0), 0);
  const collectedToday = completedToday
    .filter((request) => request.paymentStatus === 'paid')
    .reduce((sum, request) => sum + Number(request.finalPrice || 0), 0);

  return {
    pending: requests.filter((request) => request.status === 'pending').length,
    overdue: requests.filter((request) => request.status === 'pending' && now - new Date(request.createdAt).getTime() > 30 * 60 * 1000).length,
    unassigned: requests.filter((request) => request.status === 'confirmed' && !request.assignedTechnicianId).length,
    inProgress: requests.filter((request) => ['assigned', 'in_progress'].includes(request.status)).length,
    completedToday: completedToday.length,
    serviceRevenueToday,
    collectedToday,
    techniciansAvailable: (db.technicians || []).filter((technician) => technician.status === 'available').length,
  };
}

router.get('/admin/dashboard', requirePermission('dashboard:read'), (req, res) => {
  return respondSuccess(res, buildServiceDashboard(readDB()));
});

router.buildServiceDashboard = buildServiceDashboard;
module.exports = router;
