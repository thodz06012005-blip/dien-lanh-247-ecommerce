import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Building2, CheckCircle2, Save, Settings as SettingsIcon, SlidersHorizontal } from 'lucide-react';
import api from '../services/api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import BusinessConfigEditor from '../features/settings/components/BusinessConfigEditor';
import type { SystemSettings } from '../types/businessConfig';

type PageTab = 'business' | 'contact';

export default function Settings() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => (await api.get('/admin/settings')).data,
  });

  if (isLoading) return <LoadingState message="Đang tải cấu hình nghiệp vụ..." />;
  if (error || !data?.success || !data.data) return <EmptyState message="Lỗi kết nối dữ liệu" subMessage="Không thể tải cấu hình hệ thống từ máy chủ." />;

  return <SettingsForm key={data.data.updatedAt || 'settings-form'} initialData={data.data} />;
}

function SettingsForm({ initialData }: { initialData: SystemSettings }) {
  const queryClient = useQueryClient();
  const [pageTab, setPageTab] = useState<PageTab>('business');
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState<SystemSettings>(initialData);
  const updateSettings = useMutation({
    mutationFn: async (values: SystemSettings) => api.patch('/admin/settings', values),
    onSuccess: () => {
      setSaved(true);
      setErrorMessage('');
      window.setTimeout(() => setSaved(false), 3500);
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (err: AxiosError<{ message?: string; errors?: { message: string }[] }>) => {
      const details = err.response?.data?.errors?.[0]?.message;
      setErrorMessage(details || err.response?.data?.message || 'Không thể lưu cấu hình. Vui lòng kiểm tra lại dữ liệu.');
    },
  });

  const setField = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => setFormData(prev => ({ ...prev, [key]: value }));
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.storeName.trim() || !formData.hotline.trim() || !formData.zalo.trim()) {
      setErrorMessage('Tên cửa hàng, Hotline và Zalo là các trường bắt buộc.');
      return;
    }
    if (!formData.businessConfig.appliances.length || !formData.businessConfig.serviceAreas.length || !formData.businessConfig.timeSlots.length) {
      setErrorMessage('Cần có ít nhất một thiết bị, khu vực và khung giờ phục vụ.');
      return;
    }
    updateSettings.mutate(formData);
  };

  return <form onSubmit={handleSubmit} className="mx-auto flex max-w-7xl flex-col gap-6 pb-28">
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600"><SlidersHorizontal className="h-4 w-4" />Giai đoạn 0 · Chuẩn nghiệp vụ</div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-950"><SettingsIcon className="h-6 w-6 text-blue-600" />Cấu hình vận hành</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Nguồn dữ liệu thống nhất cho website khách hàng, bộ phận điều phối và hệ thống báo cáo. Thay đổi chỉ có hiệu lực sau khi bấm lưu.</p>
      </div>
      <div className="flex items-center gap-3">
        {saved && <span className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-5 w-5" />Đã lưu thành công</span>}
        <Button type="submit" isLoading={updateSettings.isPending} leftIcon={<Save className="h-4 w-4" />} className="min-h-11 px-6 font-bold">Lưu toàn bộ cấu hình</Button>
      </div>
    </div>

    {errorMessage && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{errorMessage}</div>}

    <div className="flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      <button type="button" onClick={() => setPageTab('business')} className={`flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${pageTab === 'business' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-50'}`}><SlidersHorizontal className="h-4 w-4" />Nghiệp vụ dịch vụ</button>
      <button type="button" onClick={() => setPageTab('contact')} className={`flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${pageTab === 'contact' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-50'}`}><Building2 className="h-4 w-4" />Thông tin cửa hàng</button>
    </div>

    {pageTab === 'business' ? <BusinessConfigEditor value={formData.businessConfig} onChange={businessConfig => setField('businessConfig', businessConfig)} /> : <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6"><h2 className="text-lg font-bold text-slate-950">Thông tin cửa hàng và kênh liên hệ</h2><p className="mt-1 text-sm leading-6 text-slate-500">Thông tin này xuất hiện ở header, footer và các điểm hỗ trợ khách hàng.</p></div>
      <div className="grid gap-5 md:grid-cols-2">
        <Input label="Tên cửa hàng (*)" value={formData.storeName} onChange={e => setField('storeName', e.target.value)} required />
        <Input label="Email liên hệ" type="email" value={formData.email} onChange={e => setField('email', e.target.value)} />
        <Input label="Hotline (*)" type="tel" value={formData.hotline} onChange={e => setField('hotline', e.target.value)} required />
        <Input label="Zalo tư vấn (*)" type="tel" value={formData.zalo} onChange={e => setField('zalo', e.target.value)} required />
        <div className="md:col-span-2"><Input label="Địa chỉ trụ sở" value={formData.address} onChange={e => setField('address', e.target.value)} /></div>
      </div>
    </div>}

    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(15,23,42,.06)] backdrop-blur md:hidden"><Button type="submit" isLoading={updateSettings.isPending} leftIcon={<Save className="h-4 w-4" />} className="min-h-12 w-full font-bold">Lưu toàn bộ cấu hình</Button></div>
  </form>;
}
