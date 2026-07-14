import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Building2,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock3,
  Headphones,
  MapPin,
  Phone,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wrench,
} from 'lucide-react';
import { motion } from 'framer-motion';
import OptimizedImage from '@/components/common/OptimizedImage';
import QuickContactForm from '@/components/contact/QuickContactForm';
import { articles, processSteps, projects, reasons, services, testimonials } from '@/data/phase4Content';
import { useSettings } from '@/hooks/useSettings';
import useDocumentTitle from '@/hooks/useDocumentTitle';

const reveal = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-600">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">{description}</p>}
    </div>
  );
}

export default function Home() {
  useDocumentTitle(
    'Điện Lạnh 247 - Sửa chữa, bảo trì và lắp đặt điện lạnh',
    'Dịch vụ điện lạnh tại nhà, bảo trì doanh nghiệp, lắp đặt và tư vấn kỹ thuật minh bạch.',
  );
  const { settings } = useSettings();
  const hotline = settings?.hotline || '1900 1234';

  return (
    <div className="overflow-hidden bg-white">
      <section className="relative isolate min-h-[760px] overflow-hidden bg-[#061527] text-white lg:min-h-[720px]">
        <OptimizedImage
          src="https://images.unsplash.com/photo-1621905252472-e4b5d9fbe0c5"
          alt="Kỹ thuật viên kiểm tra hệ thống điều hòa"
          priority
          width={1600}
          height={1000}
          sizes="100vw"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-38"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,12,24,0.98)_0%,rgba(6,21,39,0.9)_48%,rgba(6,21,39,0.58)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_18%,rgba(6,182,212,0.22),transparent_32%),radial-gradient(circle_at_12%_86%,rgba(37,99,235,0.2),transparent_35%)]" />

        <div className="mx-auto grid min-h-[720px] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-20">
          <motion.div initial="hidden" animate="visible" variants={reveal} transition={{ duration: 0.55 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-extrabold text-cyan-200 backdrop-blur">
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              Hỗ trợ kỹ thuật mỗi ngày
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
              Không gian mát lành,
              <span className="block bg-gradient-to-r from-cyan-300 via-blue-300 to-white bg-clip-text text-transparent">
                dịch vụ rõ ràng từ đầu.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Điện Lạnh 247 tiếp nhận sửa chữa, vệ sinh, lắp đặt và bảo trì hệ thống điện lạnh cho gia đình và doanh nghiệp. Mỗi yêu cầu đều được xác nhận lịch, báo giá và theo dõi bảo hành.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/service-booking"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-black text-white shadow-xl shadow-orange-950/30 transition hover:-translate-y-0.5 hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300/40"
              >
                Đặt lịch kỹ thuật
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <a
                href={`tel:${hotline.replace(/\s+/g, '')}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white backdrop-blur transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
              >
                <Phone aria-hidden="true" className="h-4 w-4" />
                Gọi {hotline}
              </a>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['30–60 phút', 'Thời gian dự kiến'],
                ['3–12 tháng', 'Bảo hành dịch vụ'],
                ['Báo giá trước', 'Không tự ý sửa'],
                ['Mỗi ngày', 'Tiếp nhận yêu cầu'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/7 p-4 backdrop-blur-sm">
                  <strong className="block text-sm font-black text-white">{value}</strong>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="lg:justify-self-end"
          >
            <QuickContactForm compact title="Yêu cầu gọi lại" description="Gửi thông tin cơ bản để được tư vấn và xác nhận lịch phù hợp." />
          </motion.div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white py-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          {[
            { icon: ShieldCheck, title: 'Bảo hành rõ ràng', text: 'Có thời hạn và lịch sử dịch vụ' },
            { icon: Wrench, title: 'Đúng chuyên môn', text: 'Phân công theo kỹ năng thiết bị' },
            { icon: Clock3, title: 'Hẹn giờ linh hoạt', text: 'Xác nhận trước khi kỹ thuật viên đến' },
            { icon: Headphones, title: 'Hỗ trợ sau dịch vụ', text: 'Tiếp nhận bảo hành và phản hồi' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 rounded-2xl p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary-600">
                <item.icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <span>
                <strong className="block text-sm font-black text-slate-900">{item.title}</strong>
                <span className="mt-1 block text-xs leading-5 text-slate-500">{item.text}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeader
              eyebrow="Dịch vụ nổi bật"
              title="Giải pháp phù hợp cho từng thiết bị"
              description="Nội dung dịch vụ được trình bày rõ về phạm vi, thời gian phản hồi, bảo hành và mức giá tham khảo."
            />
            <Link to="/services" className="inline-flex items-center gap-2 text-sm font-black text-primary-700 hover:text-primary-800">
              Xem toàn bộ dịch vụ <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.slice(0, 6).map((service, index) => (
              <motion.article
                key={service.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.2) }}
                className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <OptimizedImage
                    src={service.image}
                    alt={service.title}
                    width={720}
                    height={450}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-slate-800 shadow-sm backdrop-blur">
                    {service.priceLabel}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-black text-slate-950">{service.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{service.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">{service.responseTime}</span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">{service.warranty}</span>
                  </div>
                  <Link
                    to={`/service-booking?service=${encodeURIComponent(service.slug)}`}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-black text-primary-700 hover:text-primary-900"
                  >
                    Đặt dịch vụ <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] bg-slate-100 shadow-2xl shadow-slate-900/10">
              <OptimizedImage
                src="https://images.unsplash.com/photo-1581092160562-40aa08e78837"
                alt="Đội ngũ kỹ thuật viên Điện Lạnh 247"
                width={1000}
                height={760}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="aspect-[4/3] h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 right-4 max-w-[240px] rounded-2xl border border-white/70 bg-white/95 p-5 shadow-xl backdrop-blur sm:right-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Award aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <strong className="block text-lg font-black text-slate-950">10+ năm</strong>
                  <span className="text-xs text-slate-500">kinh nghiệm vận hành</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:pl-6">
            <SectionHeader
              eyebrow="Về Điện Lạnh 247"
              title="Dịch vụ kỹ thuật được tổ chức như một quy trình có thể theo dõi"
              description="Từ bước tiếp nhận đến bảo hành, mỗi công việc đều có người phụ trách, trạng thái xử lý và thông tin bàn giao rõ ràng."
            />
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {[
                'Điều phối theo khu vực và kỹ năng',
                'Báo giá trước khi triển khai',
                'Ghi nhận hình ảnh và kết quả',
                'Theo dõi bảo hành sau dịch vụ',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-700">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  {item}
                </div>
              ))}
            </div>
            <Link to="/about" className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800">
              Tìm hiểu về chúng tôi <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#061527] py-20 text-white sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeader
              eyebrow="Dự án tiêu biểu"
              title="Kinh nghiệm từ nhiều loại không gian"
              description="Từ căn hộ đến văn phòng và chuỗi dịch vụ, giải pháp được thiết kế theo điều kiện vận hành thực tế."
            />
            <Link to="/projects" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300 hover:text-white">
              Xem tất cả dự án <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {projects.slice(0, 4).map((project) => (
              <Link
                key={project.slug}
                to={`/projects/${project.slug}`}
                className="group relative min-h-[360px] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900"
              >
                <OptimizedImage
                  src={project.image}
                  alt={project.title}
                  width={900}
                  height={640}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="absolute inset-0 h-full w-full object-cover opacity-65 transition duration-500 group-hover:scale-105 group-hover:opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-cyan-200">
                    <span>{project.category}</span>
                    <span aria-hidden="true">•</span>
                    <span>{project.location}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-black leading-tight text-white sm:text-2xl">{project.title}</h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">{project.summary}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-white">
                    Xem hồ sơ dự án <ArrowRight aria-hidden="true" className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Lý do lựa chọn"
            title="Bốn nguyên tắc xuyên suốt mỗi yêu cầu"
            description="Thiết kế dịch vụ tập trung vào sự rõ ràng, an toàn và khả năng hỗ trợ sau khi hoàn thành."
            align="center"
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((reason, index) => (
              <div key={reason.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-primary-700">
                  0{index + 1}
                </span>
                <h3 className="mt-5 text-lg font-black text-slate-950">{reason.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Quy trình phục vụ"
            title="Từ yêu cầu đến chăm sóc sau dịch vụ"
            description="Quy trình sáu bước giúp khách hàng biết rõ công việc đang ở đâu và ai đang phụ trách."
          />
          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {processSteps.map((item) => (
              <li key={item.step} className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6">
                <span className="absolute right-5 top-3 text-5xl font-black text-slate-100">{item.step}</span>
                <div className="relative">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white">
                    <CalendarCheck aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-black text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Khách hàng chia sẻ" title="Trải nghiệm được tạo nên từ những chi tiết nhỏ" align="center" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <figure key={testimonial.name} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <Quote aria-hidden="true" className="h-8 w-8 text-blue-100" />
                <div className="mt-4 flex gap-1" aria-label={`${testimonial.rating} trên 5 sao`}>
                  {Array.from({ length: testimonial.rating }).map((_, index) => (
                    <Star key={index} aria-hidden="true" className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="mt-4 text-sm leading-7 text-slate-700">“{testimonial.quote}”</blockquote>
                <figcaption className="mt-6 border-t border-slate-100 pt-5">
                  <strong className="block text-sm font-black text-slate-950">{testimonial.name}</strong>
                  <span className="mt-1 block text-xs text-slate-500">{testimonial.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeader
              eyebrow="Góc kiến thức"
              title="Thông tin dễ hiểu để sử dụng thiết bị tốt hơn"
              description="Bài viết mẫu được tổ chức theo chủ đề, thời gian đọc và nội dung thực hành."
            />
            <Link to="/articles" className="inline-flex items-center gap-2 text-sm font-black text-primary-700 hover:text-primary-900">
              Xem tất cả bài viết <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {articles.slice(0, 3).map((article) => (
              <article key={article.slug} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                <OptimizedImage
                  src={article.image}
                  alt={article.title}
                  width={720}
                  height={440}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="aspect-[16/10] h-full w-full object-cover"
                />
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary-700">
                    <span>{article.category}</span>
                    <span aria-hidden="true">•</span>
                    <span>{article.readTime}</span>
                  </div>
                  <h3 className="mt-3 line-clamp-2 text-lg font-black leading-snug text-slate-950">{article.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{article.excerpt}</p>
                  <Link to={`/articles/${article.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-black text-primary-700">
                    Đọc bài viết <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0c1b2e] py-20 text-white sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(37,99,235,0.22),transparent_35%),radial-gradient(circle_at_88%_80%,rgba(6,182,212,0.18),transparent_36%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Liên hệ Điện Lạnh 247</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Mô tả tình trạng, chúng tôi sẽ cùng bạn tìm phương án.</h2>
            <p className="mt-5 text-sm leading-7 text-slate-300 sm:text-base">
              Form liên hệ được rút gọn để sử dụng tốt trên điện thoại. Trường hợp khẩn cấp, hãy gọi hotline để được tiếp nhận ngay.
            </p>
            <div className="mt-8 grid gap-4 text-sm text-slate-200">
              <a href={`tel:${hotline.replace(/\s+/g, '')}`} className="flex items-center gap-3 font-bold hover:text-white">
                <Phone aria-hidden="true" className="h-5 w-5 text-cyan-300" /> {hotline}
              </a>
              <div className="flex items-center gap-3">
                <MapPin aria-hidden="true" className="h-5 w-5 text-cyan-300" /> {settings?.address || 'Cầu Giấy, Hà Nội'}
              </div>
              <div className="flex items-center gap-3">
                <Users aria-hidden="true" className="h-5 w-5 text-cyan-300" /> Phục vụ khách hàng gia đình và doanh nghiệp
              </div>
              <div className="flex items-center gap-3">
                <Building2 aria-hidden="true" className="h-5 w-5 text-cyan-300" /> Có phương án bảo trì định kỳ
              </div>
            </div>
          </div>
          <QuickContactForm title="Gửi yêu cầu liên hệ" description="Thông tin được sử dụng để tư vấn và xác nhận lịch dịch vụ." />
        </div>
      </section>
    </div>
  );
}
