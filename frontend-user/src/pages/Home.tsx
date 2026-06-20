import { useState, useEffect } from 'react';
import {
  ArrowRight, Phone, MessageSquare, ShieldCheck, Truck, Headphones,
  Wrench, Award, ClipboardCheck, Star, Zap, Package, ThumbsUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import { categories, reviews } from '../mock/data';
import type { Product } from '../mock/data';
import HeroBanner from '../components/home/HeroBanner';
import CategoryCard from '../components/home/CategoryCard';
import ProductGrid from '../components/product/ProductGrid';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToastStore } from '../store/toastStore';
import { useSettings } from '../hooks/useSettings';
import useDocumentTitle from '../hooks/useDocumentTitle';

// Featured categories: first 3 get featured=true
const FEATURED_CAT_IDS = ['dieu-hoa', 'tu-lanh', 'may-giat'];

// Consultation packages for the new "Smart Picker" section
const SERVICE_COMBOS = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Lắp đặt nhanh',
    desc: 'Giao và lắp trong 2h. Kỹ thuật viên đến đúng giờ, đảm bảo đúng kỹ thuật.',
    tag: 'Phổ biến nhất',
    tagColor: 'bg-orange-500',
    href: '/products',
  },
  {
    icon: <Package className="w-6 h-6" />,
    title: 'Gói trọn bộ',
    desc: 'Bao gồm máy + vật tư lắp đặt + dây điện + bảo hành lắp đặt 12 tháng.',
    tag: 'Tiết kiệm nhất',
    tagColor: 'bg-blue-600',
    href: '/products',
  },
  {
    icon: <Wrench className="w-6 h-6" />,
    title: 'Bảo dưỡng định kỳ',
    desc: 'Vệ sinh máy lạnh theo chu kỳ 6 tháng, tăng tuổi thọ và hiệu năng thiết bị.',
    tag: 'Khuyến mãi 20%',
    tagColor: 'bg-cyan-600',
    href: '/products',
  },
  {
    icon: <ThumbsUp className="w-6 h-6" />,
    title: 'Tư vấn miễn phí',
    desc: 'Chuyên gia tư vấn chọn dòng máy phù hợp diện tích phòng và ngân sách của bạn.',
    tag: 'Hoàn toàn miễn phí',
    tagColor: 'bg-green-600',
    href: 'tel:09998888777',
  },
];

