import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageSquare, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useSettings } from '../hooks/useSettings';
import api from '../services/api';
import { useToastStore } from '../store/toastStore';
import Breadcrumb from '../components/common/Breadcrumb';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface ContactFormInput {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
}

export default function Contact() {
  const { settings } = useSettings();
  const { showSuccess, showError } = useToastStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormInput>();

  const onSubmitContact = async (data: ContactFormInput) => {
    setIsSubmitting(true);
    try {
      const response = await api.post('/contact', data);
      if (response.data?.success) {
        showSuccess('Gửi yêu cầu tư vấn thành công! Chúng tôi sẽ liên hệ trong vòng 15 phút.');
        reset();
      }
    } catch (err) {
      showError('Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactChannels = [
    {
      icon: <Phone className="w-5 h-5" />,
      title: 'Đường dây nóng hỗ trợ',
      value: settings.hotline,
      sub: 'Tư vấn miễn phí 24/7 (kể cả lễ tết)',
      href: `tel:${settings.hotline.replace(/\s+/g, '')}`,
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: 'Tư vấn qua Zalo',
      value: settings.zalo,
      sub: 'Hỗ trợ sự cố kỹ thuật khẩn cấp 2h',
      href: `https://zalo.me/${settings.zalo.replace(/\s+/g, '')}`,
    },
    {
      icon: <Mail className="w-5 h-5" />,
      title: 'Hòm thư điện tử',
      value: settings.email,
      sub: 'Giải quyết khiếu nại, hóa đơn VAT',
      href: `mailto:${settings.email}`,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumbs */}
      <Breadcrumb items={[{ name: 'Liên hệ' }]} />

      <h1 className="text-xl md:text-2xl font-black text-slate-900 mb-8">
        Liên hệ với Điện Lạnh 247
      </h1>

      {/* 3 Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {contactChannels.map((chan, idx) => (
          <a
            key={idx}
            href={chan.href}
            target={chan.href.startsWith('http') ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="bg-white p-6 rounded-3xl border border-slate-100 hover:border-primary-100 shadow-sm hover:shadow-xl hover:shadow-primary-500/5 transition-all flex flex-col items-center text-center group cursor-pointer"
          >
            <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
              {chan.icon}
            </div>
            <h3 className="text-xs font-bold text-slate-900 mb-1">{chan.title}</h3>
            <span className="text-sm font-black text-primary-600 block mb-2">{chan.value}</span>
            <p className="text-3xs text-slate-400 leading-normal">{chan.sub}</p>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Contact Form */}
        <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Gửi yêu cầu tư vấn kỹ thuật</h2>
            <p className="text-2xs text-slate-400 mt-1">Đội ngũ kỹ sư của chúng tôi sẵn sàng giải đáp thắc mắc về công suất, chọn máy lạnh, lỗi điều hòa chảy nước hay nạp gas...</p>
          </div>

          <form onSubmit={handleSubmit(onSubmitContact)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Họ tên của bạn (*)"
                placeholder="Ví dụ: Nguyễn Văn A"
                error={errors.name?.message}
                {...register('name', { required: 'Họ tên không được để trống' })}
              />
              <Input
                label="Số điện thoại (*)"
                placeholder="Ví dụ: 0912345678"
                type="tel"
                error={errors.phone?.message}
                {...register('phone', {
                  required: 'Số điện thoại không được để trống',
                  pattern: {
                    value: /^(0[3|5|7|8|9])([0-9]{8})$/,
                    message: 'Số điện thoại Việt Nam không hợp lệ',
                  },
                })}
              />
            </div>

            <Input
              label="Email"
              placeholder="Ví dụ: email@gmail.com"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Tiêu đề yêu cầu (*)"
              placeholder="Ví dụ: Cần báo giá dịch vụ vệ sinh 3 máy lạnh..."
              error={errors.subject?.message}
              {...register('subject', { required: 'Vui lòng nhập tiêu đề' })}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Nội dung chi tiết yêu cầu (*)</label>
              <textarea
                placeholder="Mô tả cụ thể sự cố thiết bị của bạn hoặc yêu cầu lắp ráp..."
                rows={4}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                {...register('message', { required: 'Nội dung không được để trống' })}
              />
              {errors.message && (
                <span className="text-xs text-red-500 font-medium">{errors.message.message}</span>
              )}
            </div>

            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<Send className="w-4 h-4" />}
              className="w-fit py-3 px-6 rounded-xl self-end mt-2 font-bold cursor-pointer"
            >
              Gửi tin nhắn đi
            </Button>
          </form>
        </div>

        {/* Right Column: Address and Map Info */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-50 pb-2 flex items-center gap-1.5">
              <MapPin className="w-5 h-5 text-primary-600" />
              Hệ thống chi nhánh
            </h3>
            
            <div className="text-xs text-slate-650 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <strong className="text-slate-800 font-bold">Trụ sở chính Cầu Giấy (Hà Nội):</strong>
                <p>{settings.address}</p>
                <span className="text-3xs text-slate-400 mt-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 8:00 - 21:00 hằng ngày</span>
              </div>
              <div className="flex flex-col gap-1 border-t border-slate-50 pt-3">
                <strong className="text-slate-800 font-bold">Chi nhánh 2 (Đống Đa - Hà Nội):</strong>
                <p>45 Đường Tây Sơn, Quang Trung, Đống Đa, Hà Nội</p>
              </div>
              <div className="flex flex-col gap-1 border-t border-slate-50 pt-3">
                <strong className="text-slate-800 font-bold">Chi nhánh Quận 3 (TP. Hồ Chí Minh):</strong>
                <p>78 Đường Cách Mạng Tháng 8, Phường 6, Quận 3, TP.HCM</p>
              </div>
            </div>
          </div>

          {/* Map Image/Mock Graphic */}
          <div className="bg-slate-100 border border-slate-200 rounded-[2rem] overflow-hidden aspect-video shadow-inner relative flex items-center justify-center">
            {/* Visual map placeholder representing Dien Lanh 247 HQ */}
            <img
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600&auto=format&fit=crop"
              alt="Google Maps Placement placeholder"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-primary-950/20" />
            <div className="absolute bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl max-w-[240px] text-center flex flex-col items-center gap-2">
              <MapPin className="w-6 h-6 text-red-500 fill-red-500/10 animate-bounce" />
              <div>
                <h4 className="text-3xs font-extrabold text-slate-900 leading-tight">Trụ sở Điện Lạnh 247</h4>
                <p className="text-4xs text-slate-500 mt-0.5">{settings.address}</p>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-4xs font-bold text-primary-600 hover:underline inline-flex items-center gap-0.5"
              >
                Nhấp xem trên Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
