export const EDITORIAL_CONTENT_TYPES = [
  'services',
  'service-categories',
  'projects',
  'posts',
  'categories',
  'tags',
  'media',
  'banners',
  'partners',
  'testimonials',
  'site-sections',
  'authors',
] as const;

export type EditorialContentType = (typeof EDITORIAL_CONTENT_TYPES)[number];

export const LEGACY_CONTENT_TYPES = [
  'services',
  'service-categories',
  'projects',
  'posts',
  'categories',
  'tags',
  'media',
] as const satisfies readonly EditorialContentType[];

export const PUBLISHABLE_CONTENT_TYPES = [
  'services',
  'projects',
  'posts',
  'banners',
  'partners',
  'testimonials',
  'site-sections',
] as const satisfies readonly EditorialContentType[];

export interface EditorialActor {
  userId: number;
  email: string;
  role: string;
  name?: string;
}

export interface EditorialTableConfig {
  table: string;
  labelField: string;
  slugField?: string;
  publishable: boolean;
  activeField?: string;
}

export const EDITORIAL_TABLES: Record<EditorialContentType, EditorialTableConfig> = {
  services: { table: 'Service', labelField: 'title', slugField: 'slug', publishable: true },
  'service-categories': { table: 'ServiceCategory', labelField: 'name', slugField: 'slug', publishable: false, activeField: 'isActive' },
  projects: { table: 'Project', labelField: 'title', slugField: 'slug', publishable: true },
  posts: { table: 'Post', labelField: 'title', slugField: 'slug', publishable: true },
  categories: { table: 'Category', labelField: 'name', slugField: 'slug', publishable: false, activeField: 'isActive' },
  tags: { table: 'Tag', labelField: 'name', slugField: 'slug', publishable: false, activeField: 'isActive' },
  media: { table: 'Media', labelField: 'name', publishable: false, activeField: 'isActive' },
  banners: { table: 'Banner', labelField: 'name', publishable: true, activeField: 'isActive' },
  partners: { table: 'Partner', labelField: 'name', publishable: true, activeField: 'isActive' },
  testimonials: { table: 'Testimonial', labelField: 'customerName', publishable: true, activeField: 'isActive' },
  'site-sections': { table: 'SiteSection', labelField: 'name', publishable: true, activeField: 'isActive' },
  authors: { table: 'AuthorProfile', labelField: 'displayName', publishable: false, activeField: 'isActive' },
};

export const isEditorialType = (value: string): value is EditorialContentType =>
  EDITORIAL_CONTENT_TYPES.includes(value as EditorialContentType);

export const isLegacyType = (value: EditorialContentType) =>
  (LEGACY_CONTENT_TYPES as readonly string[]).includes(value);

export const isPublishableType = (value: EditorialContentType) =>
  (PUBLISHABLE_CONTENT_TYPES as readonly string[]).includes(value);
