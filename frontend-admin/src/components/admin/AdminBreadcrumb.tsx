import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getAdminRouteMeta } from '@/config/adminNavigation';

export default function AdminBreadcrumb() {
  const location = useLocation();
  const meta = getAdminRouteMeta(location.pathname);
  const isHome = location.pathname === '/';

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-500">
      <Link to="/" className="inline-flex items-center gap-1.5 rounded-lg px-1 py-1 transition hover:text-primary-600">
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Quản trị</span>
      </Link>
      {!isHome && (
        <>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
          <span className="truncate text-slate-800" aria-current="page">{meta.label}</span>
        </>
      )}
    </nav>
  );
}
