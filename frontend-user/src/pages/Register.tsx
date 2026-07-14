import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle2, ShieldCheck, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import api, { getApiErrorMessage } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';

const schema = z.object({
  firstName: z.string().min(2, 'Tên tối thiểu 2 ký tự').max(80),
  lastName: z.string().min(2, 'Họ tối thiểu 2 ký tự').max(80),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/, 'Số điện thoại Việt Nam không hợp lệ'),
  password: z.string().min(10, 'Mật khẩu tối thiểu 10 ký tự').regex(/[a-z]/, 'Cần chữ thường').regex(/[A-Z]/, 'Cần chữ hoa').regex(/[0-9]/, 'Cần chữ số'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((accepted) => accepted, 'Bạn cần đồng ý điều khoản'),
}).refine((value) => value.password === value.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp', path: ['confirmPassword'],
});
type RegisterForm = z.infer<typeof schema>;

export default function Register() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const showSuccess = useToastStore((state) => state.showSuccess);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: { acceptTerms: false },
  });

  const onSubmit = async (values: RegisterForm) => {
    setError('');
    try {
      const response = await api.post('/auth/register', {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        password: values.password,
      });
      const user = response.data?.data?.user;
      setUser(user);
      showSuccess('Tài khoản đã được tạo. Hãy kiểm tra email để xác minh và liên kết lịch sử dịch vụ.');
      navigate('/account', { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.'));
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(59,130,246,0.24),transparent_32%),radial-gradient(circle_at_90%_75%,rgba(34,211,238,0.16),transparent_30%)]" />
      <Link to="/" className="relative z-10 inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4" />Về trang chủ</Link>
      <div className="relative z-10 mx-auto mt-7 grid max-w-6xl overflow-hidden rounded-[2.75rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden flex-col justify-between p-12 lg:flex">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-xl shadow-orange-500/20"><UserPlus className="h-7 w-7" /></div>
            <p className="mt-10 text-xs font-black uppercase tracking-[0.3em] text-orange-300">Một tài khoản, toàn bộ hành trình</p>
            <h1 className="mt-5 text-4xl font-black leading-tight">Không còn phải tìm mã yêu cầu trong tin nhắn cũ.</h1>
            <p className="mt-5 text-sm leading-7 text-slate-300">Xác minh email hoặc chứng minh số điện thoại của yêu cầu để hệ thống tự động gom lịch sử sửa chữa về đúng tài khoản.</p>
          </div>
          <div className="space-y-4">
            {['Theo dõi yêu cầu và đơn hàng theo thời gian thực', 'Lưu nhiều địa chỉ và chọn địa chỉ mặc định', 'Đánh giá dịch vụ, đọc thông báo và quản lý thiết bị đăng nhập'].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" /><span className="text-sm leading-6 text-slate-200">{item}</span></div>
            ))}
          </div>
        </section>
        <motion.section initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }} className="bg-white p-7 text-slate-950 sm:p-10 lg:p-12">
          <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-primary-600"><ShieldCheck className="h-6 w-6" /></div><div><h2 className="text-2xl font-black">Tạo tài khoản</h2><p className="text-sm text-slate-500">Bảo mật bằng cookie HttpOnly và token rotation.</p></div></div>
          {error && <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700">{error}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Họ" autoComplete="family-name" error={errors.lastName?.message} {...register('lastName')} />
              <Input label="Tên" autoComplete="given-name" error={errors.firstName?.message} {...register('firstName')} />
            </div>
            <Input label="Email" type="email" autoComplete="email" placeholder="ban@example.com" error={errors.email?.message} {...register('email')} />
            <Input label="Số điện thoại" autoComplete="tel" placeholder="0912345678" error={errors.phone?.message} {...register('phone')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Mật khẩu" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
              <Input label="Xác nhận" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
            </div>
            <p className="text-xs leading-5 text-slate-500">Ít nhất 10 ký tự, gồm chữ hoa, chữ thường và chữ số.</p>
            <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600"><input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600" {...register('acceptTerms')} /><span>Tôi đồng ý với <Link to="/policy/terms" className="font-bold text-primary-600">Điều khoản</Link> và <Link to="/policy/privacy" className="font-bold text-primary-600">Chính sách bảo mật</Link>.</span></label>
            {errors.acceptTerms && <p className="text-xs font-bold text-red-600">{errors.acceptTerms.message}</p>}
            <Button type="submit" isLoading={isSubmitting} className="w-full py-3.5">Tạo tài khoản an toàn</Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">Đã có tài khoản? <Link to="/login" className="font-black text-primary-600">Đăng nhập</Link></p>
        </motion.section>
      </div>
    </main>
  );
}
