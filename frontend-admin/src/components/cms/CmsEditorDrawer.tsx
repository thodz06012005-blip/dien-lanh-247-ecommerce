import { AlertCircle, Check, FileText, Image as ImageIcon, Search, Settings2, Sparkles, X } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { cmsMeta } from '@/config/cmsContentTypes';
import type { CmsContentType, CmsRecord } from '@/services/cmsApi';
import MediaLibrary from './MediaLibrary';
import RichContentEditor from './RichContentEditor';

interface CmsEditorDrawerProps {
  type: CmsContentType;
  initial?: CmsRecord | null;
  saving: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<void> | void;
}

type EditorTab = 'content' | 'media' | 'seo' | 'settings';
type FormState = Record<string, string>;
const inputClass = 'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-blue-100';

function asText(value: unknown) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function initialState(record?: CmsRecord | null): FormState {
  const source: CmsRecord = record ?? { id: '' };
  const album = Array.isArray(source.album) ? source.album as CmsRecord[] : [];
  const tags = Array.isArray(source.tags) ? source.tags as CmsRecord[] : [];
  const fields = [
    'title','name','displayName','customerName','slug','sectionKey','eyebrow','excerpt','summary','subtitle',
    'content','description','warranty','quote','bio','result','pricing','process','faq','tasks','config',
    'socialLinks','relatedServiceSlugs','serviceCategoryId','categoryId','authorId','userId','serviceId',
    'coverMediaId','socialImageMediaId','desktopMediaId','mobileMediaId','logoMediaId','avatarMediaId',
    'clientName','location','customerTitle','company','roleTitle','startedAt','completedAt','startsAt','endsAt',
    'seoTitle','seoDescription','canonicalUrl','ctaLabel','ctaUrl','secondaryCtaLabel','secondaryCtaUrl',
    'websiteUrl','placement','theme','url','altText','mimeType','folder',
  ];
  const state: FormState = {};
  for (const field of fields) state[field] = asText(source[field]);
  state.roleTitle = asText(source.roleTitle || source.title);
  state.mediaIds = album.length ? album.map((item) => item.id).join(',') : asText(source.mediaIds);
  state.tagIds = tags.length ? tags.map((item) => item.id).join(',') : asText(source.tagIds);
  state.isFeatured = asText(source.isFeatured ?? false);
  state.isActive = asText(source.isActive ?? true);
  state.sortOrder = asText(source.sortOrder ?? 0);
  state.rating = asText(source.rating ?? 5);
  state.placement ||= 'HOME_HERO';
  state.theme ||= 'DARK';
  state.mimeType ||= 'image/jpeg';
  state.startedAt = state.startedAt.slice(0, 10);
  state.completedAt = state.completedAt.slice(0, 10);
  state.startsAt = state.startsAt.slice(0, 16);
  state.endsAt = state.endsAt.slice(0, 16);
  return state;
}

function parseJson(value: string, label: string) {
  if (!value.trim()) return undefined;
  try { return JSON.parse(value) as unknown; } catch { throw new Error(`${label} chưa đúng định dạng JSON.`); }
}
function parseIds(value: string) { return value.split(',').map((item) => Number(item.trim())).filter((item) => Number.isInteger(item) && item > 0); }
function numberValue(value: string) { const parsed = Number(value); return value.trim() && Number.isFinite(parsed) ? parsed : undefined; }
function dateValue(value: string) { return value ? new Date(value).toISOString() : undefined; }

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: ReactNode }) {
  return <label className="block space-y-2"><span className="text-xs font-black uppercase tracking-wider text-slate-500">{label}{required && <span className="ml-1 text-red-500">*</span>}</span>{children}{hint && <span className="block text-[11px] leading-5 text-slate-400">{hint}</span>}</label>;
}
function Input({ value, onChange, type = 'text', placeholder }: { value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={inputClass} />;
}
function Textarea({ value, onChange, rows = 4, placeholder }: { value: string; onChange: (value: string) => void; rows?: number; placeholder?: string }) {
  return <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} placeholder={placeholder} className={`${inputClass} resize-y py-3 leading-6`} />;
}
function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
}

