import { ArrowLeft, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071426] px-4 py-12 text-white">
      <section className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/15 text-cyan-300"><Compass className="h-8 w-8" /></div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Error 404</p>
          <h1 className="mt-3 text-3xl font-black">Không tìm thấy trang quản trị</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-300">Đường dẫn có thể đã thay đổi, bị xóa hoặc không thuộc module đang được triển khai.</p>
          <button type="button" onClick={() => navigate('/')} className="mx-auto mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-slate-950 transition hover:-translate-y-0.5"><ArrowLeft className="h-4 w-4" />Về Dashboard</button>
        </div>
      </section>
    </main>
  );
}
