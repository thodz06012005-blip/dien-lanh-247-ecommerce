import api from './api';
import type {
  ServiceRequest,
  ServiceRequestListResponse,
  ServiceRequestStatus,
} from '@/features/service-requests/types';

export interface ServiceRequestFilters {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  priority?: string;
  serviceCategoryId?: string;
  technicianId?: string;
  quickFilter?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function listServiceRequests(filters: ServiceRequestFilters) {
  const response = await api.get('/admin/service-requests', { params: filters });
  return response.data as ServiceRequestListResponse;
}

export async function getServiceRequest(id: string) {
  const response = await api.get(`/admin/service-requests/${encodeURIComponent(id)}`);
  return response.data as { success: true; data: ServiceRequest };
}

export async function updateServiceRequestStatus(
  id: string,
  payload: {
    status: ServiceRequestStatus;
    note?: string;
    finalPrice?: number;
    preferredDate?: string;
    preferredTimeSlot?: string;
  },
) {
  const response = await api.patch(`/admin/service-requests/${encodeURIComponent(id)}/status`, payload);
  return response.data as { success: true; data: ServiceRequest };
}

export async function assignServiceRequestTechnician(id: string, technicianId: string) {
  const response = await api.patch(`/admin/service-requests/${encodeURIComponent(id)}/assign-technician`, { technicianId });
  return response.data as { success: true; data: ServiceRequest };
}

export async function uploadServiceRequestMedia(
  id: string,
  files: File[],
  stage: 'BEFORE' | 'DIAGNOSTIC' | 'AFTER' | 'WARRANTY',
  caption?: string,
) {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  form.append('stage', stage);
  if (caption) form.append('caption', caption);
  const response = await api.post(`/admin/service-requests/${encodeURIComponent(id)}/media`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
