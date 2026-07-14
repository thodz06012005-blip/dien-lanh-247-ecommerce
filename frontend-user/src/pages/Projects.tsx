import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, MapPin, SearchX } from 'lucide-react';
import Breadcrumb from '@/components/common/Breadcrumb';
import OptimizedImage from '@/components/common/OptimizedImage';
import { projects } from '@/data/phase4Content';
import useDocumentTitle from '@/hooks/useDocumentTitle';

const categories = ['Tất cả', ...Array.from(new Set(projects.map((project) => project.category)))] as const;

export default function Projects() {
  useDocumentTitle(
    'Dự án điện lạnh tiêu biểu',
    'Các dự án lắp đặt, bảo trì và tối ưu hệ thống điện lạnh cho nhà ở, văn phòng, nhà hàng và bán lẻ.',
  );
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>('Tất cả');

  const visibleProjects = useMemo(
    () => (activeCategory === 'Tất cả' ? projects : projects.filter((project) => project.category === activeCategory)),
    [activeCategory],
  );

  return (
    <div className="bg-slate-50">
      <section className="relative overflow-hidden bg-[#061527] py-16 text-white sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(6,182,212,0.2),transparent_35%),radial-gradient(circle_at_12%_90%,rgba(37,99,235,0.2),transparent_38%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumb items={[{ name: 'Dự án' }]} />
          <div className="mt-8 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Hồ sơ năng lực</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Dự án được kể bằng bài toán, giải pháp và kết quả
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-300">
              Mỗi hồ sơ dự án mẫu mô tả điều kiện thực tế, cách triển khai và kết quả bàn giao thay vì chỉ hiển thị hình ảnh.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-8 flex flex-wrap gap-2" aria-label="Lọc dự án theo loại công trình">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
              className={`min-h-11 rounded-full px-4 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${
                activeCategory === category
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-primary-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {visibleProjects.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <SearchX aria-hidden="true" className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-4 text-xl font-black text-slate-900">Chưa có dự án trong nhóm này</h2>
            <p className="mt-2 text-sm text-slate-500">Hãy chọn một nhóm công trình khác để tiếp tục xem.</p>
          </div>
        ) : (
          <div className="grid gap-7 lg:grid-cols-2">
            {visibleProjects.map((project) => (
              <article
                key={project.slug}
                className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
              >
                <Link to={`/projects/${project.slug}`} className="block">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <OptimizedImage
                      src={project.image}
                      alt={project.title}
                      width={960}
                      height={600}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
                    <span className="absolute left-5 top-5 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-slate-800 shadow-sm backdrop-blur">
                      {project.category}
                    </span>
                  </div>
                  <div className="p-6 sm:p-7">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-primary-600" />
                        {project.location}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 aria-hidden="true" className="h-3.5 w-3.5 text-primary-600" />
                        {project.completedAt}
                      </span>
                    </div>
                    <h2 className="mt-4 text-xl font-black leading-tight text-slate-950 sm:text-2xl">{project.title}</h2>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{project.summary}</p>
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      {project.metrics.map((metric) => (
                        <div key={metric.label} className="rounded-xl bg-slate-50 p-3">
                          <strong className="block text-xs font-black text-slate-900">{metric.value}</strong>
                          <span className="mt-1 block text-[11px] text-slate-500">{metric.label}</span>
                        </div>
                      ))}
                    </div>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-primary-700">
                      Xem chi tiết dự án <ArrowRight aria-hidden="true" className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
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
