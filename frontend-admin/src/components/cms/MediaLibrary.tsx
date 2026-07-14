import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, FileImage, Loader2, Search, Upload, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { getApiErrorMessage } from '@/services/api';
import { listCms, uploadCmsMedia, type CmsRecord } from '@/services/cmsApi';

interface MediaLibraryProps {
  selectedId?: number | null;
  onSelect?: (media: CmsRecord) => void;
  compact?: boolean;
}

function mediaUrl(value?: unknown) {
  const url = String(value || '');
  if (!url.startsWith('/')) return url;
  const api = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
  return `${api.replace(/\/api\/v1\/?$/, '')}${url}`;
}

export default function MediaLibrary({ selectedId, onSelect, compact = false }: MediaLibraryProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mediaQuery = useQuery({
    queryKey: ['cms', 'media'],
    queryFn: async () => (await listCms('media', { limit: 100 })).data,
    staleTime: 20_000,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Vui lòng chọn tệp');
      return uploadCmsMedia(file, { name: file.name, altText, folder: 'editorial' });
    },
    onSuccess: (response) => {
      setFile(null);
      setAltText('');
      setError(null);
      if (inputRef.current) inputRef.current.value = '';
      void queryClient.invalidateQueries({ queryKey: ['cms', 'media'] });
      onSelect?.(response.data);
    },
    onError: (caught) => setError(getApiErrorMessage(caught, 'Không thể tải media lên.')),
  });

  const rows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi-VN');
    return (mediaQuery.data || []).filter((item) => !normalized || [item.name, item.altText, item.url]
      .join(' ')
      .toLocaleLowerCase('vi-VN')
      .includes(normalized));
  }, [mediaQuery.data, query]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <header className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="text-sm font-black text-slate-900">Thư viện media</h3><p className="mt-1 text-xs text-slate-500">JPEG, PNG, WebP, GIF hoặc PDF · tối đa 10 MB.</p></div>
        <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white"><Upload className="h-4 w-4" />Chọn tệp</button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" hidden onChange={(event) => setFile(event.target.files?.[0] || null)} />
      </header>

      {file && (
        <div className="grid gap-3 border-b border-slate-100 bg-blue-50/60 p-4 sm:grid-cols-[1fr_1.3fr_auto] sm:items-end">
          <div className="min-w-0"><span className="text-[10px] font-black uppercase tracking-wider text-blue-600">Tệp đã chọn</span><p className="mt-1 truncate text-sm font-bold text-slate-900">{file.name}</p><p className="text-xs text-slate-500">{Math.ceil(file.size / 1024)} KB</p></div>
          <label className="space-y-1.5"><span className="text-xs font-black text-slate-600">Alt text</span><input value={altText} onChange={(event) => setAltText(event.target.value)} className="min-h-10 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm outline-none focus:border-blue-400" placeholder="Mô tả hình ảnh cho SEO và trợ năng" /></label>
          <div className="flex gap-2"><button type="button" onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black text-white disabled:opacity-50">{uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Tải lên</button><button type="button" onClick={() => setFile(null)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-white text-slate-500" aria-label="Bỏ tệp"><X className="h-4 w-4" /></button></div>
        </div>
      )}

      {error && <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>}

      <div className="p-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-primary-500 focus:bg-white" placeholder="Tìm theo tên, alt text hoặc URL..." />
        </label>

        <div className={`mt-4 grid gap-3 ${compact ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'}`}>
          {mediaQuery.isLoading && Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-square animate-pulse rounded-2xl bg-slate-100" />)}
          {!mediaQuery.isLoading && rows.map((item) => {
            const selected = Number(item.id) === Number(selectedId);
            const image = String(item.mimeType || '').startsWith('image/');
            return (
              <button key={String(item.id)} type="button" onClick={() => onSelect?.(item)} className={`group relative overflow-hidden rounded-2xl border text-left transition ${selected ? 'border-blue-500 ring-4 ring-blue-100' : 'border-slate-200 hover:border-blue-300 hover:shadow-md'}`}>
                <div className="aspect-square bg-slate-100">
                  {image ? <img src={mediaUrl(item.url)} alt={String(item.altText || item.name || '')} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" /> : <div className="flex h-full items-center justify-center text-slate-400"><FileImage className="h-10 w-10" /></div>}
                </div>
                <div className="p-3"><p className="truncate text-xs font-black text-slate-900">{String(item.name || 'Media')}</p><p className="mt-1 truncate text-[10px] text-slate-400">#{item.id} · {String(item.mimeType || '')}</p></div>
                {selected && <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg"><Check className="h-4 w-4" /></span>}
              </button>
            );
          })}
        </div>

        {!mediaQuery.isLoading && !rows.length && <div className="py-10 text-center text-sm text-slate-500">Chưa có media phù hợp.</div>}
      </div>
    </section>
  );
}
