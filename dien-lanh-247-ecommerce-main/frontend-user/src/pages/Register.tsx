import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useToastStore } from '../store/toastStore';
import api from '../services/api';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { ArrowLeft } from 'lucide-react';

const registerSchema = z.object({
  firstName: z.string().min(2, 'Tên tối thiểu phải có 2 ký tự'),
  lastName: z.string().min(2, 'Họ tối thiểu phải có 2 ký tự'),
  email: z.string().email('Địa chỉ email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const { showSuccess } = useToastStore();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError('');
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      };
      const response = await api.post('/auth/register', payload);
      if (response.data?.success) {
        showSuccess('Đăng ký tài khoản thành công! Vui lòng đăng nhập lại.');
        navigate('/login');
      } else {
        setError(response.data?.message || 'Đăng ký thất bại.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <Link to="/" className="absolute top-6 left-6 inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-primary-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Về trang chủ
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100/80 flex flex-col gap-6"
      >
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-md shadow-primary-500/20">
              <span className="text-white font-black text-xl">D</span>
            </div>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
            Tạo tài khoản mới
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            Đã có tài khoản Điện Lạnh 247?{' '}
            <Link to="/login" className="font-bold text-primary-600 hover:text-primary-700 transition-colors">
              Đăng nhập ngay
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-2xs text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Họ"
              placeholder="Nguyễn"
              error={errors.lastName?.message}
              {...register('lastName')}
            />

            <Input
              label="Tên"
              placeholder="Văn A"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
          </div>

          <Input
            label="Địa chỉ Email"
            placeholder="Ví dụ: email@gmail.com"
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            type="password"
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu"
            type="password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full py-3.5 rounded-xl font-bold mt-2 shadow-md shadow-primary-500/15"
          >
            Đăng ký tài khoản
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
