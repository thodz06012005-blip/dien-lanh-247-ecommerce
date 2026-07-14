import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FloatingContactActions from '@/components/layout/FloatingContactActions';
import ToastContainer from '@/components/ui/Toast';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="ds-skip-link">
        Chuyển đến nội dung chính
      </a>
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-grow pt-16 outline-none md:pt-[112px]">
        <Outlet />
      </main>
      <ToastContainer />
      <FloatingContactActions />
      <Footer />
    </div>
  );
}
