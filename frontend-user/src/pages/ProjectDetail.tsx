import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, CheckCircle2, MapPin, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Breadcrumb from '@/components/common/Breadcrumb';
import OptimizedImage from '@/components/common/OptimizedImage';
import { getProject } from '@/services/contentApi';
import useDocumentTitle from '@/hooks/useDocumentTitle';

const formatDate = (value?: string) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value)) : 'Đang cập nhật';

export default function ProjectDetail() {
  const { slug = '' } = useParams();
  const query = useQuery({ queryKey: ['managed-project', slug], queryFn: () => getProject(slug), enabled: Boolean(slug) });
  const project = query.data?.data;
  useDocumentTitle(project ? `${project.title} | Dự án Điện Lạnh 247` : 'Chi tiết dự án', project?.excerpt);

  if (query.isLoading) return <div className="mx-auto max-w-7xl px-4 py-20"><div className="h-[620px] animate-pulse rounded-3xl bg-slate-200" /></div>;
  if (query.isError || !project) return <section className="mx-auto max-w-3xl px-4 py-24 text-center"><h1 className="text-3xl font-black text-slate-950">Dự án không tồn tại hoặc chưa được xuất bản</h1><Link to="/projects" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white"><ArrowLeft className="h-4 w-4" /> Quay lại danh sách</Link></section>;

  return (
    <article className="bg-white pb-20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ name: 'Dự án', path: '/projects' }, { name: project.title }]} />
        <div className="mt-8 overflow-hidden rounded-[2rem] bg-[#061527] text-white shadow-2xl">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="p-8 sm:p-12">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Hồ sơ dự án</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{project.title}</h1>
              <p className="mt-5 text-base leading-8 text-slate-300">{project.excerpt}</p>
              <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4"><dt className="flex items-center gap-2 text-slate-400"><UserRound className="h-4 w-4" />Khách hàng</dt><dd className="mt-2 font-bold text-white">{project.clientName || 'Bảo mật theo thỏa thuận'}</dd></div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4"><dt className="flex items-center gap-2 text-slate-400"><MapPin className="h-4 w-4" />Địa điểm</dt><dd className="mt-2 font-bold text-white">{project.location || 'Đang cập nhật'}</dd></div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4"><dt className="flex items-center gap-2 text-slate-400"><CalendarDays className="h-4 w-4" />Bắt đầu</dt><dd className="mt-2 font-bold text-white">{formatDate(project.startedAt)}</dd></div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4"><dt className="flex items-center gap-2 text-slate-400"><CalendarDays className="h-4 w-4" />Hoàn thành</dt><dd className="mt-2 font-bold text-white">{formatDate(project.completedAt)}</dd></div>
              </dl>
            </div>
            <OptimizedImage src={project.coverUrl || 'https://images.unsplash.com/photo-1497366754035-f200968a6e72'} alt={project.coverAlt || project.title} width={1200} height={900} priority className="min-h-[360px] h-full w-full object-cover" />
          </div>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_340px]">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Nội dung thực hiện</h2>
            <div className="prose prose-slate mt-5 max-w-none leading-8" dangerouslySetInnerHTML={{ __html: project.content || '<p>Nội dung đang được cập nhật.</p>' }} />

            {(project.album || []).length > 0 && <section className="mt-12"><h2 className="text-2xl font-black text-slate-950">Album ảnh dự án</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{project.album?.map((media) => <figure key={media.id} className="overflow-hidden rounded-2xl border border-slate-200"><OptimizedImage src={media.url} alt={media.altText || media.caption || project.title} width={900} height={650} sizes="(max-width: 640px) 100vw, 50vw" className="aspect-[4/3] w-full object-cover" />{media.caption && <figcaption className="p-3 text-sm text-slate-600">{media.caption}</figcaption>}</figure>)}</div></section>}
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6"><h2 className="font-black text-slate-950">Nhiệm vụ chính</h2><ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">{(project.tasks || []).map((task) => <li key={task} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />{task}</li>)}</ul></div>
            <div className="rounded-2xl bg-emerald-50 p-6"><h2 className="font-black text-emerald-950">Kết quả</h2><p className="mt-3 text-sm leading-7 text-emerald-900">{project.result || 'Kết quả nghiệm thu đang được cập nhật.'}</p></div>
          </aside>
        </div>
      </div>
    </article>
  );
}
