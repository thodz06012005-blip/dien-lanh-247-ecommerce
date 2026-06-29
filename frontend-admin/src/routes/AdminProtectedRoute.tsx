import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuthStore } from '../store/adminAuthStore';

interface AdminProtectedRouteProps {
  requiredRole?: string;
  children?: React.ReactNode;
}

export default function AdminProtectedRoute({ requiredRole = 'owner', children }: AdminProtectedRouteProps) {
  const admin = useAdminAuthStore((state) => state.admin);
  const token = useAdminAuthStore((state) => state.token);
  const checkAuth = useAdminAuthStore((state) => state.checkAuth);
  const fetchCurrentUser = useAdminAuthStore((state) => state.fetchCurrentUser);
  const isLoading = useAdminAuthStore((state) => state.isLoading);

  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Quick client-side check
  const isAuthValid = checkAuth();

  // On mount or when we have a token but need to verify with server (e.g. F5 reload)
  useEffect(() => {
    if (token && isAuthValid && !isVerified) {
      const timer = setTimeout(() => {
        setIsVerifying(true);
      }, 0);
      
      fetchCurrentUser().then(() => {
        setIsVerified(true);
        setIsVerifying(false);
      });
      
      return () => clearTimeout(timer);
    }
  }, [token, isAuthValid, isVerified, fetchCurrentUser]);

  // No token at all → redirect to login immediately
  if (!token || !isAuthValid) {
    return <Navigate to="/login" replace />;
  }

  // Still verifying with server → show loading spinner
  if (isVerifying || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c1b30]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Đang xác thực phiên làm việc...</p>
        </div>
      </div>
    );
  }

  // Role check
  const allowedRoles = ['admin', 'superadmin', 'owner'];
  const currentRole = admin?.role?.toLowerCase();

  if (requiredRole) {
    const reqRole = requiredRole.toLowerCase();
    if (reqRole === 'owner') {
      if (!allowedRoles.includes(currentRole || '')) {
        return <Navigate to="/403" replace />;
      }
    } else if (currentRole !== reqRole) {
      return <Navigate to="/403" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
}
