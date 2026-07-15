import { useQuery } from '@tanstack/react-query';
import { Clock3, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';
import { getSiteContent, type SiteSectionContent } from '@/services/contentApi';

interface FooterLink {
  label: string;
  to: string;
}

interface FooterConfig {
  description?: string;
  copyright?: string;
  hotline?: string;
  zalo?: string;
  email?: string;
  address?: string;
  serviceLinks?: FooterLink[];
  companyLinks?: FooterLink[];
  policyLinks?: FooterLink[];
}

const fallbackServiceLinks: FooterLink[] = [
  { label: 'Sửa điều hòa tại nhà', to: '/service-booking?service=sua-dieu-hoa-tai-nha' },
  { label: 'Vệ sinh điều hòa', to: '/service-booking?service=ve-sinh-dieu-hoa' },
  { label: 'Sửa máy giặt', to: '/service-booking?service=sua-may-giat' },
  { label: 'Sửa tủ lạnh', to: '/service-booking?service=sua-tu-lanh' },
  { label: 'Bảo trì doanh nghiệp', to: '/service-booking?service=bao-tri-doanh-nghiep' },
  { label: 'Tất cả dịch vụ', to: '/services' },
];
const fallbackCompanyLinks: FooterLink[] = [
  { label: 'Giới thiệu', to: '/about' },
  { label: 'Dự án tiêu biểu', to: '/projects' },
  { label: 'Bài viết kiến thức', to: '/articles' },
  { label: 'Sản phẩm', to: '/products' },
  { label: 'Liên hệ', to: '/contact' },
];
const fallbackPolicyLinks: FooterLink[] = [
  { label: 'Chính sách bảo hành', to: '/policy/warranty' },
  { label: 'Chính sách bảo mật', to: '/policy/privacy' },
  { label: 'Điều khoản sử dụng', to: '/policy/terms' },
  { label: 'Giao nhận & lắp đặt', to: '/policy/shipping' },
  { label: 'Đổi trả', to: '/policy/returns' },
  { label: 'Thanh toán', to: '/policy/payment' },
];

function section(bundle: SiteSectionContent[] | undefined, keys: string[]) {
  return bundle?.find((item) => keys.includes(item.sectionKey));
}

function safeLinks(value: unknown, fallback: FooterLink[]) {
  if (!Array.isArray(value)) return fallback;
  const links = value.filter(
    (item): item is FooterLink =>
      Boolean(item && typeof item === 'object' && 'label' in item && 'to' in item),
  );
  return links.length ? links : fallback;
}

function FooterLinks({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h2 className="text-sm font-black uppercase tracking-[0.14em] text-white">{title}</h2>
      <ul className="mt-5 grid gap-3">
        {links.map((item) => (
          <li key={`${item.label}-${item.to}`}>
            {item.to.startsWith('/') ? (
              <Link to={item.to} className="text-sm hover:text-cyan-300">
                {item.label}
              </Link>
            ) : (
              <a
                href={item.to}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:text-cyan-300"
              >
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const { settings } = useSettings();
  const cmsQuery = useQuery({
    queryKey: ['site-content', 'footer'],
    queryFn: async () => (await getSiteContent('footer')).data,
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const footerSection = section(cmsQuery.data?.sections, ['FOOTER', 'FOOTER_MAIN']);
  const contactSection = section(cmsQuery.data?.sections, ['CONTACT', 'FOOTER_CONTACT']);
  const config = (footerSection?.config || {}) as FooterConfig;
  const contactConfig = (contactSection?.config || {}) as FooterConfig;
  const currentYear = new Date().getFullYear();
  const hotline = contactConfig.hotline || config.hotline || settings?.hotline || '1900 1234';
  const zalo = contactConfig.zalo || config.zalo || settings?.zalo || hotline;
  const email = contactConfig.email || config.email || settings?.email || 'support@dienlanh247.vn';
  const address = contactConfig.address || config.address || settings?.address || 'Cầu Giấy, Hà Nội';
  const description =
    footerSection?.content ||
    config.description ||
    'Nền tảng dịch vụ điện lạnh cho gia đình và doanh nghiệp, tập trung vào điều phối rõ ràng, báo giá minh bạch và theo dõi bảo hành.';
  const serviceLinks = safeLinks(config.serviceLinks, fallbackServiceLinks);
  const companyLinks = safeLinks(config.companyLinks, fallbackCompanyLinks);
  const policyLinks = safeLinks(config.policyLinks, fallbackPolicyLinks);

  return (
    <footer className="mt-auto border-t border-slate-900 bg-[#020b14] text-slate-300">
      <div className="border-b border-white/5 bg-[#061527]">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-7 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            { icon: ShieldCheck, title: 'Bảo hành có ghi nhận', text: 'Theo mã yêu cầu và hạng mục bàn giao.' },
            { icon: Wrench, title: 'Báo giá trước khi sửa', text: 'Khách hàng xác nhận rồi mới thực hiện.' },
            { icon: Clock3, title: 'Điều phối theo lịch', text: 'Xác nhận trước khi kỹ thuật viên di chuyển.' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 rounded-xl p-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-cyan-300">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <strong className="block text-sm font-black text-white">{item.title}</strong>
                <span className="mt-1 block text-xs leading-5 text-slate-300">{item.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.1fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-cyan-500 text-lg font-black text-white"
              >
                D
              </span>
              <span className="text-lg font-black text-white">
                Điện Lạnh <span className="text-cyan-300">247</span>
              </span>
            </Link>
            <div
              className="mt-5 max-w-sm text-sm leading-7 text-slate-300"
              dangerouslySetInnerHTML={{ __html: description }}
            />
            <div className="mt-6 grid gap-3 text-sm">
              <a
                href={`tel:${hotline.replace(/\s+/g, '')}`}
                className="flex items-center gap-3 font-bold text-white hover:text-cyan-300"
              >
                <Phone className="h-4 w-4 text-cyan-300" /> {hotline}
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-3 break-all hover:text-white">
                <Mail className="h-4 w-4 shrink-0 text-cyan-300" /> {email}
              </a>
              <span className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" /> {address}
              </span>
              <a
                href={`https://zalo.me/${zalo.replace(/\s+/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 font-bold text-cyan-300 hover:text-white"
              >
                <MessageCircle className="h-4 w-4" /> Nhắn Zalo
              </a>
            </div>
          </div>
          <FooterLinks title="Dịch vụ" links={serviceLinks} />
          <FooterLinks title="Khám phá" links={companyLinks} />
          <div>
            <FooterLinks title="Chính sách" links={policyLinks} />
            <div className="mt-7 grid grid-cols-2 gap-2">
              <Link
                to="/my-services"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-black text-white hover:bg-white/10"
              >
                Lịch sửa chữa
              </Link>
              <Link
                to="/orders"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-black text-white hover:bg-white/10"
              >
                Đơn hàng
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-white/5 pt-7 text-xs text-slate-300 md:flex-row md:items-center md:justify-between">
          <p>{config.copyright || `© ${currentYear} Điện Lạnh 247. Mọi quyền được bảo lưu.`}</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/policy/privacy" className="hover:text-white">Bảo mật</Link>
            <Link to="/policy/terms" className="hover:text-white">Điều khoản</Link>
            <Link to="/contact" className="hover:text-white">Hỗ trợ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
