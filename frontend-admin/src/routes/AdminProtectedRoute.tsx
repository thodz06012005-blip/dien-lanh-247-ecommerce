import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { canAccess } from '@/config/adminPermissions';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import type { AdminPermission } from '@/types/admin';

interface AdminProtectedRouteProps {
  permission?: AdminPermission | readonly AdminPermission[];
  mode?: 'all' | 'any';
  children?: React.ReactNode;
}

export default function AdminProtectedRoute({
  permission,
  mode = 'all',
  children,
}: AdminProtectedRouteProps) {
  const location = useLocation();
  const {
    isAuthenticated,
    isInitialized,
    isLoading,
    permissions,
    bootstrap,
  } = useAdminAuthStore();

  useEffect(() => {
    if (!isInitialized && !isLoading) void bootstrap();
  }, [bootstrap, isInitialized, isLoading]);

  if (!isInitialized || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#071426]" role="status" aria-live="polite" aria-busy="true">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-11 w-11 animate-spin rounded-full border-4 border-cyan-400/20 border-t-cyan-400 motion-reduce:animate-none" />
          <div>
            <p className="text-sm font-black text-white">Đang xác thực phiên quản trị</p>
            <p className="mt-1 text-xs text-slate-400">Hệ thống đang kiểm tra cookie và quyền truy cập.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  if (!canAccess(permissions, permission, mode)) {
    return <Navigate to="/403" replace state={{ from: location.pathname }} />;
  }

  return children ? <>{children}</> : <Outlet />;
}
