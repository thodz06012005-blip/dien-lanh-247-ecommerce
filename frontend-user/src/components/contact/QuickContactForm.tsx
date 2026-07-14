import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Send } from 'lucide-react';
import api from '@/services/api';
import { services } from '@/data/phase4Content';
import { Button, Input, Select, Textarea } from '@/design-system';
import { useToastStore } from '@/store/toastStore';

interface ContactFormValues {
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string;
}

interface QuickContactFormProps {
  compact?: boolean;
  title?: string;
  description?: string;
}

export default function QuickContactForm({
  compact = false,
  title = 'Nhận tư vấn kỹ thuật',
  description = 'Để lại thông tin, đội ngũ Điện Lạnh 247 sẽ liên hệ xác nhận trong thời gian sớm nhất.',
}: QuickContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToastStore();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      service: '',
      message: '',
    },
  });

  const submitForm = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      await api.post('/contact', {
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        subject: values.service ? `Tư vấn dịch vụ: ${values.service}` : 'Yêu cầu tư vấn từ website',
        message: values.message.trim() || 'Khách hàng muốn được gọi lại để tư vấn.',
      });
      showSuccess('Đã ghi nhận yêu cầu. Điện Lạnh 247 sẽ liên hệ với bạn sớm nhất.');
      reset();
    } catch {
      showError('Chưa thể gửi yêu cầu lúc này. Vui lòng gọi hotline để được hỗ trợ ngay.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white p-5 shadow-2xl shadow-slate-950/10 sm:p-7">
      <div className="mb-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary-600">Phản hồi nhanh</p>
        <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">{title}</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <form onSubmit={handleSubmit(submitForm)} className="grid gap-4" noValidate>
        <div className={compact ? 'grid gap-4' : 'grid gap-4 sm:grid-cols-2'}>
          <Input
            label="Họ và tên"
            placeholder="Nguyễn Văn A"
            autoComplete="name"
            required
            error={errors.name?.message}
            {...register('name', { required: 'Vui lòng nhập họ và tên.' })}
          />
          <Input
            label="Số điện thoại"
            placeholder="09xxxxxxxx"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            error={errors.phone?.message}
            {...register('phone', {
              required: 'Vui lòng nhập số điện thoại.',
              pattern: {
                value: /^(0[3|5|7|8|9])[0-9]{8}$/,
                message: 'Số điện thoại chưa đúng định dạng Việt Nam.',
              },
            })}
          />
        </div>

        {!compact && (
          <Input
            label="Email"
            placeholder="ban@example.com"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email', {
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Email chưa đúng định dạng.',
              },
            })}
          />
        )}

        <Select
          label="Dịch vụ quan tâm"
          placeholder="Chọn dịch vụ"
          options={services.map((service) => ({ value: service.title, label: service.title }))}
          {...register('service')}
        />

        <Textarea
          label="Mô tả nhu cầu"
          placeholder="Ví dụ: Điều hòa phòng khách không lạnh, cần kiểm tra chiều nay..."
          rows={compact ? 3 : 4}
          {...register('message')}
        />

        <Button
          type="submit"
          size="lg"
          loading={isSubmitting}
          loadingLabel="Đang gửi yêu cầu"
          leftIcon={<Send aria-hidden="true" className="h-4 w-4" />}
          fullWidth
        >
          Gửi yêu cầu tư vấn
        </Button>

        <p className="text-xs leading-5 text-slate-500">
          Bằng việc gửi biểu mẫu, bạn đồng ý để Điện Lạnh 247 liên hệ theo thông tin đã cung cấp.
        </p>
      </form>
    </div>
  );
}
