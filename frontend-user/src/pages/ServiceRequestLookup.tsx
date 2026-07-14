import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Image as ImageIcon,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
  Wrench,
} from 'lucide-react';
import { lookupServiceRequest } from '@/services/serviceRequestApi';
import type { ServiceRequest, ServiceRequestStatus } from '@/types/service';
import Breadcrumb from '@/components/common/Breadcrumb';
import PageTransition from '@/components/common/PageTransition';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import useDocumentTitle from '@/hooks/useDocumentTitle';

const statusLabels: Record<ServiceRequestStatus, string> = {
  NEW: 'Mới tiếp nhận',
  CONFIRMED: 'Đã xác nhận',
  ASSIGNED: 'Đã phân công',
  IN_PROGRESS: 'Đang sửa chữa',
  WAITING_PARTS: 'Chờ linh kiện',
  COMPLETED: 'Đã hoàn thành',
  WARRANTY: 'Đang bảo hành',
  CLOSED: 'Đã đóng',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Từ chối tiếp nhận',
  RESCHEDULED: 'Đã hẹn lại',
};

const statusClass: Record<ServiceRequestStatus, string> = {
  NEW: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  ASSIGNED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  IN_PROGRESS: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  WAITING_PARTS: 'bg-orange-50 text-orange-700 border-orange-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  WARRANTY: 'bg-violet-50 text-violet-700 border-violet-200',
  CLOSED: 'bg-slate-100 text-slate-700 border-slate-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  RESCHEDULED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

export default function ServiceRequestLookup() {
  useDocumentTitle('Tra cứu yêu cầu sửa chữa', 'Tra cứu tiến độ bằng mã yêu cầu và số điện thoại đã đăng ký.');
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const recent = JSON.parse(sessionStorage.getItem('dl247_last_request') || 'null') as { code?: string; phone?: string } | null;
      if (recent?.code) setCode(recent.code);
      if (recent?.phone) setPhone(recent.phone);
    } catch {
      // Ignore invalid session data.
    }
  }, []);

  const groupedMedia = useMemo(() => {
    const groups = new Map<string, NonNullable<ServiceRequest['media']>>();
    (result?.media || []).forEach((item) => groups.set(item.stage, [...(groups.get(item.stage) || []), item]));
    return groups;
  }, [result]);

  const lookup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim() || !phone.trim()) {
      setError('Vui lòng nhập mã yêu cầu và số điện thoại.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await lookupServiceRequest(code.trim().toUpperCase(), phone.trim());
      setResult(response.data);
      sessionStorage.setItem('dl247_last_request', JSON.stringify({ code: code.trim().toUpperCase(), phone: phone.trim() }));
    } catch (caught: unknown) {
      const message = (caught as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(message || 'Không tìm thấy yêu cầu với thông tin đã cung cấp.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ name: 'Tra cứu yêu cầu' }]} />
        <section className="grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm lg:grid-cols-[0.8fr_1.2fr]">
          <div className="relative overflow-hidden bg-slate-950 p-7 text-white sm:p-10">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300"><ShieldCheck className="h-3.5 w-3.5" /> Tra cứu bảo mật</span>
              <h1 className="mt-5 text-3xl font-black leading-tight">Theo dõi yêu cầu sửa chữa</h1>
              <p className="mt-3 text-sm leading-7 text-slate-300">Chỉ mã yêu cầu và số điện thoại khớp mới xem được tiến độ. Địa chỉ, email và số điện thoại đầy đủ không bao giờ được trả về.</p>
              <form onSubmit={lookup} className="mt-8 space-y-4">
                <Input label="Mã yêu cầu" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="DL247-260714-A1B2C3" leftIcon={<Search className="h-4 w-4" />} className="border-white/15 bg-white/10 text-white placeholder:text-slate-500 focus:border-cyan-400" />
                <Input label="Số điện thoại đã đăng ký" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0912345678" leftIcon={<Phone className="h-4 w-4" />} className="border-white/15 bg-white/10 text-white placeholder:text-slate-500 focus:border-cyan-400" />
                {error && <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-xs font-semibold text-red-200">{error}</div>}
                <Button type="submit" isLoading={loading} fullWidth leftIcon={<Search className="h-4 w-4" />}>Tra cứu trạng thái</Button>
              </form>
            </div>
          </div>

          <div className="min-h-[520px] bg-slate-50 p-5 sm:p-8">
            {!result ? <div className="flex min-h-[460px] flex-col items-center justify-center text-center"><div className="flex h-20 w-20 items-center justify-center rounded-[2rem] border border-slate-200 bg-white text-slate-300 shadow-sm"><Wrench className="h-9 w-9" /></div><h2 className="mt-5 text-xl font-black text-slate-900">Thông tin tiến độ sẽ hiển thị tại đây</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Hệ thống chỉ hiển thị dữ liệu cần thiết cho việc theo dõi và đã che thông tin liên hệ nhạy cảm.</p></div> : <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div><span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Mã yêu cầu</span><h2 className="mt-1 text-xl font-black text-slate-950">{result.code || result.id}</h2><p className="mt-1 text-xs text-slate-500">Cập nhật {new Date(result.updatedAt).toLocaleString('vi-VN')}</p></div>
                <span className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-black ${statusClass[result.status]}`}>{statusLabels[result.status]}</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Info icon={UserRound} label="Khách hàng" value={result.customerName || 'Đã ẩn'} />
                <Info icon={Phone} label="Liên hệ" value={`${result.customerPhone || 'Đã ẩn'}${result.customerEmail ? ` · ${result.customerEmail}` : ''}`} />
                <Info icon={Wrench} label="Dịch vụ" value={`${result.serviceCategory?.name || 'Dịch vụ điện lạnh'} · ${result.applianceType}`} />
                <Info icon={MapPin} label="Khu vực" value={result.district || 'Đã ẩn địa chỉ chi tiết'} />
                <Info icon={CalendarDays} label="Ngày mong muốn" value={result.preferredDate} />
                <Info icon={Clock3} label="Khung giờ" value={result.preferredTimeSlot} />
              </div>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary-600" /><h3 className="font-black text-slate-900">Lịch sử xử lý</h3></div><div className="mt-5 space-y-0">{(result.timeline || []).map((event, index) => <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0"><div className="relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full bg-primary-500 ring-4 ring-primary-50" />{index < (result.timeline?.length || 0) - 1 && <div className="absolute left-[5px] top-4 h-full w-px bg-slate-200" />}<div><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-slate-900">{statusLabels[event.toStatus]}</strong><span className="text-[10px] text-slate-400">{new Date(event.createdAt).toLocaleString('vi-VN')}</span></div>{event.note && <p className="mt-1 text-xs leading-5 text-slate-500">{event.note}</p>}</div></div>)}</div></section>

              {groupedMedia.size > 0 && <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary-600" /><h3 className="font-black text-slate-900">Hình ảnh quá trình</h3></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{Array.from(groupedMedia.values()).flat().map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-2xl border border-slate-200"><img src={item.url} alt={item.caption || 'Ảnh yêu cầu dịch vụ'} className="aspect-square w-full object-cover transition group-hover:scale-105" /><div className="p-2 text-[10px] font-bold text-slate-500">{item.stage.replaceAll('_', ' ')}</div></a>)}</div></section>}
            </motion.div>}
          </div>
        </section>
      </div>
    </PageTransition>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400"><Icon className="h-3.5 w-3.5" />{label}</div><strong className="mt-2 block text-sm leading-6 text-slate-900">{value}</strong></div>;
}
