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

const inputClass = 'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400';

function asText(value: unknown) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function initialState(record?: CmsRecord | null): FormState {
  const source = record || {};
  const album = Array.isArray(source.album) ? source.album as CmsRecord[] : [];
  const tags = Array.isArray(source.tags) ? source.tags as CmsRecord[] : [];
  return {
    title: asText(source.title),
    name: asText(source.name),
    displayName: asText(source.displayName),
    customerName: asText(source.customerName),
    slug: asText(source.slug),
    sectionKey: asText(source.sectionKey),
    eyebrow: asText(source.eyebrow),
    excerpt: asText(source.excerpt),
    summary: asText(source.summary),
    subtitle: asText(source.subtitle),
    content: asText(source.content),
    description: asText(source.description),
    warranty: asText(source.warranty),
    quote: asText(source.quote),
    bio: asText(source.bio),
    result: asText(source.result),
    pricing: asText(source.pricing),
    process: asText(source.process),
    faq: asText(source.faq),
    tasks: asText(source.tasks),
    config: asText(source.config),
    socialLinks: asText(source.socialLinks),
    relatedServiceSlugs: asText(source.relatedServiceSlugs),
    serviceCategoryId: asText(source.serviceCategoryId),
    categoryId: asText(source.categoryId),
    authorId: asText(source.authorId),
    userId: asText(source.userId),
    serviceId: asText(source.serviceId),
    coverMediaId: asText(source.coverMediaId),
    socialImageMediaId: asText(source.socialImageMediaId),
    desktopMediaId: asText(source.desktopMediaId),
    mobileMediaId: asText(source.mobileMediaId),
    logoMediaId: asText(source.logoMediaId),
    avatarMediaId: asText(source.avatarMediaId),
    mediaIds: album.length ? album.map((item) => item.id).join(',') : asText(source.mediaIds),
    tagIds: tags.length ? tags.map((item) => item.id).join(',') : asText(source.tagIds),
    clientName: asText(source.clientName),
    location: asText(source.location),
    customerTitle: asText(source.customerTitle),
    company: asText(source.company),
    roleTitle: asText(source.roleTitle || source.title),
    startedAt: asText(source.startedAt).slice(0, 10),
    completedAt: asText(source.completedAt).slice(0, 10),
    startsAt: asText(source.startsAt).slice(0, 16),
    endsAt: asText(source.endsAt).slice(0, 16),
    isFeatured: asText(source.isFeatured ?? false),
    isActive: asText(source.isActive ?? true),
    sortOrder: asText(source.sortOrder ?? 0),
    rating: asText(source.rating ?? 5),
    seoTitle: asText(source.seoTitle),
    seoDescription: asText(source.seoDescription),
    canonicalUrl: asText(source.canonicalUrl),
    ctaLabel: asText(source.ctaLabel),
    ctaUrl: asText(source.ctaUrl),
    secondaryCtaLabel: asText(source.secondaryCtaLabel),
    secondaryCtaUrl: asText(source.secondaryCtaUrl),
    websiteUrl: asText(source.websiteUrl),
    placement: asText(source.placement || 'HOME_HERO'),
    theme: asText(source.theme || 'DARK'),
    url: asText(source.url),
    altText: asText(source.altText),
    mimeType: asText(source.mimeType || 'image/jpeg'),
    folder: asText(source.folder),
  };
}

