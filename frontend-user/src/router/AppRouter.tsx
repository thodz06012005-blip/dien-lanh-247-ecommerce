import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import Home from '@/pages/Home';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

const About = lazy(() => import('@/pages/About'));
const Account = lazy(() => import('@/pages/Account'));
const ArticleDetail = lazy(() => import('@/pages/ArticleDetail'));
const Articles = lazy(() => import('@/pages/Articles'));
const Cart = lazy(() => import('@/pages/Cart'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const Contact = lazy(() => import('@/pages/Contact'));
const DesignSystem = lazy(() => import('@/pages/DesignSystem'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const Login = lazy(() => import('@/pages/Login'));
const MyServiceDetail = lazy(() => import('@/pages/MyServiceDetail'));
const MyServices = lazy(() => import('@/pages/MyServices'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Orders = lazy(() => import('@/pages/Orders'));
const Policy = lazy(() => import('@/pages/Policy'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Products = lazy(() => import('@/pages/Products'));
const ProjectDetail = lazy(() => import('@/pages/ProjectDetail'));
const Projects = lazy(() => import('@/pages/Projects'));
const Register = lazy(() => import('@/pages/Register'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const ServiceBooking = lazy(() => import('@/pages/ServiceBooking'));
const ServiceBookingSuccess = lazy(() => import('@/pages/ServiceBookingSuccess'));
const ServiceDetail = lazy(() => import('@/pages/ServiceDetail'));
const ServiceRequestLookup = lazy(() => import('@/pages/ServiceRequestLookup'));
const Services = lazy(() => import('@/pages/Services'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    window.requestAnimationFrame(() => document.getElementById('main-content')?.focus({ preventScroll: true }));
  }, [pathname]);
  return null;
}

function RouteLoading() {
  return (
    <div className="flex min-h-[360px] items-center justify-center bg-slate-50" role="status" aria-live="polite">
      <div className="text-center">
        <span className="mx-auto block h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-primary-600 motion-reduce:animate-none" />
        <p className="mt-4 text-sm font-bold text-slate-600">Đang tải nội dung...</p>
      </div>
    </div>
  );
}

function AuthBootstrap() {
  const { isInitialized, setUser, clearSession, setInitialized } = useAuthStore();
  useEffect(() => {
    if (isInitialized) return;
    let active = true;
    void api.get('/auth/me')
      .then((response) => {
        if (active) setUser(response.data?.data ?? null);
      })
      .catch(() => {
        if (active) clearSession();
      })
      .finally(() => {
        if (active) setInitialized(true);
      });
    return () => { active = false; };
  }, [clearSession, isInitialized, setInitialized, setUser]);
  return null;
}

function ProtectedRoute() {
  const location = useLocation();
  const { isInitialized, isAuthenticated } = useAuthStore();
  if (!isInitialized) return <RouteLoading />;
  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }
  return <Outlet />;
}

export default function AppRouter() {
  return (
    <HashRouter>
      <AuthBootstrap />
      <ScrollToTop />
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="services" element={<Services />} />
            <Route path="services/:slug" element={<ServiceDetail />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:slug" element={<ProjectDetail />} />
            <Route path="articles" element={<Articles />} />
            <Route path="articles/:slug" element={<ArticleDetail />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="policy/:slug" element={<Policy />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="service-booking" element={<ServiceBooking />} />
            <Route path="service-booking/success" element={<ServiceBookingSuccess />} />
            <Route path="service-lookup" element={<ServiceRequestLookup />} />
            <Route path="design-system" element={<DesignSystem />} />
            <Route element={<ProtectedRoute />}>
              <Route path="account" element={<Account />} />
              <Route path="orders" element={<Orders />} />
              <Route path="my-services" element={<MyServices />} />
              <Route path="my-services/:id" element={<MyServiceDetail />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
