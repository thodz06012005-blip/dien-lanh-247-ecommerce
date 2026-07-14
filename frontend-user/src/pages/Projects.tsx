import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, MapPin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import Breadcrumb from '@/components/common/Breadcrumb';
import OptimizedImage from '@/components/common/OptimizedImage';
import { getProjects } from '@/services/contentApi';
import useDocumentTitle from '@/hooks/useDocumentTitle';

export default function Projects() {
  useDocumentTitle('Dự án điện lạnh', 'Các dự án điện lạnh được quản trị từ hệ thống nội dung.');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['managed-projects', q, page],
    queryFn: () => getProjects({ q: q || undefined, page, limit: 9 }),
  });
  const projects = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <div className="bg-slate-50 pb-20">
      <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumb items={[{ name: 'Dự án' }]} />
          <h1 className="mt-8 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">Dự án được ghi nhận bằng dữ liệu và kết quả thực tế</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">Mỗi hồ sơ dự án thể hiện khách hàng, địa điểm, thời gian, nhiệm vụ, nội dung thi công, kết quả và album ảnh.</p>
        </div>
      </section>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <label className="relative block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="sr-only">Tìm dự án</span>
          <Search className="pointer-events-none absolute left-8 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(event) => { setQ(event.target.value); setPage(1); }} placeholder="Tìm theo tên dự án, khách hàng hoặc địa điểm..." className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
        </label>

        {query.isLoading && <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-96 animate-pulse rounded-3xl bg-slate-200" />)}</div>}
        {query.isError && <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-8 text-center"><h2 className="font-black text-red-900">Không tải được dự án</h2><button onClick={() => query.refetch()} className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white">Thử lại</button></div>}
        {!query.isLoading && !query.isError && projects.length === 0 && <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center"><h2 className="text-lg font-black text-slate-900">Chưa có dự án phù hợp</h2><p className="mt-2 text-sm text-slate-500">Nội dung nháp hoặc đã ẩn sẽ không xuất hiện ở website khách hàng.</p></div>}

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <article key={project.id} className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <OptimizedImage src={project.coverUrl || 'https://images.unsplash.com/photo-1497366754035-f200968a6e72'} alt={project.coverAlt || project.title} width={800} height={520} sizes="(max-width: 768px) 100vw, 33vw" className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><MapPin className="h-4 w-4 text-blue-600" />{project.location || 'Đang cập nhật địa điểm'}</div>
                <h2 className="mt-3 text-xl font-black text-slate-950">{project.title}</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{project.excerpt}</p>
                {project.clientName && <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Khách hàng: {project.clientName}</p>}
                <Link to={`/projects/${project.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-700 hover:text-blue-900">Xem hồ sơ dự án <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </article>
          ))}
        </div>

        {meta && meta.totalPages > 1 && <div className="mt-10 flex justify-center gap-3"><button disabled={page <= 1} onClick={() => setPage((v) => v - 1)} className="min-h-11 rounded-xl border bg-white px-4 text-sm font-bold disabled:opacity-40">Trang trước</button><span className="self-center text-sm font-semibold text-slate-600">{meta.page}/{meta.totalPages}</span><button disabled={page >= meta.totalPages} onClick={() => setPage((v) => v + 1)} className="min-h-11 rounded-xl border bg-white px-4 text-sm font-bold disabled:opacity-40">Trang sau</button></div>}
      </main>
    </div>
  );
}
