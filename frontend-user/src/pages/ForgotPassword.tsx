import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import api, { getApiErrorMessage } from '@/services/api';

const schema = z.object({ email: z.string().email('Email không hợp lệ') });
type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setError('');
    try {
      await api.post('/auth/forgot-password', values);
      setSubmitted(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể gửi yêu cầu lúc này.'));
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.2),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.16),transparent_30%)]" />
      <Link to="/login" className="relative z-10 inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Quay lại đăng nhập
      </Link>
      <div className="relative z-10 mx-auto mt-10 grid max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl md:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden bg-gradient-to-br from-cyan-500/20 to-blue-700/20 p-10 md:block">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950"><ShieldCheck className="h-7 w-7" /></div>
          <h1 className="mt-8 text-3xl font-black">Khôi phục quyền truy cập an toàn</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">Liên kết đặt lại chỉ dùng một lần, hết hạn sau 30 phút và mọi phiên cũ sẽ bị thu hồi sau khi đổi mật khẩu.</p>
        </section>
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-7 text-slate-900 sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-primary-600"><KeyRound className="h-6 w-6" /></div>
          <h2 className="mt-6 text-2xl font-black">Quên mật khẩu?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Nhập email tài khoản. Vì lý do bảo mật, hệ thống luôn trả cùng một thông báo dù email có tồn tại hay không.</p>
          {submitted ? (
            <div className="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
              <Mail className="h-7 w-7 text-emerald-600" />
              <h3 className="mt-4 font-black text-emerald-900">Kiểm tra hộp thư của bạn</h3>
              <p className="mt-2 text-sm leading-6 text-emerald-800">Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.</p>
              <Link to="/login" className="mt-5 inline-flex font-black text-primary-600">Trở về đăng nhập</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              {error && <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
              <Input label="Email tài khoản" type="email" placeholder="ban@example.com" error={errors.email?.message} {...register('email')} />
              <Button type="submit" isLoading={isSubmitting} className="w-full py-3.5">Gửi liên kết bảo mật</Button>
            </form>
          )}
        </motion.section>
      </div>
    </main>
  );
}
