import axios from 'axios';

const contentApi = axios.create({
  baseURL: import.meta.env.VITE_CONTENT_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000),
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

contentApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin-access-token') || sessionStorage.getItem('admin-access-token');
  if (token && !config.headers.has('Authorization')) config.headers.set('Authorization', `Bearer ${token}`);
  if (config.method?.toLowerCase() === 'delete') config.headers.set('X-Confirm-Dangerous-Action', 'true');
  return config;
});

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
  const response = await contentApi.get(`/admin/content/${type}`, { params });
  return unwrap<AdminContentListResponse>(response.data);
}

export async function getContent(type: ContentType, id: number | string) {
  const response = await contentApi.get(`/admin/content/${type}/${id}`);
  return unwrap<{ success: boolean; data: AdminContentRecord }>(response.data);
}

export async function previewContent(type: ContentType, id: number | string) {
  const response = await contentApi.get(`/admin/content/${type}/${id}/preview`);
  return unwrap<{ success: boolean; data: AdminContentRecord }>(response.data);
}

export async function createContent(type: ContentType, payload: Record<string, unknown>) {
  const response = await contentApi.post(`/admin/content/${type}`, payload);
  return unwrap<{ success: boolean; data: AdminContentRecord }>(response.data);
}

export async function updateContent(type: ContentType, id: number | string, payload: Record<string, unknown>) {
  const response = await contentApi.patch(`/admin/content/${type}/${id}`, payload);
  return unwrap<{ success: boolean; data: AdminContentRecord }>(response.data);
}

export async function archiveContent(type: ContentType, id: number | string) {
  const response = await contentApi.delete(`/admin/content/${type}/${id}`);
  return unwrap<{ success: boolean; data: { id: number | string; archived: boolean } }>(response.data);
}

export default contentApi;
