import { useEffect } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import About from '@/pages/About';
import Account from '@/pages/Account';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import Contact from '@/pages/Contact';
import DesignSystem from '@/pages/DesignSystem';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import MyServiceDetail from '@/pages/MyServiceDetail';
import MyServices from '@/pages/MyServices';
import Orders from '@/pages/Orders';
import Policy from '@/pages/Policy';
import ProductDetail from '@/pages/ProductDetail';
import Products from '@/pages/Products';
import Register from '@/pages/Register';
import ServiceBooking from '@/pages/ServiceBooking';
import ServiceBookingSuccess from '@/pages/ServiceBookingSuccess';
import Services from '@/pages/Services';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

function NotFoundPage() {
  return (
    <section className="flex min-h-96 flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">404</p>
      <h1 className="text-2xl font-bold text-slate-900">Trang chưa sẵn sàng</h1>
      <p className="max-w-md text-sm leading-6 text-slate-500">
        Đường dẫn không tồn tại hoặc nội dung đang được hoàn thiện.
      </p>
    </section>
  );
}

export default function AppRouter() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="account" element={<Account />} />
          <Route path="orders" element={<Orders />} />
          <Route path="services" element={<Services />} />
          <Route path="service-booking" element={<ServiceBooking />} />
          <Route path="service-booking/success" element={<ServiceBookingSuccess />} />
          <Route path="my-services" element={<MyServices />} />
          <Route path="my-services/:id" element={<MyServiceDetail />} />
          <Route path="contact" element={<Contact />} />
          <Route path="about" element={<About />} />
          <Route path="policy/:slug" element={<Policy />} />
          <Route path="design-system" element={<DesignSystem />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </HashRouter>
  );
}
