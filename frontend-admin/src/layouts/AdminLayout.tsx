import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Palette,
  Search,
  Settings as SettingsIcon,
  ShoppingBag,
  Snowflake,
  User,
  Users,
  Wrench,
} from 'lucide-react';
import clsx from 'clsx';
import { useAdminAuthStore } from '../store/adminAuthStore';

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const admin = useAdminAuthStore((state) => state.admin);
  const logoutStore = useAdminAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logoutStore();
    navigate('/login');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMobileOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const menuGroups = [
    {
      title: 'Chính',
      items: [
        { path: '/', label: 'Tổng quan', icon: <LayoutDashboard className="h-[18px] w-[18px] shrink-0" /> },
        { path: '/orders', label: 'Đơn hàng', icon: <ShoppingBag className="h-[18px] w-[18px] shrink-0" /> },
        { path: '/products', label: 'Sản phẩm', icon: <Package className="h-[18px] w-[18px] shrink-0" /> },
      ],
    },
    {
      title: 'Dịch vụ',
      items: [
        { path: '/service-requests', label: 'Yêu cầu sửa chữa', icon: <Wrench className="h-[18px] w-[18px] shrink-0" /> },
        { path: '/technicians', label: 'Quản lý thợ kỹ thuật', icon: <Users className="h-[18px] w-[18px] shrink-0" /> },
      ],
    },
    {
      title: 'Quản lý',
      items: [
        { path: '/customers', label: 'Khách hàng', icon: <Users className="h-[18px] w-[18px] shrink-0" /> },
        { path: '/settings', label: 'Cài đặt', icon: <SettingsIcon className="h-[18px] w-[18px] shrink-0" /> },
        { path: '/design-system', label: 'Thư viện giao diện', icon: <Palette className="h-[18px] w-[18px] shrink-0" /> },
      ],
    },
  ];

  const breadcrumbs: Record<string, string> = {
    '/': 'Tổng quan hệ thống',
    '/orders': 'Quản lý Đơn hàng',
    '/products': 'Quản lý Sản phẩm',
    '/customers': 'Quản lý Khách hàng',
    '/settings': 'Cài đặt Hệ thống',
    '/service-requests': 'Yêu cầu dịch vụ sửa chữa',
    '/technicians': 'Quản lý Thợ kỹ thuật',
    '/design-system': 'Thư viện giao diện quản trị',
  };

  const getBreadcrumbTitle = (pathname: string) => {
    if (pathname.startsWith('/service-requests/')) return 'Yêu cầu sửa chữa / Chi tiết yêu cầu';
    if (pathname.startsWith('/orders/')) return 'Quản lý Đơn hàng / Chi tiết đơn hàng';
    if (pathname.startsWith('/products/')) return 'Quản lý Sản phẩm / Chi tiết sản phẩm';
    if (pathname.startsWith('/technicians/')) return 'Quản lý Thợ kỹ thuật / Chi tiết thợ';
    return breadcrumbs[pathname] || 'Dashboard';
  };

  const currentPageTitle = getBreadcrumbTitle(location.pathname);

  const sidebarContent = (
    <>
      <div
        className={clsx(
          'flex h-16 items-center gap-3.5 border-b border-white/5 px-6',
          collapsed && 'justify-center px-0',
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-blue-500/20">
          <Snowflake className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col justify-center">
            <strong className="text-sm font-bold leading-tight text-white">Điện Lạnh 247</strong>
            <span className="mt-0.5 text-[11px] text-slate-400">Admin Panel</span>
          </div>
        )}
      </div>

      <nav aria-label="Điều hướng quản trị" className="flex flex-grow flex-col gap-6 overflow-y-auto px-3 py-4">
        {menuGroups.map((group) => (
          <div key={group.title} className="flex flex-col gap-1.5">
            {!collapsed && (
              <span className="px-3 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400/80">
                {group.title}
              </span>
            )}
            {group.items.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  className={clsx(
                    'admin-focus-ring group relative flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition',
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-900/20'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white',
                    collapsed && 'justify-center',
                  )}
                >
                  {isActive && !collapsed && (
                    <div className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                  )}
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div
        className={clsx(
          'mt-auto flex items-center gap-3 border-t border-white/5 p-5 pb-6',
          collapsed && 'justify-center p-3',
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-sm font-bold text-slate-300">
          {admin?.name?.[0] || 'A'}
        </div>
        {!collapsed && (
          <div className="flex min-w-0 flex-col">
            <strong className="truncate text-sm font-semibold text-slate-200">{admin?.name || 'Administrator'}</strong>
            <span className="truncate text-xs text-slate-400">{admin?.email || 'owner@dienlanh247.vn'}</span>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#F5F7FB] font-sans text-slate-800 antialiased">
      <a href="#admin-main-content" className="admin-skip-link">
        Chuyển đến nội dung quản trị
      </a>

      <aside
        aria-label="Thanh điều hướng quản trị"
        className={clsx(
          'sidebar-gradient sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-slate-800 text-white shadow-xl transition-all duration-300 lg:flex',
          collapsed ? 'w-[72px]' : 'w-[260px]',
        )}
      >
        {sidebarContent}
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Đóng menu quản trị"
            className="absolute inset-0 cursor-default bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside aria-label="Menu quản trị trên thiết bị di động" className="sidebar-gradient absolute inset-y-0 left-0 flex w-[min(86vw,260px)] flex-col text-white shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex h-screen min-w-0 flex-grow flex-col overflow-hidden">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/60 bg-white px-4 shadow-sm lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
              aria-expanded={!collapsed}
              onClick={() => setCollapsed(!collapsed)}
              className="admin-focus-ring hidden h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 lg:flex"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Mở menu quản trị"
              aria-expanded={isMobileOpen}
              onClick={() => setIsMobileOpen(true)}
              className="admin-focus-ring flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="hidden truncate text-sm font-extrabold tracking-tight text-slate-800 sm:block">
              {currentPageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 lg:gap-5">
            <button
              type="button"
              disabled
              aria-label="Tìm kiếm chưa khả dụng"
              className="relative flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl text-slate-500 opacity-50"
              title="Tính năng tìm kiếm đang được phát triển"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              disabled
              aria-label="Thông báo chưa khả dụng"
              className="relative flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl text-slate-500 opacity-50"
              title="Tính năng thông báo đang được phát triển"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-white bg-red-500" />
            </button>

            <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-focus-ring hidden min-h-10 items-center rounded-lg bg-primary-50 px-3 text-[11px] font-bold text-primary-600 transition-colors hover:text-primary-700 sm:flex"
            >
              Xem Web
            </a>

            <div className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={showProfileDropdown}
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="admin-focus-ring flex min-h-10 cursor-pointer items-center gap-3 rounded-xl border border-transparent p-1 transition-colors hover:border-slate-200 hover:bg-slate-50"
              >
                <div className="hidden flex-col items-end text-right sm:flex">
                  <span className="text-sm font-medium leading-tight text-slate-900">{admin?.name || 'Administrator'}</span>
                  <span className="mt-0.5 text-xs text-slate-500">{admin?.email || 'owner@dienlanh247.vn'}</span>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white">
                  {admin?.name?.[0] || 'A'}
                </div>
                <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
              </button>

              {showProfileDropdown && (
                <>
                  <button
                    type="button"
                    aria-label="Đóng menu tài khoản"
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setShowProfileDropdown(false)}
                  />
                  <div role="menu" className="absolute right-0 z-20 mt-2 flex w-48 flex-col rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold shadow-xl">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowProfileDropdown(false);
                        navigate('/settings');
                      }}
                      className="admin-focus-ring flex min-h-10 w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-left text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      <User className="h-4 w-4" />
                      <span>Thông tin tài khoản</span>
                    </button>
                    <hr className="my-1 border-slate-100" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="admin-focus-ring flex min-h-10 w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-left text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main
          id="admin-main-content"
          tabIndex={-1}
          className="page-fade-in relative w-full flex-grow overflow-y-auto p-4 outline-none lg:p-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
