import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Send, CalendarDays, Wrench } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import type { ServiceCategory } from '../types/service';
import Breadcrumb from '../components/common/Breadcrumb';
import PageTransition from '../components/common/PageTransition';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import useDocumentTitle from '../hooks/useDocumentTitle';

import { DISTRICT_OPTIONS } from '../constants/areas';

const TIME_SLOTS = [
  '08:00 - 10:00',
  '10:00 - 12:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
];

interface BookingForm {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  district: string;
  applianceType: string;
  serviceCategoryId: string;
  issueDescription: string;
  preferredDate: string;
  preferredTimeSlot: string;
  note: string;
}

export default function ServiceBooking() {
  useDocumentTitle('Đặt lịch sửa chữa', 'Đặt lịch sửa chữa thiết bị điện lạnh online tại Điện Lạnh 247.');

  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showError } = useToastStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<BookingForm>({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    district: '',
    applianceType: '',
    serviceCategoryId: '',
    issueDescription: '',
    preferredDate: '',
    preferredTimeSlot: '',
    note: '',
  });

  // Auto-fill from auth store
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        customerName: [user.firstName, user.lastName].filter(Boolean).join(' ') || prev.customerName,
        customerPhone: user.phone || prev.customerPhone,
        customerAddress: user.addressDetail || prev.customerAddress,
        district: user.district || prev.district,
      }));
    }
  }, [user]);

  // Fetch service categories
  const { data: categoriesData } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const res = await api.get('/service-categories');
      return res.data;
    },
  });

  const categories: ServiceCategory[] = categoriesData?.data || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedPhone = form.customerPhone.replace(/\s+/g, '').trim();

    // Basic validation
    if (!form.customerName.trim() || !cleanedPhone || !form.customerAddress.trim()) {
      showError('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ.');
      return;
    }
    if (!form.district) {
      showError('Vui lòng chọn quận/huyện.');
      return;
    }
    if (!form.serviceCategoryId) {
      showError('Vui lòng chọn loại dịch vụ.');
      return;
    }
    if (!form.applianceType.trim()) {
      showError('Vui lòng nhập loại thiết bị.');
      return;
    }
    if (!form.issueDescription.trim()) {
      showError('Vui lòng mô tả sự cố cần sửa chữa.');
      return;
    }
    if (!form.preferredDate) {
      showError('Vui lòng chọn ngày hẹn.');
      return;
    }
    if (!form.preferredTimeSlot) {
      showError('Vui lòng chọn khung giờ.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        customerPhone: cleanedPhone,
        customerName: form.customerName.trim(),
        customerAddress: form.customerAddress.trim(),
        issueDescription: form.issueDescription.trim(),
        applianceType: form.applianceType.trim(),
        note: form.note.trim(),
      };
      const response = await api.post('/service-requests', payload);
      const requestId = response.data?.data?.id;
      navigate(`/service-booking/success?requestId=${requestId}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showError(error.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Set min date to today (using local date)
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${date}`;

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { name: 'Dịch vụ sửa chữa', path: '/services' },
            { name: 'Đặt lịch' },
          ]}
        />

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-primary-600" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl font-black text-slate-900"
          >
            Đặt lịch sửa chữa
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed"
          >
            Điền thông tin bên dưới để đặt lịch kỹ thuật viên. Chúng tôi sẽ liên hệ xác nhận trong vòng 30 phút.
          </motion.p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] border border-slate-100 shadow-2xs p-6 md:p-8 flex flex-col gap-6">
            {/* Section: Customer Info */}
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 text-3xs font-black">1</span>
                Thông tin liên hệ
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Họ và tên *"
                  name="customerName"
                  value={form.customerName}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                />
                <Input
                  label="Số điện thoại *"
                  name="customerPhone"
                  value={form.customerPhone}
                  onChange={handleChange}
                  placeholder="0912345678"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Địa chỉ *"
                  name="customerAddress"
                  value={form.customerAddress}
                  onChange={handleChange}
                  placeholder="Số nhà, tên đường, phường..."
                />
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-sm font-semibold text-slate-700 select-none">
                    Quận/Huyện *
                  </label>
                  <select
                    name="district"
                    value={form.district}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 hover:border-slate-300"
                  >
                    <option value="">-- Chọn quận/huyện --</option>
                    {DISTRICT_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="divider-gradient" />

            {/* Section: Service Info */}
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600 text-3xs font-black">2</span>
                Thông tin dịch vụ
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-sm font-semibold text-slate-700 select-none">
                    Loại dịch vụ *
                  </label>
                  <select
                    name="serviceCategoryId"
                    value={form.serviceCategoryId}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 hover:border-slate-300"
                  >
                    <option value="">-- Chọn loại dịch vụ --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Loại thiết bị *"
                  name="applianceType"
                  value={form.applianceType}
                  onChange={handleChange}
                  placeholder="VD: Điều hòa Daikin 12000BTU"
                />
              </div>
              <div className="mt-4">
                <label className="text-sm font-semibold text-slate-700 select-none block mb-1.5">
                  Mô tả sự cố *
                </label>
                <textarea
                  name="issueDescription"
                  value={form.issueDescription}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Mô tả chi tiết tình trạng sự cố thiết bị..."
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 hover:border-slate-300 resize-none"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="divider-gradient" />

            {/* Section: Scheduling */}
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 text-3xs font-black">3</span>
                Lịch hẹn mong muốn
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Ngày hẹn *"
                  name="preferredDate"
                  type="date"
                  value={form.preferredDate}
                  onChange={handleChange}
                  min={today}
                />
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-sm font-semibold text-slate-700 select-none">
                    Khung giờ *
                  </label>
                  <select
                    name="preferredTimeSlot"
                    value={form.preferredTimeSlot}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 hover:border-slate-300"
                  >
                    <option value="">-- Chọn khung giờ --</option>
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="text-sm font-semibold text-slate-700 select-none block mb-1.5">
                  Ghi chú thêm
                </label>
                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Thông tin thêm cho kỹ thuật viên (tầng, mật khẩu cửa, cách liên hệ khác...)"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 hover:border-slate-300 resize-none"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="secondary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full rounded-xl text-sm font-bold"
                leftIcon={!isSubmitting ? <Send className="w-4 h-4" /> : undefined}
              >
                {isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu đặt lịch'}
              </Button>
              <p className="text-3xs text-slate-400 text-center mt-3 leading-relaxed">
                <Wrench className="w-3 h-3 inline-block mr-1 relative -top-px" />
                Điện Lạnh 247 sẽ gọi xác nhận lịch hẹn trong vòng 30 phút sau khi tiếp nhận.
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </PageTransition>
  );
}
