import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CalendarDays, Camera, Check, CheckCircle2, Clock3, FileVideo, Info, MapPin, Send, ShieldCheck, Trash2, Upload, UserRound, Wrench } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import type { ServiceCategory } from '../types/service';
import PageTransition from '../components/common/PageTransition';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useSettings } from '../hooks/useSettings';

const DRAFT_KEY = 'dl247-service-booking-draft-v2';
interface BookingForm { customerName: string; customerPhone: string; customerAddress: string; district: string; applianceType: string; serviceCategoryId: string; issueDescription: string; preferredDate: string; preferredTimeSlot: string; note: string; }
interface MediaItem { name: string; type: string; dataUrl: string; size: number; }
const emptyForm: BookingForm = { customerName: '', customerPhone: '', customerAddress: '', district: '', applianceType: '', serviceCategoryId: '', issueDescription: '', preferredDate: '', preferredTimeSlot: '', note: '' };
const formatMoney = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + 'đ';

export default function ServiceBooking() {
  useDocumentTitle('Đặt lịch sửa chữa', 'Đặt lịch sửa chữa điện lạnh trong 3 bước, không cần đăng nhập.');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { showError } = useToastStore();
  const { settings } = useSettings();
  const reduceMotion = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<BookingForm>(() => {
    try { const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); return saved?.form ? { ...emptyForm, ...saved.form, applianceType: searchParams.get('appliance') || saved.form.applianceType } : { ...emptyForm, applianceType: searchParams.get('appliance') || '' }; } catch { return { ...emptyForm, applianceType: searchParams.get('appliance') || '' }; }
  });
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftRestored] = useState(() => Boolean(localStorage.getItem(DRAFT_KEY)));

  const { data: categoriesData } = useQuery({ queryKey: ['service-categories'], queryFn: async () => (await api.get('/service-categories')).data });
  const categories: ServiceCategory[] = categoriesData?.data || [];
  const appliances = settings.businessConfig.appliances.filter(item => item.active);
  const areas = settings.businessConfig.serviceAreas.filter(item => item.active);
  const timeSlots = settings.businessConfig.timeSlots.filter(item => item.active);
  const selectedAppliance = appliances.find(item => item.name === form.applianceType);
  const selectedArea = areas.find(item => item.name === form.district);
  const selectedCategory = categories.find(item => item.id === form.serviceCategoryId);

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => setForm(prev => ({ ...prev, customerName: prev.customerName || [user.firstName, user.lastName].filter(Boolean).join(' '), customerPhone: prev.customerPhone || user.phone || '', customerAddress: prev.customerAddress || user.addressDetail || '', district: prev.district || user.district || '' })), 0);
    return () => window.clearTimeout(timer);
  }, [user]);
  useEffect(() => { const timer = window.setTimeout(() => localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step, updatedAt: new Date().toISOString() })), 250); return () => window.clearTimeout(timer); }, [form, step]);

  const today = useMemo(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }, []);
  const setField = <K extends keyof BookingForm>(key: K, value: BookingForm[K]) => setForm(prev => ({ ...prev, [key]: value }));
  const validateStep = (target: number) => {
    if (target === 1 && (!form.applianceType || !form.serviceCategoryId || !form.issueDescription.trim())) return 'Vui lòng chọn thiết bị, loại dịch vụ và tình trạng đang gặp.';
    if (target === 2 && (!form.district || !form.customerAddress.trim() || !form.preferredDate || !form.preferredTimeSlot || !form.customerName.trim() || !form.customerPhone.trim())) return 'Vui lòng điền đầy đủ khu vực, lịch hẹn và thông tin liên hệ.';
    if (target === 2 && !/^(0|\+84)[0-9]{9,10}$/.test(form.customerPhone.replace(/[\s.-]/g, ''))) return 'Số điện thoại chưa đúng định dạng Việt Nam.';
    return '';
  };
  const next = () => { const message = validateStep(step); if (message) return showError(message); setStep(current => Math.min(3, current + 1)); window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); };

  const addMedia = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (media.length + files.length > 4) { showError('Bạn chỉ có thể gửi tối đa 4 ảnh/video.'); event.target.value = ''; return; }
    const allowed = files.filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'));
    if (allowed.length !== files.length) { showError('Chỉ hỗ trợ file ảnh hoặc video.'); event.target.value = ''; return; }
    if (allowed.some(file => file.size > (file.type.startsWith('video/') ? 500_000 : 250_000))) { showError('Ảnh tối đa 250KB và video tối đa 500KB để gửi yêu cầu nhanh.'); event.target.value = ''; return; }
    const items = await Promise.all(allowed.map(file => new Promise<MediaItem>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve({ name: file.name, type: file.type, dataUrl: String(reader.result), size: file.size }); reader.onerror = reject; reader.readAsDataURL(file); })));
    const total = [...media, ...items].reduce((sum, item) => sum + item.dataUrl.length, 0);
    if (total > 850_000) showError('Tổng dung lượng file vượt giới hạn. Vui lòng chọn file nhỏ hơn.'); else setMedia(prev => [...prev, ...items]);
    event.target.value = '';
  };

  const submit = async () => {
    const message = validateStep(1) || validateStep(2); if (message) { showError(message); return; }
    setIsSubmitting(true);
    try {
      const payload = { ...form, customerPhone: form.customerPhone.replace(/[\s.-]/g, ''), customerName: form.customerName.trim(), customerAddress: form.customerAddress.trim(), issueDescription: form.issueDescription.trim(), note: form.note.trim(), images: media.map(item => item.dataUrl), mediaMetadata: media.map(({ name, type, size }) => ({ name, type, size })) };
      const response = await api.post('/service-requests', payload);
      const requestId = response.data?.data?.id;
      localStorage.removeItem(DRAFT_KEY);
      localStorage.setItem('dl247-last-booking', JSON.stringify({ requestId, phone: payload.customerPhone, form, createdAt: new Date().toISOString() }));
      navigate(`/service-booking/success?requestId=${encodeURIComponent(requestId || '')}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showError(err.response?.data?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally { setIsSubmitting(false); }
  };

  const stepMotion = { initial: reduceMotion ? false : { opacity: 0, x: 18 }, animate: { opacity: 1, x: 0 }, exit: reduceMotion ? undefined : { opacity: 0, x: -12 }, transition: { duration: 0.22 } };
  return <PageTransition><div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="mx-auto mb-8 max-w-2xl text-center"><span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><CalendarDays className="h-6 w-6" /></span><h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Đặt lịch sửa chữa trong 3 bước</h1><p className="mt-2 text-sm leading-6 text-slate-500">Không cần đăng nhập · Tự động lưu thông tin · Xác nhận trong vòng 30 phút</p>{draftRestored && <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" />Đã khôi phục thông tin bạn nhập trước đó</p>}</div>
    <Progress step={step} />
    <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5"><AnimatePresence mode="wait">
      {step === 1 && <motion.section key="step1" {...stepMotion} className="p-5 sm:p-8"><StepHeading icon={Wrench} number="01" title="Thiết bị đang gặp vấn đề" description="Chọn nhanh bằng thẻ, bạn không cần biết tên lỗi kỹ thuật." />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{appliances.map(item => <button key={item.id} type="button" onClick={() => setForm(prev => ({ ...prev, applianceType: item.name, issueDescription: '' }))} className={`relative min-h-24 rounded-2xl border p-4 text-left transition ${form.applianceType === item.name ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md'}`}><Wrench className={`h-5 w-5 ${form.applianceType === item.name ? 'text-blue-600' : 'text-slate-400'}`} /><span className="mt-3 block text-sm font-bold text-slate-900">{item.name}</span>{form.applianceType === item.name && <Check className="absolute right-3 top-3 h-4 w-4 text-blue-600" />}</button>)}</div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2"><Field label="Loại dịch vụ *"><select value={form.serviceCategoryId} onChange={e => setField('serviceCategoryId', e.target.value)} className="form-control"><option value="">Chọn loại dịch vụ</option>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><div /></div>
        {selectedAppliance && <div className="mt-5"><p className="mb-2 text-sm font-semibold text-slate-700">Tình trạng đang gặp *</p><div className="flex flex-wrap gap-2">{selectedAppliance.issues.map(issue => <button key={issue} type="button" onClick={() => setField('issueDescription', issue)} className={`min-h-10 rounded-xl border px-3.5 text-sm font-medium transition ${form.issueDescription === issue ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'}`}>{issue}</button>)}</div><textarea rows={3} value={form.issueDescription} onChange={e => setField('issueDescription', e.target.value)} placeholder="Mô tả thêm dấu hiệu, mã lỗi hoặc thời điểm phát sinh..." className="form-control mt-3 h-auto py-3" /></div>}
        {selectedAppliance && settings.businessConfig.pricing.showPriceRanges && <div className="mt-5 flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4"><Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" /><div><p className="font-bold text-blue-950">Khoảng tham khảo: {formatMoney(selectedAppliance.priceMin)} – {formatMoney(selectedAppliance.priceMax)}</p><p className="mt-1 text-xs leading-5 text-blue-800">{settings.businessConfig.pricing.disclaimer}</p></div></div>}
        <MediaUpload media={media} inputRef={fileInputRef} onAdd={addMedia} onRemove={index => setMedia(items => items.filter((_, i) => i !== index))} />
      </motion.section>}
      {step === 2 && <motion.section key="step2" {...stepMotion} className="p-5 sm:p-8"><StepHeading icon={MapPin} number="02" title="Địa điểm và lịch hẹn" description="Chọn thời gian phù hợp và cho chúng tôi biết cách liên hệ." /><div className="grid gap-5 sm:grid-cols-2"><Field label="Quận/Huyện *"><select value={form.district} onChange={e => setField('district', e.target.value)} className="form-control"><option value="">Chọn khu vực</option>{areas.map(area => <option key={area.id} value={area.name}>{area.name}{area.travelFee ? ` · phí dự kiến ${formatMoney(area.travelFee)}` : ''}</option>)}</select></Field><Input label="Địa chỉ chi tiết *" value={form.customerAddress} onChange={e => setField('customerAddress', e.target.value)} placeholder="Số nhà, đường, phường/xã" /><Input label="Ngày mong muốn *" type="date" min={today} value={form.preferredDate} onChange={e => setField('preferredDate', e.target.value)} /><Field label="Khung giờ *"><select value={form.preferredTimeSlot} onChange={e => setField('preferredTimeSlot', e.target.value)} className="form-control"><option value="">Chọn khung giờ</option>{timeSlots.map(slot => <option key={slot.id} value={slot.label}>{slot.label}</option>)}</select></Field><Input label="Họ và tên *" autoComplete="name" value={form.customerName} onChange={e => setField('customerName', e.target.value)} placeholder="Nguyễn Văn A" /><Input label="Số điện thoại *" type="tel" inputMode="tel" autoComplete="tel" value={form.customerPhone} onChange={e => setField('customerPhone', e.target.value)} placeholder="0912 345 678" /><div className="sm:col-span-2"><Field label="Ghi chú cho kỹ thuật viên"><textarea rows={3} value={form.note} onChange={e => setField('note', e.target.value)} className="form-control h-auto py-3" placeholder="Ví dụ: gọi trước khi đến, nhà ở tầng 3..." /></Field></div></div>{selectedArea?.travelFee ? <div className="mt-5 flex items-center gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><MapPin className="h-5 w-5 text-amber-600" />Phí di chuyển tham khảo tại {selectedArea.name}: <strong>{formatMoney(selectedArea.travelFee)}</strong></div> : null}</motion.section>}
      {step === 3 && <motion.section key="step3" {...stepMotion} className="p-5 sm:p-8"><StepHeading icon={ShieldCheck} number="03" title="Kiểm tra và xác nhận" description="Vui lòng kiểm tra lại trước khi gửi. Bạn vẫn có thể quay lại chỉnh sửa." /><div className="grid gap-4 sm:grid-cols-2"><Summary icon={Wrench} label="Dịch vụ" value={`${selectedCategory?.name || 'Dịch vụ'} · ${form.applianceType}`} detail={form.issueDescription} /><Summary icon={CalendarDays} label="Lịch hẹn" value={`${form.preferredTimeSlot} · ${formatDate(form.preferredDate)}`} detail={`${form.customerAddress}, ${form.district}`} /><Summary icon={UserRound} label="Người liên hệ" value={form.customerName} detail={form.customerPhone} /><Summary icon={Camera} label="Tệp đính kèm" value={media.length ? `${media.length} ảnh/video` : 'Không có tệp'} detail={media.length ? media.map(item => item.name).join(', ') : 'Bạn vẫn có thể gửi yêu cầu bình thường.'} /></div>{selectedAppliance && settings.businessConfig.pricing.showPriceRanges && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="font-bold text-amber-950">Chi phí tham khảo: {formatMoney(selectedAppliance.priceMin)} – {formatMoney(selectedAppliance.priceMax)}</p><p className="mt-2 text-sm leading-6 text-amber-900">{settings.businessConfig.pricing.disclaimer}</p></div>}<div className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><p>Bằng việc gửi yêu cầu, bạn xác nhận thông tin trên là đúng. Điện Lạnh 247 sẽ liên hệ để xác nhận lịch; kỹ thuật viên chỉ sửa chữa sau khi bạn đồng ý chi phí thực tế.</p></div></motion.section>}
    </AnimatePresence>
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 p-4 sm:px-8 sm:py-5"><button type="button" onClick={() => setStep(current => Math.max(1, current - 1))} disabled={step === 1} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-white disabled:invisible"><ArrowLeft className="h-4 w-4" />Quay lại</button>{step < 3 ? <Button type="button" onClick={next} rightIcon={<ArrowRight className="h-4 w-4" />} className="min-h-11 font-bold">Tiếp tục</Button> : <Button type="button" variant="secondary" onClick={submit} isLoading={isSubmitting} leftIcon={<Send className="h-4 w-4" />} className="min-h-11 font-bold">Gửi yêu cầu</Button>}</div>
    </div><p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400"><Clock3 className="h-4 w-4" />Thông tin được tự động lưu trên thiết bị này.</p>
  </div></PageTransition>;
}

function Progress({ step }: { step: number }) { return <div className="mx-auto max-w-2xl"><div className="relative flex justify-between"><div className="absolute left-[12%] right-[12%] top-5 h-0.5 bg-slate-200"><motion.div className="h-full bg-blue-600" animate={{ width: `${((step - 1) / 2) * 100}%` }} /></div>{['Thiết bị & sự cố', 'Lịch hẹn', 'Xác nhận'].map((label, index) => { const number = index + 1; const active = step >= number; return <div key={label} className="relative z-10 flex w-24 flex-col items-center text-center"><span className={`flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#f8fafc] text-sm font-bold transition ${active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{step > number ? <Check className="h-4 w-4" /> : number}</span><span className={`mt-2 text-xs font-semibold ${active ? 'text-blue-700' : 'text-slate-400'}`}>{label}</span></div>; })}</div></div>; }
function StepHeading({ icon: Icon, number, title, description }: { icon: typeof Wrench; number: string; title: string; description: string }) { return <div className="mb-7 flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Icon className="h-6 w-6" /></span><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Bước {number}</p><h2 className="mt-1 text-xl font-bold text-slate-950">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p></div></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">{label}{children}</label>; }
function MediaUpload({ media, inputRef, onAdd, onRemove }: { media: MediaItem[]; inputRef: React.RefObject<HTMLInputElement | null>; onAdd: (e: React.ChangeEvent<HTMLInputElement>) => void; onRemove: (index: number) => void }) { return <div className="mt-6"><div className="mb-2 flex items-end justify-between"><div><p className="text-sm font-semibold text-slate-700">Ảnh/video tình trạng <span className="font-normal text-slate-400">(không bắt buộc)</span></p><p className="mt-1 text-xs text-slate-400">Tối đa 4 tệp · ảnh 250KB · video 500KB</p></div><span className="text-xs font-medium text-slate-400">{media.length}/4</span></div><input ref={inputRef} type="file" accept="image/*,video/*" multiple onChange={onAdd} className="sr-only" /><button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-28 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center transition hover:border-blue-300 hover:bg-blue-50"><Upload className="h-6 w-6 text-blue-600" /><span className="mt-2 text-sm font-semibold text-slate-700">Chọn ảnh hoặc video</span><span className="mt-1 text-xs text-slate-400">Giúp kỹ thuật viên chuẩn bị nhanh hơn</span></button>{media.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-2">{media.map((item, index) => <div key={`${item.name}-${index}`} className="flex items-center gap-3 rounded-xl border border-slate-200 p-2"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">{item.type.startsWith('image/') ? <img src={item.dataUrl} alt="" className="h-full w-full object-cover" /> : <FileVideo className="h-5 w-5 text-blue-600" />}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-700">{item.name}</p><p className="mt-0.5 text-[11px] text-slate-400">{Math.ceil(item.size / 1024)}KB</p></div><button type="button" onClick={() => onRemove(index)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Xóa ${item.name}`}><Trash2 className="h-4 w-4" /></button></div>)}</div>}</div>; }
function Summary({ icon: Icon, label, value, detail }: { icon: typeof Wrench; label: string; value: string; detail: string }) { return <div className="rounded-2xl border border-slate-200 p-4"><div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Icon className="h-5 w-5" /></span><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-bold text-slate-900">{value}</p><p className="mt-1 break-words text-sm leading-5 text-slate-500">{detail}</p></div></div></div>; }
function formatDate(value: string) { if (!value) return ''; return new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }); }
