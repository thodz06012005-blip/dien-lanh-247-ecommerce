import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Breadcrumb from '@/components/common/Breadcrumb';
import OptimizedImage from '@/components/common/OptimizedImage';
import { getPost } from '@/services/contentApi';
import useDocumentTitle from '@/hooks/useDocumentTitle';

const formatDate = (value?: string) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(new Date(value)) : 'Chưa lên lịch';

export default function ArticleDetail() {
  const { slug = '' } = useParams();
  const query = useQuery({ queryKey: ['managed-post', slug], queryFn: () => getPost(slug), enabled: Boolean(slug) });
  const post = query.data?.data;
  useDocumentTitle(post?.seoTitle || post?.title || 'Chi tiết bài viết', post?.seoDescription || post?.excerpt);

  useEffect(() => {
    if (!post?.seoDescription) return;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.append(meta);
    }
    meta.content = post.seoDescription;
  }, [post?.seoDescription]);

  if (query.isLoading) return <div className="mx-auto max-w-5xl px-4 py-20"><div className="h-[640px] animate-pulse rounded-3xl bg-slate-200" /></div>;
  if (query.isError || !post) return <section className="mx-auto max-w-3xl px-4 py-24 text-center"><h1 className="text-3xl font-black text-slate-950">Bài viết không tồn tại hoặc chưa được xuất bản</h1><Link to="/articles" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white"><ArrowLeft className="h-4 w-4" /> Quay lại danh sách</Link></section>;

  return (
    <article className="bg-white pb-20">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ name: 'Bài viết', path: '/articles' }, { name: post.title }]} />
        <header className="mx-auto mt-10 max-w-4xl text-center">
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">{post.categoryName || 'Kiến thức'}</span>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">{post.title}</h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-600">{post.excerpt}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-sm text-slate-500"><span className="inline-flex items-center gap-2"><UserRound className="h-4 w-4" />{post.authorName?.trim() || 'Ban biên tập Điện Lạnh 247'}</span><span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDate(post.publishedAt)}</span></div>
        </header>

        <OptimizedImage src={post.coverUrl || 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d'} alt={post.coverAlt || post.title} width={1400} height={850} priority className="mt-10 aspect-[16/9] w-full rounded-[2rem] object-cover shadow-xl" />

        <div className="mx-auto mt-12 max-w-3xl">
          <div className="prose prose-slate prose-headings:font-black prose-a:text-blue-700 max-w-none leading-8" dangerouslySetInnerHTML={{ __html: post.content || '<p>Nội dung đang được cập nhật.</p>' }} />
          {(post.tags || []).length > 0 && <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-6"><span className="text-sm font-black text-slate-700">Thẻ:</span>{post.tags?.map((tag) => <Link key={tag.id} to={`/articles?tag=${encodeURIComponent(tag.slug)}`} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700">#{tag.name}</Link>)}</div>}
        </div>
      </div>
    </article>
  );
}
