import axios from 'axios';
import type {
  ContentDetailResponse,
  ContentListResponse,
  ManagedPost,
  ManagedProject,
  ManagedService,
} from '@/types/content';

const contentApi = axios.create({
  baseURL: import.meta.env.VITE_CONTENT_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000),
  headers: { Accept: 'application/json' },
});

function unwrap<T>(payload: unknown): T {
  const value = payload as { data?: unknown };
  if (value?.data && typeof value.data === 'object' && 'success' in (value.data as object)) {
    return value.data as T;
  }
  return payload as T;
}

export interface ContentListParams {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  tag?: string;
  featured?: boolean;
}

export async function getServices(params: ContentListParams = {}) {
  const response = await contentApi.get('/services', { params });
  return unwrap<ContentListResponse<ManagedService>>(response.data);
}

export async function getService(slug: string) {
  const response = await contentApi.get(`/services/${encodeURIComponent(slug)}`);
  return unwrap<ContentDetailResponse<ManagedService>>(response.data);
}

export async function getProjects(params: ContentListParams = {}) {
  const response = await contentApi.get('/projects', { params });
  return unwrap<ContentListResponse<ManagedProject>>(response.data);
}

export async function getProject(slug: string) {
  const response = await contentApi.get(`/projects/${encodeURIComponent(slug)}`);
  return unwrap<ContentDetailResponse<ManagedProject>>(response.data);
}

export async function getPosts(params: ContentListParams = {}) {
  const response = await contentApi.get('/posts', { params });
  return unwrap<ContentListResponse<ManagedPost>>(response.data);
}

export async function getPost(slug: string) {
  const response = await contentApi.get(`/posts/${encodeURIComponent(slug)}`);
  return unwrap<ContentDetailResponse<ManagedPost>>(response.data);
}

export default contentApi;
