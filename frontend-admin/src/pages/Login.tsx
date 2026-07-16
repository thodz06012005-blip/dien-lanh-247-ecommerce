import { AlertCircle, Eye, EyeOff, Lock, Mail, ShieldCheck, Snowflake, Sparkles } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAdminAuthStore } from '@/store/adminAuthStore';

export default function Login() {
  const [email, setEmail] = useState('owner@dienlanh247.vn');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, bootstrap, isAuthenticated, isInitialized, isLoading } = useAdminAuthStore();
  const returnTo = searchParams.get('returnTo') || '/';

  useEffect(() => {
    if (!isInitialized) void bootstrap();
  }, [bootstrap, isInitialized]);

  useEffect(() => {
    if (isInitialized && isAuthenticated) navigate(returnTo, { replace: true });
  }, [isAuthenticated, isInitialized, navigate, returnTo]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !password) return setError('Vui lòng nhập đầy đủ email và mật khẩu.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Định dạng email không hợp lệ.');
    const result = await login(email.trim(), password);
    if (result.success) navigate(returnTo, { replace: true });
    else setError(result.message);
  };

  return (
    <main className="grid min-h-screen bg-[#061221] text-white lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden border-r border-white/5 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_85%_75%,rgba(37,99,235,0.2),transparent_35%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.2)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="relative">
          <div className="inline-flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-xl shadow-cyan-500/20"><Snowflake className="h-6 w-6" /></div><div><strong className="text-lg font-black">Điện Lạnh 247</strong><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Admin Workspace</p></div></div>
          <div className="mt-24 max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-black text-cyan-200"><Sparkles className="h-3.5 w-3.5" />Điều hành tập trung</span>
            <h1 className="mt-6 text-5xl font-black leading-[1.08] tracking-tight">Quản trị vận hành,<br /><span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">ra quyết định nhanh.</span></h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-slate-300">Theo dõi đơn hàng, điều phối kỹ thuật viên, quản lý nội dung và kiểm soát dữ liệu theo đúng phạm vi quyền của từng vai trò.</p>
          </div>
        </div>
        <div className="relative grid grid-cols-3 gap-3">
          {['Cookie HttpOnly', 'Permission Guard', 'Session Rotation'].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"><ShieldCheck className="h-5 w-5 text-cyan-300" /><strong className="mt-3 block text-xs">{item}</strong></div>)}
        </div>
      </section>

      <section className="relative flex items-center justify-center overflow-hidden px-4 py-12 sm:px-8">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="relative w-full max-w-md">
          <div className="mb-8 lg:hidden"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600"><Snowflake className="h-5 w-5" /></div><div><strong className="text-lg font-black">Điện Lạnh 247</strong><p className="text-xs text-slate-400">Admin Workspace</p></div></div></div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Secure sign in</p>
            <h2 className="mt-3 text-3xl font-black">Đăng nhập quản trị</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Phiên sẽ được xác minh trên server và tự làm mới khi access token hết hạn.</p>

            {error && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <label className="block space-y-2"><span className="text-xs font-black uppercase tracking-wider text-slate-300">Email quản trị</span><div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="owner@dienlanh247.vn" className="min-h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:bg-white/[0.08] focus:ring-4 focus:ring-cyan-400/10" /></div></label>
              <label className="block space-y-2"><span className="text-xs font-black uppercase tracking-wider text-slate-300">Mật khẩu</span><div className="relative"><Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Nhập mật khẩu" className="min-h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:bg-white/[0.08] focus:ring-4 focus:ring-cyan-400/10" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-white/10 hover:text-white" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
              <button type="submit" disabled={isLoading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-sm font-black text-white shadow-lg shadow-blue-900/30 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60">{isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none" />}{isLoading ? 'Đang xác thực...' : 'Đăng nhập an toàn'}</button>
            </form>
          </div>
          <p className="mt-6 text-center text-xs leading-6 text-slate-500">Không chia sẻ tài khoản quản trị. Mọi lần đăng nhập và thao tác nhạy cảm đều được ghi audit log.</p>
        </div>
      </section>
    </main>
  );
}
