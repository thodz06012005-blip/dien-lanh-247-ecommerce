import api from './api';
import type { ServiceRequest, ServiceRequestPriority } from '@/types/service';

export interface CreateServiceRequestPayload {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  district: string;
  applianceType: string;
  serviceCategoryId: string;
  issueDescription: string;
  priority: ServiceRequestPriority;
  preferredDate: string;
  preferredTimeSlot: string;
  note?: string;
}

export async function createServiceRequest(payload: CreateServiceRequestPayload) {
  const response = await api.post('/service-requests', payload);
  return response.data as {
    success: true;
    message: string;
    data: { id: string; code: string; status: 'NEW'; confirmationSent: boolean };
  };
}

export async function uploadCustomerRequestMedia(code: string, phone: string, files: File[]) {
  if (!files.length) return null;
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  form.append('phone', phone);
  form.append('stage', 'CUSTOMER_BEFORE');
  form.append('caption', 'Ảnh khách hàng cung cấp khi gửi yêu cầu');
  const response = await api.post(`/service-requests/${encodeURIComponent(code)}/media`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function lookupServiceRequest(code: string, phone: string) {
  const response = await api.post('/service-requests/lookup', { code, phone });
  return response.data as { success: true; data: ServiceRequest };
}
