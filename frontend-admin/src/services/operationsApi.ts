import api from './api';

export interface OperationsMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OperationsOverview {
  metrics: {
    customers: number;
    devices: number;
    technicians: number;
    activeRequests: number;
    breachedSla: number;
    unpaidAcceptedQuotes: number;
    activeWarranties: number;
    serviceRevenue30Days: number;
  };
  attention: Array<Record<string, unknown>>;
}

export interface OperationsWorkspace {
  request: Record<string, unknown>;
  customer: Record<string, unknown> | null;
  device: Record<string, unknown> | null;
  assignments: Array<Record<string, unknown>>;
  notes: Array<Record<string, unknown>>;
  sla: Record<string, unknown> | null;
  quotes: Array<Record<string, unknown> & { lines?: Array<Record<string, unknown>> }>;
  payments: Array<Record<string, unknown>>;
  completion: Record<string, unknown> | null;
  warranties: Array<Record<string, unknown>>;
  timeline: Array<Record<string, unknown>>;
  audit: Array<Record<string, unknown>>;
}

function data<T>(response: { data: { data?: T } | T }): T {
  const payload = response.data as { data?: T };
  return payload?.data ?? (response.data as T);
}

export async function getOperationsOverview() {
  return data<OperationsOverview>(await api.get('/admin/operations/overview'));
}

export async function getOperationsCustomers(params: Record<string, unknown> = {}) {
  return data<{ items: Array<Record<string, unknown>>; meta: OperationsMeta }>(await api.get('/admin/operations/customers', { params }));
}

export async function getOperationsCustomer(id: number) {
  return data<Record<string, unknown>>(await api.get(`/admin/operations/customers/${id}`));
}

export async function createCustomerDevice(payload: Record<string, unknown>) {
  return data<Record<string, unknown>>(await api.post('/admin/operations/devices', payload));
}

export async function updateCustomerDevice(id: number, payload: Record<string, unknown>) {
  return data<Record<string, unknown>>(await api.patch(`/admin/operations/devices/${id}`, payload));
}

export async function getOperationsTechnicians(params: Record<string, unknown> = {}) {
  return data<{ items: Array<Record<string, unknown>>; meta: OperationsMeta }>(await api.get('/admin/operations/technicians', { params }));
}

export async function getOperationsTechnician(id: string, params: Record<string, unknown> = {}) {
  return data<Record<string, unknown>>(await api.get(`/admin/operations/technicians/${encodeURIComponent(id)}`, { params }));
}

export async function createTechnicianSchedule(payload: Record<string, unknown>) {
  return data<Record<string, unknown>>(await api.post('/admin/operations/technician-schedules', payload));
}

export async function getOperationsWorkspace(id: string) {
  return data<OperationsWorkspace>(await api.get(`/admin/operations/requests/${encodeURIComponent(id)}`));
}

export async function dispatchTechnician(id: string, payload: Record<string, unknown>) {
  return data<OperationsWorkspace>(await api.post(`/admin/operations/requests/${encodeURIComponent(id)}/dispatch`, payload));
}

export async function rescheduleRequest(id: string, payload: Record<string, unknown>) {
  return data<OperationsWorkspace>(await api.post(`/admin/operations/requests/${encodeURIComponent(id)}/reschedule`, payload));
}

export async function addOperationsNote(id: string, payload: Record<string, unknown>) {
  return data<{ success: boolean }>(await api.post(`/admin/operations/requests/${encodeURIComponent(id)}/notes`, payload));
}

export async function getSlaPolicies() {
  return data<Array<Record<string, unknown>>>(await api.get('/admin/operations/sla/policies'));
}

export async function saveSlaPolicy(payload: Record<string, unknown>, id?: number) {
  const response = id
    ? await api.patch(`/admin/operations/sla/policies/${id}`, payload)
    : await api.post('/admin/operations/sla/policies', payload);
  return data<Record<string, unknown>>(response);
}

export async function getSlaAlerts(params: Record<string, unknown> = {}) {
  return data<Array<Record<string, unknown>>>(await api.get('/admin/operations/sla/alerts', { params }));
}

export async function evaluateSla() {
  return data<Array<Record<string, unknown>>>(await api.post('/admin/operations/sla/evaluate'));
}

export async function createServiceQuote(requestId: string, payload: Record<string, unknown>) {
  return data<Record<string, unknown>>(await api.post(`/admin/operations/requests/${encodeURIComponent(requestId)}/quotes`, payload));
}

export async function getServiceQuote(id: number) {
  return data<Record<string, unknown>>(await api.get(`/admin/operations/quotes/${id}`));
}

export async function recordServicePayment(requestId: string, payload: Record<string, unknown>) {
  return data<Record<string, unknown>>(await api.post(`/admin/operations/requests/${encodeURIComponent(requestId)}/payments`, payload));
}

export async function createCompletionReport(requestId: string, payload: Record<string, unknown>) {
  return data<Record<string, unknown>>(await api.post(`/admin/operations/requests/${encodeURIComponent(requestId)}/completion`, payload));
}

export async function createWarranty(requestId: string, payload: Record<string, unknown>) {
  return data<Record<string, unknown>>(await api.post(`/admin/operations/requests/${encodeURIComponent(requestId)}/warranties`, payload));
}

export async function addWarrantyEvent(id: number, payload: Record<string, unknown>) {
  return data<{ success: boolean }>(await api.post(`/admin/operations/warranties/${id}/events`, payload));
}
