import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  Eye,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Layers3,
  Pencil,
  Plus,
  Search,
  Tags,
  Wrench,
  X,
} from 'lucide-react';
import { Button, Input, Select, Textarea } from '@/design-system';
import {
  archiveContent,
  createContent,
  getContent,
  listContent,
  previewContent,
  updateContent,
  type AdminContentRecord,
  type ContentType,
} from '@/services/contentApi';

const types: Array<{ value: ContentType; label: string; icon: typeof Wrench }> = [
  { value: 'services', label: 'Dịch vụ', icon: Wrench },
  { value: 'service-categories', label: 'Danh mục dịch vụ', icon: Layers3 },
  { value: 'projects', label: 'Dự án', icon: FolderKanban },
  { value: 'posts', label: 'Bài viết', icon: FileText },
  { value: 'categories', label: 'Danh mục bài viết', icon: Layers3 },
  { value: 'tags', label: 'Thẻ', icon: Tags },
  { value: 'media', label: 'Media', icon: ImageIcon },
];

const titleTypes: ContentType[] = ['services', 'projects', 'posts'];
const statusTypes: ContentType[] = ['services', 'projects', 'posts'];

function stringValue(value: unknown) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function parseJson(value: string) {
  if (!value.trim()) return undefined;
  try { return JSON.parse(value); } catch { throw new Error('Một trường JSON đang sai định dạng.'); }
}

function csvNumbers(value: string) {
  return value.split(',').map((item) => Number(item.trim())).filter((item) => Number.isInteger(item) && item > 0);
}

