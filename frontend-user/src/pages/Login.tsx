import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import api from '../services/api';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { ArrowLeft } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Địa chỉ email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const { showSuccess } = useToastStore();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', data);
      if (response.data?.success) {
        // According to standard contract, user is in response.data.data
        setUser(response.data.data);
        showSuccess('Đăng nhập thành công! Chào mừng bạn quay trở lại.');
        navigate('/');
      } else {
        setError(response.data?.message || 'Đăng nhập thất bại.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Sai email hoặc mật khẩu. Tài khoản mẫu: user@gmail.com / 123456');
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
            Đăng nhập tài khoản
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-bold text-primary-600 hover:text-primary-700 transition-colors">
              Đăng ký tài khoản mới
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-2xs text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Địa chỉ Email"
            placeholder="Ví dụ: user@gmail.com"
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

          <div className="flex justify-between items-center text-xs mt-1">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 select-none">
              <input type="checkbox" className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300" />
              <span>Ghi nhớ</span>
            </label>
            <a href="#" className="font-bold text-slate-500 hover:text-primary-600 transition-colors">
              Quên mật khẩu?
            </a>
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full py-3.5 rounded-xl font-bold mt-2 shadow-md shadow-primary-500/15"
          >
            Đăng nhập
          </Button>
        </form>

        {/* Guest credentials help tip */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-3xs text-slate-500 leading-normal">
          <p className="font-bold text-slate-700 mb-1">Tài khoản demo:</p>
          <p>• Email: <strong>user@gmail.com</strong></p>
          <p>• Mật khẩu: <strong>123456</strong></p>
        </div>
      </motion.div>
    </div>
  );
}
