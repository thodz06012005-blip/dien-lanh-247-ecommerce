const VALID_SERVICE_STATUSES = ['pending', 'confirmed', 'assigned', 'completed', 'cancelled'];
const VALID_SERVICE_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_TECHNICIAN_STATUSES = ['available', 'busy', 'offline', 'inactive'];
const VALID_ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const VALID_PAYMENT_STATUSES = ['unpaid', 'paid', 'failed', 'refunded'];
const VALID_PAYMENT_METHODS = ['COD', 'BANK_TRANSFER'];
const ACTIVE_SERVICE_REQUEST_STATUSES = ['assigned'];

module.exports = {
  VALID_SERVICE_STATUSES,
  VALID_SERVICE_PRIORITIES,
  VALID_TECHNICIAN_STATUSES,
  VALID_ORDER_STATUSES,
  VALID_PAYMENT_STATUSES,
  VALID_PAYMENT_METHODS,
  ACTIVE_SERVICE_REQUEST_STATUSES
};
