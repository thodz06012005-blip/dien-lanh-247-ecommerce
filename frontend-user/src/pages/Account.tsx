import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Save, LogOut, ClipboardList } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Breadcrumb from '../components/common/Breadcrumb';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface ProfileFormInput {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  district: string;
  addressDetail: string;
}

export default function Account() {
  const { user, isAuthenticated, setUser, logout } = useAuthStore();
  const { showSuccess } = useToastStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'address'>('profile');
  const [isUpdating, setIsUpdating] = useState(false);

  // Form handling
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormInput>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      city: user?.city || '',
      district: user?.district || '',
      addressDetail: user?.addressDetail || '',
    },
  });

  const onSubmitProfile = (data: ProfileFormInput) => {
    if (!user) return;
    setIsUpdating(true);
    
    // Simulate API update call
    setTimeout(() => {
      const updatedUser = {
        ...user,
        ...data,
      };
      setUser(updatedUser);
      showSuccess('Cập nhật thông tin tài khoản thành công!');
      setIsUpdating(false);
    }, 400);
  };

  const handleLogout = () => {
    logout();
    showSuccess('Đăng xuất tài khoản thành công!');
    navigate('/');
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
          <User className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Bạn chưa đăng nhập</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-sm leading-relaxed">
          Vui lòng đăng nhập tài khoản của bạn để quản lý hồ sơ cá nhân, sổ địa chỉ và theo dõi lịch sử đơn hàng.
        </p>
        <div className="flex gap-4 mt-6">
          <Button variant="outline" onClick={() => navigate('/')}>
            Về trang chủ
          </Button>
          <Button variant="primary" onClick={() => navigate('/login')}>
            Đăng nhập ngay
          </Button>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [{ name: 'Tài khoản cá nhân' }];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbItems} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Account Navigation Panel */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100/80 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center font-black text-lg shadow-inner">
              {(user.firstName || 'K').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-none">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-2xs text-slate-400 mt-1">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left cursor-pointer transition-all ${
                activeTab === 'profile'
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-slate-650 hover:bg-slate-50'
              }`}
            >
              <User className="w-4.5 h-4.5" />
              <span>Thông tin tài khoản</span>
            </button>

            <button
              onClick={() => setActiveTab('address')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left cursor-pointer transition-all ${
                activeTab === 'address'
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-slate-650 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-4.5 h-4.5" />
              <span>Sổ địa chỉ giao hàng</span>
            </button>

            <button
              onClick={() => navigate('/orders')}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-left text-slate-650 hover:bg-slate-50 cursor-pointer transition-all"
            >
              <ClipboardList className="w-4.5 h-4.5" />
              <span>Lịch sử đơn hàng</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-500 hover:bg-red-50 cursor-pointer mt-4 border-t border-slate-50 pt-4"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span>Đăng xuất tài khoản</span>
            </button>
          </div>
        </div>

        {/* Right Side: Tab Contents */}
        <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-3xl border border-slate-100/80 shadow-sm">
          {activeTab === 'profile' && (
            <div className="flex flex-col gap-6">
              <h2 className="text-sm font-bold text-slate-905 border-b border-slate-100 pb-3">
                Thông tin cá nhân
              </h2>

              <form onSubmit={handleSubmit(onSubmitProfile)} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Họ (*)"
                    error={errors.lastName?.message}
                    {...register('lastName', { required: 'Họ không được để trống' })}
                  />
                  <Input
                    label="Tên (*)"
                    error={errors.firstName?.message}
                    {...register('firstName', { required: 'Tên không được để trống' })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Địa chỉ Email"
                    type="email"
                    disabled
                    value={user.email}
                    helperText="Không thể thay đổi địa chỉ email tài khoản."
                  />
                  <Input
                    label="Số điện thoại (*)"
                    error={errors.phone?.message}
                    {...register('phone', {
                      required: 'Số điện thoại không được để trống',
                      pattern: {
                        value: /^(0[3|5|7|8|9])([0-9]{8})$/,
                        message: 'Số điện thoại Việt Nam không hợp lệ (10 số)',
                      },
                    })}
                  />
                </div>

                <div className="flex justify-end mt-4">
                  <Button
                    type="submit"
                    isLoading={isUpdating}
                    leftIcon={<Save className="w-4 h-4" />}
                    className="py-2.5 px-6 rounded-xl font-bold"
                  >
                    Lưu thay đổi
                  </Button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'address' && (
            <div className="flex flex-col gap-6">
              <h2 className="text-sm font-bold text-slate-905 border-b border-slate-100 pb-3">
                Địa chỉ giao hàng mặc định
              </h2>

              <form onSubmit={handleSubmit(onSubmitProfile)} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Tỉnh / Thành phố"
                    placeholder="Ví dụ: Hà Nội"
                    {...register('city')}
                  />
                  <Input
                    label="Quận / Huyện"
                    placeholder="Ví dụ: Quận Cầu Giấy"
                    {...register('district')}
                  />
                </div>

                <Input
                  label="Địa chỉ chi tiết (Số nhà, tên đường...)"
                  placeholder="Ví dụ: Số 12 Ngõ 34 Trần Thái Tông"
                  {...register('addressDetail')}
                />

                <div className="flex justify-end mt-4">
                  <Button
                    type="submit"
                    isLoading={isUpdating}
                    leftIcon={<Save className="w-4 h-4" />}
                    className="py-2.5 px-6 rounded-xl font-bold"
                  >
                    Lưu sổ địa chỉ
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
