import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Truck, CheckCircle, Calendar, BadgeCheck, Wrench, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';

const floatingCards = [
  {
    icon: <ShieldCheck className="w-5 h-5 text-cyan-400" />,
    label: 'Thợ kỹ thuật',
    value: 'Đã xác minh',
    color: 'from-cyan-500/20 to-blue-500/10',
    delay: 0,
    offsetClass: 'top-[12%] left-[-4%] lg:left-[-8%]',
    animateY: [0, -8, 0],
  },
  {
    icon: <Truck className="w-5 h-5 text-orange-400" />,
    label: 'Dịch vụ tận nơi',
    value: 'Có mặt trong 2h',
    color: 'from-orange-500/20 to-red-500/10',
    delay: 0.8,
    offsetClass: 'bottom-[22%] left-[-4%] lg:left-[-8%]',
    animateY: [0, 8, 0],
  },
  {
    icon: <Zap className="w-5 h-5 text-blue-400" />,
    label: 'Báo giá trước',
    value: 'Không phí ẩn',
    color: 'from-blue-500/20 to-indigo-500/10',
    delay: 1.5,
    offsetClass: 'top-[8%] right-[-4%] lg:right-[-8%]',
    animateY: [0, -6, 0],
  },
  {
    icon: <CheckCircle className="w-5 h-5 text-green-400" />,
    label: 'Bảo hành dài',
    value: '3 - 12 tháng',
    color: 'from-green-500/20 to-emerald-500/10',
    delay: 2.2,
    offsetClass: 'bottom-[10%] right-[-4%] lg:right-[-8%]',
    animateY: [0, 6, 0],
  },
];

const trustBadges = [
  { icon: <BadgeCheck className="w-4.5 h-4.5 text-cyan-400" />, label: 'Thợ kỹ thuật đã xác minh' },
  { icon: <Wrench className="w-4.5 h-4.5 text-orange-400" />, label: 'Báo giá minh bạch trước khi sửa' },
  { icon: <ShieldCheck className="w-4.5 h-4.5 text-green-400" />, label: 'Bảo hành an tâm 3-12 tháng' },
  { icon: <ShieldAlert className="w-4.5 h-4.5 text-blue-400" />, label: 'Hỗ trợ khẩn cấp 24/7' },
];