function ContentForm({
  type,
  initial,
  saving,
  onClose,
  onSubmit,
}: {
  type: ContentType;
  initial?: AdminContentRecord;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState<Record<string, string>>(() => {
    const source = initial || {};
    return {
      title: stringValue(source.title),
      name: stringValue(source.name),
      slug: stringValue(source.slug),
      excerpt: stringValue(source.excerpt),
      description: stringValue(source.description),
      summary: stringValue(source.summary),
      content: stringValue(source.content),
      status: stringValue(source.status || 'DRAFT'),
      isFeatured: stringValue(source.isFeatured ?? false),
      isActive: stringValue(source.isActive ?? true),
      sortOrder: stringValue(source.sortOrder || 0),
      serviceCategoryId: stringValue(source.serviceCategoryId),
      coverMediaId: stringValue(source.coverMediaId),
      pricing: stringValue(source.pricing),
      process: stringValue(source.process),
      warranty: stringValue(source.warranty),
      faq: stringValue(source.faq),
      relatedServiceSlugs: stringValue(source.relatedServiceSlugs),
      clientName: stringValue(source.clientName),
      location: stringValue(source.location),
      startedAt: stringValue(source.startedAt).slice(0, 10),
      completedAt: stringValue(source.completedAt).slice(0, 10),
      tasks: stringValue(source.tasks),
      result: stringValue(source.result),
      mediaIds: Array.isArray(source.mediaIds) ? source.mediaIds.join(',') : '',
      categoryId: stringValue(source.categoryId),
      authorId: stringValue(source.authorId),
      tagIds: Array.isArray(source.tagIds) ? source.tagIds.join(',') : '',
      publishedAt: stringValue(source.publishedAt).slice(0, 16),
      seoTitle: stringValue(source.seoTitle),
      seoDescription: stringValue(source.seoDescription),
      canonicalUrl: stringValue(source.canonicalUrl),
      url: stringValue(source.url),
      altText: stringValue(source.altText),
      mimeType: stringValue(source.mimeType || 'image/jpeg'),
      width: stringValue(source.width),
      height: stringValue(source.height),
      sizeBytes: stringValue(source.sizeBytes),
      provider: stringValue(source.provider),
      publicId: stringValue(source.publicId),
      folder: stringValue(source.folder),
    };
  });
  const [error, setError] = useState('');
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const payload: Record<string, unknown> = {
        slug: form.slug || undefined,
        isActive: form.isActive === 'true',
        sortOrder: Number(form.sortOrder || 0),
      };
      if (titleTypes.includes(type)) payload.title = form.title;
      else payload.name = form.name;
      if (statusTypes.includes(type)) {
        payload.status = form.status;
        payload.isFeatured = form.isFeatured === 'true';
        payload.publishedAt = form.publishedAt ? new Date(form.publishedAt).toISOString() : undefined;
        payload.excerpt = form.excerpt || undefined;
        payload.content = form.content || undefined;
        payload.coverMediaId = form.coverMediaId ? Number(form.coverMediaId) : undefined;
        payload.seoTitle = form.seoTitle || undefined;
        payload.seoDescription = form.seoDescription || undefined;
      } else payload.description = form.description || undefined;

      if (type === 'services') Object.assign(payload, {
        serviceCategoryId: form.serviceCategoryId,
        pricing: parseJson(form.pricing),
        process: parseJson(form.process),
        warranty: form.warranty || undefined,
        faq: parseJson(form.faq),
        relatedServiceSlugs: parseJson(form.relatedServiceSlugs),
      });
      if (type === 'service-categories') Object.assign(payload, { summary: form.summary || undefined, coverMediaId: form.coverMediaId ? Number(form.coverMediaId) : undefined, isFeatured: form.isFeatured === 'true' });
      if (type === 'projects') Object.assign(payload, { clientName: form.clientName || undefined, location: form.location || undefined, startedAt: form.startedAt || undefined, completedAt: form.completedAt || undefined, tasks: parseJson(form.tasks), result: form.result || undefined, mediaIds: csvNumbers(form.mediaIds) });
      if (type === 'posts') Object.assign(payload, { categoryId: Number(form.categoryId), authorId: Number(form.authorId), tagIds: csvNumbers(form.tagIds), canonicalUrl: form.canonicalUrl || undefined });
      if (type === 'media') Object.assign(payload, { url: form.url, altText: form.altText || undefined, mimeType: form.mimeType, width: form.width ? Number(form.width) : undefined, height: form.height ? Number(form.height) : undefined, sizeBytes: form.sizeBytes ? Number(form.sizeBytes) : undefined, provider: form.provider || undefined, publicId: form.publicId || undefined, folder: form.folder || undefined });
      setError('');
      onSubmit(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Dữ liệu không hợp lệ.');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2">
        {titleTypes.includes(type) ? <Input required label="Tiêu đề" value={form.title} onChange={(e) => set('title', e.target.value)} /> : <Input required label="Tên" value={form.name} onChange={(e) => set('name', e.target.value)} />}
        {type !== 'media' && <Input label="Slug" hint="Để trống để backend tự sinh" value={form.slug} onChange={(e) => set('slug', e.target.value)} />}
      </div>

      {statusTypes.includes(type) && <div className="grid gap-4 md:grid-cols-3"><Select label="Trạng thái" value={form.status} onChange={(e) => set('status', e.target.value)} options={[{ value: 'DRAFT', label: 'Bản nháp' }, { value: 'PUBLISHED', label: 'Đã xuất bản' }, { value: 'ARCHIVED', label: 'Lưu trữ' }]} /><Select label="Nổi bật" value={form.isFeatured} onChange={(e) => set('isFeatured', e.target.value)} options={[{ value: 'false', label: 'Không' }, { value: 'true', label: 'Có' }]} /><Input type="datetime-local" label="Lịch xuất bản" value={form.publishedAt} onChange={(e) => set('publishedAt', e.target.value)} /></div>}

      {!statusTypes.includes(type) && <Select label="Hiển thị" value={form.isActive} onChange={(e) => set('isActive', e.target.value)} options={[{ value: 'true', label: 'Đang hoạt động' }, { value: 'false', label: 'Đã ẩn' }]} />}

      {statusTypes.includes(type) ? <Textarea label="Mô tả ngắn" rows={3} value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} /> : type !== 'media' && <Textarea label="Mô tả" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />}
      {statusTypes.includes(type) && <Textarea label="Nội dung HTML" rows={10} value={form.content} onChange={(e) => set('content', e.target.value)} />}

      {type === 'services' && <div className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><Input required label="ID danh mục dịch vụ" value={form.serviceCategoryId} onChange={(e) => set('serviceCategoryId', e.target.value)} /><Input type="number" label="ID ảnh đại diện" value={form.coverMediaId} onChange={(e) => set('coverMediaId', e.target.value)} /></div><Textarea label="Bảng giá JSON" hint='Ví dụ: [{"label":"Vệ sinh","price":"150.000đ"}]' value={form.pricing} onChange={(e) => set('pricing', e.target.value)} /><Textarea label="Quy trình JSON" hint='Ví dụ: ["Tiếp nhận","Khảo sát","Bàn giao"]' value={form.process} onChange={(e) => set('process', e.target.value)} /><Textarea label="Bảo hành" value={form.warranty} onChange={(e) => set('warranty', e.target.value)} /><Textarea label="FAQ JSON" value={form.faq} onChange={(e) => set('faq', e.target.value)} /><Textarea label="Slug dịch vụ liên quan JSON" value={form.relatedServiceSlugs} onChange={(e) => set('relatedServiceSlugs', e.target.value)} /></div>}
      {type === 'service-categories' && <div className="grid gap-4 md:grid-cols-2"><Input label="Tóm tắt" value={form.summary} onChange={(e) => set('summary', e.target.value)} /><Input type="number" label="ID ảnh đại diện" value={form.coverMediaId} onChange={(e) => set('coverMediaId', e.target.value)} /></div>}
      {type === 'projects' && <div className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><Input label="Khách hàng" value={form.clientName} onChange={(e) => set('clientName', e.target.value)} /><Input label="Địa điểm" value={form.location} onChange={(e) => set('location', e.target.value)} /><Input type="date" label="Ngày bắt đầu" value={form.startedAt} onChange={(e) => set('startedAt', e.target.value)} /><Input type="date" label="Ngày hoàn thành" value={form.completedAt} onChange={(e) => set('completedAt', e.target.value)} /></div><Textarea label="Nhiệm vụ JSON" value={form.tasks} onChange={(e) => set('tasks', e.target.value)} /><Textarea label="Kết quả" value={form.result} onChange={(e) => set('result', e.target.value)} /><Input label="ID album ảnh, cách nhau bằng dấu phẩy" value={form.mediaIds} onChange={(e) => set('mediaIds', e.target.value)} /></div>}
      {type === 'posts' && <div className="space-y-4"><div className="grid gap-4 md:grid-cols-3"><Input required type="number" label="ID danh mục" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} /><Input required type="number" label="ID tác giả" value={form.authorId} onChange={(e) => set('authorId', e.target.value)} /><Input label="ID thẻ, cách nhau bằng dấu phẩy" value={form.tagIds} onChange={(e) => set('tagIds', e.target.value)} /></div><Input label="Canonical URL" value={form.canonicalUrl} onChange={(e) => set('canonicalUrl', e.target.value)} /></div>}
      {type === 'media' && <div className="space-y-4"><Input required label="URL media" value={form.url} onChange={(e) => set('url', e.target.value)} /><Input label="Alt text" value={form.altText} onChange={(e) => set('altText', e.target.value)} /><div className="grid gap-4 md:grid-cols-3"><Input label="MIME type" value={form.mimeType} onChange={(e) => set('mimeType', e.target.value)} /><Input type="number" label="Chiều rộng" value={form.width} onChange={(e) => set('width', e.target.value)} /><Input type="number" label="Chiều cao" value={form.height} onChange={(e) => set('height', e.target.value)} /></div><div className="grid gap-4 md:grid-cols-3"><Input label="Provider" value={form.provider} onChange={(e) => set('provider', e.target.value)} /><Input label="Public ID" value={form.publicId} onChange={(e) => set('publicId', e.target.value)} /><Input label="Folder" value={form.folder} onChange={(e) => set('folder', e.target.value)} /></div></div>}

      {statusTypes.includes(type) && <div className="grid gap-4 md:grid-cols-2"><Input label="SEO title" value={form.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} /><Input label="SEO description" value={form.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} /></div>}

      <div className="flex justify-end gap-3 border-t border-slate-200 pt-5"><Button type="button" variant="outline" onClick={onClose}>Hủy</Button><Button type="submit" loading={saving}>{initial ? 'Lưu thay đổi' : 'Tạo nội dung'}</Button></div>
    </form>
  );
}

