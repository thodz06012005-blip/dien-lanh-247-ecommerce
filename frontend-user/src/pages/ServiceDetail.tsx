import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, HelpCircle, ShieldCheck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Breadcrumb from '@/components/common/Breadcrumb';
import OptimizedImage from '@/components/common/OptimizedImage';
import { getService } from '@/services/contentApi';
import useDocumentTitle from '@/hooks/useDocumentTitle';

export default function ServiceDetail() {
  const { slug = '' } = useParams();
  const detailQuery = useQuery({
    queryKey: ['managed-service', slug],
    queryFn: () => getService(slug),
    enabled: Boolean(slug),
  });
  const service = detailQuery.data?.data;
  useDocumentTitle(service?.title || 'Chi tiết dịch vụ', service?.excerpt);

  if (detailQuery.isLoading) return <div className="mx-auto max-w-7xl px-4 py-20"><div className="h-[560px] animate-pulse rounded-3xl bg-slate-200" /></div>;
  if (detailQuery.isError || !service) return <div className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="text-2xl font-black">Không tìm thấy dịch vụ</h1><Link to="/services" className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-bold text-white">Quay lại danh sách</Link></div>;

  return (
    <article className="bg-white pb-20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ name: 'Dịch vụ', path: '/services' }, { name: service.title }]} />
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">{service.categoryName}</span>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{service.title}</h1>
            <p className="mt-5 text-base leading-8 text-slate-600">{service.excerpt}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to={`/service-booking?service=${encodeURIComponent(service.slug)}`} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-black text-white hover:bg-orange-600">Đặt lịch dịch vụ <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/contact" className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-5 text-sm font-black text-slate-800">Nhận tư vấn</Link>
            </div>
          </div>
          <OptimizedImage src={service.coverUrl || 'https://images.unsplash.com/photo-1621905252507-b354bc25edac'} alt={service.coverAlt || service.title} width={1000} height={720} priority className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-2xl" />
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-black text-slate-950">Mô tả dịch vụ</h2>
              <div className="prose prose-slate mt-5 max-w-none leading-8" dangerouslySetInnerHTML={{ __html: service.content || '<p>Nội dung đang được cập nhật.</p>' }} />
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-950">Bảng giá tham khảo</h2>
              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                {(service.pricing || []).length ? (service.pricing || []).map((item, index) => (
                  <div key={`${item.label}-${index}`} className="grid gap-2 border-b border-slate-100 bg-white p-5 last:border-0 sm:grid-cols-[1fr_auto]">
                    <div><strong className="text-slate-900">{item.label}</strong>{item.note && <p className="mt-1 text-sm text-slate-500">{item.note}</p>}</div>
                    <span className="font-black text-blue-700">{item.price}</span>
                  </div>
                )) : <p className="p-5 text-sm text-slate-500">Giá được báo sau khi khảo sát.</p>}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-950">Quy trình thực hiện</h2>
              <ol className="mt-5 grid gap-4 sm:grid-cols-2">
                {(service.process || []).map((step, index) => <li key={step} className="flex gap-3 rounded-2xl bg-slate-50 p-5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">{index + 1}</span><span className="font-semibold text-slate-800">{step}</span></li>)}
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-950">Câu hỏi thường gặp</h2>
              <div className="mt-5 space-y-3">
                {(service.faq || []).map((item) => <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white p-5"><summary className="flex cursor-pointer list-none items-center gap-3 font-black text-slate-900"><HelpCircle className="h-5 w-5 text-blue-600" />{item.question}</summary><p className="mt-3 pl-8 text-sm leading-7 text-slate-600">{item.answer}</p></details>)}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl bg-[#061527] p-6 text-white">
              <ShieldCheck className="h-8 w-8 text-cyan-300" />
              <h2 className="mt-4 text-xl font-black">Bảo hành</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{service.warranty || 'Thời hạn bảo hành được xác nhận theo hạng mục thực tế.'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6">
              <h2 className="font-black text-slate-950">Cam kết vận hành</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {['Báo giá trước khi thực hiện', 'Ghi nhận trạng thái và bảo hành', 'Kỹ thuật viên theo đúng chuyên môn'].map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />{item}</li>)}
              </ul>
            </div>
          </aside>
        </div>

        {(service.related || []).length > 0 && <section className="mt-16"><h2 className="text-2xl font-black text-slate-950">Dịch vụ liên quan</h2><div className="mt-6 grid gap-5 md:grid-cols-3">{service.related?.map((item) => <Link key={item.id} to={`/services/${item.slug}`} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg"><h3 className="font-black text-slate-900">{item.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{item.excerpt}</p></Link>)}</div></section>}
      </div>
    </article>
  );
}
