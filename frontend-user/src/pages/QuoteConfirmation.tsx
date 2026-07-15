import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, FileSignature, ShieldCheck, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '@/services/api';

export default function QuoteConfirmation() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [note, setNote] = useState('');
  const mutation = useMutation({
    mutationFn: async (decision: 'ACCEPT' | 'REJECT') => {
      const response = await api.post('/operations/quotes/confirm', { token, decision, note: note || undefined });
      return response.data?.data ?? response.data;
    },
  });

  return (
    <main className="min-h-[75vh] bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 px-4 py-14 text-white sm:py-20">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.08] shadow-2xl backdrop-blur-xl">
        <div className="border-b border-white/10 p-6 sm:p-9">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-blue-950/30"><FileSignature className="h-7 w-7" /></div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Điện Lạnh 247 · Xác nhận báo giá</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Phản hồi báo giá dịch vụ</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">Xác nhận đồng ý để kỹ thuật viên tiếp tục công việc, hoặc từ chối và ghi rõ nội dung cần điều chỉnh. Liên kết chỉ sử dụng được một lần.</p>
        </div>

        <div className="space-y-6 p-6 sm:p-9">
          {!token && <div className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm font-semibold text-red-100">Liên kết xác nhận không hợp lệ hoặc thiếu token.</div>}
          {mutation.isSuccess ? (
            <div className="rounded-[1.5rem] border border-emerald-300/20 bg-emerald-500/10 p-6 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300" />
              <h2 className="mt-4 text-2xl font-black">Đã ghi nhận phản hồi</h2>
              <p className="mt-2 text-sm leading-7 text-emerald-100">Mã báo giá: <strong>{String((mutation.data as Record<string, unknown>)?.quoteNumber ?? '')}</strong>. Bộ phận điều phối sẽ tiếp tục xử lý theo lựa chọn của bạn.</p>
              <Link to="/service-lookup" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-black text-slate-950">Tra cứu yêu cầu</Link>
            </div>
          ) : (
            <>
              <label className="block"><span className="mb-2 block text-sm font-black">Ghi chú cho bộ phận điều phối</span><textarea value={note} onChange={(event) => setNote(event.target.value)} className="min-h-32 w-full rounded-2xl border border-white/15 bg-slate-950/30 p-4 text-sm text-white outline-none placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-400/10" placeholder="Ví dụ: Đồng ý báo giá; cần đổi loại linh kiện; vui lòng gọi lại trước khi thực hiện..." /></label>
              {mutation.isError && <div className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm font-semibold text-red-100">Không thể ghi nhận phản hồi. Báo giá có thể đã được xử lý hoặc hết hiệu lực.</div>}
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" disabled={!token || mutation.isPending} onClick={() => mutation.mutate('ACCEPT')} className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 text-sm font-black text-white shadow-lg disabled:opacity-40"><ThumbsUp className="h-5 w-5" />Đồng ý báo giá</button>
                <button type="button" disabled={!token || mutation.isPending} onClick={() => mutation.mutate('REJECT')} className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-5 text-sm font-black text-white hover:bg-white/10 disabled:opacity-40"><ThumbsDown className="h-5 w-5" />Yêu cầu điều chỉnh</button>
              </div>
            </>
          )}
          <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 text-xs leading-6 text-slate-300"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" /><p>Liên kết xác nhận được lưu dưới dạng hash, không chứa thông tin thanh toán và không cho phép truy cập hồ sơ nội bộ.</p></div>
        </div>
      </section>
    </main>
  );
}
