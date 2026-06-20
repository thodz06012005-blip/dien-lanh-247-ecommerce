import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Truck, CheckCircle, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';

const floatingCards = [
  {
    icon: <ShieldCheck className="w-4 h-4 text-cyan-400" />,
    label: 'Chính hãng',
    value: '24T Bảo hành',
    color: 'from-cyan-500/20 to-blue-500/10',
    delay: 0,
    offsetClass: 'top-[12%] left-[-4%] lg:left-[-8%]',
    animateY: [0, -10, 0],
  },
  {
    icon: <Truck className="w-4 h-4 text-orange-400" />,
    label: 'Giao lắp',
    value: 'Siêu tốc 2H',
    color: 'from-orange-500/20 to-red-500/10',
    delay: 0.8,
    offsetClass: 'bottom-[22%] left-[-4%] lg:left-[-8%]',
    animateY: [0, 10, 0],
  },
  {
    icon: <Zap className="w-4 h-4 text-blue-400" />,
    label: 'Hỗ trợ KT',
    value: 'Trực 24/7',
    color: 'from-blue-500/20 to-indigo-500/10',
    delay: 1.5,
    offsetClass: 'top-[8%] right-[-4%] lg:right-[-8%]',
    animateY: [0, -8, 0],
  },
  {
    icon: <CheckCircle className="w-4 h-4 text-green-400" />,
    label: 'Thanh toán',
    value: 'COD an toàn',
    color: 'from-green-500/20 to-emerald-500/10',
    delay: 2.2,
    offsetClass: 'bottom-[10%] right-[-4%] lg:right-[-8%]',
    animateY: [0, 8, 0],
  },
];

export default function HeroBanner() {
  return (
    <section className="relative bg-[#061527] overflow-hidden min-h-[88vh] flex flex-col justify-center pt-24 pb-16 lg:pb-24">
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
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/8 mb-7"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400 animate-pulse" />
            <span className="text-[0.65rem] font-extrabold tracking-widest uppercase text-cyan-300">
              Giao lắp siêu tốc trong 2h — Nội thành HN &amp; HCM
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight mb-6"
          >
            Thiết bị điện lạnh<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300">
              Chính hãng.
            </span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
              Lắp ngay.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18 }}
            className="text-sm md:text-base text-slate-300/90 mb-10 leading-relaxed max-w-[46ch]"
          >
            Hệ thống phân phối điều hòa, tủ lạnh, máy giặt chính hãng Daikin, Panasonic, LG. 
            Giao hàng trong ngày, lắp đặt hoàn chỉnh chỉ trong 2h bởi kỹ thuật viên tay nghề cao.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.28 }}
            className="flex flex-wrap gap-3 w-full sm:w-auto"
          >
            <Link to="/products" className="flex-1 sm:flex-initial min-w-0">
              <button className="btn-cta-orange w-full sm:w-auto flex items-center justify-center gap-2 text-sm px-8 py-3.5">
                Mua sắm ngay
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <a href="tel:09998888777" className="flex-1 sm:flex-initial min-w-0">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto bg-white/6 hover:bg-white/12 text-white border-white/15 hover:border-white/30 backdrop-blur-sm font-bold rounded-[0.875rem] py-3.5 px-7 text-sm"
              >
                <Phone className="w-4 h-4 mr-2 shrink-0" />
                Gọi tư vấn miễn phí
              </Button>
            </a>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.42 }}
            className="flex gap-8 mt-10 pt-8 border-t border-white/8"
          >
            {[
              { value: '15.000+', label: 'Khách hàng hài lòng' },
              { value: '99%', label: 'Lắp đúng hẹn' },
              { value: '5 năm', label: 'Kinh nghiệm ngành' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-xl font-black text-white tracking-tight leading-none">{s.value}</p>
                <p className="text-[0.65rem] text-slate-400 mt-1 font-medium">{s.label}</p>
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
              src="https://images.unsplash.com/photo-1621905252507-b354bc25edac?q=80&w=700&auto=format&fit=crop"
              alt="Thiết bị điện lạnh cao cấp"
              className="relative z-10 w-full h-full object-cover opacity-75 mix-blend-luminosity"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 z-20 bg-gradient-to-t from-slate-950/70 via-transparent to-blue-900/10" />

            {/* Inner badge */}
            <div className="absolute bottom-5 left-5 z-30">
              <span className="inline-block px-3 py-1.5 rounded-full bg-orange-500/90 text-white text-[0.6rem] font-extrabold uppercase tracking-wider shadow-lg shadow-orange-500/30">
                Ưu đãi đến 30%
              </span>
            </div>
          </motion.div>

          {/* Floating Cards */}
          {floatingCards.map((card) => (
            <motion.div
              key={card.label}
              animate={{ y: card.animateY }}
              transition={{ repeat: Infinity, duration: 3.5 + card.delay * 0.3, delay: card.delay * 0.15, ease: 'easeInOut' }}
              className={`absolute ${card.offsetClass} floating-card px-4 py-3 flex items-center gap-3 min-w-[130px]`}
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center shrink-0`}>
                {card.icon}
              </div>
              <div>
                <p className="text-[0.58rem] font-bold text-slate-400 uppercase tracking-wider leading-none">{card.label}</p>
                <p className="text-[0.72rem] font-black text-slate-900 mt-0.5 leading-none">{card.value}</p>
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
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { icon: <ShieldCheck className="w-5 h-5 text-cyan-400" />, title: '100% Chính Hãng', desc: 'CO/CQ đầy đủ, bảo hành hãng' },
            { icon: <Truck className="w-5 h-5 text-orange-400" />, title: 'Giao Lắp 2H', desc: 'Nội thành Hà Nội & HCM' },
            { icon: <Zap className="w-5 h-5 text-blue-400" />, title: 'Kỹ Thuật 24/7', desc: 'Xử lý sự cố mọi lúc mọi nơi' },
            { icon: <CheckCircle className="w-5 h-5 text-green-400" />, title: 'Thanh Toán COD', desc: 'Nhận hàng, kiểm tra mới trả' },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 items-center p-4 rounded-2xl bg-white/4 border border-white/7 backdrop-blur-sm hover:bg-white/7 transition-colors">
              <div className="w-10 h-10 bg-white/6 border border-white/8 rounded-xl flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-snug">{item.title}</p>
                <p className="text-[0.6rem] text-slate-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
