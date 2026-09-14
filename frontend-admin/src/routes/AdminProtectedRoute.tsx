import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuthStore } from '../store/adminAuthStore';
import { can, type Permission } from '../auth/permissions';

export default function AdminProtectedRoute({ permission, children }: { permission?: Permission; children?: React.ReactNode }) {
  const admin = useAdminAuthStore(state => state.admin);
  const status = useAdminAuthStore(state => state.status);
  if (status === 'unknown' || status === 'loading') return null;
  if (status !== 'authenticated' || !admin) return <Navigate to="/login" replace />;
  if (permission && !can(admin.role, permission)) return <Navigate to="/403" replace />;
  return children ? <>{children}</> : <Outlet />;
}
