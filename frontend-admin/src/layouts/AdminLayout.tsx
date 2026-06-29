import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings as SettingsIcon,
  Menu,
  LogOut,
  User,
  Snowflake,
  Search,
  Bell,
  ChevronDown,
  Wrench
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

  // Auto close mobile drawer on route change
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
      ]
    },
    {
      title: 'Dịch vụ',
      items: [
        { path: '/service-requests', label: 'Yêu cầu sửa chữa', icon: <Wrench className="h-[18px] w-[18px] shrink-0" /> },
        { path: '/technicians', label: 'Quản lý thợ kỹ thuật', icon: <Users className="h-[18px] w-[18px] shrink-0" /> },
      ]
    },
    {
      title: 'Quản lý',
      items: [
        { path: '/customers', label: 'Khách hàng', icon: <Users className="h-[18px] w-[18px] shrink-0" /> },
        { path: '/settings', label: 'Cài đặt', icon: <SettingsIcon className="h-[18px] w-[18px] shrink-0" /> }
      ]
    }
  ];

  const breadcrumbs: Record<string, string> = {
    '/': 'Tổng quan hệ thống',
    '/orders': 'Quản lý Đơn hàng',
    '/products': 'Quản lý Sản phẩm',
    '/customers': 'Quản lý Khách hàng',
    '/settings': 'Cài đặt Hệ thống',
    '/service-requests': 'Yêu cầu dịch vụ sửa chữa',
    '/technicians': 'Quản lý Thợ kỹ thuật',
  };

  const getBreadcrumbTitle = (pathname: string) => {
    if (pathname.startsWith('/service-requests/')) {
      return 'Yêu cầu sửa chữa / Chi tiết yêu cầu';
    }
    if (pathname.startsWith('/orders/')) {
      return 'Quản lý Đơn hàng / Chi tiết đơn hàng';
    }
    if (pathname.startsWith('/products/')) {
      return 'Quản lý Sản phẩm / Chi tiết sản phẩm';
    }
    if (pathname.startsWith('/technicians/')) {
      return 'Quản lý Thợ kỹ thuật / Chi tiết thợ';
    }
    return breadcrumbs[pathname] || 'Dashboard';
  };

  const currentPageTitle = getBreadcrumbTitle(location.pathname);

  const sidebarContent = (
    <>
      {/* Brand/Logo */}
      <div className={clsx(
        'flex items-center h-16 px-6 border-b border-white/5 gap-3.5',
        collapsed && 'justify-center px-0'
      )}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
          <Snowflake className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col justify-center">
            <strong className="text-sm font-bold text-white leading-tight">Điện Lạnh 247</strong>
            <span className="text-[11px] text-slate-400 mt-0.5">Admin Panel</span>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-grow py-4 px-3 flex flex-col gap-6 overflow-y-auto">
        {menuGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="flex flex-col gap-1.5">
            {!collapsed && (
              <span className="px-3 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400/80">
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
                  className={clsx(
                    'group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition',
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-900/20'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white',
                    collapsed && 'justify-center'
                  )}
                >
                  {isActive && !collapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                  )}
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className={clsx(
        'p-5 pb-6 border-t border-white/5 flex gap-3 items-center mt-auto',
        collapsed && 'justify-center p-3'
      )}>
        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm shrink-0">
          {admin?.name?.[0] || 'A'}
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <strong className="text-sm font-semibold text-slate-200 truncate">{admin?.name || 'Administrator'}</strong>
            <span className="text-xs text-slate-400 truncate">{admin?.email || 'owner@dienlanh247.vn'}</span>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#F5F7FB] font-sans text-slate-800 antialiased overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          'sidebar-gradient text-white flex-col transition-all duration-300 shadow-xl shrink-0 sticky top-0 h-screen z-30 hidden lg:flex border-r border-slate-800',
          collapsed ? 'w-[72px]' : 'w-[260px]'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute top-0 left-0 bottom-0 w-[260px] sidebar-gradient text-white flex flex-col shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar Header */}
        <header className="h-16 bg-white flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20 shadow-sm border-b border-slate-200/60 shrink-0">
          <div className="flex items-center gap-4">
            {/* Desktop Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer hidden lg:flex"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Mobile Toggle */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb / Page Title */}
            <h1 className="text-sm font-extrabold text-slate-800 tracking-tight hidden sm:block">
              {currentPageTitle}
            </h1>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 lg:gap-5">
            <button 
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 cursor-not-allowed opacity-50"
              title="Tính năng tìm kiếm đang được phát triển"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
            <button 
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 cursor-not-allowed opacity-50"
              title="Tính năng thông báo đang được phát triển"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 border border-white" />
            </button>

            <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1" />

            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg transition-colors hidden sm:flex items-center"
            >
              Xem Web
            </a>

            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-3 p-1 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              >
                <div className="flex flex-col items-end text-right hidden sm:flex">
                  <span className="text-sm font-medium text-slate-900 leading-tight">{admin?.name || 'Administrator'}</span>
                  <span className="text-xs text-slate-500 mt-0.5">{admin?.email || 'owner@dienlanh247.vn'}</span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 border border-blue-200 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {admin?.name?.[0] || 'A'}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Profile dropdown */}
              {showProfileDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowProfileDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-2 flex flex-col text-xs font-semibold">
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        navigate('/settings');
                      }}
                      className="flex items-center gap-2.5 px-4 py-2 text-left text-slate-600 hover:bg-slate-50 cursor-pointer w-full transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Thông tin tài khoản</span>
                    </button>
                    <hr className="border-slate-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 px-4 py-2 text-left text-red-600 hover:bg-red-50 cursor-pointer w-full transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-grow p-4 lg:p-8 overflow-y-auto w-full page-fade-in relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
