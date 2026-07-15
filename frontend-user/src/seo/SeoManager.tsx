import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import api from '@/services/api';
import { getPost, getProject, getService } from '@/services/contentApi';

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://dienlanh247.vn').replace(/\/$/, '');
const DEFAULT_IMAGE = `${SITE_URL}/og-cover.jpg`;
const BUSINESS_NAME = 'Điện Lạnh 247';
const CACHE_FIVE_MINUTES = 5 * 60_000;

interface SeoEntry {
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
  type?: 'website' | 'article' | 'product';
  schema?: Record<string, unknown> | Record<string, unknown>[];
}

interface ProductSeoRecord {
  name?: string;
  slug?: string;
  description?: string;
  thumbnail?: string;
  images?: string[];
  sku?: string;
  basePrice?: number;
  salePrice?: number;
  inStock?: boolean;
  brand?: { name?: string };
}

const staticSeo: Record<string, SeoEntry> = {
  '/': {
    title: 'Điện Lạnh 247 | Sửa chữa, bảo trì điện lạnh tận nơi',
    description: 'Dịch vụ sửa chữa, vệ sinh và bảo trì điều hòa, tủ lạnh, máy giặt tận nơi. Đặt lịch nhanh, báo giá minh bạch và bảo hành rõ ràng.',
    schema: {
      '@context': 'https://schema.org',
      '@type': ['LocalBusiness', 'HomeAndConstructionBusiness'],
      name: BUSINESS_NAME,
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
    title: 'Đặt lịch dịch vụ điện lạnh | Điện Lạnh 247',
    description: 'Đặt lịch sửa chữa hoặc bảo trì điện lạnh trực tuyến chỉ trong vài bước, nhận mã theo dõi và xác nhận lịch rõ ràng.',
  },
  '/policy/warranty': {
    title: 'Chính sách bảo hành | Điện Lạnh 247',
    description: 'Điều kiện, phạm vi và quy trình tiếp nhận bảo hành dịch vụ và sản phẩm tại Điện Lạnh 247.',
  },
  '/policy/privacy': {
    title: 'Chính sách bảo mật | Điện Lạnh 247',
    description: 'Thông tin về cách Điện Lạnh 247 thu thập, sử dụng và bảo vệ dữ liệu cá nhân của khách hàng.',
  },
  '/policy/terms': {
    title: 'Điều khoản sử dụng | Điện Lạnh 247',
    description: 'Điều khoản sử dụng website, đặt dịch vụ và giao dịch với Điện Lạnh 247.',
  },
  '/policy/shipping': {
    title: 'Chính sách giao nhận | Điện Lạnh 247',
    description: 'Phạm vi, thời gian, chi phí và quy trình giao nhận sản phẩm của Điện Lạnh 247.',
  },
  '/policy/returns': {
    title: 'Chính sách đổi trả | Điện Lạnh 247',
    description: 'Điều kiện và quy trình đổi trả sản phẩm tại Điện Lạnh 247.',
  },
  '/policy/payment': {
    title: 'Phương thức thanh toán | Điện Lạnh 247',
    description: 'Các phương thức thanh toán an toàn và quy trình xác nhận thanh toán tại Điện Lạnh 247.',
  },
};

const privateSeo: Record<string, SeoEntry> = {
  '/cart': { title: 'Giỏ hàng | Điện Lạnh 247', description: 'Kiểm tra sản phẩm trong giỏ hàng trước khi thanh toán.', noindex: true },
  '/checkout': { title: 'Thanh toán | Điện Lạnh 247', description: 'Hoàn tất thông tin giao hàng và thanh toán đơn hàng.', noindex: true },
  '/login': { title: 'Đăng nhập | Điện Lạnh 247', description: 'Đăng nhập tài khoản khách hàng Điện Lạnh 247.', noindex: true },
  '/register': { title: 'Đăng ký tài khoản | Điện Lạnh 247', description: 'Tạo tài khoản để quản lý lịch sử dịch vụ và đơn hàng.', noindex: true },
  '/forgot-password': { title: 'Quên mật khẩu | Điện Lạnh 247', description: 'Yêu cầu liên kết đặt lại mật khẩu an toàn.', noindex: true },
  '/reset-password': { title: 'Đặt lại mật khẩu | Điện Lạnh 247', description: 'Tạo mật khẩu mới cho tài khoản khách hàng.', noindex: true },
  '/verify-email': { title: 'Xác minh email | Điện Lạnh 247', description: 'Xác minh địa chỉ email của tài khoản khách hàng.', noindex: true },
  '/account': { title: 'Tài khoản của tôi | Điện Lạnh 247', description: 'Quản lý hồ sơ, địa chỉ, thông báo và thiết bị đăng nhập.', noindex: true },
  '/orders': { title: 'Đơn hàng của tôi | Điện Lạnh 247', description: 'Theo dõi đơn hàng thuộc tài khoản đang đăng nhập.', noindex: true },
  '/my-services': { title: 'Yêu cầu dịch vụ của tôi | Điện Lạnh 247', description: 'Theo dõi tiến độ các yêu cầu dịch vụ thuộc tài khoản.', noindex: true },
  '/service-lookup': { title: 'Tra cứu yêu cầu dịch vụ | Điện Lạnh 247', description: 'Tra cứu trạng thái yêu cầu bằng mã và thông tin xác thực.', noindex: true },
  '/quote-confirmation': { title: 'Xác nhận báo giá | Điện Lạnh 247', description: 'Xem và phản hồi báo giá dịch vụ an toàn.', noindex: true },
  '/service-booking/success': { title: 'Đã tiếp nhận yêu cầu | Điện Lạnh 247', description: 'Yêu cầu dịch vụ đã được tiếp nhận.', noindex: true },
  '/design-system': { title: 'Design System | Điện Lạnh 247', description: 'Thư viện giao diện nội bộ.', noindex: true },
};

function segmentLabel(segment: string) {
  const known: Record<string, string> = {
    services: 'Dịch vụ',
    projects: 'Dự án',
    articles: 'Bài viết',
    products: 'Sản phẩm',
    about: 'Giới thiệu',
    contact: 'Liên hệ',
    policy: 'Chính sách',
  };
  return known[segment] || decodeURIComponent(segment).replaceAll('-', ' ');
}

function fallbackSeo(pathname: string): SeoEntry {
  if (staticSeo[pathname]) return staticSeo[pathname];
  if (privateSeo[pathname]) return privateSeo[pathname];
  if (/^\/(account|orders|my-services)(\/|$)/.test(pathname)) {
    return { title: 'Khu vực khách hàng | Điện Lạnh 247', description: 'Nội dung riêng tư dành cho tài khoản đang đăng nhập.', noindex: true };
  }
  if (/^\/services\/[\w-]+$/.test(pathname)) return {
    title: 'Chi tiết dịch vụ | Điện Lạnh 247',
    description: 'Thông tin chi tiết, quy trình, bảng giá tham khảo và chính sách bảo hành của dịch vụ điện lạnh.',
  };
  if (/^\/projects\/[\w-]+$/.test(pathname)) return {
    title: 'Chi tiết dự án | Điện Lạnh 247',
    description: 'Thông tin dự án điện lạnh tiêu biểu do Điện Lạnh 247 thực hiện.',
  };
  if (/^\/products\/[\w-]+$/.test(pathname)) return {
    title: 'Chi tiết sản phẩm | Điện Lạnh 247',
    description: 'Thông tin sản phẩm, thông số, giá bán và chính sách hỗ trợ tại Điện Lạnh 247.',
    type: 'product',
  };
  if (/^\/articles\/[\w-]+$/.test(pathname)) return {
    title: 'Bài viết điện lạnh | Điện Lạnh 247',
    description: 'Kiến thức và hướng dẫn thực tế về sử dụng, bảo trì và sửa chữa thiết bị điện lạnh.',
    type: 'article',
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
  const serviceSlug = pathname.match(/^\/services\/([\w-]+)$/)?.[1] || '';
  const projectSlug = pathname.match(/^\/projects\/([\w-]+)$/)?.[1] || '';
  const articleSlug = pathname.match(/^\/articles\/([\w-]+)$/)?.[1] || '';
  const productIdentifier = pathname.match(/^\/products\/([\w-]+)$/)?.[1] || '';

  const serviceQuery = useQuery({
    queryKey: ['managed-service', serviceSlug],
    queryFn: () => getService(serviceSlug),
    enabled: Boolean(serviceSlug),
    staleTime: CACHE_FIVE_MINUTES,
  });
  const projectQuery = useQuery({
    queryKey: ['managed-project', projectSlug],
    queryFn: () => getProject(projectSlug),
    enabled: Boolean(projectSlug),
    staleTime: CACHE_FIVE_MINUTES,
  });
  const articleQuery = useQuery({
    queryKey: ['managed-post', articleSlug],
    queryFn: () => getPost(articleSlug),
    enabled: Boolean(articleSlug),
    staleTime: CACHE_FIVE_MINUTES,
  });
  const productQuery = useQuery({
    queryKey: ['product', productIdentifier],
    queryFn: async () => {
      const response = await api.get(`/products/${encodeURIComponent(productIdentifier)}`);
      return response.data as { data?: ProductSeoRecord };
    },
    enabled: Boolean(productIdentifier),
    staleTime: CACHE_FIVE_MINUTES,
  });

  const seo = useMemo<SeoEntry>(() => {
    const service = serviceQuery.data?.data;
    if (service) {
      return {
        title: `${service.seoTitle || service.title} | ${BUSINESS_NAME}`,
        description: service.seoDescription || service.excerpt || 'Dịch vụ điện lạnh chuyên nghiệp, báo giá minh bạch và bảo hành rõ ràng.',
        image: service.socialImageUrl || service.coverUrl || DEFAULT_IMAGE,
        schema: {
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: service.title,
          description: service.seoDescription || service.excerpt,
          image: service.socialImageUrl || service.coverUrl || DEFAULT_IMAGE,
          url: `${SITE_URL}${pathname}`,
          areaServed: import.meta.env.VITE_SERVICE_AREA || 'Việt Nam',
          provider: { '@type': 'LocalBusiness', name: BUSINESS_NAME, url: SITE_URL },
        },
      };
    }

    const project = projectQuery.data?.data;
    if (project) {
      return {
        title: `${project.seoTitle || project.title} | ${BUSINESS_NAME}`,
        description: project.seoDescription || project.excerpt || 'Dự án điện lạnh tiêu biểu do Điện Lạnh 247 thực hiện.',
        image: project.socialImageUrl || project.coverUrl || DEFAULT_IMAGE,
        schema: {
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: project.title,
          description: project.seoDescription || project.excerpt,
          image: project.socialImageUrl || project.coverUrl || DEFAULT_IMAGE,
          url: `${SITE_URL}${pathname}`,
        },
      };
    }

    const article = articleQuery.data?.data;
    if (article) {
      return {
        title: `${article.seoTitle || article.title} | ${BUSINESS_NAME}`,
        description: article.seoDescription || article.excerpt || 'Kiến thức và hướng dẫn sử dụng thiết bị điện lạnh.',
        image: article.socialImageUrl || article.coverUrl || DEFAULT_IMAGE,
        type: 'article',
        schema: {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article.title,
          description: article.seoDescription || article.excerpt,
          image: article.socialImageUrl || article.coverUrl || DEFAULT_IMAGE,
          datePublished: article.publishedAt,
          dateModified: article.updatedAt,
          author: { '@type': 'Person', name: article.authorName?.trim() || `Ban biên tập ${BUSINESS_NAME}` },
          publisher: { '@type': 'Organization', name: BUSINESS_NAME, url: SITE_URL },
          mainEntityOfPage: `${SITE_URL}${pathname}`,
        },
      };
    }

    const product = productQuery.data?.data;
    if (product) {
      const price = product.salePrice || product.basePrice;
      return {
        title: `${product.name || 'Sản phẩm điện lạnh'} | ${BUSINESS_NAME}`,
        description: product.description || 'Sản phẩm điện lạnh chính hãng, thông tin minh bạch và hỗ trợ kỹ thuật chuyên nghiệp.',
        image: product.thumbnail || product.images?.[0] || DEFAULT_IMAGE,
        type: 'product',
        schema: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.description,
          image: product.images?.length ? product.images : [product.thumbnail || DEFAULT_IMAGE],
          sku: product.sku,
          brand: { '@type': 'Brand', name: product.brand?.name || BUSINESS_NAME },
          offers: price ? {
            '@type': 'Offer',
            priceCurrency: 'VND',
            price,
            availability: product.inStock === false ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
            url: `${SITE_URL}${pathname}`,
          } : undefined,
        },
      };
    }

    return fallbackSeo(pathname);
  }, [articleQuery.data?.data, pathname, productQuery.data?.data, projectQuery.data?.data, serviceQuery.data?.data]);

  useEffect(() => {
    const canonical = `${SITE_URL}${pathname === '/' ? '' : pathname}`;
    const image = seo.image || DEFAULT_IMAGE;
    document.title = seo.title;
    setMeta('meta[name="description"]', 'name', 'description', seo.description);
    setMeta('meta[name="robots"]', 'name', 'robots', seo.noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large');
    setMeta('meta[property="og:title"]', 'property', 'og:title', seo.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', seo.description);
    setMeta('meta[property="og:type"]', 'property', 'og:type', seo.type || 'website');
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    setMeta('meta[property="og:image"]', 'property', 'og:image', image);
    setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', BUSINESS_NAME);
    setMeta('meta[property="og:locale"]', 'property', 'og:locale', 'vi_VN');
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', seo.title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', seo.description);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image);

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonical;

    document.querySelectorAll('script[data-seo-schema]').forEach((node) => node.remove());
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumb = pathSegments.length ? {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE_URL },
        ...pathSegments.map((segment, index) => ({
          '@type': 'ListItem',
          position: index + 2,
          name: segmentLabel(segment),
          item: `${SITE_URL}/${pathSegments.slice(0, index + 1).join('/')}`,
        })),
      ],
    } : undefined;

    const schemas = [seo.schema, breadcrumb].flat().filter(Boolean);
    for (const schema of schemas) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seoSchema = 'true';
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    }
  }, [pathname, seo]);

  return null;
}
