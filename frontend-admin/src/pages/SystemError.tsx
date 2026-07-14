import { LifeBuoy, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SystemError() {
  const navigate = useNavigate();
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white">
      <section className="w-full max-w-xl rounded-[2rem] border border-red-400/15 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 text-red-300"><LifeBuoy className="h-8 w-8" /></div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.25em] text-red-300">Error 500</p>
        <h1 className="mt-3 text-3xl font-black">Hệ thống quản trị đang gián đoạn</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-300">Không thể hoàn tất yêu cầu hiện tại. Hãy thử tải lại; dữ liệu chưa gửi sẽ không được ghi vào hệ thống.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-slate-950"><RefreshCw className="h-4 w-4" />Thử lại</button>
          <button type="button" onClick={() => navigate('/')} className="min-h-11 rounded-xl border border-white/15 px-5 text-sm font-black text-white hover:bg-white/10">Về Dashboard</button>
        </div>
      </section>
    </main>
  );
}
