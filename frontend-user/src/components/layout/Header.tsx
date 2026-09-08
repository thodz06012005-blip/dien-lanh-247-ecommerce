import { useEffect, useState } from 'react';
import { CalendarCheck, ChevronRight, History, Menu, Phone, UserRound, Wrench, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';
import { useAuthStore } from '../../store/authStore';

const navigation = [
  { label: 'Dịch vụ', href: '/services' },
  { label: 'Bảng giá tham khảo', href: '/#pricing' },
  { label: 'Quy trình', href: '/#process' },
  { label: 'Về chúng tôi', href: '/about' },
  { label: 'Liên hệ', href: '/contact' },
];

export default function Header() {
  const { settings } = useSettings();
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname, location.hash]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const phone = settings.hotline.replace(/\s+/g, '');

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${scrolled ? 'border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl' : 'border-slate-200/60 bg-white/90 backdrop-blur-lg'}`}>
      <div className="hidden border-b border-slate-100 bg-slate-950 text-slate-300 md:block">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-6 text-xs lg:px-8">
          <p>Phục vụ tại Hà Nội · Tiếp nhận yêu cầu mỗi ngày</p>
          <div className="flex items-center gap-5">
            <Link to="/track-service" className="transition hover:text-white">Tra cứu lịch sửa chữa</Link>
            <a href={`tel:${phone}`} className="font-semibold text-cyan-300 transition hover:text-cyan-200">Hotline: {settings.hotline}</a>
          </div>
        </div>
      </div>

      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100" aria-label="Điện Lạnh 247 - Trang chủ">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20"><Wrench className="h-5 w-5" aria-hidden="true" /></span>
          <span className="leading-none"><strong className="block text-base font-extrabold tracking-tight text-slate-950">Điện Lạnh <span className="text-blue-600">247</span></strong><span className="mt-1 block text-[11px] font-medium text-slate-500">Đặt thợ tận nhà</span></span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Điều hướng chính">
          {navigation.map((item) => (
            <Link key={item.label} to={item.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">{item.label}</Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          <a href={`tel:${phone}`} className="hidden min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 md:inline-flex" aria-label={`Gọi hotline ${settings.hotline}`}><Phone className="h-4 w-4 text-blue-600" aria-hidden="true" />{settings.hotline}</a>
          <Link to="/service-booking" className="hidden min-h-11 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 sm:inline-flex"><CalendarCheck className="h-4 w-4" aria-hidden="true" />Đặt lịch</Link>
          <Link to={isAuthenticated ? '/account' : '/login'} className="hidden h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:flex" aria-label={isAuthenticated ? 'Tài khoản của tôi' : 'Đăng nhập'}><UserRound className="h-5 w-5" aria-hidden="true" /></Link>
          <button type="button" onClick={() => setMenuOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 lg:hidden" aria-label="Mở menu" aria-expanded={menuOpen}><Menu className="h-5 w-5" /></button>
        </div>
      </div>

      <div className={`fixed inset-0 z-[60] lg:hidden ${menuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!menuOpen}>
        <button type="button" className={`absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setMenuOpen(false)} aria-label="Đóng menu" />
        <div className={`absolute right-0 top-0 flex h-full w-[min(88%,380px)] flex-col bg-white p-5 shadow-2xl transition-transform duration-300 ease-out ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <strong className="text-lg text-slate-950">Menu</strong>
            <button type="button" onClick={() => setMenuOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700" aria-label="Đóng menu"><X className="h-5 w-5" /></button>
          </div>
          <nav className="mt-5 space-y-1" aria-label="Điều hướng di động">
            {navigation.map((item) => <Link key={item.label} to={item.href} className="flex min-h-12 items-center justify-between rounded-xl px-3 text-base font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700">{item.label}<ChevronRight className="h-4 w-4" /></Link>)}
            <Link to="/track-service" className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-semibold text-slate-700 hover:bg-blue-50"><History className="h-5 w-5 text-blue-600" />Tra cứu lịch sửa chữa</Link>
          </nav>
          <div className="mt-auto space-y-3 border-t border-slate-100 pt-5">
            <Link to="/service-booking" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 font-bold text-white"><CalendarCheck className="h-5 w-5" />Đặt lịch sửa chữa</Link>
            <a href={`tel:${phone}`} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 font-semibold text-slate-800"><Phone className="h-5 w-5 text-blue-600" />Gọi {settings.hotline}</a>
          </div>
        </div>
      </div>
    </header>
  );
}