export default function HeroBanner() {
  return (
    <section className="relative bg-gradient-to-b from-[#020b14] via-[#061527] to-[#041221] overflow-hidden min-h-[90vh] flex flex-col justify-center pt-28 pb-16 lg:pb-24">
      {/* Blueprint grid overlay */}
      <div className="absolute inset-0 blueprint-grid opacity-100 pointer-events-none" />

      {/* Mesh glow blobs */}
      <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-blue-600/14 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[55%] h-[55%] rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-[35%] right-[15%] w-[28%] h-[28%] rounded-full bg-indigo-600/10 blur-[80px] pointer-events-none" />

      {/* ── Main Grid ─────────────────────────────────────────────── */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-6 items-center">

        {/* LEFT — copy */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col items-start text-left order-2 lg:order-1">

          {/* Kicker */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/8 mb-6"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400 animate-pulse" />
            <span className="text-[10px] font-extrabold tracking-widest uppercase text-cyan-300">
              Hệ thống kỹ thuật điện lạnh toàn diện tại Hà Nội
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="text-[32px] sm:text-[44px] lg:text-[48px] xl:text-[56px] font-black text-white leading-[1.08] tracking-tight mb-5"
          >
            Dịch vụ điện lạnh cao cấp<br className="hidden sm:block" />
            Lắp đặt &amp; sửa chữa <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-[#F97316]">siêu tốc.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18 }}
            className="text-sm sm:text-base text-slate-200/90 mb-8 leading-[1.65] max-w-[560px]"
          >
            Điện Lạnh 247 cung cấp giải pháp toàn diện: bán thiết bị chính hãng, lắp đặt tiêu chuẩn, sửa chữa tận nơi và bảo trì định kỳ bởi đội ngũ kỹ thuật viên giàu kinh nghiệm.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.28 }}
            className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto mb-8"
          >
            <Link to="/service-booking" className="w-full sm:w-auto min-w-0">
              <button className="btn-cta-orange w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-bold px-7 py-3.5 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 hover:-translate-y-0.5 transition-all cursor-pointer">
                <Calendar className="w-4 h-4 shrink-0" />
                Đặt lịch sửa chữa ngay
              </button>
            </Link>
            <Link to="/products" className="w-full sm:w-auto min-w-0">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border-white/10 hover:border-white/25 backdrop-blur-sm font-bold rounded-xl py-3.5 px-7 text-sm hover:-translate-y-0.5 transition-all"
              >
                Mua sắm thiết bị
                <ArrowRight className="w-4 h-4 ml-1.5 shrink-0" />
              </Button>
            </Link>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.38 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 border-t border-white/8 pt-6 w-full"
          >
            {trustBadges.map((badge, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-slate-300">
                {badge.icon}
                <span className="text-xs font-semibold tracking-wide">{badge.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT — Product stage */}
        <div className="lg:col-span-6 xl:col-span-5 relative flex items-center justify-center order-1 lg:order-2 h-[320px] sm:h-[400px] lg:h-[500px]">
          {/* Central glow */}
          <div className="absolute w-[65%] h-[65%] rounded-full bg-blue-500/18 blur-[64px] pointer-events-none" />

          {/* Main product image card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.12, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative w-[75%] aspect-square rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl shadow-black/50"
          >
            {/* Dark gradient bg */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950" />
            {/* Blueprint grid on product stage */}
            <div className="absolute inset-0 blueprint-grid opacity-60" />

            <img
              src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=700&auto=format&fit=crop"
              alt="Kỹ thuật viên Điện Lạnh 247 sửa chữa chuyên nghiệp"
              className="relative z-10 w-full h-full object-cover opacity-75 mix-blend-luminosity"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 z-20 bg-gradient-to-t from-slate-950/70 via-transparent to-blue-900/10" />

            {/* Inner badge */}
            <div className="absolute bottom-5 left-5 z-35">
              <span className="inline-block px-3 py-1.5 rounded-full bg-orange-500/90 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-orange-500/30">
                Cam kết chất lượng 5 sao
              </span>
            </div>
          </motion.div>

          {/* iOS Widget Schedule Simulation Overlay */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="absolute bottom-4 right-[-4%] lg:right-[-6%] z-30 bg-slate-950/90 border border-white/10 backdrop-blur-md rounded-2xl p-4 shadow-xl max-w-[200px]"
          >
            <p className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest leading-none mb-2">Trạng thái điều phối</p>
            <h4 className="text-xs font-bold text-white mb-1">Vệ sinh điều hòa</h4>
            <p className="text-[10px] text-slate-400">Khách hàng: Anh Minh (Cầu Giấy)</p>
            <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-green-400 font-medium">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span>KTV đang đến (15 phút)</span>
            </div>
          </motion.div>

          {/* Floating Cards */}
          {floatingCards.map((card) => (
            <motion.div
              key={card.label}
              animate={{ y: card.animateY }}
              transition={{ repeat: Infinity, duration: 4.5 + card.delay * 0.4, delay: card.delay * 0.2, ease: 'easeInOut' }}
              className={`absolute ${card.offsetClass} floating-card px-4 py-3 flex items-center gap-2.5 min-w-[150px] z-30`}
            >
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center shrink-0`}>
                {card.icon}
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 tracking-wide leading-none">{card.label}</p>
                <p className="text-xs font-bold text-slate-900 mt-1.5 leading-none">{card.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom commitment strip */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-14 hidden md:block">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            { icon: <ShieldCheck className="w-6 h-6 text-cyan-400" />, title: 'Cam kết chính hãng 100%', desc: 'Thiết bị đầy đủ CO/CQ, kiểm tra nguồn gốc rõ ràng.' },
            { icon: <CheckCircle className="w-6 h-6 text-green-400" />, title: 'Bảo hành tận nơi', desc: 'Tiếp nhận nhanh, hỗ trợ xử lý trong thời gian bảo hành.' },
            { icon: <Zap className="w-6 h-6 text-blue-400" />, title: 'Báo giá minh bạch', desc: 'Kỹ thuật viên kiểm tra và báo giá trước khi sửa.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-4 items-center p-5 rounded-2xl bg-white/4 border border-white/7 backdrop-blur-sm hover:bg-white/8 transition-colors">
              <div className="w-12 h-12 bg-white/5 border border-white/8 rounded-xl flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="text-[15px] font-extrabold text-white leading-snug">{item.title}</p>
                <p className="text-[13px] text-slate-300 mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
