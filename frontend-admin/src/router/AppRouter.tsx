import { HashRouter, Route, Routes } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import Customers from '@/pages/Customers';
import Dashboard from '@/pages/Dashboard';
import Forbidden from '@/pages/Forbidden';
import Login from '@/pages/Login';
import Orders from '@/pages/Orders';
import Products from '@/pages/Products';
import ServiceRequestDetail from '@/pages/ServiceRequestDetail';
import ServiceRequests from '@/pages/ServiceRequests';
import Settings from '@/pages/Settings';
import Technicians from '@/pages/Technicians';
import AdminProtectedRoute from '@/routes/AdminProtectedRoute';

function NotFoundPage() {
  return (
    <section className="flex min-h-64 flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">404</p>
      <h1 className="text-2xl font-bold text-slate-900">Không tìm thấy trang quản trị</h1>
      <p className="max-w-md text-sm leading-6 text-slate-500">
        Kiểm tra lại đường dẫn hoặc quyền truy cập của tài khoản hiện tại.
      </p>
    </section>
  );
}

export default function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/403" element={<Forbidden />} />
        <Route
          path="/"
          element={
            <AdminProtectedRoute requiredRole="owner">
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} />
          <Route path="customers" element={<Customers />} />
          <Route path="settings" element={<Settings />} />
          <Route path="service-requests" element={<ServiceRequests />} />
          <Route path="service-requests/:id" element={<ServiceRequestDetail />} />
          <Route path="technicians" element={<Technicians />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