export default function Home() {
  useDocumentTitle('Điện Lạnh 247 - Giao lắp siêu tốc điều hòa, tủ lạnh, máy giặt');
  const { settings } = useSettings();
  const { showSuccess, showError } = useToastStore();
  const [activeTab, setActiveTab] = useState<'bestSeller' | 'discount' | 'newArrival'>('bestSeller');

  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      setIsLoadingProducts(true);
      try {
        const params: Record<string, unknown> = { limit: 4 };
        if (activeTab === 'bestSeller') params.sort = 'bestSeller';
        else params.sort = 'newest';

        const response = await api.get('/products', { params });
        if (response.data?.success) {
          let list = response.data.data as Product[];
          if (activeTab === 'discount') {
            list = list.filter((p) => !!p.salePrice && p.salePrice < p.basePrice);
            if (list.length === 0) list = (response.data.data as Product[]).slice(0, 4);
          }
          setDisplayedProducts(list.slice(0, 4));
        }
      } catch (err) {
        console.error('Error loading products for home tabs', err);
      } finally {
        setIsLoadingProducts(false);
      }
    }
    loadProducts();
  }, [activeTab]);

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

  const steps = [
    { num: '01', icon: <ClipboardCheck className="w-6 h-6" />, title: 'Đăng Ký Đặt Hàng', desc: 'Chọn sản phẩm, dịch vụ và đặt hàng qua Web, Hotline hoặc Zalo nhanh chóng.' },
    { num: '02', icon: <Phone className="w-6 h-6" />, title: 'Xác Nhận & Tư Vấn', desc: 'Kỹ thuật viên gọi xác nhận dòng máy, công suất và chốt thời gian giao lắp.' },
    { num: '03', icon: <Truck className="w-6 h-6" />, title: 'Giao Lắp Siêu Tốc', desc: 'Giao hàng và lắp đặt chuẩn kỹ thuật chỉ trong 2h tại khu vực nội thành.' },
    { num: '04', icon: <ShieldCheck className="w-6 h-6" />, title: 'Bảo Hành Sau Bán', desc: 'Kích hoạt bảo hành điện tử chính hãng và bảo hành lắp đặt tận tâm 24 tháng.' },
  ];

  const TABS = [
    { key: 'bestSeller' as const, label: 'Bán chạy' },
    { key: 'discount' as const, label: 'Khuyến mãi hot' },
    { key: 'newArrival' as const, label: 'Hàng mới về' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">

      {/* ── 1. HERO ─────────────────────────────────────────────── */}
      <HeroBanner />

      {/* ── 2. CATEGORIES (light section) ────────────────────────── */}
      <section className="py-20 md:py-28 section-glow relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="premium-kicker mb-2">
                <span className="w-5 h-px bg-blue-500 rounded-full inline-block" />
                Mua sắm thông minh
              </p>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Danh mục sản phẩm &amp; Dịch vụ
              </h2>
            </div>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed hidden md:block">
              Thiết bị chính hãng từ Daikin, Panasonic, LG cùng gói bảo dưỡng chuyên nghiệp.
            </p>
          </div>

          {/* Category grid */}
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                id={cat.id}
                name={cat.name}
                iconName={cat.icon}
                productCount={cat.productCount}
                featured={FEATURED_CAT_IDS.includes(cat.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. PRODUCTS (slightly tinted bg) ─────────────────────── */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Header + Tabs */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div>
              <p className="premium-kicker mb-2">
                <span className="w-5 h-px bg-blue-500 rounded-full inline-block" />
                Gợi ý hôm nay
              </p>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Sản phẩm bán chạy nhất
              </h2>
            </div>

            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/15'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <ProductGrid products={displayedProducts} isLoading={isLoadingProducts} skeletonCount={4} />

          <div className="text-center mt-12">
            <Link to="/products">
              <Button
                variant="outline"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="font-bold rounded-2xl border-slate-200 hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                Xem tất cả sản phẩm
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. SERVICE COMBOS (dark section) ──────────────────────── */}
      <section className="premium-mesh-bg blueprint-grid py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-14">
            <p className="premium-kicker text-cyan-400 mb-3 justify-center">
              <span className="w-5 h-px bg-cyan-500 rounded-full inline-block" />
              Dịch vụ &amp; Giải pháp
            </p>
            <h2 className="premium-heading-dark mb-4">
              Chọn gói phù hợp với bạn
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              Từ lắp đặt nhanh đến bảo dưỡng định kỳ — Điện Lạnh 247 cung cấp trọn gói giải pháp cho mọi nhu cầu điện lạnh.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICE_COMBOS.map((combo, i) => (
              <motion.a
                key={i}
                href={combo.href}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="group flex flex-col p-6 rounded-2xl bg-white/5 border border-white/8 hover:bg-white/10 hover:border-white/16 transition-all cursor-pointer"
              >
                {/* Tag */}
                <span className={`self-start px-2.5 py-0.5 rounded-full text-[0.6rem] font-extrabold uppercase tracking-wider text-white ${combo.tagColor} mb-5`}>
                  {combo.tag}
                </span>
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-white/8 text-cyan-400 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                  {combo.icon}
                </div>
                {/* Text */}
                <h3 className="text-sm font-bold text-white mb-2">{combo.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed flex-1">{combo.desc}</p>
                {/* Arrow */}
                <div className="flex items-center gap-1.5 mt-5 text-cyan-400 text-xs font-bold group-hover:gap-3 transition-all">
                  Xem thêm <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. TRUST + WHY US (light) ─────────────────────────────── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-center">
            {/* LEFT copy */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <p className="premium-kicker">
                <span className="w-5 h-px bg-blue-500 rounded-full inline-block" />
                Lợi ích độc quyền
              </p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                An tâm mua sắm tại<br />
                <span className="gradient-text">Điện Lạnh 247</span>
              </h2>
              <p className="premium-description">
                Chúng tôi không chỉ bán thiết bị chính hãng, mà còn cung cấp trọn gói giải pháp lắp đặt và dịch vụ bảo dưỡng chuẩn mực, chăm sóc thiết bị trọn đời.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                {[
                  { val: '15K+', label: 'Khách hài lòng' },
                  { val: '99%', label: 'Đúng hẹn lắp' },
                  { val: '5★', label: 'Đánh giá TB' },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="stat-number leading-none">{s.val}</p>
                    <p className="text-[0.65rem] text-slate-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-2">
                <a href={`tel:${settings.hotline || '09998888777'}`}>
                  <Button variant="primary" size="md" className="font-bold rounded-xl">
                    Gọi Hotline ngay
                  </Button>
                </a>
                <a href={`https://zalo.me/${settings.zalo || '09998888777'}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="md" className="border-slate-200 font-bold rounded-xl hover:border-blue-300">
                    Nhắn tin Zalo
                  </Button>
                </a>
              </div>
            </div>

            {/* RIGHT benefit cards */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: <Award className="w-7 h-7 text-blue-600" />, title: 'Chính hãng 100%', desc: 'Sản phẩm phân phối chính thức từ Daikin, Panasonic, LG, Samsung, Casper — đầy đủ CO/CQ.' },
                { icon: <Wrench className="w-7 h-7 text-blue-600" />, title: 'Lắp đặt chuyên nghiệp', desc: 'KTV dày dặn kinh nghiệm, lắp đảm bảo thẩm mỹ, đúng kỹ thuật và tối ưu vận hành.' },
                { icon: <Truck className="w-7 h-7 text-blue-600" />, title: 'Giao hàng 2h', desc: 'Giao siêu tốc trong ngày, lắp đặt hoàn chỉnh trong vòng 2h với đơn hàng khẩn cấp.' },
                { icon: <Headphones className="w-7 h-7 text-blue-600" />, title: 'Hỗ trợ kỹ thuật 24/7', desc: 'Tổng đài hỗ trợ sự cố khẩn cấp, chảy nước, rò gas mọi lúc — kể cả ngày nghỉ lễ.' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.08 }}
                  className="p-6 bg-slate-50 hover:bg-blue-50/60 border border-slate-100 hover:border-blue-100 rounded-2xl transition-all group"
                >
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white transition-colors shadow-sm">
                    {item.icon}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. STEPS (gradient light-blue section) ────────────────── */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-blue-50/80 via-white to-cyan-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="premium-kicker justify-center mb-2">
              <span className="w-5 h-px bg-blue-500 rounded-full inline-block" />
              Quy trình chuẩn hóa
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              4 bước mua hàng dễ dàng
            </h2>
            <p className="text-sm text-slate-500 mt-3 leading-relaxed">
              Quy trình khép kín giúp bạn sở hữu thiết bị ưng ý mà không mất công sức và thời gian.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="relative flex flex-col items-center text-center p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-blue-500/6 transition-all group overflow-hidden"
              >
                {/* Big step number */}
                <span className="absolute top-4 right-5 text-5xl font-black text-slate-100 select-none group-hover:text-blue-500/8 transition-colors font-mono">
                  {item.num}
                </span>
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-500 group-hover:text-white transition-all duration-300 shadow-sm">
                  {item.icon}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. REVIEWS (white) ────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="premium-kicker justify-center mb-2">
              <span className="w-5 h-px bg-blue-500 rounded-full inline-block" />
              Đánh giá thực tế
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Khách hàng nói gì về chúng tôi
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <motion.div
                key={rev.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35 }}
                className="flex flex-col justify-between p-7 bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 rounded-[2rem] transition-all"
              >
                <div>
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 italic leading-relaxed mb-6">
                    "{rev.content}"
                  </p>
                </div>

                <div className="flex items-center gap-3.5 pt-4 border-t border-slate-100">
                  <img
                    src={rev.avatar || '/placeholder-product.png'}
                    alt={rev.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    onError={(e) => { e.currentTarget.src = '/placeholder-product.png'; }}
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{rev.name}</h4>
                    <p className="text-[0.65rem] text-slate-400 mt-0.5 line-clamp-1">
                      Đã mua: {rev.productName}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. CONSULT CTA (deep navy) ────────────────────────────── */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 mb-12">
        <div className="max-w-7xl mx-auto">
          <div className="premium-mesh-bg blueprint-grid rounded-[2.5rem] md:rounded-[3.5rem] text-white p-8 md:p-14 flex flex-col lg:flex-row justify-between items-center gap-12 border border-white/5 overflow-hidden relative">
            {/* Extra glow blob */}
            <div className="absolute top-[-30%] right-[-10%] w-[50%] h-[80%] rounded-full bg-blue-600/12 blur-[120px] pointer-events-none" />

            {/* LEFT */}
            <div className="relative z-10 max-w-lg flex flex-col gap-5">
              <p className="premium-kicker text-cyan-400">
                <span className="w-5 h-px bg-cyan-500 rounded-full inline-block" />
                Hỗ trợ tư vấn
              </p>
              <h3 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
                Bạn cần tư vấn dòng máy<br className="hidden md:block" /> hoặc xử lý sự cố?
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Điền thông tin liên hệ — kỹ thuật viên Điện Lạnh 247 sẽ gọi điện tư vấn miễn phí trong 15 phút.
              </p>
              <div className="flex flex-col gap-3 text-sm">
                <a href={`tel:${settings.hotline || '09998888777'}`} className="flex items-center gap-2 hover:text-cyan-300 transition-colors">
                  <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                  Hotline: <strong>{settings.hotline || '0999 888 777'}</strong>
                </a>
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                  Zalo: <strong>{settings.zalo || '0900 000 247'}</strong>
                </span>
              </div>
            </div>

            {/* RIGHT — form */}
            <div className="relative z-10 bg-white text-slate-900 p-7 md:p-8 rounded-2xl shadow-2xl w-full max-w-md">
              <h4 className="text-sm font-black text-slate-900 mb-6">
                Đăng ký tư vấn miễn phí
              </h4>
              <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
                <Input
                  label="Họ tên (*)"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={contactName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactName(e.target.value)}
                  className="py-2.5 rounded-xl border-slate-200"
                />
                <Input
                  label="Số điện thoại (*)"
                  placeholder="Ví dụ: 0912 345 678"
                  type="tel"
                  value={contactPhone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactPhone(e.target.value)}
                  className="py-2.5 rounded-xl border-slate-200"
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Yêu cầu cụ thể</label>
                  <textarea
                    placeholder="Ví dụ: Điều hòa Daikin 1HP cho phòng 15m²..."
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
                  className="w-full py-3 rounded-xl mt-1 font-bold bg-[#F97316] hover:bg-[#EA580C] border-none shadow-md shadow-orange-500/20"
                >
                  Gửi yêu cầu ngay
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
