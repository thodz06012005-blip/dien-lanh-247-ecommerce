import type { ReactNode } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { ADMIN_PERMISSIONS } from '@/config/adminPermissions';
import AdminLayout from '@/layouts/AdminLayout';
import AdminProfile from '@/pages/AdminProfile';
import Customers from '@/pages/Customers';
import Dashboard from '@/pages/Dashboard';
import DesignSystem from '@/pages/DesignSystem';
import EditorialCms from '@/pages/EditorialCms';
import Forbidden from '@/pages/Forbidden';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import Orders from '@/pages/Orders';
import Products from '@/pages/Products';
import ServiceRequestDetail from '@/pages/ServiceRequestDetail';
import ServiceRequests from '@/pages/ServiceRequests';
import Settings from '@/pages/Settings';
import SystemError from '@/pages/SystemError';
import Technicians from '@/pages/Technicians';
import AdminProtectedRoute from '@/routes/AdminProtectedRoute';
import type { AdminPermission } from '@/types/admin';

function ProtectedPage({ permission, children }: { permission: AdminPermission; children: ReactNode }) {
  return <AdminProtectedRoute permission={permission}>{children}</AdminProtectedRoute>;
}

export default function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/403" element={<Forbidden />} />
        <Route path="/500" element={<SystemError />} />
        <Route element={<AdminProtectedRoute />}>
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<ProtectedPage permission={ADMIN_PERMISSIONS.DASHBOARD_VIEW}><Dashboard /></ProtectedPage>} />
            <Route path="content" element={<ProtectedPage permission={ADMIN_PERMISSIONS.CONTENT_VIEW}><EditorialCms /></ProtectedPage>} />
            <Route path="products" element={<ProtectedPage permission={ADMIN_PERMISSIONS.PRODUCTS_VIEW}><Products /></ProtectedPage>} />
            <Route path="orders" element={<ProtectedPage permission={ADMIN_PERMISSIONS.ORDERS_VIEW}><Orders /></ProtectedPage>} />
            <Route path="customers" element={<ProtectedPage permission={ADMIN_PERMISSIONS.CUSTOMERS_VIEW}><Customers /></ProtectedPage>} />
            <Route path="settings" element={<ProtectedPage permission={ADMIN_PERMISSIONS.SETTINGS_VIEW}><Settings /></ProtectedPage>} />
            <Route path="service-requests" element={<ProtectedPage permission={ADMIN_PERMISSIONS.SERVICES_VIEW}><ServiceRequests /></ProtectedPage>} />
            <Route path="service-requests/:id" element={<ProtectedPage permission={ADMIN_PERMISSIONS.SERVICES_VIEW}><ServiceRequestDetail /></ProtectedPage>} />
            <Route path="technicians" element={<ProtectedPage permission={ADMIN_PERMISSIONS.TECHNICIANS_VIEW}><Technicians /></ProtectedPage>} />
            <Route path="design-system" element={<ProtectedPage permission={ADMIN_PERMISSIONS.DESIGN_SYSTEM_VIEW}><DesignSystem /></ProtectedPage>} />
            <Route path="profile" element={<ProtectedPage permission={ADMIN_PERMISSIONS.PROFILE_VIEW}><AdminProfile /></ProtectedPage>} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}
