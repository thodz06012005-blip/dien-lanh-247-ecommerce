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

export interface SiteBanner {
  id: number;
  placement?: string;
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  secondaryCtaLabel?: string | null;
  secondaryCtaUrl?: string | null;
  desktopMediaUrl?: string | null;
  mobileMediaUrl?: string | null;
  theme?: string;
}

export interface SitePartner {
  id: number;
  name: string;
  description?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  logoAlt?: string | null;
}

export interface SiteTestimonial {
  id: number;
  customerName: string;
  customerTitle?: string | null;
  company?: string | null;
  quote: string;
  rating: number;
  avatarUrl?: string | null;
  serviceTitle?: string | null;
}

export interface SiteSectionContent {
  id: number;
  sectionKey: string;
  name: string;
  eyebrow?: string | null;
  title?: string | null;
  content?: string | null;
  config?: Record<string, unknown> | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  socialImageUrl?: string | null;
}

export interface SiteContentBundle {
  scope: string;
  banners: SiteBanner[];
  partners: SitePartner[];
  testimonials: SiteTestimonial[];
  sections: SiteSectionContent[];
  services: ManagedService[];
  projects: ManagedProject[];
  posts: ManagedPost[];
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

export async function getSiteContent(scope: 'home' | 'footer' | 'all' = 'home') {
  const response = await contentApi.get(`/site-content/${scope}`);
  return unwrap<{ success: boolean; data: SiteContentBundle }>(response.data);
}

export async function getSiteSection(key: string) {
  const response = await contentApi.get(`/site-content/section/${encodeURIComponent(key)}`);
  return unwrap<{ success: boolean; data: SiteSectionContent }>(response.data);
}

export default contentApi;
