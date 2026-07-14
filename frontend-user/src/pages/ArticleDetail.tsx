import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Clock3 } from 'lucide-react';
import Breadcrumb from '@/components/common/Breadcrumb';
import OptimizedImage from '@/components/common/OptimizedImage';
import { articles } from '@/data/phase4Content';
import useDocumentTitle from '@/hooks/useDocumentTitle';

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const article = articles.find((item) => item.slug === slug);
  useDocumentTitle(article ? `${article.title} | Điện Lạnh 247` : 'Không tìm thấy bài viết');

  if (!article) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-600">Không tìm thấy dữ liệu</p>
        <h1 className="mt-3 text-3xl font-black text-slate-950">Bài viết không tồn tại hoặc đã được cập nhật</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">Quay lại trang bài viết để tiếp tục xem các nội dung đang có.</p>
        <Link to="/articles" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-black text-white">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Quay lại danh sách
        </Link>
      </section>
    );
  }

  const related = articles.filter((item) => item.slug !== article.slug).slice(0, 3);

  return (
    <article className="bg-white">
      <header className="bg-slate-50 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Breadcrumb items={[{ name: 'Bài viết' }, { name: article.title }]} />
          <div className="mt-10 max-w-4xl">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-primary-700">{article.category}</span>
            <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">{article.title}</h1>
            <p className="mt-5 text-base leading-8 text-slate-600">{article.excerpt}</p>
            <div className="mt-5 flex flex-wrap gap-4 text-sm font-bold text-slate-500">
              <span className="inline-flex items-center gap-2"><CalendarDays aria-hidden="true" className="h-4 w-4 text-primary-600" /> {article.publishedAt}</span>
              <span className="inline-flex items-center gap-2"><Clock3 aria-hidden="true" className="h-4 w-4 text-primary-600" /> {article.readTime}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="overflow-hidden rounded-[2rem] bg-slate-100 shadow-xl shadow-slate-900/10">
          <OptimizedImage
            src={article.image}
            alt={article.title}
            priority
            width={1440}
            height={850}
            sizes="(max-width: 1024px) 100vw, 960px"
            className="aspect-[16/9] h-full w-full object-cover"
          />
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          {article.content.map((section) => (
            <section key={section.heading} className="mb-10">
              <h2 className="text-2xl font-black tracking-tight text-slate-950">{section.heading}</h2>
              <div className="mt-4 space-y-4">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-base leading-8 text-slate-700">{paragraph}</p>
                ))}
              </div>
            </section>
          ))}

          <div className="mt-12 rounded-[1.75rem] border border-blue-100 bg-blue-50 p-6 sm:p-8">
            <h2 className="text-xl font-black text-slate-950">Cần kiểm tra thiết bị thực tế?</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">Thông tin trong bài viết mang tính tham khảo. Khi có mùi khét, rò điện hoặc âm thanh bất thường, nên tắt thiết bị và liên hệ kỹ thuật viên.</p>
            <Link to="/contact" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-black text-white">
              Gửi yêu cầu tư vấn <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <section className="border-t border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-black text-slate-950">Bài viết liên quan</h2>
            <Link to="/articles" className="text-sm font-black text-primary-700">Xem tất cả</Link>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {related.map((item) => (
              <Link key={item.slug} to={`/articles/${item.slug}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <OptimizedImage src={item.image} alt={item.title} width={640} height={400} sizes="(max-width: 768px) 100vw, 33vw" className="aspect-[16/10] h-full w-full object-cover" />
                <div className="p-5">
                  <span className="text-xs font-bold text-primary-700">{item.category}</span>
                  <h3 className="mt-2 line-clamp-2 font-black leading-snug text-slate-950 group-hover:text-primary-700">{item.title}</h3>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-slate-500">Đọc bài <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}
