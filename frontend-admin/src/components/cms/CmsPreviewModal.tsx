import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Image as ImageIcon, X } from 'lucide-react';
import { cmsMeta, cmsRecordLabel } from '@/config/cmsContentTypes';
import { getApiErrorMessage } from '@/services/api';
import { previewCms, type CmsContentType } from '@/services/cmsApi';

interface CmsPreviewModalProps {
  type: CmsContentType;
  id: number | string;
  onClose: () => void;
}

function resolveMedia(value: unknown) {
  const url = String(value || '');
  if (!url.startsWith('/')) return url;
  const api = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
  return `${api.replace(/\/api\/v1\/?$/, '')}${url}`;
}

function previewHtml(content: unknown) {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Inter,system-ui;margin:0;padding:28px;line-height:1.75;color:#0f172a}h1,h2,h3{line-height:1.25}img{max-width:100%;height:auto;border-radius:16px}blockquote{border-left:4px solid #06b6d4;background:#f8fafc;padding:12px 18px;margin:20px 0}pre{background:#0f172a;color:#e2e8f0;padding:18px;border-radius:14px;overflow:auto}</style></head><body>${String(content || '<p style="color:#94a3b8">Chưa có nội dung.</p>')}</body></html>`;
}

export default function CmsPreviewModal({ type, id, onClose }: CmsPreviewModalProps) {
  const meta = cmsMeta(type);
  const query = useQuery({ queryKey: ['cms-preview', type, id], queryFn: async () => (await previewCms(type, id)).data });
  const item = query.data;
  const cover = resolveMedia(item?.coverUrl || item?.desktopMediaUrl || item?.url);
  const featured = Boolean(item?.isFeatured);
  const hasContent = Boolean(item?.content);
  const externalUrl = String(item?.ctaUrl || item?.websiteUrl || item?.canonicalUrl || '');

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={`Preview ${meta.singular}`}>
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Đóng preview" />
      <section className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600">Draft preview · {meta.label}</p><h2 className="mt-1 text-xl font-black text-slate-950">{item ? cmsRecordLabel(item) : 'Đang tải preview...'}</h2></div><button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100" aria-label="Đóng"><X className="h-5 w-5" /></button></header>
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-7">
          {query.isLoading && <div className="grid gap-4"><div className="h-56 animate-pulse rounded-[2rem] bg-slate-200" /><div className="h-96 animate-pulse rounded-[2rem] bg-white" /></div>}
          {query.isError && <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-semibold text-red-700">{getApiErrorMessage(query.error)}</div>}
          {item && <div className="mx-auto max-w-5xl space-y-5">
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              {cover ? <img src={cover} alt={String(item.altText || item.title || item.name || '')} className="max-h-[420px] w-full object-cover" /> : <div className="flex h-44 items-center justify-center bg-slate-100 text-slate-400"><ImageIcon className="h-12 w-12" /></div>}
              <div className="p-6 sm:p-8"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-700">{String(item.status || (item.isActive ? 'ACTIVE' : 'INACTIVE'))}</span>{featured && <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black text-amber-700">NỔI BẬT</span>}<span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600">VERSION {String(item.version || 1)}</span></div><h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">{cmsRecordLabel(item)}</h1>{Boolean(item.excerpt) && <p className="mt-4 text-base leading-8 text-slate-600">{String(item.excerpt)}</p>}</div>
            </section>
            {hasContent && <iframe title="Nội dung preview" sandbox="" srcDoc={previewHtml(item.content)} className="min-h-[520px] w-full rounded-[2rem] border border-slate-200 bg-white shadow-sm" />}
            <section className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-7">{Object.entries(item).filter(([key, value]) => !['content','snapshot','coverUrl','desktopMediaUrl','url'].includes(key) && value !== null && value !== undefined && typeof value !== 'object').slice(0, 18).map(([key, value]) => <div key={key} className="rounded-xl bg-slate-50 p-3"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{key}</span><p className="mt-1 break-words text-sm font-semibold text-slate-700">{String(value)}</p></div>)}</section>
            {externalUrl && <div className="flex justify-end"><a href={externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white">Mở liên kết <ExternalLink className="h-4 w-4" /></a></div>}
          </div>}
        </div>
      </section>
    </div>
  );
}
