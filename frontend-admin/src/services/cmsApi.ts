import api from '@/services/api';

export type CmsContentType =
  | 'services'
  | 'service-categories'
  | 'projects'
  | 'posts'
  | 'categories'
  | 'tags'
  | 'media'
  | 'banners'
  | 'partners'
  | 'testimonials'
  | 'site-sections'
  | 'authors';

export interface CmsRecord {
  id: number | string;
  title?: string;
  name?: string;
  displayName?: string;
  customerName?: string;
  sectionKey?: string;
  slug?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isActive?: boolean;
  isFeatured?: boolean;
  deletedAt?: string | null;
  publishedAt?: string | null;
  updatedAt?: string;
  updatedByName?: string;
  updatedByEmail?: string;
  version?: number;
  url?: string;
  coverUrl?: string;
  desktopMediaUrl?: string;
  [key: string]: unknown;
}

export interface CmsListResponse {
  success: boolean;
  data: CmsRecord[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface CmsRevision {
  id: string;
  action: string;
  version: number;
  summary?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  createdAt: string;
  snapshot?: Record<string, unknown> | null;
}

function unwrap<T>(payload: unknown): T {
  const outer = payload as { data?: unknown };
  if (outer?.data && typeof outer.data === 'object' && 'success' in (outer.data as object)) {
    return outer.data as T;
  }
  return payload as T;
}

export async function listCms(type: CmsContentType, params: Record<string, unknown> = {}) {
  const response = await api.get(`/admin/cms/${type}`, { params });
  return unwrap<CmsListResponse>(response.data);
}

export async function getCms(type: CmsContentType, id: number | string) {
  const response = await api.get(`/admin/cms/${type}/${encodeURIComponent(String(id))}`);
  return unwrap<{ success: boolean; data: CmsRecord }>(response.data);
}

export async function previewCms(type: CmsContentType, id: number | string) {
  const response = await api.get(`/admin/cms/${type}/${encodeURIComponent(String(id))}/preview`);
  return unwrap<{ success: boolean; data: CmsRecord }>(response.data);
}

export async function createCms(type: CmsContentType, payload: Record<string, unknown>) {
  const response = await api.post(`/admin/cms/${type}`, payload);
  return unwrap<{ success: boolean; data: CmsRecord }>(response.data);
}

export async function updateCms(type: CmsContentType, id: number | string, payload: Record<string, unknown>) {
  const response = await api.patch(`/admin/cms/${type}/${encodeURIComponent(String(id))}`, payload);
  return unwrap<{ success: boolean; data: CmsRecord }>(response.data);
}

export async function publishCms(type: CmsContentType, id: number | string, publishedAt?: string) {
  const response = await api.post(`/admin/cms/${type}/${encodeURIComponent(String(id))}/publish`, {
    publishedAt: publishedAt || undefined,
  });
  return unwrap<{ success: boolean; data: CmsRecord }>(response.data);
}

export async function unpublishCms(type: CmsContentType, id: number | string) {
  const response = await api.post(`/admin/cms/${type}/${encodeURIComponent(String(id))}/unpublish`);
  return unwrap<{ success: boolean; data: CmsRecord }>(response.data);
}

export async function archiveCms(type: CmsContentType, id: number | string) {
  const response = await api.delete(`/admin/cms/${type}/${encodeURIComponent(String(id))}`);
  return unwrap<{ success: boolean; data: CmsRecord }>(response.data);
}

export async function restoreCms(type: CmsContentType, id: number | string) {
  const response = await api.post(`/admin/cms/${type}/${encodeURIComponent(String(id))}/restore`);
  return unwrap<{ success: boolean; data: CmsRecord }>(response.data);
}

export async function getCmsHistory(type: CmsContentType, id: number | string) {
  const response = await api.get(`/admin/cms/${type}/${encodeURIComponent(String(id))}/history`);
  return unwrap<{ success: boolean; data: CmsRevision[] }>(response.data);
}

export async function uploadCmsMedia(file: File, metadata: { name?: string; altText?: string; folder?: string }) {
  const body = new FormData();
  body.append('file', file);
  if (metadata.name) body.append('name', metadata.name);
  if (metadata.altText) body.append('altText', metadata.altText);
  if (metadata.folder) body.append('folder', metadata.folder);
  const response = await api.post('/admin/cms/media/upload', body, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60_000,
  });
  return unwrap<{ success: boolean; data: CmsRecord }>(response.data);
}
