import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  Check,
  Clock3,
  Refrigerator,
  ShieldCheck,
  Snowflake,
  WashingMachine,
  Wind,
  Wrench,
} from 'lucide-react';
import Breadcrumb from '@/components/common/Breadcrumb';
import OptimizedImage from '@/components/common/OptimizedImage';
import { services, type ServiceIconName } from '@/data/phase4Content';
import useDocumentTitle from '@/hooks/useDocumentTitle';

const iconMap: Record<ServiceIconName, React.ElementType> = {
  wind: Wind,
  snowflake: Snowflake,
  washer: WashingMachine,
  refrigerator: Refrigerator,
  building: Building2,
  tools: Wrench,
};

export default function Services() {
  useDocumentTitle(
    'Dịch vụ điện lạnh tại nhà và doanh nghiệp',
    'Danh sách dịch vụ sửa chữa, vệ sinh, lắp đặt và bảo trì điện lạnh của Điện Lạnh 247.',
  );

  return (
    <div className="bg-slate-50">
      <section className="relative overflow-hidden bg-[#061527] py-16 text-white sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_20%,rgba(6,182,212,0.22),transparent_32%),radial-gradient(circle_at_10%_90%,rgba(37,99,235,0.2),transparent_36%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumb items={[{ name: 'Dịch vụ' }]} />
          <div className="mt-8 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Danh mục dịch vụ</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Giải pháp kỹ thuật rõ phạm vi, thời gian và bảo hành
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-300">
              Dữ liệu dịch vụ được trình bày theo cấu trúc thống nhất để khách hàng dễ so sánh và lựa chọn trước khi gửi yêu cầu.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-7 lg:grid-cols-2">
          {services.map((service) => {
            const Icon = iconMap[service.icon];
            return (
              <article
                key={service.slug}
                className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
              >
                <div className="grid h-full sm:grid-cols-[0.9fr_1.1fr]">
                  <div className="relative min-h-[240px] overflow-hidden">
                    <OptimizedImage
                      src={service.image}
                      alt={service.title}
                      width={760}
                      height={620}
                      sizes="(max-width: 640px) 100vw, 45vw"
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 to-transparent" />
                    <span className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/90 text-primary-700 shadow-lg backdrop-blur">
                      <Icon aria-hidden="true" className="h-6 w-6" />
                    </span>
                  </div>

                  <div className="flex flex-col p-6 sm:p-7">
                    <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{service.responseTime}</span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{service.warranty}</span>
                    </div>
                    <h2 className="mt-4 text-xl font-black text-slate-950">{service.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{service.description}</p>
                    <ul className="mt-5 grid gap-2 text-sm text-slate-700">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <strong className="text-sm font-black text-orange-600">{service.priceLabel}</strong>
                      <Link
                        to={`/service-booking?service=${encodeURIComponent(service.slug)}`}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-black text-white hover:bg-primary-700"
                      >
                        Đặt lịch <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            { icon: Clock3, title: 'Xác nhận lịch', text: 'Khung giờ được xác nhận trước khi kỹ thuật viên di chuyển.' },
            { icon: ShieldCheck, title: 'Bảo hành có ghi nhận', text: 'Thông tin công việc và thời hạn được lưu theo yêu cầu dịch vụ.' },
            { icon: Wrench, title: 'Báo giá trước khi sửa', text: 'Chỉ triển khai sau khi khách hàng đồng ý phương án.' },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl bg-slate-50 p-6">
              <item.icon aria-hidden="true" className="h-6 w-6 text-primary-600" />
              <h3 className="mt-4 text-base font-black text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
