import { Link } from 'react-router-dom';
import { Clock3, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Wrench } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

const serviceLinks = [
  { label: 'Sửa điều hòa tại nhà', to: '/service-booking?service=sua-dieu-hoa-tai-nha' },
  { label: 'Vệ sinh điều hòa', to: '/service-booking?service=ve-sinh-dieu-hoa' },
  { label: 'Sửa máy giặt', to: '/service-booking?service=sua-may-giat' },
  { label: 'Sửa tủ lạnh', to: '/service-booking?service=sua-tu-lanh' },
  { label: 'Bảo trì doanh nghiệp', to: '/service-booking?service=bao-tri-doanh-nghiep' },
  { label: 'Tất cả dịch vụ', to: '/services' },
];

const companyLinks = [
  { label: 'Giới thiệu', to: '/about' },
  { label: 'Dự án tiêu biểu', to: '/projects' },
  { label: 'Bài viết kiến thức', to: '/articles' },
  { label: 'Sản phẩm', to: '/products' },
  { label: 'Liên hệ', to: '/contact' },
];

const policyLinks = [
  { label: 'Chính sách bảo hành', to: '/policy/warranty' },
  { label: 'Chính sách bảo mật', to: '/policy/privacy' },
  { label: 'Điều khoản sử dụng', to: '/policy/terms' },
  { label: 'Giao nhận & lắp đặt', to: '/policy/shipping' },
  { label: 'Đổi trả', to: '/policy/return' },
  { label: 'Thanh toán', to: '/policy/payment' },
];

export default function Footer() {
  const { settings } = useSettings();
  const currentYear = new Date().getFullYear();
  const hotline = settings?.hotline || '1900 1234';
  const zalo = settings?.zalo || hotline;
  const email = settings?.email || 'support@dienlanh247.vn';
  const address = settings?.address || 'Cầu Giấy, Hà Nội';

  return (
    <footer className="mt-auto border-t border-slate-900 bg-[#020b14] text-slate-400">
      <div className="border-b border-white/5 bg-[#061527]">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-7 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            { icon: ShieldCheck, title: 'Bảo hành có ghi nhận', text: 'Theo mã yêu cầu và hạng mục bàn giao.' },
            { icon: Wrench, title: 'Báo giá trước khi sửa', text: 'Khách hàng xác nhận rồi mới thực hiện.' },
            { icon: Clock3, title: 'Điều phối theo lịch', text: 'Xác nhận trước khi kỹ thuật viên di chuyển.' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 rounded-xl p-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-cyan-300">
                <item.icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <strong className="block text-sm font-black text-white">{item.title}</strong>
                <span className="mt-1 block text-xs leading-5 text-slate-400">{item.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.1fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5" aria-label="Điện Lạnh 247 - Trang chủ">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-cyan-500 text-lg font-black text-white">D</span>
              <span className="text-lg font-black text-white">Điện Lạnh <span className="text-cyan-300">247</span></span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              Nền tảng dịch vụ điện lạnh cho gia đình và doanh nghiệp, tập trung vào điều phối rõ ràng, báo giá minh bạch và theo dõi bảo hành.
            </p>
            <div className="mt-6 grid gap-3 text-sm">
              <a href={`tel:${hotline.replace(/\s+/g, '')}`} className="flex items-center gap-3 font-bold text-white hover:text-cyan-300">
                <Phone aria-hidden="true" className="h-4 w-4 text-cyan-300" /> {hotline}
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-3 break-all hover:text-white">
                <Mail aria-hidden="true" className="h-4 w-4 shrink-0 text-cyan-300" /> {email}
              </a>
              <span className="flex items-start gap-3">
                <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" /> {address}
              </span>
              <a
                href={`https://zalo.me/${zalo.replace(/\s+/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 font-bold text-cyan-300 hover:text-white"
              >
                <MessageCircle aria-hidden="true" className="h-4 w-4" /> Nhắn Zalo
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-white">Dịch vụ</h2>
            <ul className="mt-5 grid gap-3">
              {serviceLinks.map((item) => (
                <li key={item.label}><Link to={item.to} className="text-sm hover:text-cyan-300">{item.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-white">Khám phá</h2>
            <ul className="mt-5 grid gap-3">
              {companyLinks.map((item) => (
                <li key={item.label}><Link to={item.to} className="text-sm hover:text-cyan-300">{item.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-white">Chính sách</h2>
            <ul className="mt-5 grid gap-3">
              {policyLinks.map((item) => (
                <li key={item.label}><Link to={item.to} className="text-sm hover:text-cyan-300">{item.label}</Link></li>
              ))}
            </ul>
            <div className="mt-7 grid grid-cols-2 gap-2">
              <Link to="/my-services" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-black text-white hover:bg-white/10">Lịch sửa chữa</Link>
              <Link to="/orders" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-black text-white hover:bg-white/10">Đơn hàng</Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/5 pt-7 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© {currentYear} Điện Lạnh 247. Nội dung mẫu phục vụ xây dựng nền tảng.</p>
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
