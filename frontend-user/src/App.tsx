import { lazy, Suspense, useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import RouteSkeleton from './components/common/RouteSkeleton';
import DevModeBanner from './components/common/DevModeBanner';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Account = lazy(() => import('./pages/Account'));
const Contact = lazy(() => import('./pages/Contact'));
const About = lazy(() => import('./pages/About'));
const Policy = lazy(() => import('./pages/Policy'));
const Services = lazy(() => import('./pages/Services'));
const ServiceBooking = lazy(() => import('./pages/ServiceBooking'));
const ServiceBookingSuccess = lazy(() => import('./pages/ServiceBookingSuccess'));
const MyServices = lazy(() => import('./pages/MyServices'));
const MyServiceDetail = lazy(() => import('./pages/MyServiceDetail'));
const TrackService = lazy(() => import('./pages/TrackService'));
const TechnicianLogin = lazy(() => import('./pages/TechnicianLogin'));
const TechnicianPortal = lazy(() => import('./pages/TechnicianPortal'));

function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    const main = document.getElementById('main-content');
    if (main) window.requestAnimationFrame(() => main.focus({ preventScroll: true }));
  }, [pathname]);
  return null;
}

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const status = useAuthStore(state => state.status);
  const bootstrap = useAuthStore(state => state.bootstrap);
  useEffect(() => { void bootstrap(); }, [bootstrap]);
  if (status === 'unknown' || status === 'loading') return <RouteSkeleton />;
  return <>{children}</>;
}

export default function App() {
  return <HashRouter><AuthBootstrap><RouteEffects />{import.meta.env.DEV && <DevModeBanner />}<Suspense fallback={<RouteSkeleton />}><Routes>
    <Route path="/" element={<MainLayout />}>
      <Route index element={<Home />} />
      <Route path="account" element={<Account />} />
      <Route path="services" element={<Services />} />
      <Route path="service-booking" element={<ServiceBooking />} />
      <Route path="service-booking/success" element={<ServiceBookingSuccess />} />
      <Route path="my-services" element={<MyServices />} />
      <Route path="track-service" element={<TrackService />} />
      <Route path="my-services/:id" element={<MyServiceDetail />} />
      <Route path="contact" element={<Contact />} />
      <Route path="about" element={<About />} />
      <Route path="policy/:slug" element={<Policy />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/technician/login" element={<TechnicianLogin />} />
    <Route path="/technician" element={<TechnicianPortal />} />
  </Routes></Suspense></AuthBootstrap></HashRouter>;
}
