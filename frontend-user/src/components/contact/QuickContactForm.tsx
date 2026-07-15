import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowRight, CalendarCheck, PhoneCall, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { QuickContactFormCoreProps } from './QuickContactFormCore';

const QuickContactFormCore = lazy(() => import('./QuickContactFormCore'));

export default function QuickContactForm({
  compact = false,
  title = 'Nhận tư vấn kỹ thuật',
  description = 'Để lại thông tin, đội ngũ Điện Lạnh 247 sẽ liên hệ xác nhận trong thời gian sớm nhất.',
}: QuickContactFormCoreProps) {
  const markerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (compact || active) return;
    const marker = markerRef.current;
    if (!marker || typeof IntersectionObserver === 'undefined') {
      setActive(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px 0px' },
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, [active, compact]);

  if (compact && !active) {
    return (
      <aside className="rounded-[2rem] border border-white/15 bg-white p-6 text-slate-900 shadow-2xl shadow-slate-950/20 sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary-700">Đặt lịch trong 2 phút</p>
        <h2 className="mt-3 text-2xl font-black tracking-tight">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        <ul className="mt-6 grid gap-3 text-sm font-bold text-slate-700">
          <li className="flex items-center gap-3"><CalendarCheck aria-hidden="true" className="h-5 w-5 text-primary-700" /> Chọn dịch vụ và thời gian phù hợp</li>
          <li className="flex items-center gap-3"><PhoneCall aria-hidden="true" className="h-5 w-5 text-primary-700" /> Nhận xác nhận trước khi kỹ thuật viên đến</li>
          <li className="flex items-center gap-3"><ShieldCheck aria-hidden="true" className="h-5 w-5 text-primary-700" /> Báo giá và bảo hành rõ ràng</li>
        </ul>
        <div className="mt-7 grid gap-3">
          <button
            type="button"
            onClick={() => setActive(true)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary-700 px-5 text-sm font-black text-white transition hover:bg-primary-800"
          >
            Mở biểu mẫu gọi lại <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
          <Link to="/service-booking" className="text-center text-sm font-black text-primary-700 hover:text-primary-900">
            Hoặc đặt lịch đầy đủ
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <div ref={markerRef} className="min-h-[360px]">
      {active ? (
        <Suspense
          fallback={
            <div className="h-[360px] animate-pulse rounded-[2rem] border border-slate-200 bg-white/90" role="status" aria-label="Đang tải biểu mẫu liên hệ" />
          }
        >
          <QuickContactFormCore compact={compact} title={title} description={description} />
        </Suspense>
      ) : (
        <div className="h-[360px] rounded-[2rem] border border-white/10 bg-white/10" aria-hidden="true" />
      )}
    </div>
  );
}
