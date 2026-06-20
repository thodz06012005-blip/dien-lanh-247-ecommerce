import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ToastContainer from '../components/ui/Toast';

export default function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16 md:pt-28 pb-12">
        <Outlet />
      </main>
      <ToastContainer />
      <Footer />
    </div>
  );
}