function parseJson(value: string, label: string) {
  if (!value.trim()) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${label} chưa đúng định dạng JSON.`);
  }
}

function parseIds(value: string) {
  return value.split(',').map((item) => Number(item.trim())).filter((item) => Number.isInteger(item) && item > 0);
}

function numberOrUndefined(value: string) {
  const number = Number(value);
  return value.trim() && Number.isFinite(number) ? number : undefined;
}

function dateOrUndefined(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

function Field({ label, hint, children, required }: { label: string; hint?: string; children: ReactNode; required?: boolean }) {
  return <label className="block space-y-2"><span className="text-xs font-black uppercase tracking-wider text-slate-500">{label}{required && <span className="ml-1 text-red-500">*</span>}</span>{children}{hint && <span className="block text-[11px] leading-5 text-slate-400">{hint}</span>}</label>;
}

function Input({ value, onChange, type = 'text', placeholder, disabled }: { value: string; onChange: (value: string) => void; type?: string; placeholder?: string; disabled?: boolean }) {
  return <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} disabled={disabled} className={inputClass} />;
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

  const chooseMedia = (field: string, id: number | string) => setField(field, String(id));
  const appendMedia = (id: number | string) => {
    const values = new Set(parseIds(form.mediaIds));
    values.add(Number(id));
    setField('mediaIds', [...values].join(','));
  };

  const validate = () => {
    if (['services', 'projects', 'posts', 'banners'].includes(type) && !form.title.trim()) throw new Error('Tiêu đề là bắt buộc.');
    if (['service-categories', 'categories', 'tags', 'partners'].includes(type) && !form.name.trim()) throw new Error('Tên là bắt buộc.');
    if (type === 'services' && !form.serviceCategoryId.trim()) throw new Error('Dịch vụ phải thuộc một danh mục.');
    if (type === 'posts' && (!numberOrUndefined(form.categoryId) || !numberOrUndefined(form.authorId))) throw new Error('Bài viết cần danh mục và tác giả.');
    if (type === 'testimonials' && (!form.customerName.trim() || !form.quote.trim())) throw new Error('Tên khách hàng và nội dung đánh giá là bắt buộc.');
    if (type === 'site-sections' && (!form.sectionKey.trim() || !form.name.trim())) throw new Error('Mã khu vực và tên quản trị là bắt buộc.');
    if (type === 'authors' && (!numberOrUndefined(form.userId) || !form.displayName.trim())) throw new Error('Hồ sơ tác giả cần user ID và tên hiển thị.');
    if (type === 'media' && !form.url.trim() && !initial) throw new Error('Media tạo thủ công cần URL; sử dụng tab Media để tải file trực tiếp.');
  };

  const payload = () => {
    validate();
    const common: Record<string, unknown> = {
      slug: form.slug.trim() || undefined,
      isActive: form.isActive === 'true',
      isFeatured: form.isFeatured === 'true',
      sortOrder: numberOrUndefined(form.sortOrder) ?? 0,
    };
    if (['services', 'projects', 'posts', 'banners'].includes(type)) common.title = form.title.trim();
    if (['service-categories', 'categories', 'tags', 'partners'].includes(type)) common.name = form.name.trim();

    if (['services', 'projects', 'posts'].includes(type)) Object.assign(common, {
      excerpt: form.excerpt.trim() || undefined,
      content: form.content || undefined,
      coverMediaId: numberOrUndefined(form.coverMediaId),
      socialImageMediaId: numberOrUndefined(form.socialImageMediaId),
      seoTitle: form.seoTitle.trim() || undefined,
      seoDescription: form.seoDescription.trim() || undefined,
    });
    if (type === 'services') Object.assign(common, {
      serviceCategoryId: form.serviceCategoryId.trim(),
      pricing: parseJson(form.pricing, 'Bảng giá'),
      process: parseJson(form.process, 'Quy trình'),
      warranty: form.warranty || undefined,
      faq: parseJson(form.faq, 'FAQ'),
      relatedServiceSlugs: parseJson(form.relatedServiceSlugs, 'Dịch vụ liên quan'),
    });
    if (type === 'service-categories') Object.assign(common, {
      summary: form.summary.trim() || undefined,
      description: form.description || undefined,
      coverMediaId: numberOrUndefined(form.coverMediaId),
      socialImageMediaId: numberOrUndefined(form.socialImageMediaId),
      seoTitle: form.seoTitle.trim() || undefined,
      seoDescription: form.seoDescription.trim() || undefined,
    });
    if (type === 'projects') Object.assign(common, {
      clientName: form.clientName.trim() || undefined,
      location: form.location.trim() || undefined,
      startedAt: form.startedAt || undefined,
      completedAt: form.completedAt || undefined,
      tasks: parseJson(form.tasks, 'Danh sách nhiệm vụ'),
      result: form.result || undefined,
      mediaIds: parseIds(form.mediaIds),
    });
    if (type === 'posts') Object.assign(common, {
      categoryId: numberOrUndefined(form.categoryId),
      authorId: numberOrUndefined(form.authorId),
      tagIds: parseIds(form.tagIds),
      canonicalUrl: form.canonicalUrl.trim() || undefined,
    });
    if (['categories', 'tags'].includes(type)) Object.assign(common, {
      description: form.description || undefined,
      seoTitle: form.seoTitle.trim() || undefined,
      seoDescription: form.seoDescription.trim() || undefined,
      socialImageMediaId: numberOrUndefined(form.socialImageMediaId),
    });
    if (type === 'banners') Object.assign(common, {
      name: form.name.trim() || form.title.trim(),
      eyebrow: form.eyebrow.trim() || undefined,
      subtitle: form.subtitle || undefined,
      ctaLabel: form.ctaLabel.trim() || undefined,
      ctaUrl: form.ctaUrl.trim() || undefined,
      secondaryCtaLabel: form.secondaryCtaLabel.trim() || undefined,
      secondaryCtaUrl: form.secondaryCtaUrl.trim() || undefined,
      placement: form.placement,
      theme: form.theme,
      desktopMediaId: numberOrUndefined(form.desktopMediaId),
      mobileMediaId: numberOrUndefined(form.mobileMediaId),
      startsAt: dateOrUndefined(form.startsAt),
      endsAt: dateOrUndefined(form.endsAt),
    });
    if (type === 'partners') Object.assign(common, {
      description: form.description || undefined,
      websiteUrl: form.websiteUrl.trim() || undefined,
      logoMediaId: numberOrUndefined(form.logoMediaId),
    });
    if (type === 'testimonials') Object.assign(common, {
      customerName: form.customerName.trim(),
      customerTitle: form.customerTitle.trim() || undefined,
      company: form.company.trim() || undefined,
      quote: form.quote.trim(),
      rating: numberOrUndefined(form.rating) ?? 5,
      avatarMediaId: numberOrUndefined(form.avatarMediaId),
      serviceId: numberOrUndefined(form.serviceId),
    });
    if (type === 'site-sections') Object.assign(common, {
      sectionKey: form.sectionKey.trim().toUpperCase(),
      name: form.name.trim(),
      eyebrow: form.eyebrow.trim() || undefined,
      title: form.title.trim() || undefined,
      content: form.content || undefined,
      config: parseJson(form.config, 'Cấu hình khu vực'),
      socialImageMediaId: numberOrUndefined(form.socialImageMediaId),
      seoTitle: form.seoTitle.trim() || undefined,
      seoDescription: form.seoDescription.trim() || undefined,
      canonicalUrl: form.canonicalUrl.trim() || undefined,
    });
    if (type === 'authors') Object.assign(common, {
      userId: numberOrUndefined(form.userId),
      displayName: form.displayName.trim(),
      roleTitle: form.roleTitle.trim() || undefined,
      bio: form.bio || undefined,
      avatarMediaId: numberOrUndefined(form.avatarMediaId),
      socialLinks: parseJson(form.socialLinks, 'Liên kết mạng xã hội'),
    });
    if (type === 'media') Object.assign(common, {
      name: form.name.trim() || 'Media',
      url: form.url.trim(),
      altText: form.altText.trim() || undefined,
      mimeType: form.mimeType.trim() || 'image/jpeg',
      folder: form.folder.trim() || undefined,
    });
    return common;
  };

  const submit = async () => {
    try {
      setLocalError(null);
      await onSave(payload());
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'Dữ liệu chưa hợp lệ.');
    }
  };

  const tabs: Array<{ key: EditorTab; label: string; icon: typeof FileText }> = [
    { key: 'content', label: 'Nội dung', icon: FileText },
    { key: 'media', label: 'Media & liên kết', icon: ImageIcon },
    { key: 'seo', label: 'SEO', icon: Search },
    { key: 'settings', label: 'Hiển thị', icon: Settings2 },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Biên tập ${meta.singular}`}>
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Đóng trình biên tập" />
      <section className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden bg-[#F5F7FB] shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
          <div className="min-w-0"><div className="flex items-center gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary-700">{initial ? `Phiên bản ${initial.version || 1}` : 'Bản nháp mới'}</span>{dirty && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">Chưa lưu</span>}</div><h2 className="mt-2 truncate text-xl font-black text-slate-950">{initial ? `Chỉnh sửa ${meta.singular}` : `Tạo ${meta.singular}`}</h2><p className="mt-1 truncate text-xs text-slate-500">{meta.description}</p></div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100" aria-label="Đóng"><X className="h-5 w-5" /></button>
        </header>

        <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 sm:px-7" aria-label="Các phần biên tập">
          {tabs.map((item) => <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`inline-flex min-h-12 items-center gap-2 border-b-2 px-3 text-xs font-black whitespace-nowrap ${tab === item.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}><item.icon className="h-4 w-4" />{item.label}</button>)}
        </nav>

        <div className="flex-1 overflow-y-auto p-4 sm:p-7">
          {(localError || error) && <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{localError || error}</div>}

          {tab === 'content' && (
            <div className="space-y-6">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="grid gap-5 sm:grid-cols-2">
                  {['services','projects','posts','banners'].includes(type) && <Field label="Tiêu đề" required><Input value={form.title} onChange={(value) => setField('title', value)} placeholder="Tiêu đề hiển thị" /></Field>}
                  {['service-categories','categories','tags','partners','site-sections','media'].includes(type) && <Field label="Tên quản trị" required={type !== 'media'}><Input value={form.name} onChange={(value) => setField('name', value)} placeholder="Tên dùng trong CMS" /></Field>}
                  {type === 'authors' && <><Field label="Tên hiển thị" required><Input value={form.displayName} onChange={(value) => setField('displayName', value)} /></Field><Field label="User ID" required><Input type="number" value={form.userId} onChange={(value) => setField('userId', value)} /></Field></>}
                  {type === 'testimonials' && <Field label="Tên khách hàng" required><Input value={form.customerName} onChange={(value) => setField('customerName', value)} /></Field>}
                  {type === 'site-sections' && <Field label="Mã khu vực" required hint="Ví dụ HOME_ABOUT, CONTACT hoặc FOOTER"><Input value={form.sectionKey} onChange={(value) => setField('sectionKey', value.toUpperCase())} /></Field>}
                  {['services','projects','posts','service-categories','categories','tags'].includes(type) && <Field label="Slug" hint="Để trống khi tạo để backend tự sinh"><Input value={form.slug} onChange={(value) => setField('slug', value)} placeholder="duong-dan-than-thien" /></Field>}
                  {['services','projects','posts'].includes(type) && <Field label="Mô tả ngắn"><Textarea value={form.excerpt} onChange={(value) => setField('excerpt', value)} rows={3} /></Field>}
                  {type === 'service-categories' && <Field label="Tóm tắt"><Textarea value={form.summary} onChange={(value) => setField('summary', value)} rows={3} /></Field>}
                </div>
              </section>

              {['services','projects','posts','site-sections'].includes(type) && <RichContentEditor label={type === 'site-sections' ? 'Nội dung khu vực' : 'Nội dung chi tiết'} value={form.content} onChange={(value) => setField('content', value)} />}

              {type === 'services' && <section className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:grid-cols-2"><Field label="ID danh mục dịch vụ" required><Input value={form.serviceCategoryId} onChange={(value) => setField('serviceCategoryId', value)} /></Field><Field label="Bảng giá JSON" hint='[{"label":"Vệ sinh","price":150000}]'><Textarea value={form.pricing} onChange={(value) => setField('pricing', value)} /></Field><Field label="Quy trình JSON" hint='["Tiếp nhận","Khảo sát","Bàn giao"]'><Textarea value={form.process} onChange={(value) => setField('process', value)} /></Field><Field label="Chính sách bảo hành"><Textarea value={form.warranty} onChange={(value) => setField('warranty', value)} /></Field><Field label="FAQ JSON"><Textarea value={form.faq} onChange={(value) => setField('faq', value)} /></Field><Field label="Dịch vụ liên quan JSON"><Textarea value={form.relatedServiceSlugs} onChange={(value) => setField('relatedServiceSlugs', value)} /></Field></section>}

              {type === 'projects' && <section className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7 sm:grid-cols-2"><Field label="Khách hàng"><Input value={form.clientName} onChange={(value) => setField('clientName', value)} /></Field><Field label="Địa điểm"><Input value={form.location} onChange={(value) => setField('location', value)} /></Field><Field label="Ngày bắt đầu"><Input type="date" value={form.startedAt} onChange={(value) => setField('startedAt', value)} /></Field><Field label="Ngày hoàn thành"><Input type="date" value={form.completedAt} onChange={(value) => setField('completedAt', value)} /></Field><Field label="Nhiệm vụ JSON"><Textarea value={form.tasks} onChange={(value) => setField('tasks', value)} /></Field><Field label="Kết quả"><Textarea value={form.result} onChange={(value) => setField('result', value)} /></Field></section>}

              {type === 'posts' && <section className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7 sm:grid-cols-2"><Field label="Category ID" required><Input type="number" value={form.categoryId} onChange={(value) => setField('categoryId', value)} /></Field><Field label="Author User ID" required><Input type="number" value={form.authorId} onChange={(value) => setField('authorId', value)} /></Field><Field label="Tag IDs" hint="Cách nhau bằng dấu phẩy"><Input value={form.tagIds} onChange={(value) => setField('tagIds', value)} /></Field></section>}

              {['service-categories','categories','tags','partners'].includes(type) && <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><Field label="Mô tả"><Textarea value={form.description} onChange={(value) => setField('description', value)} rows={6} /></Field></section>}

              {type === 'banners' && <section className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7 sm:grid-cols-2"><Field label="Tên quản trị"><Input value={form.name} onChange={(value) => setField('name', value)} /></Field><Field label="Eyebrow"><Input value={form.eyebrow} onChange={(value) => setField('eyebrow', value)} /></Field><Field label="Mô tả"><Textarea value={form.subtitle} onChange={(value) => setField('subtitle', value)} /></Field><Field label="Vị trí"><Select value={form.placement} onChange={(value) => setField('placement', value)} options={[{ value: 'HOME_HERO', label: 'Hero trang chủ' }, { value: 'HOME_MIDDLE', label: 'Giữa trang chủ' }, { value: 'SERVICE_TOP', label: 'Đầu trang dịch vụ' }]} /></Field><Field label="CTA chính"><Input value={form.ctaLabel} onChange={(value) => setField('ctaLabel', value)} /></Field><Field label="URL CTA chính"><Input value={form.ctaUrl} onChange={(value) => setField('ctaUrl', value)} /></Field><Field label="CTA phụ"><Input value={form.secondaryCtaLabel} onChange={(value) => setField('secondaryCtaLabel', value)} /></Field><Field label="URL CTA phụ"><Input value={form.secondaryCtaUrl} onChange={(value) => setField('secondaryCtaUrl', value)} /></Field></section>}

              {type === 'partners' && <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><Field label="Website"><Input value={form.websiteUrl} onChange={(value) => setField('websiteUrl', value)} placeholder="https://..." /></Field></section>}

              {type === 'testimonials' && <section className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7 sm:grid-cols-2"><Field label="Chức danh"><Input value={form.customerTitle} onChange={(value) => setField('customerTitle', value)} /></Field><Field label="Công ty"><Input value={form.company} onChange={(value) => setField('company', value)} /></Field><Field label="Đánh giá" required><Textarea value={form.quote} onChange={(value) => setField('quote', value)} rows={5} /></Field><Field label="Số sao"><Select value={form.rating} onChange={(value) => setField('rating', value)} options={[1,2,3,4,5].map((value) => ({ value: String(value), label: `${value} sao` }))} /></Field><Field label="Service ID"><Input type="number" value={form.serviceId} onChange={(value) => setField('serviceId', value)} /></Field></section>}

              {type === 'site-sections' && <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><Field label="Cấu hình JSON" hint='Ví dụ {"links":[],"hotline":"..."}'><Textarea value={form.config} onChange={(value) => setField('config', value)} rows={8} /></Field></section>}

              {type === 'authors' && <section className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7 sm:grid-cols-2"><Field label="Chức danh"><Input value={form.roleTitle} onChange={(value) => setField('roleTitle', value)} /></Field><Field label="Tiểu sử"><Textarea value={form.bio} onChange={(value) => setField('bio', value)} rows={6} /></Field><Field label="Mạng xã hội JSON"><Textarea value={form.socialLinks} onChange={(value) => setField('socialLinks', value)} /></Field></section>}

              {type === 'media' && <section className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7 sm:grid-cols-2"><Field label="URL" required={!initial}><Input value={form.url} onChange={(value) => setField('url', value)} /></Field><Field label="Alt text"><Input value={form.altText} onChange={(value) => setField('altText', value)} /></Field><Field label="MIME type"><Input value={form.mimeType} onChange={(value) => setField('mimeType', value)} /></Field><Field label="Folder"><Input value={form.folder} onChange={(value) => setField('folder', value)} /></Field></section>}
            </div>
          )}

          {tab === 'media' && (
            <div className="space-y-6">
              {type === 'projects' && <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4"><p className="text-sm font-black text-blue-900">Album dự án</p><p className="mt-1 text-xs text-blue-700">Media IDs hiện tại: {form.mediaIds || 'Chưa chọn'}</p></section>}
              <MediaLibrary selectedId={numberOrUndefined(form.coverMediaId) || numberOrUndefined(form.desktopMediaId) || numberOrUndefined(form.logoMediaId) || numberOrUndefined(form.avatarMediaId)} onSelect={(media) => {
                if (type === 'banners') chooseMedia('desktopMediaId', media.id);
                else if (type === 'partners') chooseMedia('logoMediaId', media.id);
                else if (['testimonials','authors'].includes(type)) chooseMedia('avatarMediaId', media.id);
                else if (type === 'projects') appendMedia(media.id);
                else chooseMedia('coverMediaId', media.id);
              }} />
              <section className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7 sm:grid-cols-2">
                {['services','projects','posts','service-categories'].includes(type) && <Field label="Cover Media ID"><Input type="number" value={form.coverMediaId} onChange={(value) => setField('coverMediaId', value)} /></Field>}
                {['services','projects','posts','service-categories','categories','site-sections'].includes(type) && <Field label="Social Image Media ID"><Input type="number" value={form.socialImageMediaId} onChange={(value) => setField('socialImageMediaId', value)} /></Field>}
                {type === 'banners' && <><Field label="Ảnh desktop"><Input type="number" value={form.desktopMediaId} onChange={(value) => setField('desktopMediaId', value)} /></Field><Field label="Ảnh mobile"><Input type="number" value={form.mobileMediaId} onChange={(value) => setField('mobileMediaId', value)} /></Field></>}
                {type === 'partners' && <Field label="Logo Media ID"><Input type="number" value={form.logoMediaId} onChange={(value) => setField('logoMediaId', value)} /></Field>}
                {['testimonials','authors'].includes(type) && <Field label="Avatar Media ID"><Input type="number" value={form.avatarMediaId} onChange={(value) => setField('avatarMediaId', value)} /></Field>}
                {type === 'projects' && <Field label="Album Media IDs" hint="Cách nhau bằng dấu phẩy; thứ tự chính là thứ tự album"><Input value={form.mediaIds} onChange={(value) => setField('mediaIds', value)} /></Field>}
              </section>
            </div>
          )}

          {tab === 'seo' && (
            <section className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4"><div className="flex items-center gap-2 text-sm font-black text-blue-900"><Sparkles className="h-4 w-4" />Google & social preview</div><p className="mt-2 text-lg font-bold text-blue-700">{form.seoTitle || form.title || form.name || 'Tiêu đề trang'}</p><p className="mt-1 text-sm leading-6 text-slate-600">{form.seoDescription || form.excerpt || form.description || 'Mô tả SEO sẽ xuất hiện tại đây.'}</p><p className="mt-2 truncate text-xs text-emerald-700">{form.canonicalUrl || `https://dienlanh247.vn/${form.slug || 'duong-dan'}`}</p></div>
              <Field label="SEO title" hint={`${form.seoTitle.length}/255 ký tự`}><Input value={form.seoTitle} onChange={(value) => setField('seoTitle', value)} /></Field>
              <Field label="Meta description" hint={`${form.seoDescription.length}/500 ký tự`}><Textarea value={form.seoDescription} onChange={(value) => setField('seoDescription', value)} rows={4} /></Field>
              {['posts','site-sections'].includes(type) && <Field label="Canonical URL"><Input value={form.canonicalUrl} onChange={(value) => setField('canonicalUrl', value)} /></Field>}
              <Field label="Social image Media ID"><Input type="number" value={form.socialImageMediaId} onChange={(value) => setField('socialImageMediaId', value)} /></Field>
            </section>
          )}

          {tab === 'settings' && (
            <section className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Hiển thị"><Select value={form.isActive} onChange={(value) => setField('isActive', value)} options={[{ value: 'true', label: 'Đang hoạt động' }, { value: 'false', label: 'Tạm ẩn' }]} /></Field>
                {!['media','authors','categories','tags'].includes(type) && <Field label="Nổi bật"><Select value={form.isFeatured} onChange={(value) => setField('isFeatured', value)} options={[{ value: 'false', label: 'Bình thường' }, { value: 'true', label: 'Nổi bật' }]} /></Field>}
                <Field label="Thứ tự"><Input type="number" value={form.sortOrder} onChange={(value) => setField('sortOrder', value)} /></Field>
                {type === 'banners' && <><Field label="Bắt đầu hiển thị"><Input type="datetime-local" value={form.startsAt} onChange={(value) => setField('startsAt', value)} /></Field><Field label="Kết thúc hiển thị"><Input type="datetime-local" value={form.endsAt} onChange={(value) => setField('endsAt', value)} /></Field><Field label="Giao diện"><Select value={form.theme} onChange={(value) => setField('theme', value)} options={[{ value: 'DARK', label: 'Tối' }, { value: 'LIGHT', label: 'Sáng' }, { value: 'BRAND', label: 'Thương hiệu' }]} /></Field></>}
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-800"><strong>Quy trình xuất bản:</strong> lưu nội dung tại đây không tự động publish. Sau khi lưu, dùng nút Preview và Publish tại danh sách để tạo revision riêng, hỗ trợ lịch xuất bản và kiểm soát người thao tác.</div>
            </section>
          )}
        </div>

        <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="text-xs text-slate-400">{initial?.updatedByName ? `Cập nhật gần nhất bởi ${String(initial.updatedByName)}` : 'Mọi thay đổi được ghi lịch sử sau khi lưu.'}</div>
          <div className="flex gap-3"><button type="button" onClick={onClose} disabled={saving} className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50">Hủy</button><button type="button" onClick={() => void submit()} disabled={saving || !dirty} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 text-sm font-black text-white shadow-lg shadow-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50">{saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Check className="h-4 w-4" />}{saving ? 'Đang lưu...' : 'Lưu nội dung'}</button></div>
        </footer>
      </section>
    </div>
  );
}
