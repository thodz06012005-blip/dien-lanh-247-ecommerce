import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, Search, SearchX } from 'lucide-react';
import Breadcrumb from '@/components/common/Breadcrumb';
import OptimizedImage from '@/components/common/OptimizedImage';
import { articles } from '@/data/phase4Content';
import useDocumentTitle from '@/hooks/useDocumentTitle';

const categories = ['Tất cả', ...Array.from(new Set(articles.map((article) => article.category)))] as const;

export default function Articles() {
  useDocumentTitle(
    'Bài viết và kinh nghiệm điện lạnh',
    'Kiến thức bảo dưỡng, tiết kiệm điện và lựa chọn thiết bị được trình bày ngắn gọn, dễ áp dụng.',
  );
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>('Tất cả');

  const visibleArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi');
    return articles.filter((article) => {
      const matchesCategory = activeCategory === 'Tất cả' || article.category === activeCategory;
      const matchesQuery =
        !normalizedQuery ||
        article.title.toLocaleLowerCase('vi').includes(normalizedQuery) ||
        article.excerpt.toLocaleLowerCase('vi').includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  return (
    <div className="bg-slate-50">
      <section className="bg-[#061527] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumb items={[{ name: 'Bài viết' }]} />
          <div className="mt-8 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Góc kiến thức</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Nội dung dễ hiểu để sử dụng thiết bị hiệu quả hơn</h1>
            <p className="mt-5 text-base leading-8 text-slate-300">Tìm kiếm theo chủ đề hoặc từ khóa. Mỗi bài viết đều có thời gian đọc và cấu trúc nội dung rõ ràng.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <label className="relative block">
            <span className="sr-only">Tìm kiếm bài viết</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tiêu đề hoặc nội dung..."
              className="min-h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pl-12 pr-4 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Lọc bài viết theo chủ đề">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                aria-pressed={activeCategory === category}
                className={`min-h-10 rounded-full px-4 text-xs font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${
                  activeCategory === category ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-primary-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {visibleArticles.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <SearchX aria-hidden="true" className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-4 text-xl font-black text-slate-900">Không tìm thấy bài viết phù hợp</h2>
            <p className="mt-2 text-sm text-slate-500">Thử thay đổi từ khóa hoặc chọn chủ đề khác.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setActiveCategory('Tất cả');
              }}
              className="mt-5 min-h-11 rounded-xl bg-primary-600 px-5 text-sm font-black text-white"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {visibleArticles.map((article) => (
              <article key={article.slug} className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
                <Link to={`/articles/${article.slug}`}>
                  <div className="overflow-hidden">
                    <OptimizedImage
                      src={article.image}
                      alt={article.title}
                      width={760}
                      height={460}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="aspect-[16/10] h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-primary-700">
                      <span>{article.category}</span>
                      <span aria-hidden="true">•</span>
                      <span className="inline-flex items-center gap-1"><Clock3 aria-hidden="true" className="h-3.5 w-3.5" /> {article.readTime}</span>
                    </div>
                    <h2 className="mt-3 line-clamp-2 text-xl font-black leading-snug text-slate-950 group-hover:text-primary-700">{article.title}</h2>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{article.excerpt}</p>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-slate-500">{article.publishedAt}</span>
                      <span className="inline-flex items-center gap-1.5 text-sm font-black text-primary-700">Đọc tiếp <ArrowRight aria-hidden="true" className="h-4 w-4" /></span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
