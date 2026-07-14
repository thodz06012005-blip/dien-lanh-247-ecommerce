import { Clock3, Mail, MapPin, MessageCircle, Phone, Route } from 'lucide-react';
import Breadcrumb from '@/components/common/Breadcrumb';
import OptimizedImage from '@/components/common/OptimizedImage';
import QuickContactForm from '@/components/contact/QuickContactForm';
import { useSettings } from '@/hooks/useSettings';
import useDocumentTitle from '@/hooks/useDocumentTitle';

export default function Contact() {
  useDocumentTitle(
    'Liên hệ Điện Lạnh 247',
    'Gọi hotline, nhắn Zalo hoặc gửi biểu mẫu để được tư vấn dịch vụ điện lạnh.',
  );
  const { settings } = useSettings();
  const hotline = settings?.hotline || '1900 1234';
  const zalo = settings?.zalo || hotline;
  const email = settings?.email || 'support@dienlanh247.vn';
  const address = settings?.address || 'Cầu Giấy, Hà Nội';

  const channels = [
    {
      icon: Phone,
      title: 'Hotline kỹ thuật',
      value: hotline,
      description: 'Ưu tiên cho sự cố cần tiếp nhận nhanh.',
      href: `tel:${hotline.replace(/\s+/g, '')}`,
      external: false,
    },
    {
      icon: MessageCircle,
      title: 'Tư vấn qua Zalo',
      value: zalo,
      description: 'Phù hợp khi cần gửi hình ảnh tình trạng thiết bị.',
      href: `https://zalo.me/${zalo.replace(/\s+/g, '')}`,
      external: true,
    },
    {
      icon: Mail,
      title: 'Email hỗ trợ',
      value: email,
      description: 'Dành cho báo giá doanh nghiệp, hóa đơn và phản hồi.',
      href: `mailto:${email}`,
      external: false,
    },
  ];

  return (
    <div className="bg-slate-50">
      <section className="bg-[#061527] py-12 text-white sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumb items={[{ name: 'Liên hệ' }]} />
          <div className="mt-8 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Kết nối với chúng tôi</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Chọn cách liên hệ thuận tiện nhất cho bạn</h1>
            <p className="mt-5 text-base leading-8 text-slate-300">Thông tin liên hệ được tách rõ theo mục đích để khách hàng không phải tìm kiếm hoặc đi qua nhiều bước.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {channels.map((channel) => (
            <a
              key={channel.title}
              href={channel.href}
              target={channel.external ? '_blank' : undefined}
              rel={channel.external ? 'noopener noreferrer' : undefined}
              className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-primary-700 transition group-hover:bg-primary-600 group-hover:text-white">
                <channel.icon aria-hidden="true" className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-lg font-black text-slate-950">{channel.title}</h2>
              <strong className="mt-2 block break-all text-sm font-black text-primary-700">{channel.value}</strong>
              <p className="mt-3 text-sm leading-6 text-slate-600">{channel.description}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-20">
        <QuickContactForm
          title="Gửi yêu cầu tư vấn"
          description="Mô tả ngắn tình trạng thiết bị hoặc nhu cầu bảo trì. Đội ngũ sẽ liên hệ xác nhận trước khi sắp lịch."
        />

        <div className="grid gap-6">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="relative aspect-[16/10] overflow-hidden">
              <OptimizedImage
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b"
                alt="Bản đồ khu vực phục vụ"
                width={900}
                height={560}
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="h-full w-full object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/30 bg-white/95 p-4 shadow-lg backdrop-blur">
                <div className="flex items-start gap-3">
                  <MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  <div>
                    <strong className="block text-sm font-black text-slate-950">Văn phòng Điện Lạnh 247</strong>
                    <span className="mt-1 block text-xs leading-5 text-slate-600">{address}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Thông tin phục vụ</h2>
            <div className="mt-5 grid gap-4 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <Clock3 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
                <div><strong className="block text-slate-950">Thời gian tiếp nhận</strong><span className="mt-1 block text-slate-600">8:00–21:00 mỗi ngày; hotline tiếp nhận sự cố khẩn cấp.</span></div>
              </div>
              <div className="flex items-start gap-3">
                <Route aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
                <div><strong className="block text-slate-950">Khu vực phục vụ</strong><span className="mt-1 block text-slate-600">Ưu tiên nội thành Hà Nội và các khu vực lân cận theo lịch xác nhận.</span></div>
              </div>
              <div className="flex items-start gap-3">
                <Mail aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
                <div><strong className="block text-slate-950">Phản hồi doanh nghiệp</strong><span className="mt-1 block text-slate-600">Báo giá, hợp đồng bảo trì và hóa đơn được xử lý qua email.</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
