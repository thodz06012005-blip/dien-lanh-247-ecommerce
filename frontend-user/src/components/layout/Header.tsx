import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  LogOut,
  Menu,
  MessageCircle,
  Phone,
  Search,
  ShoppingCart,
  UserRound,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useSettings } from '@/hooks/useSettings';

const navigation = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Dịch vụ', to: '/services' },
  { label: 'Tra cứu', to: '/service-lookup', icon: Search },
  { label: 'Dự án', to: '/projects' },
  { label: 'Bài viết', to: '/articles' },
  { label: 'Sản phẩm', to: '/products' },
  { label: 'Giới thiệu', to: '/about' },
  { label: 'Liên hệ', to: '/contact' },
];

export default function Header() {
  const { settings } = useSettings();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { items } = useCartStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const hotline = settings?.hotline || '1900 1234';
  const zalo = settings?.zalo || hotline;
  const cartCount = items.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/', { replace: true });
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="hidden bg-[#061527] text-white md:block">
          <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-6 text-xs lg:px-8">
            <div className="flex items-center gap-5">
              <a href={`tel:${hotline.replace(/\s+/g, '')}`} className="inline-flex items-center gap-2 font-bold text-slate-200 hover:text-white">
                <Phone aria-hidden="true" className="h-3.5 w-3.5 text-orange-400" />
                Hotline: <strong className="text-orange-300">{hotline}</strong>
              </a>
              <a href={`https://zalo.me/${zalo.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-bold text-slate-300 hover:text-white">
                <MessageCircle aria-hidden="true" className="h-3.5 w-3.5 text-cyan-300" /> Tư vấn qua Zalo
              </a>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <Link to="/service-lookup" className="inline-flex items-center gap-1.5 hover:text-white"><Search className="h-3.5 w-3.5" />Tra cứu yêu cầu</Link>
              <Link to="/policy/warranty" className="hover:text-white">Bảo hành</Link>
              <Link to="/policy/privacy" className="hover:text-white">Bảo mật</Link>
              <Link to="/policy/terms" className="hover:text-white">Điều khoản</Link>
            </div>
          </div>
        </div>

        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 md:h-[76px] lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Điện Lạnh 247 - Trang chủ">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-cyan-500 text-lg font-black text-white shadow-lg shadow-blue-500/20">D</span>
            <span className="hidden text-base font-black leading-none tracking-tight text-slate-950 sm:block">
              Điện Lạnh <span className="text-primary-600">247</span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Dịch vụ kỹ thuật</span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-0.5 xl:flex" aria-label="Điều hướng chính">
            {navigation.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-extrabold transition ${isActive ? 'bg-blue-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 xl:ml-3">
            <Link to="/service-booking" className="hidden min-h-11 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 lg:inline-flex">
              <CalendarDays aria-hidden="true" className="h-4 w-4" /> Đặt lịch
            </Link>

            <Link to="/cart" className="relative flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100" aria-label={`Giỏ hàng có ${cartCount} sản phẩm`}>
              <ShoppingCart aria-hidden="true" className="h-5 w-5" />
              {cartCount > 0 && <span className="absolute right-0.5 top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-white">{cartCount > 99 ? '99+' : cartCount}</span>}
            </Link>

            <Link to={isAuthenticated ? '/account' : '/login'} className="hidden h-11 items-center gap-2 rounded-xl px-3 text-sm font-extrabold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 sm:flex" aria-label={isAuthenticated ? 'Mở tài khoản' : 'Đăng nhập'}>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-primary-700">{isAuthenticated ? (user?.firstName || user?.email || 'K').charAt(0).toUpperCase() : <UserRound aria-hidden="true" className="h-4 w-4" />}</span>
              <span className="hidden max-w-24 truncate lg:block">{isAuthenticated ? user?.firstName || 'Tài khoản' : 'Đăng nhập'}</span>
            </Link>

            <button type="button" onClick={() => setMobileOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 xl:hidden" aria-label="Mở menu" aria-expanded={mobileOpen} aria-controls="customer-mobile-menu">
              <Menu aria-hidden="true" className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] xl:hidden" id="customer-mobile-menu">
          <button type="button" className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-label="Đóng menu" />
          <aside className="absolute bottom-0 right-0 top-0 flex w-[min(88vw,380px)] flex-col overflow-y-auto bg-white shadow-2xl" aria-label="Menu di động">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <Link to="/" className="flex items-center gap-2 font-black text-slate-950"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">D</span>Điện Lạnh <span className="text-primary-600">247</span></Link>
              <button type="button" onClick={() => setMobileOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100" aria-label="Đóng menu"><X aria-hidden="true" className="h-6 w-6" /></button>
            </div>

            <nav className="grid gap-1 p-4" aria-label="Điều hướng di động">
              {navigation.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `flex min-h-12 items-center gap-3 rounded-xl px-4 text-base font-black ${isActive ? 'bg-blue-50 text-primary-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                  {item.icon && <item.icon className="h-4 w-4" />}{item.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto grid gap-3 border-t border-slate-200 p-4">
              <Link to="/service-booking" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-black text-white"><CalendarDays aria-hidden="true" className="h-4 w-4" /> Đặt lịch kỹ thuật</Link>
              <Link to="/service-lookup" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 text-sm font-black text-primary-700"><Search aria-hidden="true" className="h-4 w-4" /> Tra cứu yêu cầu</Link>
              <a href={`tel:${hotline.replace(/\s+/g, '')}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-black text-slate-800"><Phone aria-hidden="true" className="h-4 w-4" /> {hotline}</a>
              <Link to={isAuthenticated ? '/account' : '/login'} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-black text-slate-800"><UserRound aria-hidden="true" className="h-4 w-4" /> {isAuthenticated ? 'Tài khoản của tôi' : 'Đăng nhập'}</Link>
              {isAuthenticated && <button type="button" onClick={handleLogout} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-black text-red-600 hover:bg-red-50"><LogOut aria-hidden="true" className="h-4 w-4" /> Đăng xuất</button>}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
