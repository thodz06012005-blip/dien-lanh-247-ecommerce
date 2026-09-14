import { useEffect } from 'react';
import { HashRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { useAdminAuthStore } from './store/adminAuthStore';
import RouteSkeleton from './components/common/RouteSkeleton';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import ServiceRequests from './pages/ServiceRequests';
import ServiceRequestDetail from './pages/ServiceRequestDetail';
import Technicians from './pages/Technicians';
import Login from './pages/Login';
import Forbidden from './pages/Forbidden';
import Finance from './pages/Finance';
import AdminProtectedRoute from './routes/AdminProtectedRoute';
import DevModeBanner from './components/common/DevModeBanner';

function RetiredOrUnknownRoute() {
  const { pathname } = useLocation();
  const isRetiredCommerceUrl = /^\/(products|orders)(\/|$)/.test(pathname);

  if (isRetiredCommerceUrl) {
    return <Navigate to="/" replace state={{ notice: 'Chức năng bán sản phẩm đã ngừng hoạt động.' }} />;
  }

  return <div className="flex h-64 items-center justify-center text-lg text-slate-500">Không tìm thấy trang.</div>;
}

function AdminAuthBootstrap({ children }: { children: React.ReactNode }) {
  const status = useAdminAuthStore(state => state.status);
  const bootstrap = useAdminAuthStore(state => state.bootstrap);
  useEffect(() => { void bootstrap(); }, [bootstrap]);
  if (status === 'unknown' || status === 'loading') return <RouteSkeleton />;
  return <>{children}</>;
}

function App() {
  return (
    <HashRouter>
      <AdminAuthBootstrap>
      {import.meta.env.DEV && <DevModeBanner />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/403" element={<Forbidden />} />
        <Route
          path="/"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<AdminProtectedRoute permission="dashboard.read"><Dashboard /></AdminProtectedRoute>} />
          <Route path="customers" element={<AdminProtectedRoute permission="customers.read"><Customers /></AdminProtectedRoute>} />
          <Route path="settings" element={<AdminProtectedRoute permission="settings.manage"><Settings /></AdminProtectedRoute>} />
          <Route path="service-requests" element={<AdminProtectedRoute permission="requests.read"><ServiceRequests /></AdminProtectedRoute>} />
          <Route path="service-requests/:id" element={<AdminProtectedRoute permission="requests.read"><ServiceRequestDetail /></AdminProtectedRoute>} />
          <Route path="technicians" element={<AdminProtectedRoute permission="technicians.read"><Technicians /></AdminProtectedRoute>} />
          <Route path="finance" element={<AdminProtectedRoute permission="finance.read"><Finance /></AdminProtectedRoute>} />
          <Route path="*" element={<RetiredOrUnknownRoute />} />
        </Route>
      </Routes>
      </AdminAuthBootstrap>
    </HashRouter>
  );
}

export default App;
