export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MediaAsset {
  id: number;
  name?: string;
  url: string;
  altText?: string;
  width?: number;
  height?: number;
  caption?: string;
}

interface EditorialSeoFields {
  seoTitle?: string;
  seoDescription?: string;
  socialImageUrl?: string;
  publishedAt?: string;
  updatedAt?: string;
}

export interface ManagedService extends EditorialSeoFields {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  pricing?: Array<{ label: string; price: string; note?: string }>;
  process?: string[];
  warranty?: string;
  faq?: Array<{ question: string; answer: string }>;
  categoryName?: string;
  categorySlug?: string;
  coverUrl?: string;
  coverAlt?: string;
  related?: Array<Pick<ManagedService, 'id' | 'title' | 'slug' | 'excerpt' | 'coverUrl'>>;
}

export interface ManagedProject extends EditorialSeoFields {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  clientName?: string;
  location?: string;
  startedAt?: string;
  completedAt?: string;
  tasks?: string[];
  content?: string;
  result?: string;
  coverUrl?: string;
  coverAlt?: string;
  album?: MediaAsset[];
}

export interface ManagedPost extends EditorialSeoFields {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  categoryName?: string;
  categorySlug?: string;
  authorName?: string;
  coverUrl?: string;
  coverAlt?: string;
  tags?: Array<{ id: number; name: string; slug: string }>;
}

export interface ContentListResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

export interface ContentDetailResponse<T> {
  success: boolean;
  data: T;
}
