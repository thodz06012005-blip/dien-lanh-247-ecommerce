import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';
import api from '../services/api';
import { createServiceRequest, uploadCustomerRequestMedia } from '../services/serviceRequestApi';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import type { ServiceCategory, ServiceRequestPriority } from '../types/service';
import Breadcrumb from '../components/common/Breadcrumb';
import PageTransition from '../components/common/PageTransition';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { DISTRICT_OPTIONS } from '../constants/areas';

const TIME_SLOTS = ['08:00 - 10:00', '10:00 - 12:00', '14:00 - 16:00', '16:00 - 18:00'];
const PRIORITIES: Array<{ value: ServiceRequestPriority; label: string; description: string }> = [
  { value: 'low', label: 'Thông thường', description: 'Thiết bị vẫn có thể sử dụng' },
  { value: 'medium', label: 'Cần xử lý sớm', description: 'Ảnh hưởng sinh hoạt hằng ngày' },
  { value: 'high', label: 'Khẩn cấp', description: 'Thiết bị ngừng hoạt động' },
  { value: 'urgent', label: 'Rất khẩn cấp', description: 'Rò điện, rò nước hoặc có nguy cơ mất an toàn' },
];

interface BookingForm {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  district: string;
  applianceType: string;
  serviceCategoryId: string;
  issueDescription: string;
  priority: ServiceRequestPriority;
  preferredDate: string;
  preferredTimeSlot: string;
  note: string;
}

const steps = [
  { id: 1, label: 'Liên hệ', icon: UserRound },
  { id: 2, label: 'Thiết bị', icon: Wrench },
  { id: 3, label: 'Lịch và ảnh', icon: CalendarDays },
  { id: 4, label: 'Xác nhận', icon: ShieldCheck },
];

