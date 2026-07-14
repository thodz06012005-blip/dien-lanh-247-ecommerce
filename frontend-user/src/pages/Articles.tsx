import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import Breadcrumb from '@/components/common/Breadcrumb';
import OptimizedImage from '@/components/common/OptimizedImage';
import { getPosts } from '@/services/contentApi';
import useDocumentTitle from '@/hooks/useDocumentTitle';

const formatDate = (value?: string) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value)) : 'Chưa lên lịch';

export default function Articles() {
  useDocumentTitle('Bài viết điện lạnh', 'Bài viết, danh mục và thẻ được quản trị từ backend.');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const postsQuery = useQuery({
    queryKey: ['managed-posts', q, page],
    queryFn: () => getPosts({ q: q || undefined, page, limit: 9 }),
  });
  const posts = postsQuery.data?.data ?? [];
  const meta = postsQuery.data?.meta;

  return (
    <div className="bg-slate-50 pb-20">
      <section className="bg-white py-14 sm:py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumb items={[{ name: 'Bài viết' }]} />
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
            <div><p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Trung tâm kiến thức</p><h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Nội dung có tác giả, lịch xuất bản và SEO metadata</h1><p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">Các bài viết chỉ hiển thị khi được xuất bản, hỗ trợ danh mục, thẻ và thông tin tác giả.</p></div>
            <label className="relative block"><span className="sr-only">Tìm bài viết</span><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input value={q} onChange={(event) => { setQ(event.target.value); setPage(1); }} placeholder="Tìm theo tiêu đề hoặc mô tả..." className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {postsQuery.isLoading && <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-96 animate-pulse rounded-3xl bg-slate-200" />)}</div>}
        {postsQuery.isError && <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center"><h2 className="font-black text-red-900">Không tải được bài viết</h2><button onClick={() => postsQuery.refetch()} className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white">Thử lại</button></div>}
        {!postsQuery.isLoading && !postsQuery.isError && posts.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><h2 className="text-lg font-black text-slate-900">Chưa có bài viết phù hợp</h2><p className="mt-2 text-sm text-slate-500">Bài viết nháp, lưu trữ hoặc chưa đến lịch xuất bản sẽ được ẩn.</p></div>}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <OptimizedImage src={post.coverUrl || 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d'} alt={post.coverAlt || post.title} width={800} height={520} sizes="(max-width: 768px) 100vw, 33vw" className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500"><span className="rounded-full bg-blue-50 px-2.5 py-1 font-bold text-blue-700">{post.categoryName || 'Kiến thức'}</span><span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" />{formatDate(post.publishedAt)}</span></div>
                <h2 className="mt-4 text-xl font-black text-slate-950">{post.title}</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{post.excerpt}</p>
                <p className="mt-4 text-xs font-semibold text-slate-400">Tác giả: {post.authorName?.trim() || 'Ban biên tập Điện Lạnh 247'}</p>
                <Link to={`/articles/${post.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-700 hover:text-blue-900">Đọc bài viết <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </article>
          ))}
        </div>

        {meta && meta.totalPages > 1 && <div className="mt-10 flex justify-center gap-3"><button disabled={page <= 1} onClick={() => setPage((v) => v - 1)} className="min-h-11 rounded-xl border bg-white px-4 text-sm font-bold disabled:opacity-40">Trang trước</button><span className="self-center text-sm font-semibold text-slate-600">{meta.page}/{meta.totalPages}</span><button disabled={page >= meta.totalPages} onClick={() => setPage((v) => v + 1)} className="min-h-11 rounded-xl border bg-white px-4 text-sm font-bold disabled:opacity-40">Trang sau</button></div>}
      </main>
    </div>
  );
}
