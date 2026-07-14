import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Eye,
  FileText,
  FolderTree,
  History,
  Image as ImageIcon,
  LayoutTemplate,
  MessageSquareQuote,
  Newspaper,
  Pencil,
  Plus,
  RefreshCw,
  Rocket,
  Sparkles,
  Tag,
  Undo2,
  UsersRound,
  Wrench,
  X,
} from 'lucide-react';
import { useState } from 'react';
import AdminDataTable, { type AdminDataColumn } from '@/components/admin/AdminDataTable';
import CmsEditorDrawer from '@/components/cms/CmsEditorDrawer';
import CmsHistoryDrawer from '@/components/cms/CmsHistoryDrawer';
import CmsPreviewModal from '@/components/cms/CmsPreviewModal';
import { CMS_GROUPS, CMS_TYPES, cmsMeta, cmsRecordLabel } from '@/config/cmsContentTypes';
import { ADMIN_PERMISSIONS } from '@/config/adminPermissions';
import { getApiErrorMessage } from '@/services/api';
import {
  archiveCms,
  createCms,
  getCms,
  listCms,
  publishCms,
  restoreCms,
  unpublishCms,
  updateCms,
  type CmsContentType,
  type CmsRecord,
} from '@/services/cmsApi';
import { useAdminAuthStore } from '@/store/adminAuthStore';

const icons: Record<CmsContentType, typeof Wrench> = {
  services: Wrench,
  'service-categories': FolderTree,
  projects: BriefcaseBusiness,
  posts: Newspaper,
  categories: BookOpen,
  tags: Tag,
  media: ImageIcon,
  banners: LayoutTemplate,
  partners: Building2,
  testimonials: MessageSquareQuote,
  'site-sections': FileText,
  authors: UsersRound,
};

const statusStyle: Record<string, string> = {
  DRAFT: 'border-amber-100 bg-amber-50 text-amber-700',
  PUBLISHED: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  ARCHIVED: 'border-slate-200 bg-slate-100 text-slate-600',
  ACTIVE: 'border-blue-100 bg-blue-50 text-blue-700',
  INACTIVE: 'border-slate-200 bg-slate-100 text-slate-500',
};

interface Target { type: CmsContentType; id: number | string }
interface ConfirmState extends Target { action: 'archive' | 'publish' | 'unpublish' | 'restore'; label: string }

