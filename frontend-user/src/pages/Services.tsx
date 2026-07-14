import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Search, ShieldCheck, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import Breadcrumb from '@/components/common/Breadcrumb';
import OptimizedImage from '@/components/common/OptimizedImage';
import { getServices } from '@/services/contentApi';
import useDocumentTitle from '@/hooks/useDocumentTitle';

export default function Services() {
  useDocumentTitle('Dịch vụ điện lạnh', 'Danh sách dịch vụ được quản trị từ hệ thống Điện Lạnh 247.');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const servicesQuery = useQuery({
    queryKey: ['managed-services', query, page],
    queryFn: () => getServices({ q: query || undefined, page, limit: 9 }),
  });

  const items = servicesQuery.data?.data ?? [];
  const meta = servicesQuery.data?.meta;

  return (
    <div className="bg-slate-50 pb-20">
      <section className="bg-[#061527] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumb items={[{ name: 'Dịch vụ' }]} />
          <div className="mt-8 max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-200">
              <Wrench className="h-4 w-4" /> Nội dung được quản trị
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Dịch vụ rõ phạm vi, giá và bảo hành</h1>
            <p className="mt-5 text-base leading-8 text-slate-300">Mỗi dịch vụ có mô tả chi tiết, bảng giá tham khảo, quy trình thực hiện, chính sách bảo hành và câu hỏi thường gặp.</p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="relative block">
            <span className="sr-only">Tìm dịch vụ</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder="Tìm theo tên hoặc mô tả dịch vụ..."
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>

        {servicesQuery.isLoading && (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-96 animate-pulse rounded-[1.75rem] bg-slate-200" />)}
          </div>
        )}

        {servicesQuery.isError && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <h2 className="font-black text-red-900">Không tải được dữ liệu dịch vụ</h2>
            <p className="mt-2 text-sm text-red-700">Hãy kiểm tra backend và biến VITE_CONTENT_API_BASE_URL.</p>
            <button type="button" onClick={() => servicesQuery.refetch()} className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white">Thử lại</button>
          </div>
        )}

        {!servicesQuery.isLoading && !servicesQuery.isError && items.length === 0 && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-slate-400" />
            <h2 className="mt-4 text-lg font-black text-slate-900">Chưa có dịch vụ phù hợp</h2>
            <p className="mt-2 text-sm text-slate-500">Thử thay đổi từ khóa hoặc quay lại sau khi quản trị viên xuất bản nội dung.</p>
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((service) => (
            <article key={service.id} className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <OptimizedImage
                src={service.coverUrl || 'https://images.unsplash.com/photo-1621905252507-b354bc25edac'}
                alt={service.coverAlt || service.title}
                width={720}
                height={450}
                sizes="(max-width: 768px) 100vw, 33vw"
                className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <div className="p-6">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">{service.categoryName || 'Dịch vụ kỹ thuật'}</span>
                <h2 className="mt-2 text-xl font-black text-slate-950">{service.title}</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{service.excerpt}</p>
                <Link to={`/services/${service.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-700 hover:text-blue-900">
                  Xem chi tiết <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {meta && meta.totalPages > 1 && (
          <nav aria-label="Phân trang dịch vụ" className="mt-10 flex items-center justify-center gap-3">
            <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold disabled:opacity-40">Trang trước</button>
            <span className="text-sm font-semibold text-slate-600">Trang {meta.page}/{meta.totalPages}</span>
            <button disabled={page >= meta.totalPages} onClick={() => setPage((value) => value + 1)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold disabled:opacity-40">Trang sau</button>
          </nav>
        )}
      </main>
    </div>
  );
}
