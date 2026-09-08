import { motion, useReducedMotion } from 'framer-motion';
import {
  AirVent,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Droplets,
  MapPin,
  Phone,
  Refrigerator,
  ShieldCheck,
  Sparkles,
  WashingMachine,
  Wrench,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import HeroBanner from '../components/home/HeroBanner';
import ServiceCaseGallery from '../components/home/ServiceCaseGallery';
import TechnicianShowcase from '../components/home/TechnicianShowcase';
import PricingTable from '../components/home/PricingTable';
import ConsultationForm from '../components/home/ConsultationForm';
import CounterStats from '../components/home/CounterStats';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useSettings } from '../hooks/useSettings';

const process = [
  { number: '01', title: 'Gửi yêu cầu', description: 'Chọn thiết bị, mô tả tình trạng và thời gian bạn mong muốn.' },
  { number: '02', title: 'Xác nhận lịch', description: 'Điều phối viên liên hệ xác nhận thông tin và khu vực phục vụ.' },
  { number: '03', title: 'Phân công thợ', description: 'Kỹ thuật viên đúng chuyên môn được điều phối tới địa chỉ của bạn.' },
  { number: '04', title: 'Kiểm tra & tư vấn', description: 'Thợ kiểm tra thực tế và thông báo chi phí trước khi thực hiện.' },
  { number: '05', title: 'Sửa chữa & bảo hành', description: 'Nghiệm thu, thanh toán và nhận thông tin bảo hành rõ ràng.' },
];

const guarantees = [
  'Thông báo chi phí trước khi sửa chữa',
  'Không tự ý thay linh kiện khi chưa đồng ý',
  'Kỹ thuật viên có hồ sơ và chuyên môn phù hợp',
  'Theo dõi trạng thái yêu cầu trực tuyến',
  'Bảo hành rõ ràng sau khi hoàn thành',
];

