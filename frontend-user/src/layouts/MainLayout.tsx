import { useSettings } from '../hooks/useSettings';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ToastContainer from '../components/ui/Toast';
import MobileActionBar from '../components/layout/MobileActionBar';

export default function MainLayout() {
  const location = useLocation();
  const { settings, isReady, isLoading, refetch } = useSettings();
  if (!isReady) return <main className="mx-auto max-w-xl p-8" aria-live="polite">
    <h1 className="text-xl font-bold">{isLoading ? 'Đang tải thông tin dịch vụ…' : 'Chưa tải được thông tin dịch vụ'}</h1>
    {!isLoading && <><p className="mt-3">Vui lòng thử lại. Giá và khu vực phục vụ chưa được xác nhận.</p><button className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-white" onClick={() => void refetch()}>Thử lại</button></>}
  </main>;
  if (!settings.businessConfig.appliances.some(item => item.active) || !settings.businessConfig.serviceAreas.some(item => item.active) || !settings.businessConfig.timeSlots.some(item => item.active)) return <main className="mx-auto max-w-xl p-8"><h1 className="text-xl font-bold">Dịch vụ chưa mở đặt lịch trực tuyến</h1><p className="mt-3">Thông tin thiết bị, khu vực và lịch phục vụ đang được cập nhật.</p></main>;
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition focus:translate-y-0">Bỏ qua đến nội dung chính</a>
      <Header />
      <main id="main-content" className="flex-grow pt-[72px] md:pt-[104px] pb-20 md:pb-0" tabIndex={-1}>
        <div key={location.pathname} className="page-route"><Outlet /></div>
      </main>
      <ToastContainer />
      <Footer />
      <MobileActionBar />
    </div>
  );
}