export default function CmsEditorDrawer({ type, initial, saving, error, onClose, onSave }: CmsEditorDrawerProps) {
  const meta = cmsMeta(type);
  const [form, setForm] = useState<FormState>(() => initialState(initial));
  const [tab, setTab] = useState<EditorTab>('content');
  const [localError, setLocalError] = useState<string | null>(null);
  const original = useMemo(() => initialState(initial), [initial]);
  const dirty = JSON.stringify(form) !== JSON.stringify(original);
  useUnsavedChanges(dirty && !saving);
  const setField = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const validate = () => {
    if (['services','projects','posts','banners'].includes(type) && !form.title.trim()) throw new Error('Tiêu đề là bắt buộc.');
    if (['service-categories','categories','tags','partners'].includes(type) && !form.name.trim()) throw new Error('Tên là bắt buộc.');
    if (type === 'services' && !form.serviceCategoryId.trim()) throw new Error('Dịch vụ phải thuộc danh mục.');
    if (type === 'posts' && (!numberValue(form.categoryId) || !numberValue(form.authorId))) throw new Error('Bài viết cần danh mục và tác giả.');
    if (type === 'testimonials' && (!form.customerName.trim() || !form.quote.trim())) throw new Error('Tên khách hàng và nội dung đánh giá là bắt buộc.');
    if (type === 'site-sections' && (!form.sectionKey.trim() || !form.name.trim())) throw new Error('Mã khu vực và tên quản trị là bắt buộc.');
    if (type === 'authors' && (!numberValue(form.userId) || !form.displayName.trim())) throw new Error('Hồ sơ tác giả cần user ID và tên hiển thị.');
  };

  const buildPayload = () => {
    validate();
    const payload: Record<string, unknown> = {
      slug: form.slug.trim() || undefined,
      isActive: form.isActive === 'true',
      isFeatured: form.isFeatured === 'true',
      sortOrder: numberValue(form.sortOrder) ?? 0,
    };
    if (['services','projects','posts','banners'].includes(type)) payload.title = form.title.trim();
    if (['service-categories','categories','tags','partners'].includes(type)) payload.name = form.name.trim();
    if (['services','projects','posts'].includes(type)) Object.assign(payload, { excerpt: form.excerpt || undefined, content: form.content || undefined, coverMediaId: numberValue(form.coverMediaId), socialImageMediaId: numberValue(form.socialImageMediaId), seoTitle: form.seoTitle || undefined, seoDescription: form.seoDescription || undefined });
    if (type === 'services') Object.assign(payload, { serviceCategoryId: form.serviceCategoryId, pricing: parseJson(form.pricing, 'Bảng giá'), process: parseJson(form.process, 'Quy trình'), warranty: form.warranty || undefined, faq: parseJson(form.faq, 'FAQ'), relatedServiceSlugs: parseJson(form.relatedServiceSlugs, 'Dịch vụ liên quan') });
    if (type === 'service-categories') Object.assign(payload, { summary: form.summary || undefined, description: form.description || undefined, coverMediaId: numberValue(form.coverMediaId), socialImageMediaId: numberValue(form.socialImageMediaId), seoTitle: form.seoTitle || undefined, seoDescription: form.seoDescription || undefined });
    if (type === 'projects') Object.assign(payload, { clientName: form.clientName || undefined, location: form.location || undefined, startedAt: form.startedAt || undefined, completedAt: form.completedAt || undefined, tasks: parseJson(form.tasks, 'Nhiệm vụ'), result: form.result || undefined, mediaIds: parseIds(form.mediaIds) });
    if (type === 'posts') Object.assign(payload, { categoryId: numberValue(form.categoryId), authorId: numberValue(form.authorId), tagIds: parseIds(form.tagIds), canonicalUrl: form.canonicalUrl || undefined });
    if (['categories','tags'].includes(type)) Object.assign(payload, { description: form.description || undefined, seoTitle: form.seoTitle || undefined, seoDescription: form.seoDescription || undefined, socialImageMediaId: numberValue(form.socialImageMediaId) });
    if (type === 'banners') Object.assign(payload, { name: form.name || form.title, eyebrow: form.eyebrow || undefined, subtitle: form.subtitle || undefined, ctaLabel: form.ctaLabel || undefined, ctaUrl: form.ctaUrl || undefined, secondaryCtaLabel: form.secondaryCtaLabel || undefined, secondaryCtaUrl: form.secondaryCtaUrl || undefined, placement: form.placement, theme: form.theme, desktopMediaId: numberValue(form.desktopMediaId), mobileMediaId: numberValue(form.mobileMediaId), startsAt: dateValue(form.startsAt), endsAt: dateValue(form.endsAt) });
    if (type === 'partners') Object.assign(payload, { description: form.description || undefined, websiteUrl: form.websiteUrl || undefined, logoMediaId: numberValue(form.logoMediaId) });
    if (type === 'testimonials') Object.assign(payload, { customerName: form.customerName, customerTitle: form.customerTitle || undefined, company: form.company || undefined, quote: form.quote, rating: numberValue(form.rating) ?? 5, avatarMediaId: numberValue(form.avatarMediaId), serviceId: numberValue(form.serviceId) });
    if (type === 'site-sections') Object.assign(payload, { sectionKey: form.sectionKey.toUpperCase(), name: form.name, eyebrow: form.eyebrow || undefined, title: form.title || undefined, content: form.content || undefined, config: parseJson(form.config, 'Cấu hình khu vực'), socialImageMediaId: numberValue(form.socialImageMediaId), seoTitle: form.seoTitle || undefined, seoDescription: form.seoDescription || undefined, canonicalUrl: form.canonicalUrl || undefined });
    if (type === 'authors') Object.assign(payload, { userId: numberValue(form.userId), displayName: form.displayName, roleTitle: form.roleTitle || undefined, bio: form.bio || undefined, avatarMediaId: numberValue(form.avatarMediaId), socialLinks: parseJson(form.socialLinks, 'Mạng xã hội') });
    if (type === 'media') Object.assign(payload, { name: form.name || 'Media', url: form.url, altText: form.altText || undefined, mimeType: form.mimeType || 'image/jpeg', folder: form.folder || undefined });
    return payload;
  };

  const submit = async () => {
    try { setLocalError(null); await onSave(buildPayload()); }
    catch (caught) { setLocalError(caught instanceof Error ? caught.message : 'Dữ liệu chưa hợp lệ.'); }
  };

  const tabs: Array<{ key: EditorTab; label: string; icon: typeof FileText }> = [
    { key: 'content', label: 'Nội dung', icon: FileText },
    { key: 'media', label: 'Media & liên kết', icon: ImageIcon },
    { key: 'seo', label: 'SEO', icon: Search },
    { key: 'settings', label: 'Hiển thị', icon: Settings2 },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Biên tập ${meta.singular}`}>
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Đóng" />
      <section className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden bg-[#F5F7FB] shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-7"><div><div className="flex gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-primary-700">{initial ? `VERSION ${initial.version || 1}` : 'DRAFT MỚI'}</span>{dirty && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700">CHƯA LƯU</span>}</div><h2 className="mt-2 text-xl font-black text-slate-950">{initial ? `Chỉnh sửa ${meta.singular}` : `Tạo ${meta.singular}`}</h2></div><button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100" aria-label="Đóng"><X className="h-5 w-5" /></button></header>
        <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 sm:px-7">{tabs.map((item) => <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`inline-flex min-h-12 items-center gap-2 border-b-2 px-3 text-xs font-black ${tab === item.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500'}`}><item.icon className="h-4 w-4" />{item.label}</button>)}</nav>
        <div className="flex-1 overflow-y-auto p-4 sm:p-7">
          {(localError || error) && <div className="mb-5 flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{localError || error}</div>}
          {tab === 'content' && <div className="space-y-6">
            <section className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-7">
              {['services','projects','posts','banners'].includes(type) && <Field label="Tiêu đề" required><Input value={form.title} onChange={(value) => setField('title', value)} /></Field>}
              {['service-categories','categories','tags','partners','site-sections','media'].includes(type) && <Field label="Tên quản trị" required={type !== 'media'}><Input value={form.name} onChange={(value) => setField('name', value)} /></Field>}
              {type === 'authors' && <><Field label="Tên hiển thị" required><Input value={form.displayName} onChange={(value) => setField('displayName', value)} /></Field><Field label="User ID" required><Input type="number" value={form.userId} onChange={(value) => setField('userId', value)} /></Field></>}
              {type === 'testimonials' && <Field label="Tên khách hàng" required><Input value={form.customerName} onChange={(value) => setField('customerName', value)} /></Field>}
              {type === 'site-sections' && <Field label="Mã khu vực" required hint="HOME_ABOUT, CONTACT hoặc FOOTER"><Input value={form.sectionKey} onChange={(value) => setField('sectionKey', value.toUpperCase())} /></Field>}
              {['services','projects','posts','service-categories','categories','tags'].includes(type) && <Field label="Slug"><Input value={form.slug} onChange={(value) => setField('slug', value)} /></Field>}
              {['services','projects','posts'].includes(type) && <Field label="Mô tả ngắn"><Textarea value={form.excerpt} onChange={(value) => setField('excerpt', value)} /></Field>}
              {type === 'service-categories' && <Field label="Tóm tắt"><Textarea value={form.summary} onChange={(value) => setField('summary', value)} /></Field>}
            </section>
            {['services','projects','posts','site-sections'].includes(type) && <RichContentEditor value={form.content} onChange={(value) => setField('content', value)} />}
            {type === 'services' && <section className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 sm:grid-cols-2"><Field label="ID danh mục" required><Input value={form.serviceCategoryId} onChange={(value) => setField('serviceCategoryId', value)} /></Field><Field label="Bảng giá JSON"><Textarea value={form.pricing} onChange={(value) => setField('pricing', value)} /></Field><Field label="Quy trình JSON"><Textarea value={form.process} onChange={(value) => setField('process', value)} /></Field><Field label="Chính sách bảo hành"><Textarea value={form.warranty} onChange={(value) => setField('warranty', value)} /></Field><Field label="FAQ JSON"><Textarea value={form.faq} onChange={(value) => setField('faq', value)} /></Field><Field label="Dịch vụ liên quan JSON"><Textarea value={form.relatedServiceSlugs} onChange={(value) => setField('relatedServiceSlugs', value)} /></Field></section>}
            {type === 'projects' && <section className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 sm:grid-cols-2"><Field label="Khách hàng"><Input value={form.clientName} onChange={(value) => setField('clientName', value)} /></Field><Field label="Địa điểm"><Input value={form.location} onChange={(value) => setField('location', value)} /></Field><Field label="Nhiệm vụ JSON"><Textarea value={form.tasks} onChange={(value) => setField('tasks', value)} /></Field><Field label="Kết quả"><Textarea value={form.result} onChange={(value) => setField('result', value)} /></Field></section>}
            {type === 'posts' && <section className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 sm:grid-cols-3"><Field label="Category ID" required><Input type="number" value={form.categoryId} onChange={(value) => setField('categoryId', value)} /></Field><Field label="Author ID" required><Input type="number" value={form.authorId} onChange={(value) => setField('authorId', value)} /></Field><Field label="Tag IDs"><Input value={form.tagIds} onChange={(value) => setField('tagIds', value)} /></Field></section>}
            {['service-categories','categories','tags','partners'].includes(type) && <section className="rounded-[2rem] border border-slate-200 bg-white p-5"><Field label="Mô tả"><Textarea value={form.description} onChange={(value) => setField('description', value)} rows={6} /></Field></section>}
            {type === 'banners' && <section className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 sm:grid-cols-2"><Field label="Tên quản trị"><Input value={form.name} onChange={(value) => setField('name', value)} /></Field><Field label="Eyebrow"><Input value={form.eyebrow} onChange={(value) => setField('eyebrow', value)} /></Field><Field label="Mô tả"><Textarea value={form.subtitle} onChange={(value) => setField('subtitle', value)} /></Field><Field label="Vị trí"><Select value={form.placement} onChange={(value) => setField('placement', value)} options={[{value:'HOME_HERO',label:'Hero trang chủ'},{value:'HOME_MIDDLE',label:'Giữa trang chủ'},{value:'SERVICE_TOP',label:'Đầu trang dịch vụ'}]} /></Field><Field label="CTA"><Input value={form.ctaLabel} onChange={(value) => setField('ctaLabel', value)} /></Field><Field label="URL CTA"><Input value={form.ctaUrl} onChange={(value) => setField('ctaUrl', value)} /></Field></section>}
            {type === 'testimonials' && <section className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 sm:grid-cols-2"><Field label="Chức danh"><Input value={form.customerTitle} onChange={(value) => setField('customerTitle', value)} /></Field><Field label="Công ty"><Input value={form.company} onChange={(value) => setField('company', value)} /></Field><Field label="Đánh giá" required><Textarea value={form.quote} onChange={(value) => setField('quote', value)} /></Field><Field label="Số sao"><Input type="number" value={form.rating} onChange={(value) => setField('rating', value)} /></Field></section>}
            {type === 'site-sections' && <section className="rounded-[2rem] border border-slate-200 bg-white p-5"><Field label="Cấu hình JSON"><Textarea value={form.config} onChange={(value) => setField('config', value)} rows={8} /></Field></section>}
            {type === 'authors' && <section className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 sm:grid-cols-2"><Field label="Chức danh"><Input value={form.roleTitle} onChange={(value) => setField('roleTitle', value)} /></Field><Field label="Tiểu sử"><Textarea value={form.bio} onChange={(value) => setField('bio', value)} /></Field><Field label="Mạng xã hội JSON"><Textarea value={form.socialLinks} onChange={(value) => setField('socialLinks', value)} /></Field></section>}
          </div>}
          {tab === 'media' && <div className="space-y-6"><MediaLibrary selectedId={numberValue(form.coverMediaId) || numberValue(form.desktopMediaId) || numberValue(form.logoMediaId) || numberValue(form.avatarMediaId)} onSelect={(media) => { const field = type === 'banners' ? 'desktopMediaId' : type === 'partners' ? 'logoMediaId' : ['testimonials','authors'].includes(type) ? 'avatarMediaId' : 'coverMediaId'; setField(field, String(media.id)); }} /><section className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 sm:grid-cols-2"><Field label="Cover Media ID"><Input type="number" value={form.coverMediaId} onChange={(value) => setField('coverMediaId', value)} /></Field><Field label="Social Image Media ID"><Input type="number" value={form.socialImageMediaId} onChange={(value) => setField('socialImageMediaId', value)} /></Field><Field label="Album Media IDs"><Input value={form.mediaIds} onChange={(value) => setField('mediaIds', value)} /></Field></section></div>}
          {tab === 'seo' && <section className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-5"><div className="rounded-2xl bg-blue-50 p-4"><p className="flex items-center gap-2 text-sm font-black text-blue-900"><Sparkles className="h-4 w-4" />SEO preview</p><p className="mt-2 text-lg font-bold text-blue-700">{form.seoTitle || form.title || form.name || 'Tiêu đề trang'}</p><p className="mt-1 text-sm text-slate-600">{form.seoDescription || form.excerpt || form.description || 'Mô tả SEO'}</p></div><Field label="SEO title"><Input value={form.seoTitle} onChange={(value) => setField('seoTitle', value)} /></Field><Field label="Meta description"><Textarea value={form.seoDescription} onChange={(value) => setField('seoDescription', value)} /></Field><Field label="Canonical URL"><Input value={form.canonicalUrl} onChange={(value) => setField('canonicalUrl', value)} /></Field><Field label="Social Image Media ID"><Input type="number" value={form.socialImageMediaId} onChange={(value) => setField('socialImageMediaId', value)} /></Field></section>}
          {tab === 'settings' && <section className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 sm:grid-cols-3"><Field label="Hiển thị"><Select value={form.isActive} onChange={(value) => setField('isActive', value)} options={[{value:'true',label:'Đang hoạt động'},{value:'false',label:'Tạm ẩn'}]} /></Field><Field label="Nổi bật"><Select value={form.isFeatured} onChange={(value) => setField('isFeatured', value)} options={[{value:'false',label:'Bình thường'},{value:'true',label:'Nổi bật'}]} /></Field><Field label="Thứ tự"><Input type="number" value={form.sortOrder} onChange={(value) => setField('sortOrder', value)} /></Field><Field label="Bắt đầu"><Input type="datetime-local" value={form.startsAt} onChange={(value) => setField('startsAt', value)} /></Field><Field label="Kết thúc"><Input type="datetime-local" value={form.endsAt} onChange={(value) => setField('endsAt', value)} /></Field></section>}
        </div>
        <footer className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4"><button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-600">Hủy</button><button type="button" onClick={() => void submit()} disabled={saving || !dirty} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 text-sm font-black text-white disabled:opacity-50">{saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Check className="h-4 w-4" />}{saving ? 'Đang lưu...' : 'Lưu nội dung'}</button></footer>
      </section>
    </div>
  );
}
