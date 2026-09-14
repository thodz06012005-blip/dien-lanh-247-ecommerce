import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Phone,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';

const trustItems = [
  { icon: BadgeCheck, title: 'Thợ đã xác minh', detail: 'Đúng chuyên môn, rõ danh tính' },
  { icon: Clock3, title: 'Xác nhận nhanh', detail: 'Liên hệ lại trong vòng 30 phút' },
  { icon: ShieldCheck, title: 'Minh bạch chi phí', detail: 'Thông báo trước khi sửa chữa' },
];

export default function HeroBanner() {
  const { settings } = useSettings();
  const reduceMotion = useReducedMotion();
  const reveal = (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section className="relative isolate overflow-hidden bg-[#061525] text-white">
      <div className="absolute inset-0 hero-grid opacity-40" aria-hidden="true" />
      <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" aria-hidden="true" />
      <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <motion.div {...reveal()} className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100">
            <Sparkles className="h-4 w-4 text-cyan-300" aria-hidden="true" />
            Dịch vụ điện lạnh tận nhà tại Hà Nội
          </motion.div>

          <motion.h1 {...reveal(0.06)} className="text-balance text-4xl font-bold leading-[1.12] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
            Đặt thợ điện lạnh<br />
            <span className="text-cyan-300">nhanh chóng, an tâm.</span>
          </motion.h1>

          <motion.p {...reveal(0.12)} className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Mô tả sự cố, chọn lịch phù hợp và theo dõi tiến độ trực tuyến. Kỹ thuật viên kiểm tra tận nơi, thông báo chi phí để bạn đồng ý trước khi sửa.
          </motion.p>

          <motion.div {...reveal(0.18)} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/service-booking" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-orange-950/30 transition duration-200 hover:-translate-y-0.5 hover:bg-orange-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300/40">
              <CalendarCheck className="h-5 w-5" aria-hidden="true" />
              Đặt lịch sửa chữa
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <a href={`tel:${settings.hotline.replace(/\s+/g, '')}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-base font-semibold text-white backdrop-blur transition duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20">
              <Phone className="h-5 w-5 text-cyan-300" aria-hidden="true" />
              Gọi {settings.hotline}
            </a>
          </motion.div>

          <motion.p {...reveal(0.22)} className="mt-4 flex items-center gap-2 text-sm text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            Không cần đăng nhập · Chỉ mất khoảng 2 phút
          </motion.p>
        </div>

        <motion.div {...reveal(0.16)} className="relative mx-auto w-full max-w-lg">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.07] p-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="overflow-hidden rounded-[22px] bg-white text-slate-900">
              <div className="relative h-52 overflow-hidden sm:h-64">
                <picture>
                  <source type="image/avif" srcSet="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=72&w=640&fm=avif&fit=crop 640w, https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=76&w=1000&fm=avif&fit=crop 1000w" sizes="(max-width: 1024px) 100vw, 50vw" />
                  <source type="image/webp" srcSet="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=72&w=640&fm=webp&fit=crop 640w, https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=76&w=1000&fm=webp&fit=crop 1000w" sizes="(max-width: 1024px) 100vw, 50vw" />
                  <img src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=76&w=1000&auto=format&fit=crop" alt="Kỹ thuật viên đang kiểm tra thiết bị điện lạnh tại nhà" width="1000" height="750" fetchPriority="high" decoding="async" className="h-full w-full object-cover" />
                </picture>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
                  <div>
                    <p className="text-sm text-slate-200">Dịch vụ tận nơi</p>
                    <p className="mt-1 text-lg font-bold">Theo dõi từng bước xử lý</p>
                  </div>
                  <span className="rounded-full bg-emerald-400/20 px-3 py-1.5 text-xs font-semibold text-emerald-100 backdrop-blur">Đang hoạt động</span>
                </div>
              </div>

              <div className="space-y-4 p-5 sm:p-6">
                {[
                  ['1', 'Gửi yêu cầu', 'Chọn thiết bị và thời gian phù hợp', true],
                  ['2', 'Xác nhận & phân công', 'Điều phối thợ đúng chuyên môn', true],
                  ['3', 'Kiểm tra & thông báo chi phí', 'Bạn đồng ý rồi mới tiến hành', false],
                ].map(([number, title, detail, active]) => (
                  <div key={String(number)} className="flex items-center gap-4">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${active ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>{number}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{title}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{detail}</p>
                    </div>
                    {active ? <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" /> : <Wrench className="h-5 w-5 text-blue-500" aria-hidden="true" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="relative border-t border-white/10 bg-white/[0.035]">
        <div className="mx-auto grid max-w-7xl divide-y divide-white/10 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
          {trustItems.map(({ icon: Icon, title, detail }) => (
            <div key={title} className="flex items-center gap-3 px-2 py-5 sm:px-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <div><p className="text-sm font-semibold text-white">{title}</p><p className="mt-0.5 text-xs text-slate-400">{detail}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
