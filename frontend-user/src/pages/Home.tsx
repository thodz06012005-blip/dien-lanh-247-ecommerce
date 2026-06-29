import { useState, useEffect } from 'react';
import {
  ArrowRight, Phone, ShieldCheck, Headphones,
  Wrench, Award, ClipboardCheck, Star, Zap, Package, ThumbsUp,
  Snowflake, Settings, Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import { categories, reviews } from '../mock/data';
import type { Product } from '../mock/data';
import HeroBanner from '../components/home/HeroBanner';
import CategoryCard from '../components/home/CategoryCard';
import CounterStats from '../components/home/CounterStats';
import ServiceCaseGallery from '../components/home/ServiceCaseGallery';
import TechnicianShowcase from '../components/home/TechnicianShowcase';
import PricingTable from '../components/home/PricingTable';
import ConsultationForm from '../components/home/ConsultationForm';
import ProductGrid from '../components/product/ProductGrid';
import Button from '../components/ui/Button';
import { useSettings } from '../hooks/useSettings';
import useDocumentTitle from '../hooks/useDocumentTitle';

// Featured categories: first 3 get featured=true
const FEATURED_CAT_IDS = ['dieu-hoa', 'tu-lanh', 'may-giat'];

// Dịch vụ chuyên nghiệp Điện Lạnh 247
const SERVICES_LIST = [
  {
    icon: <Zap className="w-5 h-5 text-cyan-400" />,
    title: 'Sửa chữa điều hòa',
    desc: 'Khắc phục nhanh tình trạng điều hòa không mát, rò nước, mất nguồn, chập điện đột ngột.',
    benefits: ['Có mặt sau 30 phút', 'Báo giá trước khi làm', 'Bảo hành linh kiện 6T'],
    price: 'Từ 250.000đ',
    tag: 'Khẩn cấp 24/7',
    tagColor: 'bg-red-500/95',
    href: '/service-booking',
  },
  {
    icon: <Wrench className="w-5 h-5 text-orange-400" />,
    title: 'Vệ sinh điều hòa',
    desc: 'Vệ sinh xịt rửa sâu dàn nóng/lạnh bằng bơm áp lực, đo gas và kiểm tra dòng điện định kỳ.',
    benefits: ['Sạch sâu, diệt khuẩn', 'Thông đường ống nước', 'Tiết kiệm 20% điện'],
    price: 'Chỉ từ 150.000đ',
    tag: 'Đặt nhiều nhất',
    tagColor: 'bg-orange-500',
    href: '/service-booking',
  },
  {
    icon: <Package className="w-5 h-5 text-blue-400" />,
    title: 'Lắp đặt điều hòa',
    desc: 'Di dời vị trí máy cũ, đi ống đồng âm tường thẩm mỹ, lắp dàn nóng/lạnh chuẩn an toàn kỹ thuật.',
    benefits: ['Vật tư chính hãng', 'Bảo hành lắp đặt 12T', 'Khảo sát vị trí miễn phí'],
    price: 'Báo giá sau khảo sát',
    tag: 'Tiêu chuẩn cao',
    tagColor: 'bg-blue-600',
    href: '/service-booking',
  },
  {
    icon: <Snowflake className="w-5 h-5 text-cyan-400" />,
    title: 'Sửa chữa tủ lạnh',
    desc: 'Sửa tủ lạnh side-by-side, tủ inverter không lạnh, đóng tuyết, hỏng block, xì gas hoặc kêu to.',
    benefits: ['Thợ chuyên sâu dòng cao', 'Linh kiện block chính hãng', 'Xử lý triệt để tại nhà'],
    price: 'Từ 350.000đ',
    tag: 'Đã xác minh',
    tagColor: 'bg-cyan-600',
    href: '/service-booking',
  },
  {
    icon: <Settings className="w-5 h-5 text-indigo-400" />,
    title: 'Sửa chữa máy giặt',
    desc: 'Xử lý máy giặt cửa ngang/cửa đứng rung lắc mạnh, không vắt, không xả nước, lỗi board mạch.',
    benefits: ['Vệ sinh lồng giặt đi kèm', 'Sửa nhanh trong ngày', 'Linh kiện chuẩn hãng'],
    price: 'Từ 300.000đ',
    tag: 'Nhanh chóng',
    tagColor: 'bg-indigo-600',
    href: '/service-booking',
  },
  {
    icon: <ThumbsUp className="w-5 h-5 text-green-400" />,
    title: 'Bảo trì hệ thống định kỳ',
    desc: 'Gói chăm sóc vệ sinh định kỳ cho nhà hàng, văn phòng, cửa hàng kinh doanh, tối ưu hiệu suất.',
    benefits: ['Lập lịch bảo trì tự động', 'Hóa đơn VAT đầy đủ', 'Ưu tiên hỗ trợ khẩn cấp'],
    price: 'Báo giá trọn gói',
    tag: 'Doanh nghiệp',
    tagColor: 'bg-green-600',
    href: '/service-booking',
  },
];

export default function Home() {
  useDocumentTitle('Điện Lạnh 247 - Giao lắp siêu tốc điều hòa, tủ lạnh, máy giặt');
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<'bestSeller' | 'discount' | 'newArrival'>('bestSeller');

  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

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

  const steps = [
    { num: '01', icon: <ClipboardCheck className="w-5 h-5" />, title: 'Gửi yêu cầu', desc: 'Đặt lịch sửa chữa hoặc bảo trì nhanh qua website, hotline 24/7 hoặc chat Zalo khẩn cấp.' },
    { num: '02', icon: <Phone className="w-5 h-5" />, title: 'Xác nhận điều phối', desc: 'Tổng đài tiếp nhận thông tin, tư vấn sơ bộ và điều phối kỹ thuật viên chuyên trách gần nhất.' },
    { num: '03', icon: <Wrench className="w-5 h-5" />, title: 'Kiểm tra tận nơi', desc: 'KTV đến nhà đúng hẹn, kiểm tra chi tiết thiết bị và tìm chính xác nguyên nhân sự cố.' },
    { num: '04', icon: <ThumbsUp className="w-5 h-5" />, title: 'Báo giá & Sửa chữa', desc: 'Báo giá minh bạch trước khi làm. Tiến hành sửa chữa ngay sau khi khách hàng đồng ý.' },
    { num: '05', icon: <ShieldCheck className="w-5 h-5" />, title: 'Nghiệm thu bảo hành', desc: 'Vận hành bàn giao thiết bị, thanh toán và kích hoạt bảo hành điện tử dài hạn 3-12T.' },
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
              <h2 className="text-2xl md:text-[36px] font-black text-slate-900 tracking-tight leading-none">
                Danh mục sản phẩm &amp; Dịch vụ
              </h2>
            </div>
            <p className="text-base text-slate-500 max-w-xs leading-relaxed hidden md:block">
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

      {/* ── 4. SERVICE SHOWCASE (dark section) ──────────────────────── */}
      <section className="premium-mesh-bg blueprint-grid py-20 md:py-28 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-14">
            <p className="premium-kicker text-cyan-400 mb-3 justify-center">
              <span className="w-5 h-px bg-cyan-500 rounded-full inline-block" />
              Kỹ thuật điện lạnh chuyên sâu
            </p>
            <h2 className="premium-heading-dark mb-4 text-center">
              Dịch vụ kỹ thuật chuyên nghiệp
            </h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed text-center">
              Điện Lạnh 247 tiếp nhận đặt lịch lắp đặt, sửa chữa khẩn cấp và bảo trì định kỳ cho mọi thiết bị điện lạnh gia đình và doanh nghiệp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES_LIST.map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="group flex flex-col p-6 rounded-[2rem] bg-white/5 border border-white/8 hover:bg-white/10 hover:border-cyan-500/35 hover:shadow-xl hover:shadow-cyan-500/10 transition-all"
              >
                {/* Header card with Tag */}
                <div className="flex justify-between items-start gap-4 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-white/8 text-cyan-400 flex items-center justify-center group-hover:bg-cyan-500/20 group-hover:text-cyan-300 transition-colors">
                    {service.icon}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white ${service.tagColor} shadow-sm`}>
                    {service.tag}
                  </span>
                </div>

                {/* Text */}
                <h3 className="text-base font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">{service.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4 flex-1">{service.desc}</p>
                
                {/* Benefits checklist */}
                <ul className="space-y-2 border-t border-white/8 pt-4 mb-5">
                  {service.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                {/* Footer card: Price & CTA */}
                <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-4 mt-auto">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide leading-none">Chi phí từ</p>
                    <p className="text-sm font-extrabold text-cyan-400 mt-1 leading-none">{service.price}</p>
                  </div>
                  <Link to={service.href}>
                    <button className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 transition-all hover:-translate-y-0.5 cursor-pointer">
                      Đặt lịch ngay <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. SERVICE CASES (real works gallery) ─────────────────── */}
      <ServiceCaseGallery />

      {/* ── 6. STATS (Counter Stats) ─────────────────────────────── */}
      <CounterStats />

      {/* ── 6. TRUST + WHY US (light) ─────────────────────────────── */}
      <section className="py-20 md:py-28 bg-white border-t border-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-center">
            {/* LEFT copy */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <p className="premium-kicker">
                <span className="w-5 h-px bg-blue-500 rounded-full inline-block" />
                Tiêu chuẩn dịch vụ
              </p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                5 Cam kết vàng từ<br />
                <span className="gradient-text">Điện Lạnh 247</span>
              </h2>
              <p className="premium-description">
                Chúng tôi thiết lập tiêu chuẩn kỹ thuật dịch vụ điện lạnh cao cấp, mang lại sự an tâm tuyệt đối và bảo vệ tối đa quyền lợi của khách hàng.
              </p>

              <div className="flex gap-3 mt-2">
                <a href={`tel:${settings.hotline || '09998888777'}`}>
                  <Button variant="primary" size="md" className="font-bold rounded-xl shadow-md shadow-primary-500/10">
                    Gọi hotline đặt lịch
                  </Button>
                </a>
                <a href={`https://zalo.me/${settings.zalo || '09998888777'}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="md" className="border-slate-200 font-bold rounded-xl hover:border-blue-300">
                    Hỗ trợ qua Zalo
                  </Button>
                </a>
              </div>
            </div>

            {/* RIGHT benefit cards — 5 commitments checklist */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {[
                { icon: <Zap className="w-5 h-5 text-orange-500" />, title: 'Báo giá trước khi sửa', desc: 'Kỹ thuật viên kiểm tra lỗi tận nơi và lập bảng báo giá chi tiết cho khách hàng duyệt trước khi sửa chữa, không phát sinh chi phí ẩn.' },
                { icon: <Award className="w-5 h-5 text-blue-600" />, title: 'Kỹ thuật viên chuyên nghiệp xác minh', desc: '100% đội ngũ thợ có chứng chỉ nghề từ Daikin, Panasonic..., mặc đồng phục lịch sự, trung thực và được xác minh danh tính rõ ràng.' },
                { icon: <Package className="w-5 h-5 text-cyan-500" />, title: 'Linh kiện chính hãng rõ nguồn gốc', desc: 'Cam kết chỉ thay thế linh kiện, phụ tùng và vật tư điện lạnh chính hãng từ nhà sản xuất, bảo toàn độ bền của thiết bị.' },
                { icon: <ShieldCheck className="w-5 h-5 text-green-600" />, title: 'Bảo hành dịch vụ rõ ràng', desc: 'Thời gian bảo hành từ 3 đến 12 tháng sau khi xử lý. Nghiệm thu bàn giao phiếu bảo hành và hỗ trợ nhanh chóng khi có sự cố phát sinh.' },
                { icon: <Headphones className="w-5 h-5 text-blue-500" />, title: 'Hỗ trợ khẩn cấp 24/7', desc: 'Đội ngũ kỹ thuật viên thường trực tiếp nhận xử lý nhanh chóng các sự cố rò rỉ gas, chảy nước, chập điện trong khu vực nội thành.' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="flex gap-4 p-5 bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-100/70 rounded-2xl transition-all group hover:shadow-lg hover:shadow-blue-500/10"
                >
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-100 group-hover:bg-blue-50 transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. STEPS (gradient light-blue section) ────────────────── */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-blue-50/40 via-white to-cyan-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="premium-kicker justify-center mb-2">
              <span className="w-5 h-px bg-blue-500 rounded-full inline-block" />
              Quy trình chuẩn hóa
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight text-center">
              Quy trình dịch vụ kỹ thuật 5 sao
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-3 leading-relaxed text-center">
              Quy trình khép kín chặt chẽ giúp giải quyết triệt để sự cố kỹ thuật của gia đình bạn một cách nhanh chóng nhất.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 relative">
            {steps.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="relative flex flex-col items-center text-center p-6 md:p-7 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all group overflow-hidden"
              >
                {/* Connector line for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 -right-3 w-6 h-0.5 bg-slate-100 z-0" />
                )}

                {/* Big step number */}
                <span className="absolute top-3 right-4 text-4xl font-black text-slate-100 select-none group-hover:text-blue-500/8 transition-colors font-mono">
                  {item.num}
                </span>

                {/* Icon Box */}
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 text-blue-600 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-500 group-hover:text-white transition-all duration-300 shadow-sm">
                  {item.icon}
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. TECHNICIANS (Technician Showcase) ─────────────────── */}
      <TechnicianShowcase />

      {/* ── 9. PRICING (Pricing Table) ───────────────────────────── */}
      <PricingTable />

      {/* ── 10. REVIEWS (white) ────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="premium-kicker justify-center mb-2">
              <span className="w-5 h-px bg-blue-500 rounded-full inline-block" />
              Đánh giá thực tế
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight text-center">
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
                className="flex flex-col justify-between p-6 bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10 rounded-[2rem] transition-all"
              >
                <div>
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-700 italic leading-relaxed mb-6">
                    "{rev.content}"
                  </p>
                </div>

                <div className="flex items-center gap-3.5 pt-4 border-t border-slate-100">
                  <img
                    src={rev.avatar || '/placeholder-product.png'}
                    alt={rev.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200"
                    onError={(e) => { e.currentTarget.src = '/placeholder-product.png'; }}
                  />
                  <div>
                    <h4 className="text-[9px] font-extrabold text-slate-900">{rev.name}</h4>
                    <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">
                      Dịch vụ: {rev.productName}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 11. CONSULT CTA (deep navy) ────────────────────────────── */}
      <ConsultationForm />

    </div>
  );
}
