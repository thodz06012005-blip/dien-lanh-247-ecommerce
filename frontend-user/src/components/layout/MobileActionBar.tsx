import { CalendarCheck, History, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';

export default function MobileActionBar() {
  const { settings } = useSettings();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pb-[max(.6rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,.08)] backdrop-blur-xl md:hidden" aria-label="Hành động nhanh">
      <div className="mx-auto grid max-w-md grid-cols-[1fr_1.35fr_1fr] gap-2">
        <a href={`tel:${settings.hotline.replace(/\s+/g, '')}`} className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-semibold text-slate-600 active:bg-slate-100"><Phone className="h-5 w-5 text-blue-600" /><span>Gọi ngay</span></a>
        <Link to="/service-booking" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 text-sm font-bold text-white shadow-md shadow-orange-500/20 active:bg-orange-600"><CalendarCheck className="h-5 w-5" />Đặt lịch</Link>
        <Link to="/track-service" className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-semibold text-slate-600 active:bg-slate-100"><History className="h-5 w-5 text-blue-600" /><span>Tra cứu</span></Link>
      </div>
    </nav>
  );
}
