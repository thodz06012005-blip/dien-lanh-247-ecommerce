import type {
  ContentDetailResponse,
  ContentListResponse,
  ManagedPost,
  ManagedProject,
  ManagedService,
} from '@/types/content';

const CONTENT_API_BASE_URL = (
  import.meta.env.VITE_CONTENT_API_BASE_URL || 'http://localhost:3000/api/v1'
).replace(/\/$/, '');
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000);

function unwrap<T>(payload: unknown): T {
  let value = payload as { data?: unknown };
  for (let depth = 0; depth < 3; depth += 1) {
    if (value?.data && typeof value.data === 'object' && 'success' in (value.data as object)) {
      return value.data as T;
    }
    if (value?.data && typeof value.data === 'object') {
      value = value.data as { data?: unknown };
      continue;
    }
    break;
  }
  return payload as T;
}

async function publicGet<T>(path: string, params?: object): Promise<T> {
  const url = new URL(`${CONTENT_API_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    credentials: 'omit',
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Public content request failed: ${response.status}`);
  }
  return unwrap<T>(await response.json());
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

export function getServices(params: ContentListParams = {}) {
  return publicGet<ContentListResponse<ManagedService>>('/services', params);
}

export function getService(slug: string) {
  return publicGet<ContentDetailResponse<ManagedService>>(`/services/${encodeURIComponent(slug)}`);
}

export function getProjects(params: ContentListParams = {}) {
  return publicGet<ContentListResponse<ManagedProject>>('/projects', params);
}

export function getProject(slug: string) {
  return publicGet<ContentDetailResponse<ManagedProject>>(`/projects/${encodeURIComponent(slug)}`);
}

export function getPosts(params: ContentListParams = {}) {
  return publicGet<ContentListResponse<ManagedPost>>('/posts', params);
}

export function getPost(slug: string) {
  return publicGet<ContentDetailResponse<ManagedPost>>(`/posts/${encodeURIComponent(slug)}`);
}

export function getSiteContent(scope: 'home' | 'footer' | 'all' = 'home') {
  return publicGet<{ success: boolean; data: SiteContentBundle }>(`/site-content/${scope}`);
}

export function getSiteSection(key: string) {
  return publicGet<{ success: boolean; data: SiteSectionContent }>(
    `/site-content/section/${encodeURIComponent(key)}`,
  );
}
