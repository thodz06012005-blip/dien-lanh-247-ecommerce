import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, ShieldCheck, Phone, Wrench, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Button from '../ui/Button';
import { useSettings } from '../../hooks/useSettings';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { settings } = useSettings();
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleNavClick = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleLogoutClick = () => {
    onClose();
    logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Trang chủ', path: '/', icon: <ShoppingBag className="w-5 h-5" /> },
    { name: 'Sản phẩm', path: '/products', icon: <ShoppingBag className="w-5 h-5" /> },
    { name: 'Dịch vụ lắp đặt & Sửa chữa', path: '/products?categoryId=dich-vu', icon: <Wrench className="w-5 h-5" /> },
    { name: 'Chính sách bảo hành', path: '/policy/warranty', icon: <ShieldCheck className="w-5 h-5" /> },
    { name: 'Giới thiệu', path: '/about', icon: <Info className="w-5 h-5" /> },
    { name: 'Liên hệ', path: '/contact', icon: <Phone className="w-5 h-5" /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Menu Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="relative w-full max-w-xs h-full bg-white shadow-2xl flex flex-col z-10"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-lg">D</span>
                </div>
                <span className="font-extrabold text-lg tracking-tight text-slate-900">Điện Lạnh 247</span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Profile Summary */}
            <div className="px-6 py-6 bg-slate-50 border-b border-slate-100">
              {isAuthenticated ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                      {(user?.firstName || 'K').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-none">
                        {user?.firstName} {user?.lastName}
                      </h4>
                      <p className="text-2xs text-slate-450 mt-1">{user?.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNavClick('/account')}
                      className="py-1.5"
                    >
                      Tài khoản
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogoutClick}
                      className="py-1.5 text-xs text-red-500 hover:bg-red-50"
                    >
                      Đăng xuất
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-slate-500 leading-normal">
                    Đăng nhập tài khoản để quản lý đơn hàng và nhận nhiều ưu đãi mua sắm.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleNavClick('/login')}
                    className="w-full"
                  >
                    Đăng nhập / Đăng ký
                  </Button>
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <div className="flex-grow overflow-y-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.path)}
                  className="flex items-center gap-3.5 px-4 py-3 text-slate-700 hover:bg-primary-50 hover:text-primary-600 rounded-xl text-sm font-semibold transition-all text-left w-full cursor-pointer"
                >
                  <span className="text-slate-400 group-hover:text-primary-500 transition-colors">
                    {link.icon}
                  </span>
                  {link.name}
                </button>
              ))}
            </div>

            {/* Quick Hotline Info */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-2">
              <span className="text-3xs font-bold text-slate-400 tracking-wider uppercase">
                Tư vấn kỹ thuật 24/7
              </span>
              <a
                href={`tel:${settings.hotline.replace(/\s+/g, '')}`}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors font-extrabold text-base"
              >
                <Phone className="w-4 h-4 fill-primary-600/10" />
                {settings.hotline}
              </a>
              <span className="text-3xs text-slate-405 leading-normal">
                Miễn phí cuộc gọi. Hỗ trợ sự cố khẩn cấp lắp ráp bảo dưỡng trong 2 giờ.
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
