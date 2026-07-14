import type { CmsContentType, CmsRecord } from '@/services/cmsApi';

export interface CmsTypeMeta {
  type: CmsContentType;
  label: string;
  singular: string;
  description: string;
  group: 'Nội dung chính' | 'Phân loại' | 'Website' | 'Tài nguyên';
  publishable: boolean;
}

export const CMS_TYPES: CmsTypeMeta[] = [
  { type: 'services', label: 'Dịch vụ', singular: 'dịch vụ', description: 'Mô tả, bảng giá, quy trình, bảo hành và FAQ.', group: 'Nội dung chính', publishable: true },
  { type: 'projects', label: 'Dự án', singular: 'dự án', description: 'Khách hàng, địa điểm, kết quả và album ảnh.', group: 'Nội dung chính', publishable: true },
  { type: 'posts', label: 'Bài viết', singular: 'bài viết', description: 'Nội dung, tác giả, danh mục, thẻ và lịch xuất bản.', group: 'Nội dung chính', publishable: true },
  { type: 'service-categories', label: 'Danh mục dịch vụ', singular: 'danh mục dịch vụ', description: 'Cấu trúc nhóm dịch vụ và metadata SEO.', group: 'Phân loại', publishable: false },
  { type: 'categories', label: 'Danh mục bài viết', singular: 'danh mục', description: 'Phân loại nội dung kiến thức.', group: 'Phân loại', publishable: false },
  { type: 'tags', label: 'Thẻ bài viết', singular: 'thẻ', description: 'Từ khóa liên kết giữa các bài viết.', group: 'Phân loại', publishable: false },
  { type: 'authors', label: 'Tác giả', singular: 'tác giả', description: 'Hồ sơ tác giả gắn với tài khoản nội bộ.', group: 'Phân loại', publishable: false },
  { type: 'banners', label: 'Banner', singular: 'banner', description: 'Hero, CTA, ảnh desktop/mobile và lịch hiển thị.', group: 'Website', publishable: true },
  { type: 'partners', label: 'Đối tác', singular: 'đối tác', description: 'Logo, liên kết và đối tác nổi bật.', group: 'Website', publishable: true },
  { type: 'testimonials', label: 'Đánh giá', singular: 'đánh giá', description: 'Nhận xét khách hàng và dịch vụ liên quan.', group: 'Website', publishable: true },
  { type: 'site-sections', label: 'Khu vực website', singular: 'khu vực', description: 'Trang chủ, liên hệ, footer và cấu hình hiển thị.', group: 'Website', publishable: true },
  { type: 'media', label: 'Media', singular: 'media', description: 'Ảnh, PDF, alt text và nguồn lưu trữ.', group: 'Tài nguyên', publishable: false },
];

export const cmsMeta = (type: CmsContentType) => CMS_TYPES.find((item) => item.type === type) ?? CMS_TYPES[0];

export function cmsRecordLabel(record: CmsRecord) {
  return String(record.title || record.name || record.displayName || record.customerName || record.sectionKey || record.slug || `#${record.id}`);
}

export const CMS_GROUPS = ['Nội dung chính', 'Phân loại', 'Website', 'Tài nguyên'] as const;
