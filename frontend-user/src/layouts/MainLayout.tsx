import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ToastContainer from '../components/ui/Toast';
import MobileActionBar from '../components/layout/MobileActionBar';

export default function MainLayout() {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition focus:translate-y-0">Bỏ qua đến nội dung chính</a>
      <Header />
      <main id="main-content" className="flex-grow pt-[72px] md:pt-[104px] pb-20 md:pb-0" tabIndex={-1}>
        <div key={location.pathname} className="page-route"><Outlet /></div>
        <Outlet />
      </main>
      <ToastContainer />
      <Footer />
      <MobileActionBar />
    </div>
  );
}
