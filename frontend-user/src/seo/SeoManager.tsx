import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://dienlanh247.vn').replace(/\/$/, '');
const DEFAULT_IMAGE = `${SITE_URL}/og-cover.jpg`;

interface SeoEntry {
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
  type?: 'website' | 'article' | 'product';
  schema?: Record<string, unknown> | Record<string, unknown>[];
}

const staticSeo: Record<string, SeoEntry> = {
  '/': {
    title: 'Điện Lạnh 247 | Sửa chữa, bảo trì điện lạnh tận nơi',
    description: 'Dịch vụ sửa chữa, vệ sinh và bảo trì điều hòa, tủ lạnh, máy giặt tận nơi. Đặt lịch nhanh, báo giá minh bạch và bảo hành rõ ràng.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Điện Lạnh 247',
      url: SITE_URL,
      image: DEFAULT_IMAGE,
      telephone: import.meta.env.VITE_BUSINESS_PHONE || '1900 247',
      priceRange: '$$',
      areaServed: import.meta.env.VITE_SERVICE_AREA || 'Việt Nam',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'VN',
        addressLocality: import.meta.env.VITE_BUSINESS_CITY || 'Hà Nội',
      },
    },
  },
  '/services': {
    title: 'Dịch vụ điện lạnh | Điện Lạnh 247',
    description: 'Khám phá dịch vụ sửa chữa, vệ sinh, lắp đặt và bảo trì thiết bị điện lạnh với quy trình chuyên nghiệp và bảo hành minh bạch.',
  },
  '/projects': {
    title: 'Dự án đã thực hiện | Điện Lạnh 247',
    description: 'Các công trình lắp đặt, bảo trì và sửa chữa điện lạnh tiêu biểu do đội ngũ Điện Lạnh 247 thực hiện.',
  },
  '/articles': {
    title: 'Kiến thức điện lạnh | Điện Lạnh 247',
    description: 'Hướng dẫn sử dụng, bảo trì và xử lý các lỗi phổ biến của điều hòa, tủ lạnh, máy giặt và thiết bị điện lạnh.',
  },
  '/products': {
    title: 'Sản phẩm điện lạnh chính hãng | Điện Lạnh 247',
    description: 'Danh mục sản phẩm và linh kiện điện lạnh chính hãng, thông tin rõ ràng, giá minh bạch và hỗ trợ kỹ thuật chuyên nghiệp.',
  },
  '/about': {
    title: 'Giới thiệu Điện Lạnh 247',
    description: 'Tìm hiểu đội ngũ, năng lực, quy trình và cam kết chất lượng của Điện Lạnh 247.',
  },
  '/contact': {
    title: 'Liên hệ Điện Lạnh 247',
    description: 'Liên hệ Điện Lạnh 247 để được tư vấn, báo giá và đặt lịch sửa chữa điện lạnh nhanh chóng.',
  },
  '/service-booking': {
    title: 'Đặt lịch dịch vụ điện lạnh',
    description: 'Đặt lịch sửa chữa hoặc bảo trì điện lạnh trực tuyến chỉ trong vài bước.',
  },
};

function routeSeo(pathname: string): SeoEntry {
  if (staticSeo[pathname]) return staticSeo[pathname];
  if (/^\/services\/[\w-]+$/.test(pathname)) return {
    title: 'Chi tiết dịch vụ | Điện Lạnh 247',
    description: 'Thông tin chi tiết, quy trình, bảng giá tham khảo và chính sách bảo hành của dịch vụ điện lạnh.',
    schema: { '@context': 'https://schema.org', '@type': 'Service', provider: { '@type': 'LocalBusiness', name: 'Điện Lạnh 247' }, url: `${SITE_URL}${pathname}` },
  };
  if (/^\/products\/[\w-]+$/.test(pathname)) return {
    title: 'Chi tiết sản phẩm | Điện Lạnh 247',
    description: 'Thông tin sản phẩm, thông số, giá bán và chính sách hỗ trợ tại Điện Lạnh 247.',
    type: 'product',
    schema: { '@context': 'https://schema.org', '@type': 'Product', name: 'Sản phẩm điện lạnh', url: `${SITE_URL}${pathname}`, brand: { '@type': 'Brand', name: 'Điện Lạnh 247' } },
  };
  if (/^\/articles\/[\w-]+$/.test(pathname)) return {
    title: 'Bài viết điện lạnh | Điện Lạnh 247',
    description: 'Kiến thức và hướng dẫn thực tế về sử dụng, bảo trì và sửa chữa thiết bị điện lạnh.',
    type: 'article',
    schema: { '@context': 'https://schema.org', '@type': 'Article', headline: 'Kiến thức điện lạnh', mainEntityOfPage: `${SITE_URL}${pathname}`, publisher: { '@type': 'Organization', name: 'Điện Lạnh 247' } },
  };
  return { title: 'Không tìm thấy trang | Điện Lạnh 247', description: 'Trang bạn tìm kiếm không tồn tại hoặc đã được chuyển sang địa chỉ mới.', noindex: true };
}

function setMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let node = document.head.querySelector<HTMLMetaElement>(selector);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attribute, key);
    document.head.appendChild(node);
  }
  node.content = content;
}

export default function SeoManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    const seo = routeSeo(pathname);
    const canonical = `${SITE_URL}${pathname === '/' ? '' : pathname}`;
    document.title = seo.title;
    setMeta('meta[name="description"]', 'name', 'description', seo.description);
    setMeta('meta[name="robots"]', 'name', 'robots', seo.noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large');
    setMeta('meta[property="og:title"]', 'property', 'og:title', seo.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', seo.description);
    setMeta('meta[property="og:type"]', 'property', 'og:type', seo.type || 'website');
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    setMeta('meta[property="og:image"]', 'property', 'og:image', seo.image || DEFAULT_IMAGE);
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = canonical;
    document.querySelectorAll('script[data-seo-schema]').forEach((node) => node.remove());
    const schemas = [seo.schema, {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: pathname.split('/').filter(Boolean).map((segment, index, parts) => ({
        '@type': 'ListItem', position: index + 1, name: decodeURIComponent(segment).replaceAll('-', ' '), item: `${SITE_URL}/${parts.slice(0, index + 1).join('/')}`,
      })),
    }].flat().filter(Boolean);
    for (const schema of schemas) {
      const script = document.createElement('script'); script.type = 'application/ld+json'; script.dataset.seoSchema = 'true'; script.text = JSON.stringify(schema); document.head.appendChild(script);
    }
  }, [pathname]);
  return null;
}
