import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wind, Droplets, Snowflake, Wrench, Settings, Cog,
  Send, CalendarCheck, HardHat, ShieldCheck,
  BadgeDollarSign, Award, Phone,
  ArrowRight, Sparkles,
} from 'lucide-react';
import api from '../services/api';
import type { ServiceCategory } from '../types/service';
import Breadcrumb from '../components/common/Breadcrumb';
import PageTransition from '../components/common/PageTransition';
import Skeleton from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import useDocumentTitle from '../hooks/useDocumentTitle';

const iconMap: Record<string, React.ElementType> = {
  Wind,
  Droplets,
  Snowflake,
  Wrench,
  Settings,
  Cog,
};

const fallbackIcon = Wrench;

function getIconComponent(iconName: string): React.ElementType {
  return iconMap[iconName] || fallbackIcon;
}

const processSteps = [
  {
    step: 1,
    title: 'Gửi yêu cầu',
    description: 'Điền thông tin thiết bị và mô tả sự cố cần sửa chữa qua form trực tuyến.',
    icon: Send,
  },
  {
    step: 2,
    title: 'Nhận lịch hẹn',
    description: 'Điện Lạnh 247 gọi xác nhận và sắp xếp kỹ thuật viên phù hợp nhất.',
    icon: CalendarCheck,
  },
  {
    step: 3,
    title: 'Thợ đến sửa',
    description: 'Kỹ thuật viên đến đúng hẹn, kiểm tra chẩn đoán và sửa chữa tại chỗ.',
    icon: HardHat,
  },
  {
    step: 4,
    title: 'Thanh toán & Bảo hành',
    description: 'Thanh toán sau khi hoàn tất và nhận phiếu bảo hành dịch vụ rõ ràng.',
    icon: ShieldCheck,
  },
];

const commitments = [
  {
    title: 'Báo giá trước',
    description: 'Kỹ thuật viên kiểm tra và báo giá minh bạch trước khi tiến hành sửa chữa.',
    icon: BadgeDollarSign,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    title: 'Thợ có chứng nhận',
    description: 'Đội ngũ kỹ thuật viên được đào tạo bài bản, có chứng chỉ nghề chuyên môn.',
    icon: Award,
    color: 'text-primary-600',
    bg: 'bg-primary-50',
    border: 'border-primary-100',
  },
  {
    title: 'Bảo hành rõ ràng',
    description: 'Cam kết bảo hành dịch vụ từ 3-12 tháng tùy loại sửa chữa thực hiện.',
    icon: ShieldCheck,
    color: 'text-cyan-500',
    bg: 'bg-cyan-50',
    border: 'border-cyan-100',
  },
  {
    title: 'Hotline 24/7',
    description: 'Hỗ trợ tiếp nhận yêu cầu sửa chữa khẩn cấp mọi lúc, kể cả ngày lễ.',
    icon: Phone,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
  },
];

