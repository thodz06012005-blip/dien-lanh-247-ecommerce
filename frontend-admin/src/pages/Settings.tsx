import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import { Save, Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    storeName: '',
    hotline: '',
    zalo: '',
    email: '',
    address: '',
    shippingFee: 30000,
    freeShippingThreshold: 10000000
  });

  // Fetch settings
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await api.get('/admin/settings');
      return res.data;
    }
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (values: any) => {
      return api.patch('/admin/settings', values);
    },
    onSuccess: () => {
      alert('Cập nhật cấu hình hệ thống thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu cấu hình');
    }
  });

  // Populate form values when data loads
  useEffect(() => {
    if (data?.data) {
      setFormData(data.data);
    }
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'shippingFee' || name === 'freeShippingThreshold' ? Number(value || 0) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.storeName || !formData.hotline || !formData.zalo) {
      alert('Vui lòng nhập đầy đủ các trường bắt buộc (Tên cửa hàng, Hotline, Zalo)');
      return;
    }
    updateSettings.mutate(formData);
  };

  if (isLoading) {
    return <LoadingState message="Đang tải cấu hình hệ thống..." />;
  }

  if (error || !data?.success) {
    return (
      <EmptyState
        message="Lỗi kết nối dữ liệu"
        subMessage="Không thể tải dữ liệu cấu hình hệ thống từ Mock API Server."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-blue-600" />
          Cấu hình hệ thống
        </h1>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Thiết lập các thông số liên hệ, địa chỉ và phí ship của Điện Lạnh 247.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 md:p-8 flex flex-col gap-6">
            
            {/* Section 1: Thông tin chung */}
            <div className="flex flex-col gap-4">
              <h3 className="text-[15px] font-semibold text-slate-900 flex items-center gap-2 mb-1 border-b border-slate-100 pb-3">
                <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                Thông tin chung
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Tên cửa hàng (*)"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Email liên hệ"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <Input
                label="Địa chỉ trụ sở chính"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            {/* Section 2: Hotline & Zalo */}
            <div className="flex flex-col gap-4 pt-4 mt-2">
              <h3 className="text-[15px] font-semibold text-slate-900 flex items-center gap-2 mb-1 border-b border-slate-100 pb-3">
                <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                Kênh liên hệ tư vấn
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Số điện thoại Hotline (*)"
                  name="hotline"
                  value={formData.hotline}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Số điện thoại Zalo tư vấn (*)"
                  name="zalo"
                  value={formData.zalo}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Section 3: Vận chuyển */}
            <div className="flex flex-col gap-4 pt-4 mt-2">
              <h3 className="text-[15px] font-semibold text-slate-900 flex items-center gap-2 mb-1 border-b border-slate-100 pb-3">
                <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
                Chính sách vận chuyển
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Phí vận chuyển mặc định (VNĐ)"
                  name="shippingFee"
                  type="number"
                  value={formData.shippingFee}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Ngưỡng miễn phí vận chuyển (VNĐ)"
                  name="freeShippingThreshold"
                  type="number"
                  value={formData.freeShippingThreshold}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-6 mt-2 border-t border-slate-100">
              <Button
                type="submit"
                isLoading={updateSettings.isPending}
                leftIcon={<Save className="w-4 h-4" />}
                className="py-2.5 px-6 rounded-xl font-bold flex items-center gap-2"
              >
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
