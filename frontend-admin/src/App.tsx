import { HashRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import ServiceRequests from './pages/ServiceRequests';
import ServiceRequestDetail from './pages/ServiceRequestDetail';
import Technicians from './pages/Technicians';
import Login from './pages/Login';
import Forbidden from './pages/Forbidden';
import AdminProtectedRoute from './routes/AdminProtectedRoute';

function App() {
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
          <Route path="*" element={<div className="flex items-center justify-center h-64 text-slate-500 text-lg">Trang này đang được phát triển...</div>} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
