import { useQuery } from '@tanstack/react-query';
import { Archive, Clock3, Eye, FilePlus2, History, RefreshCw, Rocket, Save, Undo2, X } from 'lucide-react';
import { useState } from 'react';
import { cmsMeta } from '@/config/cmsContentTypes';
import { getApiErrorMessage } from '@/services/api';
import { getCmsHistory, type CmsContentType, type CmsRevision } from '@/services/cmsApi';

interface CmsHistoryDrawerProps {
  type: CmsContentType;
  id: number | string;
  onClose: () => void;
}

const actionMeta: Record<string, { label: string; icon: typeof Save; tone: string }> = {
  CREATE: { label: 'Tạo mới', icon: FilePlus2, tone: 'bg-emerald-50 text-emerald-700' },
  UPDATE: { label: 'Cập nhật', icon: Save, tone: 'bg-blue-50 text-blue-700' },
  PUBLISH: { label: 'Xuất bản', icon: Rocket, tone: 'bg-violet-50 text-violet-700' },
  UNPUBLISH: { label: 'Gỡ xuất bản', icon: Undo2, tone: 'bg-amber-50 text-amber-700' },
  ARCHIVE: { label: 'Lưu trữ', icon: Archive, tone: 'bg-red-50 text-red-700' },
  RESTORE: { label: 'Khôi phục', icon: RefreshCw, tone: 'bg-cyan-50 text-cyan-700' },
  UPLOAD: { label: 'Tải media', icon: FilePlus2, tone: 'bg-emerald-50 text-emerald-700' },
};

function RevisionCard({ revision }: { revision: CmsRevision }) {
  const [open, setOpen] = useState(false);
  const meta = actionMeta[revision.action] || { label: revision.action, icon: History, tone: 'bg-slate-100 text-slate-700' };
  const Icon = meta.icon;
  return (
    <article className="relative pl-11">
      <span className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-xl ${meta.tone}`}><Icon className="h-4 w-4" /></span>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-slate-900">{meta.label}</strong><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">v{revision.version}</span></div><p className="mt-1 text-xs text-slate-500">{revision.summary || 'Không có ghi chú bổ sung'}</p></div>
          <div className="text-left text-[11px] text-slate-400 sm:text-right"><p className="font-bold text-slate-600">{revision.actorName || revision.actorEmail || 'Hệ thống'}</p><p className="mt-1 inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{new Date(revision.createdAt).toLocaleString('vi-VN')}</p></div>
        </div>
        {revision.snapshot && <button type="button" onClick={() => setOpen((value) => !value)} className="mt-3 inline-flex items-center gap-2 text-xs font-black text-primary-700"><Eye className="h-3.5 w-3.5" />{open ? 'Ẩn snapshot' : 'Xem snapshot'}</button>}
        {open && revision.snapshot && <pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-[11px] leading-5 text-slate-200">{JSON.stringify(revision.snapshot, null, 2)}</pre>}
      </div>
    </article>
  );
}

export default function CmsHistoryDrawer({ type, id, onClose }: CmsHistoryDrawerProps) {
  const meta = cmsMeta(type);
  const query = useQuery({
    queryKey: ['cms-history', type, id],
    queryFn: async () => (await getCmsHistory(type, id)).data,
  });

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-slate-950/55 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Lịch sử nội dung">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Đóng lịch sử" />
      <section className="relative flex h-full w-full max-w-xl flex-col bg-[#F5F7FB] shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-7"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600">Content revisions</p><h2 className="mt-1 text-xl font-black text-slate-950">Lịch sử {meta.singular} #{id}</h2></div><button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100" aria-label="Đóng"><X className="h-5 w-5" /></button></header>
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          {query.isLoading && <div className="space-y-4">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="ml-11 h-28 animate-pulse rounded-2xl bg-white" />)}</div>}
          {query.isError && <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{getApiErrorMessage(query.error)}</div>}
          {!query.isLoading && !query.data?.length && <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center"><History className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 text-sm font-black text-slate-700">Chưa có revision</p></div>}
          <div className="relative space-y-5 before:absolute before:bottom-0 before:left-4 before:top-0 before:w-px before:bg-slate-200">{query.data?.map((revision) => <RevisionCard key={revision.id} revision={revision} />)}</div>
        </div>
      </section>
    </div>
  );
}
