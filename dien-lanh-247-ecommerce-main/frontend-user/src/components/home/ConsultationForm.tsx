import React, { useState } from 'react';
import { Phone, MessageSquare, Clock, ShieldCheck, Heart } from 'lucide-react';
import api from '../../services/api';
import { useToastStore } from '../../store/toastStore';
import { useSettings } from '../../hooks/useSettings';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function ConsultationForm() {
  const { settings } = useSettings();
  const { showSuccess, showError } = useToastStore();

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) {
      showError('Vui lòng điền đầy đủ Họ tên và Số điện thoại!');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.post('/contact', {
        name: contactName,
        phone: contactPhone,
        message: contactMessage,
      });
      if (response.data?.success) {
        showSuccess('Gửi yêu cầu tư vấn thành công! Chúng tôi sẽ gọi lại ngay.');
        setContactName('');
        setContactPhone('');
        setContactMessage('');
      }
    } catch {
      showError('Có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 mb-12">
      <div className="max-w-7xl mx-auto">
        <div className="premium-mesh-bg blueprint-grid rounded-[2.5rem] md:rounded-[3.5rem] text-white p-8 md:p-14 flex flex-col lg:flex-row justify-between items-center gap-12 border border-white/5 overflow-hidden relative">
          {/* Extra glow blob */}
          <div className="absolute top-[-30%] right-[-10%] w-[50%] h-[80%] rounded-full bg-blue-600/12 blur-[120px] pointer-events-none" />

          {/* LEFT CONTENT */}
          <div className="relative z-10 max-w-lg flex flex-col gap-6">
            <p className="premium-kicker text-cyan-400">
              <span className="w-5 h-px bg-cyan-500 rounded-full inline-block" />
              Yêu cầu hỗ trợ
            </p>
            <h3 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
              Bạn cần tư vấn giải pháp<br /> hoặc báo sự cố kỹ thuật?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-[45ch]">
              Để lại thông tin liên hệ — kỹ thuật viên trực khu vực của Điện Lạnh 247 sẽ gọi điện tư vấn chuyên môn và báo phương án xử lý miễn phí trong vòng 15 phút.
            </p>

            <div className="flex flex-col gap-3.5 text-xs text-slate-300">
              <a href={`tel:${settings.hotline || '09998888777'}`} className="flex items-center gap-3 hover:text-cyan-300 transition-colors group">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <span>Hotline 24/7: <strong className="text-white font-extrabold">{settings.hotline || '0999 888 777'}</strong></span>
              </a>
              <a href={`https://zalo.me/${(settings.zalo || '09998888777').replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-cyan-300 transition-colors group">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span>Chat tư vấn qua Zalo: <strong className="text-white font-extrabold">{settings.zalo || '0900 000 247'}</strong></span>
              </a>
            </div>

            {/* Sub checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-6 border-t border-white/8">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Gọi lại sau 15 phút</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
                <span>Bảo mật thông tin</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Heart className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Tư vấn hoàn toàn miễn phí</span>
              </div>
            </div>
          </div>

          {/* RIGHT — FORM */}
          <div className="relative z-10 bg-white text-slate-900 p-6 md:p-8 rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-100/50">
            <h4 className="text-sm font-extrabold text-slate-950 mb-5 uppercase tracking-wider">
              Đăng ký tư vấn miễn phí
            </h4>
            <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
              <Input
                label="Họ tên của bạn (*)"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={contactName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactName(e.target.value)}
                className="py-2.5 rounded-xl border-slate-200 text-sm"
              />
              <Input
                label="Số điện thoại liên hệ (*)"
                placeholder="Ví dụ: 0912 345 678"
                type="tel"
                value={contactPhone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactPhone(e.target.value)}
                className="py-2.5 rounded-xl border-slate-200 text-sm"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Yêu cầu cụ thể hoặc mô tả sự cố</label>
                <textarea
                  placeholder="Ví dụ: Vệ sinh điều hòa Daikin 1.5HP, máy giặt LG kêu to khi vắt..."
                  value={contactMessage}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContactMessage(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-none"
                />
              </div>
              <Button
                variant="primary"
                type="submit"
                isLoading={isSubmitting}
                className="w-full py-3.5 rounded-xl mt-1 font-bold bg-[#F97316] hover:bg-[#EA580C] border-none shadow-md shadow-orange-500/20 hover:shadow-orange-500/35 transition-all text-sm cursor-pointer"
              >
                Gửi yêu cầu ngay
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