export default function EditorialCms() {
  const queryClient = useQueryClient();
  const canManage = useAdminAuthStore((state) => state.hasPermission(ADMIN_PERMISSIONS.CONTENT_MANAGE));
  const [type, setType] = useState<CmsContentType>('services');
  const [editor, setEditor] = useState<CmsRecord | null | undefined>(undefined);
  const [preview, setPreview] = useState<Target | null>(null);
  const [history, setHistory] = useState<Target | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [scheduleAt, setScheduleAt] = useState('');
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [openingEditor, setOpeningEditor] = useState(false);
  const meta = cmsMeta(type);

  const listQuery = useQuery({
    queryKey: ['cms-list', type],
    queryFn: async () => (await listCms(type, { limit: 100, includeDeleted: true })).data,
    staleTime: 15_000,
  });
  const rows = listQuery.data ?? [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cms-list', type] });

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => editor
      ? updateCms(type, editor.id, payload)
      : createCms(type, payload),
    onSuccess: () => {
      setEditor(undefined);
      setMessage({ tone: 'success', text: `Đã lưu ${meta.singular}. Thay đổi đã được ghi lịch sử.` });
      void invalidate();
    },
    onError: (error) => setMessage({ tone: 'error', text: getApiErrorMessage(error) }),
  });

  const actionMutation = useMutation({
    mutationFn: async (target: ConfirmState) => {
      if (target.action === 'archive') return archiveCms(target.type, target.id);
      if (target.action === 'restore') return restoreCms(target.type, target.id);
      if (target.action === 'unpublish') return unpublishCms(target.type, target.id);
      return publishCms(target.type, target.id, scheduleAt ? new Date(scheduleAt).toISOString() : undefined);
    },
    onSuccess: (_, target) => {
      const verb = { archive: 'lưu trữ', restore: 'khôi phục', unpublish: 'gỡ xuất bản', publish: 'xuất bản' }[target.action];
      setMessage({ tone: 'success', text: `Đã ${verb} “${target.label}”.` });
      setConfirm(null);
      setScheduleAt('');
      void invalidate();
    },
    onError: (error) => setMessage({ tone: 'error', text: getApiErrorMessage(error) }),
  });

  const openEditor = async (record: CmsRecord) => {
    try {
      setOpeningEditor(true);
      setEditor((await getCms(type, record.id)).data);
      setMessage(null);
    } catch (error) {
      setMessage({ tone: 'error', text: getApiErrorMessage(error) });
    } finally {
      setOpeningEditor(false);
    }
  };

  const ask = (record: CmsRecord, action: ConfirmState['action']) => setConfirm({
    type,
    id: record.id,
    action,
    label: cmsRecordLabel(record),
  });

  const columns: AdminDataColumn<CmsRecord>[] = [
    {
      key: 'content',
      header: meta.label,
      accessor: cmsRecordLabel,
      sortable: true,
      exportValue: cmsRecordLabel,
      render: (record) => {
        const Icon = icons[type];
        return <div className="flex min-w-64 items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary-600"><Icon className="h-5 w-5" /></div><div className="min-w-0"><strong className="block truncate text-sm text-slate-950">{cmsRecordLabel(record)}</strong><p className="mt-1 truncate text-xs text-slate-400">{record.slug ? `/${String(record.slug)}` : record.sectionKey ? String(record.sectionKey) : `ID ${record.id}`}</p></div></div>;
      },
    },
    {
      key: 'status',
      header: 'Trạng thái',
      accessor: (record) => record.deletedAt ? 'ARCHIVED' : record.status || (record.isActive ? 'ACTIVE' : 'INACTIVE'),
      sortable: true,
      render: (record) => {
        const status = record.deletedAt ? 'ARCHIVED' : String(record.status || (record.isActive ? 'ACTIVE' : 'INACTIVE'));
        const label = { DRAFT: 'Bản nháp', PUBLISHED: 'Đã xuất bản', ARCHIVED: 'Đã lưu trữ', ACTIVE: 'Đang dùng', INACTIVE: 'Đã ẩn' }[status] || status;
        return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${statusStyle[status] || statusStyle.INACTIVE}`}>{label}</span>;
      },
    },
    {
      key: 'featured',
      header: 'Hiển thị',
      accessor: (record) => record.isFeatured ? 'Nổi bật' : 'Bình thường',
      render: (record) => <div className="space-y-1"><span className={`text-xs font-bold ${record.isFeatured ? 'text-amber-700' : 'text-slate-500'}`}>{record.isFeatured ? '★ Nổi bật' : 'Bình thường'}</span>{record.publishedAt && <p className="text-[10px] text-slate-400"><CalendarClock className="mr-1 inline h-3 w-3" />{new Date(record.publishedAt).toLocaleString('vi-VN')}</p>}</div>,
    },
    {
      key: 'updatedBy',
      header: 'Cập nhật bởi',
      accessor: (record) => record.updatedByName || record.updatedByEmail || '',
      sortable: true,
      render: (record) => <div><p className="text-xs font-bold text-slate-700">{String(record.updatedByName || record.updatedByEmail || 'Hệ thống')}</p><p className="mt-1 text-[10px] text-slate-400">v{String(record.version || 1)}</p></div>,
    },
    {
      key: 'updatedAt',
      header: 'Cập nhật',
      accessor: 'updatedAt',
      sortable: true,
      render: (record) => <span className="text-xs text-slate-500">{record.updatedAt ? new Date(record.updatedAt).toLocaleString('vi-VN') : '—'}</span>,
    },
    {
      key: 'actions',
      header: 'Hành động',
      align: 'right',
      render: (record) => <div className="flex justify-end gap-1.5">
        <button type="button" onClick={() => setPreview({ type, id: record.id })} className="action-button" title="Preview"><Eye className="h-4 w-4" /></button>
        <button type="button" onClick={() => setHistory({ type, id: record.id })} className="action-button" title="Lịch sử"><History className="h-4 w-4" /></button>
        {canManage && !record.deletedAt && <button type="button" onClick={() => void openEditor(record)} className="action-button" title="Chỉnh sửa"><Pencil className="h-4 w-4" /></button>}
        {canManage && meta.publishable && !record.deletedAt && record.status !== 'PUBLISHED' && <button type="button" onClick={() => ask(record, 'publish')} className="action-button text-violet-600" title="Xuất bản"><Rocket className="h-4 w-4" /></button>}
        {canManage && meta.publishable && !record.deletedAt && record.status === 'PUBLISHED' && <button type="button" onClick={() => ask(record, 'unpublish')} className="action-button text-amber-600" title="Gỡ xuất bản"><Undo2 className="h-4 w-4" /></button>}
        {canManage && !record.deletedAt && <button type="button" onClick={() => ask(record, 'archive')} className="action-button text-red-500" title="Lưu trữ"><Archive className="h-4 w-4" /></button>}
        {canManage && record.deletedAt && <button type="button" onClick={() => ask(record, 'restore')} className="action-button text-emerald-600" title="Khôi phục"><RefreshCw className="h-4 w-4" /></button>}
      </div>,
    },
  ];

  const stats = {
    total: rows.length,
    published: rows.filter((row) => row.status === 'PUBLISHED' && !row.deletedAt).length,
    draft: rows.filter((row) => row.status === 'DRAFT' && !row.deletedAt).length,
    archived: rows.filter((row) => Boolean(row.deletedAt)).length,
  };

  return (
    <div className="space-y-6 pb-12">
      <style>{`.action-button{display:flex;height:2.25rem;width:2.25rem;align-items:center;justify-content:center;border-radius:.5rem;color:#64748b}.action-button:hover{background:#eff6ff;color:#1d4ed8}`}</style>
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-xl sm:p-9">
        <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200"><Sparkles className="h-3.5 w-3.5" />Editorial workspace</div><h1 className="mt-4 text-3xl font-black sm:text-4xl">Trung tâm nội dung</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">Quản lý nội dung, media, SEO và lịch xuất bản. Mọi thao tác đều có version và người cập nhật.</p></div>
          <div className="grid grid-cols-4 gap-2">{[['Tổng',stats.total],['Published',stats.published],['Draft',stats.draft],['Archive',stats.archived]].map(([label,value]) => <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center"><strong className="block text-xl font-black">{value}</strong><span className="text-[10px] text-slate-400">{label}</span></div>)}</div>
        </div>
      </section>

      {message && <div className={`flex items-start justify-between rounded-2xl border p-4 text-sm font-semibold ${message.tone === 'success' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-red-100 bg-red-50 text-red-700'}`}><span>{message.text}</span><button type="button" onClick={() => setMessage(null)} aria-label="Đóng"><X className="h-4 w-4" /></button></div>}

      <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="space-y-5">{CMS_GROUPS.map((group) => <div key={group}><p className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{group}</p><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{CMS_TYPES.filter((item) => item.group === group).map((item) => { const Icon = icons[item.type]; const active = item.type === type; return <button key={item.type} type="button" onClick={() => { setType(item.type); setMessage(null); }} className={`flex min-h-20 items-start gap-3 rounded-2xl border p-3 text-left transition ${active ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-100 bg-slate-50/60 hover:bg-white'}`}><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-primary-600 text-white' : 'bg-white text-slate-500 shadow-sm'}`}><Icon className="h-5 w-5" /></span><span><strong className="block text-sm text-slate-900">{item.label}</strong><span className="mt-1 line-clamp-2 block text-[11px] leading-4 text-slate-500">{item.description}</span></span></button>; })}</div></div>)}</div>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-600">{meta.group}</p><h2 className="mt-1 text-2xl font-black text-slate-950">{meta.label}</h2><p className="mt-1 text-sm text-slate-500">{meta.description}</p></div>{canManage && <button type="button" onClick={() => setEditor(null)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 text-sm font-black text-white"><Plus className="h-4 w-4" />Tạo {meta.singular}</button>}</div>
        <AdminDataTable
          rows={rows}
          columns={columns}
          rowKey={(record) => record.id}
          searchFields={[(record) => cmsRecordLabel(record), 'slug', 'sectionKey', 'updatedByName']}
          searchPlaceholder={`Tìm trong ${meta.label.toLocaleLowerCase('vi-VN')}...`}
          filters={[
            { key: 'status', label: 'Trạng thái', options: [{ label: 'Bản nháp', value: 'DRAFT' }, { label: 'Đã xuất bản', value: 'PUBLISHED' }, { label: 'Đã lưu trữ', value: 'ARCHIVED' }], predicate: (record, value) => value === 'ARCHIVED' ? Boolean(record.deletedAt) : record.status === value && !record.deletedAt },
            { key: 'featured', label: 'Nổi bật', options: [{ label: 'Có', value: 'yes' }, { label: 'Không', value: 'no' }], predicate: (record, value) => value === 'yes' ? Boolean(record.isFeatured) : !record.isFeatured },
          ]}
          selectable={canManage}
          bulkActions={canManage ? [{ label: 'Lưu trữ các mục đã chọn', tone: 'danger', onClick: async (selected) => { for (const record of selected.filter((item) => !item.deletedAt)) await archiveCms(type, record.id); setMessage({ tone: 'success', text: `Đã lưu trữ ${selected.length} mục.` }); await invalidate(); } }] : []}
          exportFileName={`cms-${type}.csv`}
          defaultPageSize={20}
          isLoading={listQuery.isLoading || openingEditor}
          emptyTitle={`Chưa có ${meta.singular}`}
          emptyDescription={`Tạo ${meta.singular} đầu tiên để bắt đầu quản trị nội dung.`}
        />
      </section>

      {editor !== undefined && <CmsEditorDrawer type={type} initial={editor} saving={saveMutation.isPending} error={saveMutation.isError ? getApiErrorMessage(saveMutation.error) : null} onClose={() => setEditor(undefined)} onSave={(payload) => saveMutation.mutateAsync(payload).then(() => undefined)} />}
      {preview && <CmsPreviewModal {...preview} onClose={() => setPreview(null)} />}
      {history && <CmsHistoryDrawer {...history} onClose={() => setHistory(null)} />}

      {confirm && <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Xác nhận thao tác CMS"><button type="button" className="absolute inset-0" onClick={() => setConfirm(null)} aria-label="Đóng" /><section className="relative w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8"><h3 className="text-xl font-black text-slate-950">Xác nhận {confirm.action}</h3><p className="mt-2 text-sm leading-6 text-slate-500">“{confirm.label}” sẽ được cập nhật trạng thái và tạo revision mới.</p>{confirm.action === 'publish' && <label className="mt-5 block space-y-2"><span className="text-xs font-black uppercase tracking-wider text-slate-500">Lịch xuất bản</span><input type="datetime-local" value={scheduleAt} onChange={(event) => setScheduleAt(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none" /></label>}<div className="mt-7 flex justify-end gap-3"><button type="button" onClick={() => setConfirm(null)} className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-600">Hủy</button><button type="button" onClick={() => actionMutation.mutate(confirm)} disabled={actionMutation.isPending} className={`min-h-11 rounded-xl px-5 text-sm font-black text-white disabled:opacity-50 ${confirm.action === 'archive' ? 'bg-red-600' : 'bg-slate-950'}`}>{actionMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}</button></div></section></div>}
    </div>
  );
}