export default function ServiceBooking() {
  useDocumentTitle('Đặt lịch sửa chữa', 'Gửi yêu cầu sửa chữa điện lạnh và nhận mã tra cứu ngay lập tức.');
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showError } = useToastStore();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [form, setForm] = useState<BookingForm>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    district: '',
    applianceType: '',
    serviceCategoryId: '',
    issueDescription: '',
    priority: 'medium',
    preferredDate: '',
    preferredTimeSlot: '',
    note: '',
  });

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      customerName: [user.firstName, user.lastName].filter(Boolean).join(' ') || current.customerName,
      customerPhone: user.phone || current.customerPhone,
      customerEmail: user.email || current.customerEmail,
      customerAddress: user.addressDetail || current.customerAddress,
      district: user.district || current.district,
    }));
  }, [user]);

  const { data: categoriesData } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => (await api.get('/service-categories')).data,
  });
  const categories: ServiceCategory[] = categoriesData?.data || [];

  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );
  useEffect(
    () => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)),
    [previews],
  );

  const today = useMemo(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }, []);

  const set = (key: keyof BookingForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      if (!form.customerName.trim() || !form.customerPhone.trim() || !form.customerEmail.trim()) {
        showError('Vui lòng nhập đầy đủ họ tên, số điện thoại và email.');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) {
        showError('Email chưa đúng định dạng.');
        return false;
      }
      if (!form.customerAddress.trim() || !form.district) {
        showError('Vui lòng nhập đầy đủ địa chỉ phục vụ.');
        return false;
      }
    }
    if (currentStep === 2) {
      if (!form.serviceCategoryId || !form.applianceType.trim()) {
        showError('Vui lòng chọn dịch vụ và nhập loại thiết bị.');
        return false;
      }
      if (form.issueDescription.trim().length < 10) {
        showError('Mô tả sự cố cần có ít nhất 10 ký tự.');
        return false;
      }
    }
    if (currentStep === 3 && (!form.preferredDate || !form.preferredTimeSlot)) {
      showError('Vui lòng chọn ngày và khung giờ mong muốn.');
      return false;
    }
    return true;
  };

  const next = () => {
    if (validateStep(step)) setStep((value) => Math.min(4, value + 1));
  };

  const handleFiles = (selected: FileList | null) => {
    if (!selected) return;
    const incoming = Array.from(selected).filter((file) => file.type.startsWith('image/'));
    const oversized = incoming.find((file) => file.size > 5 * 1024 * 1024);
    if (oversized) {
      showError(`Ảnh ${oversized.name} vượt quá 5 MB.`);
      return;
    }
    setFiles((current) => [...current, ...incoming].slice(0, 5));
  };

  const submit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;
    setIsSubmitting(true);
    try {
      const phone = form.customerPhone.replace(/\s+/g, '').trim();
      const response = await createServiceRequest({
        ...form,
        customerName: form.customerName.trim(),
        customerPhone: phone,
        customerEmail: form.customerEmail.trim().toLowerCase(),
        customerAddress: form.customerAddress.trim(),
        applianceType: form.applianceType.trim(),
        issueDescription: form.issueDescription.trim(),
        note: form.note.trim(),
      });
      let mediaUploaded = files.length === 0;
      if (files.length) {
        try {
          await uploadCustomerRequestMedia(response.data.code, phone, files);
          mediaUploaded = true;
        } catch {
          mediaUploaded = false;
        }
      }
      sessionStorage.setItem('dl247_last_request', JSON.stringify({ code: response.data.code, phone }));
      navigate('/service-booking/success', {
        state: {
          code: response.data.code,
          phone,
          mediaUploaded,
          confirmationSent: response.data.confirmationSent,
        },
      });
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      showError(message || 'Không thể gửi yêu cầu. Vui lòng kiểm tra thông tin và thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find((category) => category.id === form.serviceCategoryId);

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ name: 'Dịch vụ sửa chữa', path: '/services' }, { name: 'Đặt lịch' }]} />

        <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl md:px-10 md:py-10">
          <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
                <Sparkles aria-hidden="true" className="h-3.5 w-3.5" /> Tiếp nhận 24/7
              </span>
              <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight md:text-4xl">Đặt lịch sửa chữa trong vài phút</h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">Mỗi yêu cầu có mã riêng, lịch sử minh bạch và ảnh trước/sau sửa chữa để bạn theo dõi toàn bộ quá trình.</p>
              <div className="mt-6 grid gap-3 text-xs text-slate-200 sm:grid-cols-3">
                {['Xác nhận qua email', 'Không lộ thông tin riêng tư', 'Theo dõi bằng mã yêu cầu'].map((item) => (
                  <div key={item} className="flex items-center gap-2"><Check aria-hidden="true" className="h-4 w-4 text-emerald-400" />{item}</div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300"><span>Tiến độ hoàn tất</span><span>{step}/4</span></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-[width] duration-200" style={{ width: `${step * 25}%` }} />
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2">
                {steps.map((item) => {
                  const Icon = item.icon;
                  const active = step >= item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => item.id < step && setStep(item.id)}
                      aria-label={`Bước ${item.id}: ${item.label}`}
                      aria-current={step === item.id ? 'step' : undefined}
                      disabled={item.id > step}
                      className={`rounded-2xl border p-3 text-center transition ${active ? 'border-cyan-400/40 bg-cyan-400/10 text-white' : 'border-white/10 text-slate-400'} disabled:cursor-default`}
                    >
                      <Icon aria-hidden="true" className="mx-auto h-4 w-4" />
                      <span className="mt-1 hidden text-[9px] font-bold sm:block">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto mt-8 max-w-4xl">
          <section key={step} aria-labelledby={`booking-step-${step}`} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div><p className="text-xs font-black uppercase tracking-[0.16em] text-primary-700">Bước 1</p><h2 id="booking-step-1" className="mt-2 text-2xl font-black text-slate-950">Thông tin liên hệ</h2><p className="mt-2 text-sm text-slate-600">Thông tin này chỉ dùng để xác nhận và điều phối kỹ thuật viên.</p></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Họ và tên *" value={form.customerName} onChange={(event) => set('customerName', event.target.value)} placeholder="Nguyễn Văn A" leftIcon={<UserRound aria-hidden="true" className="h-4 w-4" />} />
                  <Input label="Số điện thoại *" value={form.customerPhone} onChange={(event) => set('customerPhone', event.target.value)} placeholder="0912345678" leftIcon={<Phone aria-hidden="true" className="h-4 w-4" />} />
                  <Input label="Email nhận xác nhận *" type="email" value={form.customerEmail} onChange={(event) => set('customerEmail', event.target.value)} placeholder="ban@example.com" leftIcon={<Mail aria-hidden="true" className="h-4 w-4" />} />
                  <div className="flex flex-col gap-1.5"><label htmlFor="booking-district" className="text-sm font-semibold text-slate-700">Quận/Huyện *</label><select id="booking-district" value={form.district} onChange={(event) => set('district', event.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10"><option value="">Chọn khu vực</option>{DISTRICT_OPTIONS.map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}</select></div>
                </div>
                <Input label="Địa chỉ chi tiết *" value={form.customerAddress} onChange={(event) => set('customerAddress', event.target.value)} placeholder="Số nhà, đường, phường/xã" leftIcon={<MapPin aria-hidden="true" className="h-4 w-4" />} />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div><p className="text-xs font-black uppercase tracking-[0.16em] text-primary-700">Bước 2</p><h2 id="booking-step-2" className="mt-2 text-2xl font-black text-slate-950">Thiết bị và sự cố</h2><p className="mt-2 text-sm text-slate-600">Mô tả càng rõ, kỹ thuật viên chuẩn bị dụng cụ càng chính xác.</p></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5"><label htmlFor="booking-service" className="text-sm font-semibold text-slate-700">Dịch vụ *</label><select id="booking-service" value={form.serviceCategoryId} onChange={(event) => set('serviceCategoryId', event.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10"><option value="">Chọn dịch vụ</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
                  <Input label="Loại thiết bị *" value={form.applianceType} onChange={(event) => set('applianceType', event.target.value)} placeholder="Điều hòa Daikin 12000 BTU" />
                </div>
                <div><label htmlFor="booking-issue" className="text-sm font-semibold text-slate-700">Mô tả sự cố *</label><textarea id="booking-issue" value={form.issueDescription} onChange={(event) => set('issueDescription', event.target.value)} rows={5} placeholder="Thiết bị có biểu hiện gì, xuất hiện từ khi nào..." className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10" /></div>
                <fieldset><legend className="text-sm font-semibold text-slate-700">Mức độ ưu tiên</legend><div className="mt-2 grid gap-3 sm:grid-cols-2">{PRIORITIES.map((priority) => <button key={priority.value} type="button" onClick={() => set('priority', priority.value)} aria-pressed={form.priority === priority.value} className={`rounded-2xl border p-4 text-left transition ${form.priority === priority.value ? 'border-primary-600 bg-primary-50 ring-4 ring-primary-500/10' : 'border-slate-200 hover:border-slate-300'}`}><strong className="block text-sm text-slate-900">{priority.label}</strong><span className="mt-1 block text-xs leading-5 text-slate-600">{priority.description}</span></button>)}</div></fieldset>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div><p className="text-xs font-black uppercase tracking-[0.16em] text-primary-700">Bước 3</p><h2 id="booking-step-3" className="mt-2 text-2xl font-black text-slate-950">Lịch mong muốn và hình ảnh</h2><p className="mt-2 text-sm text-slate-600">Bạn có thể tải tối đa 5 ảnh, mỗi ảnh không quá 5 MB.</p></div>
                <div className="grid gap-4 sm:grid-cols-2"><Input label="Ngày mong muốn *" type="date" min={today} value={form.preferredDate} onChange={(event) => set('preferredDate', event.target.value)} leftIcon={<CalendarDays aria-hidden="true" className="h-4 w-4" />} /><div className="flex flex-col gap-1.5"><label htmlFor="booking-time" className="text-sm font-semibold text-slate-700">Khung giờ *</label><select id="booking-time" value={form.preferredTimeSlot} onChange={(event) => set('preferredTimeSlot', event.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10"><option value="">Chọn khung giờ</option>{TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}</select></div></div>
                <label className="group flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-primary-400 hover:bg-primary-50"><UploadCloud aria-hidden="true" className="h-8 w-8 text-primary-600" /><strong className="mt-3 text-sm text-slate-900">Chọn ảnh hiện trạng</strong><span className="mt-1 text-xs text-slate-600">JPG, PNG, WebP · tối đa 5 ảnh</span><input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => handleFiles(event.target.files)} /></label>
                {previews.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{previews.map((preview, index) => <div key={`${preview.file.name}-${index}`} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"><img src={preview.url} alt={`Ảnh hiện trạng ${index + 1}`} width="240" height="240" className="aspect-square w-full object-cover" /><button type="button" aria-label={`Xóa ảnh ${index + 1}`} onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} className="absolute right-1.5 top-1.5 rounded-full bg-slate-950/80 p-2 text-white"><X aria-hidden="true" className="h-3.5 w-3.5" /></button></div>)}</div>}
                <div><label htmlFor="booking-note" className="text-sm font-semibold text-slate-700">Ghi chú thêm</label><textarea id="booking-note" value={form.note} onChange={(event) => set('note', event.target.value)} rows={3} placeholder="Ví dụ: Gọi trước 30 phút, có chỗ gửi xe..." className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10" /></div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div><p className="text-xs font-black uppercase tracking-[0.16em] text-primary-700">Bước 4</p><h2 id="booking-step-4" className="mt-2 text-2xl font-black text-slate-950">Kiểm tra trước khi gửi</h2><p className="mt-2 text-sm text-slate-600">Sau khi gửi, bạn nhận mã tra cứu duy nhất và email xác nhận.</p></div>
                <div className="grid gap-4 sm:grid-cols-2">{[
                  ['Khách hàng', form.customerName],
                  ['Liên hệ', `${form.customerPhone} · ${form.customerEmail}`],
                  ['Dịch vụ', selectedCategory?.name || form.serviceCategoryId],
                  ['Thiết bị', form.applianceType],
                  ['Khu vực', form.district],
                  ['Lịch mong muốn', `${form.preferredDate} · ${form.preferredTimeSlot}`],
                  ['Ưu tiên', PRIORITIES.find((item) => item.value === form.priority)?.label],
                  ['Hình ảnh', files.length ? `${files.length} ảnh` : 'Không có'],
                ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><span className="text-[10px] font-black uppercase tracking-wider text-slate-600">{label}</span><strong className="mt-1 block text-sm leading-6 text-slate-900">{value}</strong></div>)}</div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-6 text-blue-900"><ShieldCheck aria-hidden="true" className="mr-2 inline h-4 w-4" />Thông tin liên hệ sẽ không hiển thị đầy đủ trên trang tra cứu. Kỹ thuật viên chỉ nhận thông tin cần thiết sau khi được phân công.</div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
              <Button type="button" variant="outline" disabled={step === 1 || isSubmitting} onClick={() => setStep((value) => Math.max(1, value - 1))} leftIcon={<ChevronLeft aria-hidden="true" className="h-4 w-4" />}>Quay lại</Button>
              {step < 4 ? <Button type="button" onClick={next} rightIcon={<ChevronRight aria-hidden="true" className="h-4 w-4" />}>Tiếp tục</Button> : <Button type="button" onClick={submit} isLoading={isSubmitting} leftIcon={<Check aria-hidden="true" className="h-4 w-4" />}>Gửi yêu cầu</Button>}
            </div>
          </section>

          <div className="mt-5 grid gap-3 text-xs text-slate-600 sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-2xl bg-white p-4"><Clock3 aria-hidden="true" className="h-4 w-4 text-primary-600" />Phản hồi dự kiến trong 30 phút</div>
            <div className="flex items-center gap-2 rounded-2xl bg-white p-4"><Camera aria-hidden="true" className="h-4 w-4 text-primary-600" />Lưu ảnh trước và sau sửa chữa</div>
            <div className="flex items-center gap-2 rounded-2xl bg-white p-4"><ShieldCheck aria-hidden="true" className="h-4 w-4 text-primary-600" />Tra cứu bằng mã và điện thoại</div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
