import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Copy, Home, ImageOff, MailCheck, Search } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';
import Button from '../components/ui/Button';
import useDocumentTitle from '../hooks/useDocumentTitle';

interface SuccessState {
  code?: string;
  phone?: string;
  mediaUploaded?: boolean;
  confirmationSent?: boolean;
}

export default function ServiceBookingSuccess() {
  useDocumentTitle('Gửi yêu cầu thành công');
  const { state } = useLocation();
  const success = (state || {}) as SuccessState;
  let recent: SuccessState = success;
  if (!recent.code) {
    try {
      recent = JSON.parse(sessionStorage.getItem('dl247_last_request') || '{}') as SuccessState;
    } catch {
      recent = {};
    }
  }
  const code = recent.code || '';

  const copyCode = async () => {
    if (code) await navigator.clipboard?.writeText(code);
  };

  return (
    <PageTransition>
      <div className="mx-auto flex min-h-[65vh] max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.section initial={{ opacity: 0, scale: 0.97, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-7 text-center shadow-xl sm:p-12">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-100 blur-3xl" />
          <div className="relative">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 180 }} className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50"><CheckCircle2 className="h-10 w-10 text-emerald-500" /></motion.div>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Tiếp nhận thành công</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Yêu cầu của bạn đã được ghi nhận</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-500">Điện Lạnh 247 sẽ xác nhận lịch và điều phối kỹ thuật viên. Hãy lưu mã dưới đây để theo dõi toàn bộ quá trình.</p>

            {code && <div className="mx-auto mt-7 max-w-md rounded-3xl border border-primary-100 bg-primary-50 p-5"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-500">Mã yêu cầu duy nhất</span><div className="mt-2 flex items-center justify-center gap-2"><strong className="font-mono text-xl font-black tracking-wide text-primary-700 sm:text-2xl">{code}</strong><button type="button" onClick={copyCode} aria-label="Sao chép mã yêu cầu" className="rounded-xl p-2 text-primary-600 hover:bg-white"><Copy className="h-4 w-4" /></button></div></div>}

            <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4"><MailCheck className="h-5 w-5 text-primary-600" /><strong className="mt-2 block text-sm text-slate-900">Email xác nhận</strong><p className="mt-1 text-xs leading-5 text-slate-500">Mã tra cứu và lịch mong muốn đã được gửi tới email đăng ký.</p></div>
              <div className={`rounded-2xl border p-4 ${recent.mediaUploaded === false ? 'border-amber-200 bg-amber-50' : 'border-slate-200'}`}>{recent.mediaUploaded === false ? <ImageOff className="h-5 w-5 text-amber-600" /> : <CheckCircle2 className="h-5 w-5 text-emerald-600" />}<strong className="mt-2 block text-sm text-slate-900">Hình ảnh hiện trạng</strong><p className="mt-1 text-xs leading-5 text-slate-500">{recent.mediaUploaded === false ? 'Yêu cầu đã tạo nhưng ảnh chưa tải được. Bạn có thể bổ sung khi tra cứu.' : 'Ảnh đã được gắn an toàn vào yêu cầu.'}</p></div>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/service-lookup"><Button leftIcon={<Search className="h-4 w-4" />} rightIcon={<ArrowRight className="h-4 w-4" />}>Tra cứu ngay</Button></Link>
              <Link to="/"><Button variant="outline" leftIcon={<Home className="h-4 w-4" />}>Về trang chủ</Button></Link>
            </div>
          </div>
        </motion.section>
      </div>
    </PageTransition>
  );
}