export default function Home() {
  useDocumentTitle('Đặt thợ sửa chữa điện lạnh tận nhà', 'Đặt lịch sửa chữa điều hòa, tủ lạnh, máy giặt tận nhà. Kiểm tra thực tế, thông báo chi phí trước khi sửa.');
  const { settings } = useSettings();
  const reduceMotion = useReducedMotion();
  const reveal = { initial: reduceMotion ? false : { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-80px' }, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } };
  const serviceIcons = [AirVent, Refrigerator, WashingMachine, Droplets, Sparkles, Wrench];
  const serviceTones = ['blue', 'cyan', 'indigo', 'orange', 'emerald', 'slate'];
  const services = settings.businessConfig.appliances.filter((item) => item.active).map((item, index) => ({
    icon: serviceIcons[index % serviceIcons.length],
    title: item.name,
    description: item.issues.slice(0, 5).join(', ') + (item.issues.length > 5 ? '…' : '.'),
    price: settings.businessConfig.pricing.showPriceRanges && item.priceMax > 0 ? `${new Intl.NumberFormat('vi-VN').format(item.priceMin)}đ – ${new Intl.NumberFormat('vi-VN').format(item.priceMax)}đ` : 'Liên hệ để được tư vấn',
    tone: serviceTones[index % serviceTones.length],
  }));

  return (
    <div className="overflow-hidden bg-white">
      <HeroBanner />

      <section className="relative z-10 -mt-1 bg-white py-16 md:py-24" aria-labelledby="quick-booking-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...reveal} className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="section-eyebrow">Chọn đúng nhu cầu</p>
              <h2 id="quick-booking-title" className="section-title">Thiết bị của bạn đang gặp vấn đề?</h2>
              <p className="section-description">Chọn thiết bị để bắt đầu. Bạn không cần biết chính xác lỗi kỹ thuật — chỉ cần mô tả dấu hiệu đang gặp.</p>
            </div>
            <Link to="/service-booking" className="group hidden items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-800 md:flex">Xem tất cả dịch vụ <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div key={service.title} {...reveal} transition={{ ...reveal.transition, delay: index * 0.04 }}>
                  <Link to={`/service-booking?appliance=${encodeURIComponent(service.title)}`} className="service-card group flex h-full flex-col p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <span className={`service-icon service-icon-${service.tone}`}><Icon className="h-6 w-6" aria-hidden="true" /></span>
                      <ArrowRight className="h-5 w-5 text-slate-300 transition duration-200 group-hover:translate-x-1 group-hover:text-blue-600" aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-slate-950">{service.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{service.description}</p>
                    <div className="mt-5 border-t border-slate-100 pt-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Khoảng giá tham khảo</p><p className="mt-1.5 text-base font-bold text-blue-700">{service.price}</p></div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 ring-1 ring-inset ring-amber-200/70">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <p><strong>Lưu ý:</strong> {settings.businessConfig.pricing.disclaimer}</p>
          </div>
        </div>
      </section>

      <section id="process" className="scroll-mt-28 bg-slate-50 py-16 md:py-24" aria-labelledby="process-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...reveal} className="mx-auto mb-12 max-w-2xl text-center">
            <p className="section-eyebrow justify-center">Rõ ràng từng bước</p>
            <h2 id="process-title" className="section-title">Quy trình đơn giản, bạn luôn chủ động</h2>
            <p className="section-description mx-auto">Từ lúc gửi yêu cầu đến khi hoàn thành, mọi bước đều được ghi nhận và cập nhật minh bạch.</p>
          </motion.div>
          <div className="relative grid gap-4 md:grid-cols-5">
            <div className="absolute left-[10%] right-[10%] top-7 hidden h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent md:block" aria-hidden="true" />
            {process.map((step, index) => (
              <motion.div key={step.number} {...reveal} transition={{ ...reveal.transition, delay: index * 0.06 }} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5 md:border-0 md:bg-transparent md:p-3 md:text-center md:shadow-none md:hover:shadow-none">
                <span className="relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/20">{step.number}</span>
                <h3 className="mt-5 text-base font-bold text-slate-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24" aria-labelledby="trust-title">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <motion.div {...reveal} className="relative overflow-hidden rounded-3xl bg-slate-950 p-7 text-white shadow-2xl shadow-slate-900/15 sm:p-10">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <p className="text-sm font-semibold text-cyan-300">Cam kết minh bạch</p>
              <h2 id="trust-title" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Kiểm tra trước.<br />Đồng ý rồi mới sửa.</h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">Chúng tôi không đưa ra một mức giá cứng khi chưa kiểm tra thiết bị. Mọi chi phí đều được giải thích rõ để bạn quyết định.</p>
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
                <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300"><CheckCircle2 className="h-6 w-6" /></span><div><p className="font-bold">Bạn có quyền quyết định</p><p className="mt-1 text-sm text-slate-400">Không sửa chữa nếu bạn chưa chấp thuận chi phí.</p></div></div>
              </div>
            </div>
          </motion.div>

          <motion.div {...reveal}>
            <p className="section-eyebrow">An tâm sử dụng dịch vụ</p>
            <h2 className="section-title">Trải nghiệm được thiết kế quanh quyền lợi của bạn</h2>
            <p className="section-description">Thông tin rõ ràng, thợ phù hợp và hỗ trợ xuyên suốt — không để khách hàng tự xoay xở khi thiết bị gặp sự cố.</p>
            <ul className="mt-8 space-y-4">
              {guarantees.map((item) => <li key={item} className="flex items-center gap-3 text-base font-medium text-slate-700"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Check className="h-4 w-4" /></span>{item}</li>)}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/service-booking" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white transition hover:bg-blue-700"><CalendarCheckIcon />Đặt lịch ngay</Link>
              <a href={`tel:${settings.hotline.replace(/\s+/g, '')}`} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 px-5 font-semibold text-slate-800 transition hover:bg-slate-50"><Phone className="h-4 w-4 text-blue-600" />{settings.hotline}</a>
            </div>
          </motion.div>
        </div>
      </section>

      <CounterStats />
      <ServiceCaseGallery />
      <TechnicianShowcase />
      <div id="pricing" className="scroll-mt-28"><PricingTable /></div>

      <section className="bg-slate-50 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...reveal} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-3 sm:p-8">
            {[{ icon: Clock3, title: 'Xác nhận nhanh', text: 'Điều phối viên liên hệ lại để xác nhận lịch.' }, { icon: MapPin, title: 'Đúng khu vực', text: 'Phân công thợ theo khu vực và chuyên môn.' }, { icon: Zap, title: 'Hỗ trợ xuyên suốt', text: 'Theo dõi yêu cầu và liên hệ khi cần trợ giúp.' }].map(({ icon: Icon, title, text }) => <div key={title} className="flex gap-4 rounded-2xl p-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon className="h-5 w-5" /></span><div><h3 className="font-bold text-slate-900">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{text}</p></div></div>)}
          </motion.div>
        </div>
      </section>

      <ConsultationForm />
    </div>
  );
}

function CalendarCheckIcon() {
  return <CheckCircle2 className="h-4 w-4" aria-hidden="true" />;
}
