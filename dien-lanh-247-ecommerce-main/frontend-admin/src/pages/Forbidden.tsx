import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAdminAuthStore } from '../store/adminAuthStore';

export default function Forbidden() {
  const navigate = useNavigate();
  const logout = useAdminAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] px-4 font-sans text-slate-800">
      <div className="w-full max-w-md text-center bg-white border border-slate-200/60 rounded-2xl shadow-xl p-8 relative overflow-hidden">
        {/* Glamour top line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500" />
        
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
          <ShieldAlert className="w-9 h-9" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">403</h1>
        <h2 className="text-lg font-bold text-slate-800 mb-3">Không có quyền truy cập</h2>
        
        <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          Tài khoản của bạn không được phân quyền để truy cập vào tài nguyên này. Vui lòng liên hệ với quản trị viên hệ thống nếu bạn nghĩ đây là một sự nhầm lẫn.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition duration-150 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay về Dashboard</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition duration-150 cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </div>
  );
}
