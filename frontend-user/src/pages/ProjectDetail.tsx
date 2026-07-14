import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin } from 'lucide-react';
import Breadcrumb from '@/components/common/Breadcrumb';
import OptimizedImage from '@/components/common/OptimizedImage';
import { projects } from '@/data/phase4Content';
import useDocumentTitle from '@/hooks/useDocumentTitle';

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const project = projects.find((item) => item.slug === slug);
  useDocumentTitle(project ? `${project.title} | Dự án Điện Lạnh 247` : 'Không tìm thấy dự án');

  if (!project) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-600">Không tìm thấy dữ liệu</p>
        <h1 className="mt-3 text-3xl font-black text-slate-950">Dự án không tồn tại hoặc đã được cập nhật</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">Bạn có thể quay lại danh sách dự án để xem các hồ sơ đang được công bố.</p>
        <Link to="/projects" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-black text-white">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Quay lại danh sách
        </Link>
      </section>
    );
  }

  const related = projects.filter((item) => item.slug !== project.slug).slice(0, 2);

  return (
    <div className="bg-white">
      <section className="bg-slate-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumb items={[{ name: 'Dự án' }, { name: project.title }]} />
        </div>
      </section>

      <article>
        <header className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8 lg:py-16">
          <div className="self-center">
            <div className="flex flex-wrap gap-2 text-xs font-black text-primary-700">
              <span className="rounded-full bg-blue-50 px-3 py-1">{project.category}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{project.completedAt}</span>
            </div>
            <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">{project.title}</h1>
            <p className="mt-5 text-base leading-8 text-slate-600">{project.summary}</p>
            <p className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-slate-700">
              <MapPin aria-hidden="true" className="h-5 w-5 text-primary-600" /> {project.location}
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {project.metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <strong className="block text-sm font-black text-slate-950">{metric.value}</strong>
                  <span className="mt-1 block text-xs text-slate-500">{metric.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-[2rem] bg-slate-100 shadow-2xl shadow-slate-900/10">
            <OptimizedImage
              src={project.image}
              alt={project.title}
              priority
              width={1200}
              height={900}
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="aspect-[4/3] h-full w-full object-cover"
            />
          </div>
        </header>

        <section className="border-y border-slate-200 bg-slate-50 py-16">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
            {[
              ['Bài toán', project.challenge],
              ['Giải pháp', project.solution],
              ['Kết quả', project.result],
            ].map(([title, content], index) => (
              <div key={title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-sm font-black text-white">0{index + 1}</span>
                <h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{content}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-600">Hình ảnh triển khai</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">Một số góc nhìn trong dự án</h2>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {project.gallery.map((image, index) => (
              <div key={image} className="overflow-hidden rounded-[1.5rem] bg-slate-100">
                <OptimizedImage
                  src={image}
                  alt={`${project.title} - hình ${index + 1}`}
                  width={720}
                  height={560}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="aspect-[4/3] h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#061527] py-16 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-cyan-300" />
                <h2 className="mt-4 text-3xl font-black">Bạn có công trình tương tự?</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">Gửi thông tin cơ bản để đội ngũ kỹ thuật khảo sát nhu cầu và đề xuất phương án phù hợp.</p>
              </div>
              <Link to="/contact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 text-sm font-black text-white hover:bg-orange-600">
                Liên hệ tư vấn <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-black text-slate-950">Dự án khác</h2>
            <Link to="/projects" className="text-sm font-black text-primary-700">Xem tất cả</Link>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {related.map((item) => (
              <Link key={item.slug} to={`/projects/${item.slug}`} className="group flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <OptimizedImage src={item.image} alt={item.title} width={360} height={260} sizes="160px" className="h-36 w-40 shrink-0 object-cover" />
                <div className="p-5">
                  <span className="text-xs font-bold text-primary-700">{item.category}</span>
                  <h3 className="mt-2 line-clamp-2 font-black text-slate-950 group-hover:text-primary-700">{item.title}</h3>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-slate-500">Chi tiết <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}