export default function Content() {
  const queryClient = useQueryClient();
  const [type, setType] = useState<ContentType>('services');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminContentRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [preview, setPreview] = useState<AdminContentRecord | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<AdminContentRecord | null>(null);

  const listQuery = useQuery({ queryKey: ['admin-content', type, q, status, page], queryFn: () => listContent(type, { q: q || undefined, status: status || undefined, page, limit: 15 }) });
  const items = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;
  const currentLabel = types.find((item) => item.value === type)?.label || 'Nội dung';

  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: Record<string, unknown>; id?: number | string }) => id === undefined ? createContent(type, payload) : updateContent(type, id, payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-content', type] }); setFormOpen(false); setEditing(null); },
  });
  const archiveMutation = useMutation({ mutationFn: (id: number | string) => archiveContent(type, id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-content', type] }); setArchiveTarget(null); } });

  const switchType = (next: ContentType) => { setType(next); setPage(1); setQ(''); setStatus(''); };
  const statusOptions = useMemo(() => [{ value: '', label: 'Tất cả trạng thái' }, { value: 'DRAFT', label: 'Bản nháp' }, { value: 'PUBLISHED', label: 'Đã xuất bản' }, { value: 'ARCHIVED', label: 'Lưu trữ' }], []);

  const openEdit = async (item: AdminContentRecord) => {
    const response = await getContent(type, item.id);
    setEditing(response.data);
    setFormOpen(true);
  };
  const openPreview = async (item: AdminContentRecord) => {
    const response = await previewContent(type, item.id);
    setPreview(response.data);
  };

  return (
    <div className="space-y-6 pb-10">
      <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Content Management</p><h1 className="mt-3 text-3xl font-black">Quản trị nội dung website</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">Quản lý nội dung xuất bản, slug, SEO, lịch hiển thị, quan hệ danh mục/thẻ và media tại một nơi.</p></div><Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setFormOpen(true); }}>Tạo {currentLabel.toLowerCase()}</Button></div>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"><div className="flex min-w-max gap-2">{types.map((item) => { const Icon = item.icon; return <button key={item.value} onClick={() => switchType(item.value)} className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${type === item.value ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}><Icon className="h-4 w-4" />{item.label}</button>; })}</div></div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-4 border-b border-slate-200 p-4 md:grid-cols-[1fr_220px_auto]">
          <label className="relative"><span className="sr-only">Tìm kiếm</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={`Tìm ${currentLabel.toLowerCase()}...`} className="min-h-10 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
          {statusTypes.includes(type) ? <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm font-semibold">{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <div />}
          <Button variant="outline" onClick={() => listQuery.refetch()}>Làm mới</Button>
        </div>

        {listQuery.isLoading && <div className="p-10 text-center text-sm font-semibold text-slate-500">Đang tải dữ liệu...</div>}
        {listQuery.isError && <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">Không thể tải dữ liệu. Kiểm tra backend, migration và quyền đăng nhập.</div>}
        {!listQuery.isLoading && !listQuery.isError && items.length === 0 && <div className="p-12 text-center"><h2 className="font-black text-slate-900">Chưa có dữ liệu</h2><p className="mt-2 text-sm text-slate-500">Tạo bản ghi đầu tiên hoặc thay đổi bộ lọc.</p></div>}

        {items.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[840px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Nội dung</th><th className="px-5 py-4">Slug / URL</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4">Cập nhật</th><th className="px-5 py-4 text-right">Hành động</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={String(item.id)} className="hover:bg-slate-50"><td className="px-5 py-4"><div className="flex items-center gap-3">{(item.coverUrl || item.url) ? <img src={String(item.coverUrl || item.url)} alt="" className="h-11 w-14 rounded-lg object-cover" loading="lazy" /> : <div className="flex h-11 w-14 items-center justify-center rounded-lg bg-slate-100"><FileText className="h-5 w-5 text-slate-400" /></div>}<div><strong className="block max-w-sm truncate text-slate-900">{String(item.title || item.name || `#${item.id}`)}</strong><span className="mt-1 block max-w-sm truncate text-xs text-slate-500">{String(item.excerpt || item.description || '')}</span></div></div></td><td className="px-5 py-4 font-mono text-xs text-slate-600">{String(item.slug || item.url || '—')}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${(item.status === 'PUBLISHED' || item.isActive === true) ? 'bg-emerald-50 text-emerald-700' : item.status === 'ARCHIVED' || item.isActive === false ? 'bg-slate-200 text-slate-700' : 'bg-amber-50 text-amber-700'}`}>{String(item.status || (item.isActive ? 'ACTIVE' : 'HIDDEN'))}</span></td><td className="px-5 py-4 text-xs text-slate-500">{item.updatedAt ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.updatedAt)) : '—'}</td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button title="Preview" onClick={() => openPreview(item)} className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"><Eye className="h-4 w-4" /></button><button title="Chỉnh sửa" onClick={() => openEdit(item)} className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"><Pencil className="h-4 w-4" /></button><button title="Ẩn hoặc lưu trữ" onClick={() => setArchiveTarget(item)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"><Archive className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div>}

        {meta && <div className="flex items-center justify-between border-t border-slate-200 p-4 text-sm"><span className="text-slate-500">Tổng {meta.total} bản ghi</span><div className="flex items-center gap-3"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Trước</Button><span className="font-semibold">{meta.page}/{Math.max(meta.totalPages, 1)}</span><Button size="sm" variant="outline" disabled={page >= meta.totalPages} onClick={() => setPage((value) => value + 1)}>Sau</Button></div></div>}
      </section>

      {formOpen && <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/55 backdrop-blur-sm"><button aria-label="Đóng form" className="absolute inset-0" onClick={() => setFormOpen(false)} /><aside role="dialog" aria-modal="true" aria-label={editing ? 'Chỉnh sửa nội dung' : 'Tạo nội dung'} className="relative h-full w-full max-w-3xl overflow-y-auto bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 p-5 backdrop-blur"><div><p className="text-xs font-black uppercase tracking-wider text-blue-600">{currentLabel}</p><h2 className="mt-1 text-xl font-black text-slate-950">{editing ? 'Chỉnh sửa nội dung' : 'Tạo nội dung mới'}</h2></div><button onClick={() => setFormOpen(false)} className="rounded-xl p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="p-5 sm:p-7"><ContentForm key={`${type}-${String(editing?.id || 'new')}`} type={type} initial={editing || undefined} saving={saveMutation.isPending} onClose={() => setFormOpen(false)} onSubmit={(payload) => saveMutation.mutate({ payload, id: editing?.id })} />{saveMutation.isError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">Không thể lưu. Slug có thể đã tồn tại hoặc dữ liệu quan hệ chưa hợp lệ.</p>}</div></aside></div>}

      {preview && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><button aria-label="Đóng preview" className="absolute inset-0" onClick={() => setPreview(null)} /><section role="dialog" aria-modal="true" className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b p-5"><div><p className="text-xs font-black uppercase tracking-wider text-blue-600">Preview quản trị</p><h2 className="mt-1 text-xl font-black">{String(preview.title || preview.name || `#${preview.id}`)}</h2></div><button onClick={() => setPreview(null)} className="rounded-xl p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="p-6">{(preview.coverUrl || preview.url) && <img src={String(preview.coverUrl || preview.url)} alt="" className="mb-6 max-h-80 w-full rounded-2xl object-cover" />}<p className="text-sm leading-7 text-slate-600">{String(preview.excerpt || preview.description || '')}</p>{preview.content && <div className="prose prose-slate mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: String(preview.content) }} />}<details className="mt-8"><summary className="cursor-pointer font-bold text-slate-700">Xem dữ liệu JSON</summary><pre className="mt-3 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-cyan-100">{JSON.stringify(preview, null, 2)}</pre></details></div></section></div>}

      {archiveTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><button aria-label="Đóng xác nhận" className="absolute inset-0" onClick={() => setArchiveTarget(null)} /><section role="alertdialog" aria-modal="true" className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-black text-slate-950">Ẩn hoặc lưu trữ nội dung?</h2><p className="mt-3 text-sm leading-6 text-slate-600">Bản ghi “{String(archiveTarget.title || archiveTarget.name || archiveTarget.id)}” sẽ không còn hiển thị công khai. Dữ liệu không bị xóa vật lý.</p><div className="mt-6 flex justify-end gap-3"><Button variant="outline" onClick={() => setArchiveTarget(null)}>Hủy</Button><Button variant="danger" loading={archiveMutation.isPending} onClick={() => archiveMutation.mutate(archiveTarget.id)}>Xác nhận</Button></div></section></div>}
    </div>
  );
}
