import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Snowflake, AlertCircle, Loader2 } from 'lucide-react';
import { useAdminAuthStore } from '../store/adminAuthStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const adminLogin = useAdminAuthStore((state) => state.login);
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  const checkAuth = useAdminAuthStore((state) => state.checkAuth);

  React.useEffect(() => {
    if (isAuthenticated && checkAuth()) {
      navigate('/');
    }
  }, [isAuthenticated, checkAuth, navigate]);

  const validateEmail = (val: string) => {
    return /\S+@\S+\.\S+/.test(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Định dạng email không hợp lệ.');
      return;
    }

    setLoading(true);

    try {
      const result = await adminLogin(email, password);
      setLoading(false);

      if (result.success) {
        navigate('/');
      } else {
        setError(result.message);
      }
    } catch {
      setLoading(false);
      setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    }
  };

  const fillCredentials = () => {
    setEmail('owner@dienlanh247.vn');
    setPassword('Admin@123');
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0c1b30] via-[#081526] to-[#040b14] px-4 py-12 relative overflow-hidden font-sans">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand / Logo */}
        <div className="flex flex-col items-center mb-8 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/25 mb-4 border border-cyan-300/20">
            <Snowflake className="w-8 h-8 text-white animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight text-center">
            Điện Lạnh 247
          </h1>
          <p className="text-slate-400 text-sm mt-1 text-center font-medium">
            Hệ thống Quản trị & Điều phối dịch vụ
          </p>
        </div>

        {/* Login Glassmorphism Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          {/* Card subtle top glare line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
          
          <h2 className="text-lg font-bold text-white mb-6">Đăng nhập Quản trị</h2>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-500/15 border border-red-500/30 text-red-200 p-3.5 rounded-xl text-xs leading-relaxed animate-shake">
              <AlertCircle className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Tài khoản Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@dienlanh247.vn"
                  className="block w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 hover:border-white/20 focus:border-cyan-400 focus:bg-white/[0.08] text-white rounded-xl text-sm placeholder-slate-500 outline-none transition duration-200"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 hover:border-white/20 focus:border-cyan-400 focus:bg-white/[0.08] text-white rounded-xl text-sm placeholder-slate-500 outline-none transition duration-200"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-cyan-900/20 hover:shadow-cyan-400/10 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <span>Đăng nhập</span>
              )}
            </button>
          </form>
        </div>

        {/* Demo Credentials Box */}
        {import.meta.env.DEV && (
          <div className="mt-6 bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-xl p-5 text-xs text-slate-400 text-center space-y-3">
            <p className="font-semibold text-slate-300">Tài khoản quản trị thử nghiệm (Security-1B):</p>
            <button
              onClick={fillCredentials}
              className="w-full max-w-xs mx-auto px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/20 rounded-lg text-slate-300 hover:text-cyan-300 transition text-[11px] font-medium text-center flex flex-col justify-center items-center cursor-pointer shadow-sm"
            >
              <span className="font-bold text-white">owner@dienlanh247.vn</span>
              <span>Mật khẩu: Admin@123</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
