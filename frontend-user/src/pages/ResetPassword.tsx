import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, KeyRound, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import api, { getApiErrorMessage } from '@/services/api';

const schema = z.object({
  newPassword: z.string().min(10, 'Mật khẩu tối thiểu 10 ký tự').regex(/[a-z]/, 'Cần chữ thường').regex(/[A-Z]/, 'Cần chữ hoa').regex(/[0-9]/, 'Cần chữ số'),
  confirmPassword: z.string(),
}).refine((value) => value.newPassword === value.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp', path: ['confirmPassword'],
});
type FormValues = z.infer<typeof schema>;

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const submit = async (values: FormValues) => {
    setError('');
    try {
      await api.post('/auth/reset-password', { token, newPassword: values.newPassword });
      setDone(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Liên kết không hợp lệ hoặc đã hết hạn.'));
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <motion.section initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-white p-7 shadow-2xl sm:p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-primary-600">{done ? <CheckCircle2 className="h-7 w-7" /> : <KeyRound className="h-7 w-7" />}</div>
        <h1 className="mt-6 text-2xl font-black text-slate-950">{done ? 'Mật khẩu đã được thay đổi' : 'Tạo mật khẩu mới'}</h1>
        {done ? (
          <div className="mt-5">
            <p className="text-sm leading-7 text-slate-600">Tất cả phiên đăng nhập cũ đã được thu hồi. Hãy đăng nhập lại bằng mật khẩu mới.</p>
            <Link to="/login" className="mt-6 inline-flex rounded-xl bg-primary-600 px-5 py-3 text-sm font-black text-white">Đăng nhập lại</Link>
          </div>
        ) : token ? (
          <form onSubmit={handleSubmit(submit)} className="mt-7 space-y-5">
            <p className="text-sm leading-6 text-slate-500">Mật khẩu cần ít nhất 10 ký tự, gồm chữ hoa, chữ thường và chữ số.</p>
            {error && <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
            <Input label="Mật khẩu mới" type="password" error={errors.newPassword?.message} {...register('newPassword')} />
            <Input label="Xác nhận mật khẩu" type="password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
            <Button type="submit" isLoading={isSubmitting} className="w-full py-3.5">Đặt lại mật khẩu</Button>
          </form>
        ) : (
          <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-5 text-amber-900">
            <ShieldAlert className="h-6 w-6" />
            <p className="mt-3 text-sm">Liên kết đặt lại mật khẩu không có token hợp lệ.</p>
            <Link to="/forgot-password" className="mt-4 inline-flex font-black text-primary-600">Yêu cầu liên kết mới</Link>
          </div>
        )}
      </motion.section>
    </main>
  );
}
