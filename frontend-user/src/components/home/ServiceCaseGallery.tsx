import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, Eye } from 'lucide-react';

interface ServiceCase {
  id: string;
  title: string;
  category: 'dieu-hoa' | 'tu-lanh' | 'may-giat' | 'lap-dat' | 'bao-tri';
  categoryLabel: string;
  location: string;
  image: string;
  description: string;
  status: string;
}

const serviceCases: ServiceCase[] = [
  {
    id: 'case-1',
    title: 'Vệ sinh hệ thống điều hòa âm trần văn phòng',
    category: 'dieu-hoa',
    categoryLabel: 'Điều hòa',
    location: 'Quận Cầu Giấy, Hà Nội',
    image: 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?q=80&w=600&auto=format&fit=crop',
    description: 'Xịt rửa sạch sâu hệ thống 8 điều hòa âm trần cassette Daikin, thông đường ống thoát nước ngưng và nạp gas bổ sung.',
    status: 'Hoàn thành bàn giao'
  },
  {
    id: 'case-2',
    title: 'Lắp đặt điều hòa multi cho căn hộ 3 phòng ngủ',
    category: 'lap-dat',
    categoryLabel: 'Lắp đặt',
    location: 'Vinhomes Ocean Park, Gia Lâm',
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=600&auto=format&fit=crop',
    description: 'Thi công đi đường ống đồng âm trần thạch cao, lắp đặt hệ thống 1 dàn nóng kết hợp 3 dàn lạnh âm trần nối ống gió thẩm mỹ.',
    status: 'Nghiệm thu chuẩn hãng'
  },
  {
    id: 'case-3',
    title: 'Sửa tủ lạnh Side-by-Side LG không đông đá',
    category: 'tu-lanh',
    categoryLabel: 'Tủ lạnh',
    location: 'Quận Tây Hồ, Hà Nội',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop',
    description: 'Khắc phục sự cố hỏng quạt dàn lạnh và lỗi cảm biến xả tuyết trên tủ lạnh dung tích lớn LG Inverter tại nhà khách hàng.',
    status: 'Xử lý triệt để tại nhà'
  },
  {
    id: 'case-4',
    title: 'Sửa máy giặt Electrolux lồng ngang rung lắc mạnh',
    category: 'may-giat',
    categoryLabel: 'Máy giặt',
    location: 'Quận Đống Đa, Hà Nội',
    image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?q=80&w=600&auto=format&fit=crop',
    description: 'Thay thế bộ thụt nhún giảm chấn chính hãng và cân chỉnh lồng giặt bằng thiết bị cân bằng chuyên dụng, khắc phục tiếng kêu to.',
    status: 'Bảo hành 6 tháng'
  },
  {
    id: 'case-5',
    title: 'Bảo trì định kỳ hệ thống kho lạnh siêu thị mini',
    category: 'bao-tri',
    categoryLabel: 'Bảo trì',
    location: 'Quận Long Biên, Hà Nội',
    image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?q=80&w=600&auto=format&fit=crop',
    description: 'Đo áp suất gas, vệ sinh dàn ngưng tủ đông, tủ mát trưng bày và bảo dưỡng định kỳ block nén đảm bảo nhiệt độ chuẩn 24/7.',
    status: 'Hợp đồng định kỳ'
  },
  {
    id: 'case-6',
    title: 'Vệ sinh bảo dưỡng máy giặt sấy cao cấp Panasonic',
    category: 'may-giat',
    categoryLabel: 'Máy giặt',
    location: 'Quận Thanh Xuân, Hà Nội',
    image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=600&auto=format&fit=crop',
    description: 'Tháo lồng xịt rửa mảng bám cặn bột giặt, vệ sinh ống thoát sấy khô và thông tắc bơm xả nước thải dàn lạnh.',
    status: 'Hoàn thành sạch 99%'
  }
];

const filterTabs = [
  { key: 'all' as const, label: 'Tất cả dự án' },
  { key: 'dieu-hoa' as const, label: 'Điều hòa' },
  { key: 'tu-lanh' as const, label: 'Tủ lạnh' },
  { key: 'may-giat' as const, label: 'Máy giặt' },
  { key: 'lap-dat' as const, label: 'Lắp đặt' },
  { key: 'bao-tri' as const, label: 'Bảo trì' }
];

export default function ServiceCaseGallery() {
  const [activeFilter, setActiveFilter] = useState<'all' | ServiceCase['category']>('all');

  const filteredCases = activeFilter === 'all'
    ? serviceCases
    : serviceCases.filter(item => item.category === activeFilter);

  return (
    <section className="py-20 md:py-28 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <p className="premium-kicker mb-2">
              <span className="w-5 h-px bg-blue-500 rounded-full inline-block" />
              Hình ảnh thi công thực tế
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Công trình tiêu biểu đã xử lý
            </h2>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === tab.key
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredCases.map((item, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                key={item.id}
                className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-350 group flex flex-col h-full"
              >
                {/* Image Stage */}
                <div className="relative overflow-hidden h-48 sm:h-52 shrink-0">
                  <div className="absolute inset-0 bg-slate-900/10 z-10 pointer-events-none group-hover:bg-slate-900/30 transition-colors" />
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.08]"
                    loading="lazy"
                  />
                  {/* Category label badge */}
                  <span className="absolute top-4 left-4 z-20 px-3 py-1 bg-blue-600/90 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm">
                    {item.categoryLabel}
                  </span>
                  {/* Eye look hover */}
                  <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-xs text-blue-600 flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      <Eye className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Info Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold">{item.location}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mb-2 line-clamp-1">
                    {item.title}
                  </h3>
                  
                  <p className="text-xs text-slate-500 leading-relaxed mb-4 flex-1 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between gap-3 border-t border-slate-50 pt-4 mt-auto">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {item.status}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:gap-1.5 transition-all">
                      Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
