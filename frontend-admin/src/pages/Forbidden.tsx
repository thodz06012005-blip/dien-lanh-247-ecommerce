import { ArrowLeft, LogOut, ShieldAlert } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { flatAdminNavigation } from '@/config/adminNavigation';
import { canAccess } from '@/config/adminPermissions';
import { useAdminAuthStore } from '@/store/adminAuthStore';

export default function Forbidden() {
  const navigate = useNavigate();
  const location = useLocation();
  const { permissions, logout } = useAdminAuthStore();
  const fallback = flatAdminNavigation.find((item) => canAccess(permissions, item.permission))?.path ?? '/profile';
  const attempted = (location.state as { from?: string } | null)?.from;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071426] px-4 py-12 text-white">
      <section className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-red-500/15 blur-3xl" />
        <div className="relative">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 text-red-300"><ShieldAlert className="h-8 w-8" /></div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.25em] text-red-300">Error 403</p>
          <h1 className="mt-3 text-3xl font-black">Không có quyền truy cập</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-300">Menu đã được ẩn theo quyền và route guard cũng chặn truy cập trực tiếp. Liên hệ Super Admin khi cần bổ sung phạm vi công việc.</p>
          {attempted && <code className="mt-4 inline-flex max-w-full truncate rounded-lg bg-black/30 px-3 py-1.5 text-xs text-slate-300">{attempted}</code>}
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={() => navigate(fallback, { replace: true })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-slate-950"><ArrowLeft className="h-4 w-4" />Về trang được phép</button>
            <button type="button" onClick={handleLogout} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-5 text-sm font-black text-white hover:bg-white/10"><LogOut className="h-4 w-4" />Đăng xuất</button>
          </div>
        </div>
      </section>
    </main>
  );
}
