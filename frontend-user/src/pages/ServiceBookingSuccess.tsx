import { Link, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, Check, CheckCircle2, Clock3, Copy, Home, Phone, Search, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import PageTransition from '../components/common/PageTransition';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useSettings } from '../hooks/useSettings';

interface LastBooking { requestId: string; phone: string; form?: { applianceType?: string; issueDescription?: string; preferredDate?: string; preferredTimeSlot?: string; district?: string }; }
export default function ServiceBookingSuccess() {
  useDocumentTitle('Đặt lịch thành công');
  const [searchParams] = useSearchParams();
  const { settings } = useSettings();
  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const last: LastBooking | null = (() => { try { return JSON.parse(localStorage.getItem('dl247-last-booking') || 'null'); } catch { return null; } })();
  const requestId = searchParams.get('requestId') || last?.requestId || '';
  const form = last?.requestId === requestId ? last.form : undefined;
  const copy = async () => { await navigator.clipboard?.writeText(requestId); setCopied(true); window.setTimeout(() => setCopied(false), 2000); };
  return <PageTransition><div className="mx-auto flex min-h-[70vh] max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8"><motion.div initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-6 py-9 text-center text-white sm:px-10"><motion.span initial={reduceMotion ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 220 }} className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-8 ring-white/5"><CheckCircle2 className="h-9 w-9" /></motion.span><h1 className="mt-5 text-2xl font-bold sm:text-3xl">Yêu cầu đã được gửi!</h1><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-emerald-50">Điện Lạnh 247 đã tiếp nhận thông tin và sẽ gọi xác nhận trong vòng 30 phút. Vui lòng để ý điện thoại.</p></div>
    <div className="grid lg:grid-cols-[1fr_.85fr]"><div className="p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Mã yêu cầu của bạn</p><div className="mt-2 flex items-center gap-2"><strong className="text-2xl font-bold tracking-wide text-blue-700">{requestId || 'Đang cập nhật'}</strong>{requestId && <button onClick={copy} className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100" aria-label="Sao chép mã yêu cầu">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button>}</div><p className="mt-2 text-sm text-slate-500">Hãy lưu mã này để tra cứu tiến độ mà không cần đăng nhập.</p>
      {form && <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-5"><Row icon={ShieldCheck} label="Thiết bị" value={`${form.applianceType || ''} · ${form.issueDescription || ''}`} /><Row icon={CalendarDays} label="Lịch mong muốn" value={`${form.preferredTimeSlot || ''}${form.preferredDate ? ` · ${new Date(`${form.preferredDate}T00:00:00`).toLocaleDateString('vi-VN')}` : ''}`} /><Row icon={Clock3} label="Khu vực" value={form.district || ''} /></div>}
    </div><div className="border-t border-slate-200 bg-slate-50/60 p-6 sm:p-8 lg:border-l lg:border-t-0"><h2 className="font-bold text-slate-950">Tiếp theo sẽ diễn ra gì?</h2><ol className="mt-5 space-y-4">{['Điều phối viên kiểm tra và gọi xác nhận thông tin.', 'Kỹ thuật viên phù hợp được phân công theo khu vực.', 'Thợ kiểm tra thực tế và thông báo chi phí trước khi sửa.'].map((item, index) => <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{index + 1}</span>{item}</li>)}</ol><div className="mt-7 space-y-3"><Link to="/track-service" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700"><Search className="h-4 w-4" />Theo dõi yêu cầu</Link><a href={`tel:${settings.hotline.replace(/\s+/g, '')}`} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Phone className="h-4 w-4 text-blue-600" />Gọi {settings.hotline}</a><Link to="/" className="flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800"><Home className="h-4 w-4" />Về trang chủ</Link></div></div></div>
  </motion.div></div></PageTransition>;
}
function Row({ icon: Icon, label, value }: { icon: typeof ShieldCheck; label: string; value: string }) { return <div className="flex items-start gap-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /><div><p className="text-xs font-semibold text-slate-400">{label}</p><p className="mt-0.5 text-sm font-medium text-slate-700">{value}</p></div></div>; }
