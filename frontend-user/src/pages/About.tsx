import { Link } from 'react-router-dom';
import { ArrowRight, Award, CheckCircle2, ShieldCheck, Sparkles, Target, Users, Wrench } from 'lucide-react';
import Breadcrumb from '@/components/common/Breadcrumb';
import OptimizedImage from '@/components/common/OptimizedImage';
import useDocumentTitle from '@/hooks/useDocumentTitle';

const values = [
  {
    icon: ShieldCheck,
    title: 'Trung thực trong tư vấn',
    description: 'Giải thích nguyên nhân, phương án và chi phí trước khi thực hiện thay vì tạo áp lực quyết định.',
  },
  {
    icon: Wrench,
    title: 'Kỷ luật kỹ thuật',
    description: 'Tuân thủ kiểm tra an toàn, checklist thi công và quy trình nghiệm thu cho từng loại thiết bị.',
  },
  {
    icon: Users,
    title: 'Tôn trọng khách hàng',
    description: 'Đúng giờ, giữ vệ sinh, giao tiếp rõ ràng và bảo vệ không gian sinh hoạt hoặc vận hành.',
  },
  {
    icon: Target,
    title: 'Cải tiến dựa trên dữ liệu',
    description: 'Theo dõi lịch sử yêu cầu, phản hồi và tỷ lệ bảo hành để liên tục nâng chất lượng dịch vụ.',
  },
];

export default function About() {
  useDocumentTitle(
    'Giới thiệu Điện Lạnh 247',
    'Tìm hiểu định hướng, giá trị cốt lõi và quy trình phát triển dịch vụ kỹ thuật của Điện Lạnh 247.',
  );

  return (
    <div className="bg-white">
      <section className="bg-slate-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumb items={[{ name: 'Giới thiệu' }]} />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_1.05fr] lg:px-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-primary-700">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            Câu chuyện Điện Lạnh 247
          </div>
          <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            Xây dịch vụ điện lạnh bằng quy trình có thể kiểm chứng
          </h1>
          <p className="mt-6 text-base leading-8 text-slate-600">
            Điện Lạnh 247 bắt đầu từ nhu cầu rất đơn giản: khách hàng cần biết ai đang xử lý, công việc gồm những gì, chi phí bao nhiêu và bảo hành ra sao. Từ đó, hệ thống được xây dựng xoay quanh điều phối, minh bạch và theo dõi sau dịch vụ.
          </p>
          <p className="mt-4 text-base leading-8 text-slate-600">
            Bên cạnh kỹ thuật, chúng tôi chú trọng trải nghiệm tại nhà và tại nơi làm việc: đúng lịch, giữ vệ sinh, hạn chế gián đoạn vận hành và hướng dẫn khách hàng sử dụng thiết bị hiệu quả hơn.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/services" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-black text-white hover:bg-primary-700">
              Xem dịch vụ <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link to="/projects" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 hover:border-blue-300 hover:text-primary-700">
              Xem dự án tiêu biểu
            </Link>
          </div>
        </div>

        <div className="relative pb-8 sm:pl-8">
          <div className="overflow-hidden rounded-[2.25rem] bg-slate-100 shadow-2xl shadow-slate-900/10">
            <OptimizedImage
              src="https://images.unsplash.com/photo-1581092160562-40aa08e78837"
              alt="Kỹ thuật viên trao đổi kế hoạch công việc"
              priority
              width={1200}
              height={900}
              sizes="(max-width: 1024px) 100vw, 52vw"
              className="aspect-[4/3] h-full w-full object-cover"
            />
          </div>
          <div className="absolute bottom-0 left-4 rounded-2xl border border-white/70 bg-white/95 p-5 shadow-xl backdrop-blur sm:left-0">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Award aria-hidden="true" className="h-6 w-6" />
              </span>
              <div>
                <strong className="block text-xl font-black text-slate-950">10+ năm</strong>
                <span className="text-xs text-slate-500">phát triển năng lực kỹ thuật</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-[#061527] py-14 text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 text-center sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            ['50.000+', 'Lượt khách hàng phục vụ'],
            ['50+', 'Kỹ thuật viên và cộng tác viên'],
            ['3–12 tháng', 'Khung bảo hành dịch vụ'],
            ['Mỗi ngày', 'Tiếp nhận và điều phối'],
          ].map(([value, label]) => (
            <div key={label}>
              <strong className="block text-2xl font-black text-cyan-300 sm:text-3xl">{value}</strong>
              <span className="mt-2 block text-xs leading-5 text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-600">Giá trị cốt lõi</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Bốn nguyên tắc định hướng mọi quyết định</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">Các giá trị được chuyển thành yêu cầu cụ thể trong quy trình vận hành và cách kỹ thuật viên làm việc với khách hàng.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {values.map((value) => (
              <article key={value.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-primary-700">
                  <value.icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-xl font-black text-slate-950">{value.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{value.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:px-8">
        <div className="order-2 lg:order-1">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-600">Cách chúng tôi làm việc</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Từ lời hứa thành checklist có thể nghiệm thu</h2>
          <div className="mt-7 grid gap-4">
            {[
              'Tiếp nhận đủ thông tin trước khi điều phối.',
              'Xác nhận lịch và nhắc hẹn trước khi đến.',
              'Kiểm tra, giải thích và báo giá trước khi sửa.',
              'Chạy thử, vệ sinh và bàn giao kết quả.',
              'Ghi nhận thời hạn bảo hành và hỗ trợ sau dịch vụ.',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-700">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="order-1 overflow-hidden rounded-[2rem] bg-slate-100 lg:order-2">
          <OptimizedImage
            src="https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0"
            alt="Kỹ thuật viên kiểm tra thiết bị"
            width={1000}
            height={800}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="aspect-[4/3] h-full w-full object-cover"
          />
        </div>
      </section>

      <section className="bg-blue-50 py-14">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Cần một đơn vị kỹ thuật có quy trình rõ ràng?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Gửi nhu cầu để được tư vấn dịch vụ phù hợp cho gia đình hoặc doanh nghiệp.</p>
          </div>
          <Link to="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary-600 px-6 text-sm font-black text-white hover:bg-primary-700">
            Liên hệ Điện Lạnh 247 <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
