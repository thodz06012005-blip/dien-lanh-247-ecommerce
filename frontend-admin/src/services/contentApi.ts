import api from '@/services/api';

export type ContentType =
  | 'services'
  | 'service-categories'
  | 'projects'
  | 'posts'
  | 'categories'
  | 'tags'
  | 'media';

export interface AdminContentRecord {
  id: number | string;
  title?: string;
  name?: string;
  slug?: string;
  excerpt?: string;
  description?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isFeatured?: boolean;
  isActive?: boolean;
  updatedAt?: string;
  coverUrl?: string;
  url?: string;
  [key: string]: unknown;
}

export interface AdminContentListResponse {
  success: boolean;
  data: AdminContentRecord[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

function unwrap<T>(payload: unknown): T {
  const value = payload as { data?: unknown };
  if (value?.data && typeof value.data === 'object' && 'success' in (value.data as object)) return value.data as T;
  return payload as T;
}

export async function listContent(type: ContentType, params: Record<string, unknown>) {
  const response = await api.get(`/admin/content/${type}`, { params });
  return unwrap<AdminContentListResponse>(response.data);
}

export async function getContent(type: ContentType, id: number | string) {
  const response = await api.get(`/admin/content/${type}/${id}`);
  return unwrap<{ success: boolean; data: AdminContentRecord }>(response.data);
}

export async function previewContent(type: ContentType, id: number | string) {
  const response = await api.get(`/admin/content/${type}/${id}/preview`);
  return unwrap<{ success: boolean; data: AdminContentRecord }>(response.data);
}

export async function createContent(type: ContentType, payload: Record<string, unknown>) {
  const response = await api.post(`/admin/content/${type}`, payload);
  return unwrap<{ success: boolean; data: AdminContentRecord }>(response.data);
}

export async function updateContent(type: ContentType, id: number | string, payload: Record<string, unknown>) {
  const response = await api.patch(`/admin/content/${type}/${id}`, payload);
  return unwrap<{ success: boolean; data: AdminContentRecord }>(response.data);
}

export async function archiveContent(type: ContentType, id: number | string) {
  const response = await api.delete(`/admin/content/${type}/${id}`);
  return unwrap<{ success: boolean; data: { id: number | string; archived: boolean } }>(response.data);
}

export default api;
