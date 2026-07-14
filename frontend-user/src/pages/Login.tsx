import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle2, LockKeyhole, ShieldCheck, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import api, { getApiErrorMessage } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';

const schema = z.object({
  email: z.string().email('Địa chỉ email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});
type LoginForm = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const showSuccess = useToastStore((state) => state.showSuccess);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: LoginForm) => {
    setError('');
    try {
      const response = await api.post('/auth/login', values);
      const user = response.data?.data;
      setUser(user);
      const linked = Number(user?.linkedServiceRequests || 0);
      showSuccess(linked > 0 ? `Đăng nhập thành công. Đã liên kết ${linked} yêu cầu dịch vụ.` : 'Đăng nhập thành công.');
      const returnTo = params.get('returnTo');
      navigate(returnTo?.startsWith('/') ? returnTo : '/account', { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Email hoặc mật khẩu không đúng.'));
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#061527] px-4 py-10 text-white sm:py-14">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(14,165,233,0.22),transparent_32%),radial-gradient(circle_at_85%_80%,rgba(249,115,22,0.18),transparent_28%)]" />
      <Link to="/" className="relative z-10 inline-flex items-center gap-2 text-sm font-bold text-slate-300 transition hover:text-white"><ArrowLeft className="h-4 w-4" />Về trang chủ</Link>
      <div className="relative z-10 mx-auto mt-8 grid max-w-6xl overflow-hidden rounded-[2.75rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden min-h-[650px] flex-col justify-between p-12 lg:flex">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-xl shadow-cyan-500/20"><Wrench className="h-7 w-7" /></div>
            <p className="mt-10 text-xs font-black uppercase tracking-[0.3em] text-cyan-300">Điện Lạnh 247 Customer Hub</p>
            <h1 className="mt-5 max-w-xl text-5xl font-black leading-[1.08]">Mọi dịch vụ, đơn hàng và bảo hành trong một tài khoản.</h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-slate-300">Theo dõi kỹ thuật viên, xem ảnh trước/sau sửa chữa, quản lý địa chỉ và nhận thông báo mà không phải cung cấp lại dữ liệu nhạy cảm.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[['Cookie HttpOnly', 'Token không nằm trong localStorage'], ['Tự làm mới', 'Phiên hết hạn được xử lý tự động'], ['Kiểm soát thiết bị', 'Thu hồi từng phiên đăng nhập']].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4"><CheckCircle2 className="h-5 w-5 text-cyan-300" /><strong className="mt-3 block text-sm">{title}</strong><span className="mt-1 block text-xs leading-5 text-slate-400">{body}</span></div>
            ))}
          </div>
        </section>
        <motion.section initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }} className="bg-white p-7 text-slate-950 sm:p-10 lg:p-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-primary-600"><LockKeyhole className="h-6 w-6" /></div>
          <h2 className="mt-6 text-3xl font-black">Chào mừng trở lại</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Đăng nhập để tiếp tục quản lý hồ sơ và lịch sử của riêng bạn.</p>
          {error && <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700">{error}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <Input label="Email" type="email" autoComplete="email" placeholder="ban@example.com" error={errors.email?.message} {...register('email')} />
            <Input label="Mật khẩu" type="password" autoComplete="current-password" placeholder="Nhập mật khẩu" error={errors.password?.message} {...register('password')} />
            <div className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2 text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-500" />Phiên được bảo vệ</span>
              <Link to="/forgot-password" className="font-black text-primary-600 hover:text-primary-700">Quên mật khẩu?</Link>
            </div>
            <Button type="submit" isLoading={isSubmitting} className="w-full py-3.5 text-sm">Đăng nhập an toàn</Button>
          </form>
          <div className="mt-7 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">Chưa có tài khoản? <Link to="/register" className="font-black text-primary-600">Tạo tài khoản mới</Link></div>
        </motion.section>
      </div>
    </main>
  );
}