export default function Services() {
  useDocumentTitle('Dịch vụ sửa chữa & Bảo trì', 'Dịch vụ sửa chữa bảo trì điện lạnh chuyên nghiệp 24/7 tại Hà Nội. Điều hòa, tủ lạnh, máy giặt - Điện Lạnh 247.');

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const res = await api.get('/service-categories');
      return res.data;
    },
  });

  const categories: ServiceCategory[] = categoriesData?.data || [];

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ name: 'Dịch vụ sửa chữa' }]} />

        {/* Hero Banner */}
        <div className="relative mb-12 overflow-hidden bg-slate-900 rounded-[2rem] shadow-xl border border-slate-800 p-8 md:p-12 lg:p-16 flex flex-col justify-center min-h-[260px] md:min-h-[320px]">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#061527] via-[#061527]/95 to-[#061527]/80 z-10" />
          {/* Decorative glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl z-0" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl z-0" />

          <div className="relative z-20 max-w-2xl">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[9px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-950/60 border border-cyan-800/30 px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-4"
            >
              <Sparkles className="w-3 h-3" />
              Dịch vụ kỹ thuật chuyên nghiệp
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight"
            >
              Sửa chữa & Bảo trì{' '}
              <span className="text-cyan-400">Điện Lạnh</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xs md:text-xs text-slate-300 mt-3 max-w-lg leading-relaxed"
            >
              Dịch vụ sửa chữa, bảo trì, vệ sinh điều hòa, tủ lạnh, máy giặt tại nhà. Kỹ thuật viên có chứng nhận, phục vụ 24/7 trên toàn Hà Nội.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6"
            >
              <Link to="/service-booking">
                <Button
                  variant="secondary"
                  size="lg"
                  className="rounded-xl text-xs font-bold shadow-lg shadow-orange-500/25"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Đặt lịch sửa chữa
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Service Categories Section */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <span className="text-[9px] font-black text-primary-600 uppercase tracking-widest bg-primary-50 border border-primary-100 px-3 py-1 rounded-full inline-block mb-3">
              Danh mục dịch vụ
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-900">
              Chúng tôi sửa chữa <span className="gradient-text">mọi thiết bị</span>
            </h2>
            <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              Đội ngũ kỹ thuật viên chuyên môn cao, xử lý mọi sự cố thiết bị điện lạnh nhanh chóng và hiệu quả.
            </p>
          </div>

          {categoriesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-[2rem]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {categories.map((category, idx) => {
                const IconComp = getIconComponent(category.icon);
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="bg-white rounded-[2rem] border border-slate-100 p-5 md:p-6 shadow-2xs hover:shadow-xs hover:border-blue-100 transition-all group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                      <IconComp className="w-6 h-6 text-primary-600" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 mb-1">{category.name}</h3>
                    <p className="text-3xs text-slate-500 leading-relaxed line-clamp-2">
                      {category.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Process Timeline Section */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <span className="text-[9px] font-black text-cyan-600 uppercase tracking-widest bg-cyan-50 border border-cyan-100 px-3 py-1 rounded-full inline-block mb-3">
              Quy trình đặt dịch vụ
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-900">
              Chỉ <span className="text-cyan-500">4 bước</span> đơn giản
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step, idx) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative bg-white rounded-[2rem] border border-slate-100 p-6 shadow-2xs text-center"
              >
                {/* Step number badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-cyan-500 text-white text-3xs font-black flex items-center justify-center shadow-md shadow-cyan-500/20">
                  {step.step}
                </div>
                {/* Connector line for desktop */}
                {idx < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 -right-3 w-6 h-0.5 bg-slate-200 z-0" />
                )}
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4 mt-2">
                  <step.icon className="w-6 h-6 text-cyan-500" />
                </div>
                <h3 className="text-xs font-black text-slate-900 mb-1.5">{step.title}</h3>
                <p className="text-3xs text-slate-500 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Commitments Section */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 border border-orange-100 px-3 py-1 rounded-full inline-block mb-3">
              Cam kết dịch vụ
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-900">
              Tại sao chọn <span className="gradient-text-orange">Điện Lạnh 247?</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {commitments.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className={`bg-white rounded-[2rem] border border-slate-100 p-6 shadow-2xs flex gap-4 items-start hover:shadow-xs hover:border-blue-100 transition-all`}
              >
                <div className={`w-12 h-12 rounded-2xl ${item.bg} border ${item.border} flex items-center justify-center flex-shrink-0`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-3xs text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-[#061527] to-[#0c2a4a] rounded-[2rem] p-8 md:p-12 text-center border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-600/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-xl md:text-2xl font-black text-white mb-2">
                Thiết bị đang gặp sự cố?
              </h2>
              <p className="text-xs text-slate-300 mb-6 max-w-md mx-auto leading-relaxed">
                Đừng chần chừ! Đặt lịch ngay để kỹ thuật viên Điện Lạnh 247 xử lý nhanh chóng.
              </p>
              <Link to="/service-booking">
                <Button
                  variant="secondary"
                  size="lg"
                  className="rounded-xl text-xs font-bold shadow-lg shadow-orange-500/25"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Đặt lịch sửa chữa ngay
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
