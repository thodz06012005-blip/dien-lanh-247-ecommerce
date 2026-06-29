import { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Account from './pages/Account';
import Orders from './pages/Orders';
import Contact from './pages/Contact';
import About from './pages/About';
import Policy from './pages/Policy';
import Services from './pages/Services';
import ServiceBooking from './pages/ServiceBooking';
import ServiceBookingSuccess from './pages/ServiceBookingSuccess';
import MyServices from './pages/MyServices';
import MyServiceDetail from './pages/MyServiceDetail';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
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
          <Route path="*" element={<div className="flex flex-col items-center justify-center h-96 text-slate-500 text-sm">Trang này đang được phát triển...</div>} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
