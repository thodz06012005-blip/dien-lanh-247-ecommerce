import { CheckCircle2, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { getApiErrorMessage } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(token ? 'Đang xác minh email...' : 'Liên kết xác minh không hợp lệ.');
  const setUser = useAuthStore((store) => store.setUser);

  useEffect(() => {
    if (!token) return;
    void api.post('/auth/verify-email', { token })
      .then((response) => {
        const user = response.data?.data?.user;
        if (user) setUser(user);
        const linked = Number(response.data?.data?.linkedCount || 0);
        setMessage(linked > 0 ? `Email đã xác minh và ${linked} yêu cầu cũ đã được liên kết.` : 'Email đã được xác minh thành công.');
        setState('success');
      })
      .catch((error) => {
        setMessage(getApiErrorMessage(error, 'Liên kết xác minh không hợp lệ hoặc đã hết hạn.'));
        setState('error');
      });
  }, [token, setUser]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <section className="w-full max-w-lg rounded-[2.5rem] bg-white p-8 text-center shadow-2xl sm:p-10">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-3xl ${state === 'success' ? 'bg-emerald-50 text-emerald-600' : state === 'error' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-primary-600'}`}>
          {state === 'success' ? <CheckCircle2 className="h-8 w-8" /> : state === 'error' ? <XCircle className="h-8 w-8" /> : <Loader2 className="h-8 w-8 animate-spin motion-reduce:animate-none" />}
        </div>
        <h1 className="mt-6 text-2xl font-black text-slate-950">Xác minh email</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">{message}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/account" className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-black text-white"><ShieldCheck className="h-4 w-4" />Mở tài khoản</Link>
          <Link to="/" className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700">Trang chủ</Link>
        </div>
      </section>
    </main>
  );
}
