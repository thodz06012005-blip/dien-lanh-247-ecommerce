import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { Bell, ChevronDown, Command, ExternalLink, LogOut, Menu, Search, Snowflake, UserRound, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import { adminNavigation, flatAdminNavigation, getAdminRouteMeta } from '@/config/adminNavigation';
import { canAccess } from '@/config/adminPermissions';
import api from '@/services/api';
import { useAdminAuthStore } from '@/store/adminAuthStore';

interface DashboardHeaderData { attention?: Array<unknown>; }

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, permissions, logout, hasPermission } = useAdminAuthStore();

  const allowedGroups = useMemo(() => adminNavigation
    .map((group) => ({ ...group, items: group.items.filter((item) => canAccess(permissions, item.permission)) }))
    .filter((group) => group.items.length > 0), [permissions]);

  const allowedSearchItems = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('vi-VN');
    return flatAdminNavigation
      .filter((item) => canAccess(permissions, item.permission))
      .filter((item) => !query || [item.label, item.shortLabel, ...(item.keywords || [])].join(' ').toLocaleLowerCase('vi-VN').includes(query));
  }, [permissions, searchQuery]);

  const dashboardQuery = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await api.get('/admin/dashboard')).data.data as DashboardHeaderData,
    enabled: hasPermission('dashboard.view'),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setMobileOpen(false);
      setProfileOpen(false);
      setSearchOpen(false);
      setSearchQuery('');
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [location.pathname]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const routeMeta = getAdminRouteMeta(location.pathname);
  const attentionCount = dashboardQuery.data?.attention?.length ?? 0;

  const sidebar = (
    <>
      <div className={clsx('flex h-16 items-center gap-3 border-b border-white/5 px-5', collapsed && 'justify-center px-0')}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-blue-500/20"><Snowflake className="h-5 w-5 text-white" /></div>
        {!collapsed && <div><strong className="block text-sm font-black text-white">Điện Lạnh 247</strong><span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/80">Admin Workspace</span></div>}
      </div>
      <nav aria-label="Điều hướng quản trị" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {allowedGroups.map((group) => (
          <section key={group.title}>
            {!collapsed && <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{group.title}</p>}
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
                const Icon = item.icon;
                return (
                  <Link key={item.path} to={item.path} title={collapsed ? item.label : undefined} aria-current={active ? 'page' : undefined} className={clsx('group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition', active ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-950/20' : 'text-slate-400 hover:bg-white/5 hover:text-white', collapsed && 'justify-center px-0')}>
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && <span className="truncate">{item.shortLabel || item.label}</span>}
                    {active && !collapsed && <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white" />}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>
      <Link to="/profile" className={clsx('m-3 flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.04] p-3 transition hover:bg-white/[0.08]', collapsed && 'justify-center')}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 text-sm font-black text-white">{admin?.name?.charAt(0).toUpperCase() || 'A'}</div>
        {!collapsed && <div className="min-w-0"><strong className="block truncate text-sm text-white">{admin?.name || 'Administrator'}</strong><span className="mt-0.5 block truncate text-[10px] font-black uppercase tracking-wider text-cyan-300">{admin?.role || 'admin'}</span></div>}
      </Link>
    </>
  );

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#F4F7FB] text-slate-800 antialiased">
      <a href="#admin-main-content" className="admin-skip-link">Chuyển đến nội dung quản trị</a>
      <aside className={clsx('sidebar-gradient sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-slate-800 shadow-xl transition-[width] duration-300 lg:flex', collapsed ? 'w-[76px]' : 'w-[264px]')} aria-label="Thanh điều hướng quản trị">{sidebar}</aside>
      {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button type="button" className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-label="Đóng menu" /><aside className="sidebar-gradient absolute inset-y-0 left-0 flex w-[min(86vw,280px)] flex-col shadow-2xl">{sidebar}</aside></div>}
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/95 px-4 shadow-sm backdrop-blur lg:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setMobileOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Mở menu"><Menu className="h-5 w-5" /></button>
            <button type="button" onClick={() => setCollapsed((value) => !value)} className="hidden h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:flex" aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}><Menu className="h-5 w-5" /></button>
            <div className="min-w-0"><AdminBreadcrumb /><h1 className="mt-0.5 hidden truncate text-sm font-black text-slate-950 md:block">{routeMeta.label}</h1></div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSearchOpen(true)} className="hidden min-h-10 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-500 hover:border-primary-200 hover:bg-white sm:flex"><Search className="h-4 w-4" /><span>Tìm module</span><kbd className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px]">Ctrl K</kbd></button>
            <button type="button" onClick={() => navigate('/')} className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label={`${attentionCount} công việc cần chú ý`}><Bell className="h-[18px] w-[18px]" />{attentionCount > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">{Math.min(attentionCount, 9)}{attentionCount > 9 ? '+' : ''}</span>}</button>
            <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer" className="hidden min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-600 hover:border-primary-200 hover:text-primary-700 xl:flex">Website <ExternalLink className="h-3.5 w-3.5" /></a>
            <div className="relative">
              <button type="button" onClick={() => setProfileOpen((value) => !value)} className="flex min-h-10 items-center gap-2 rounded-xl border border-transparent p-1.5 hover:border-slate-200 hover:bg-slate-50" aria-haspopup="menu" aria-expanded={profileOpen}>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-black text-white">{admin?.name?.charAt(0).toUpperCase() || 'A'}</div>
                <div className="hidden text-left md:block"><strong className="block max-w-32 truncate text-xs text-slate-900">{admin?.name}</strong><span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">{admin?.role}</span></div><ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 md:block" />
              </button>
              {profileOpen && <div role="menu" className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"><div className="border-b border-slate-100 px-3 py-3"><p className="truncate text-sm font-black text-slate-900">{admin?.name}</p><p className="mt-1 truncate text-xs text-slate-500">{admin?.email}</p></div><Link to="/profile" role="menuitem" className="mt-2 flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 hover:bg-slate-50"><UserRound className="h-4 w-4" />Hồ sơ và bảo mật</Link><button type="button" role="menuitem" onClick={handleLogout} className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-bold text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" />Đăng xuất</button></div>}
            </div>
          </div>
        </header>
        <main id="admin-main-content" tabIndex={-1} className="min-w-0 flex-1 overflow-y-auto px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-7"><Outlet /></main>
      </div>
      {searchOpen && <div className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/65 px-4 pt-[12vh] backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Tìm kiếm module quản trị"><button type="button" className="absolute inset-0" onClick={() => setSearchOpen(false)} aria-label="Đóng tìm kiếm" /><section className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl"><div className="flex items-center gap-3 border-b border-slate-100 px-5"><Command className="h-5 w-5 text-primary-600" /><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="min-h-16 flex-1 text-base font-bold outline-none placeholder:text-slate-400" placeholder="Tìm đơn hàng, sản phẩm, dịch vụ..." /><button type="button" onClick={() => setSearchOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Đóng"><X className="h-4 w-4" /></button></div><div className="max-h-[50vh] overflow-y-auto p-3">{allowedSearchItems.map((item) => { const Icon = item.icon; return <button key={item.path} type="button" onClick={() => navigate(item.path)} className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-slate-50"><div className="rounded-xl bg-blue-50 p-2 text-primary-600"><Icon className="h-4 w-4" /></div><div><strong className="text-sm text-slate-900">{item.label}</strong><p className="mt-0.5 text-xs text-slate-400">{item.path}</p></div></button>; })}{!allowedSearchItems.length && <div className="p-8 text-center text-sm text-slate-500">Không có module phù hợp trong phạm vi quyền hiện tại.</div>}</div></section></div>}
    </div>
  );
}
