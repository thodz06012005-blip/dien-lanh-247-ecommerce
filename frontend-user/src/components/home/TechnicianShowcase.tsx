import { motion } from 'framer-motion';
import { Star, ShieldCheck, Briefcase, MapPin } from 'lucide-react';

interface Technician {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  rating: number;
  completedJobs: number;
  areas: string[];
  experience: string;
}

const technicians: Technician[] = [
  {
    id: 'tech-1',
    name: 'KTV. Nguyễn Văn Hùng',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    specialty: 'Chuyên gia Điều hòa & Block nén',
    rating: 4.9,
    completedJobs: 480,
    areas: ['Cầu Giấy', 'Tây Hồ', 'Từ Liêm'],
    experience: '8 năm kinh nghiệm'
  },
  {
    id: 'tech-2',
    name: 'KTV. Trần Minh Đức',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
    specialty: 'Chuyên gia Tủ lạnh Side-by-Side & Inverter',
    rating: 5.0,
    completedJobs: 320,
    areas: ['Đống Đa', 'Thanh Xuân', 'Hai Bà Trưng'],
    experience: '6 năm kinh nghiệm'
  },
  {
    id: 'tech-3',
    name: 'KTV. Phạm Quốc Khánh',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop',
    specialty: 'Kỹ thuật viên Máy giặt sấy & Bo mạch',
    rating: 4.9,
    completedJobs: 410,
    areas: ['Ba Đình', 'Hoàn Kiếm', 'Long Biên'],
    experience: '7 năm kinh nghiệm'
  },
  {
    id: 'tech-4',
    name: 'KTV. Lê Hoàng Long',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop',
    specialty: 'Lắp đặt hệ thống điều hòa Multi & Cassette',
    rating: 4.8,
    completedJobs: 360,
    areas: ['Thanh Trì', 'Hoàng Mai', 'Hà Đông'],
    experience: '5 năm kinh nghiệm'
  }
];

export default function TechnicianShowcase() {
  return (
    <section className="py-20 md:py-28 bg-[#f8fafc] border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Header */}
        <div className="text-center mb-14 max-w-xl mx-auto">
          <p className="premium-kicker justify-center mb-2">
            <span className="w-5 h-px bg-blue-500 rounded-full inline-block" />
            Đội ngũ thợ đạt chuẩn
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Kỹ thuật viên chuyên nghiệp 5 sao
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-3 leading-relaxed">
            100% Kỹ thuật viên của Điện Lạnh 247 được xác minh tay nghề, có chứng chỉ kỹ thuật từ hãng lớn và cam kết trung thực tuyệt đối.
          </p>
        </div>

        {/* Tech Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {technicians.map((tech, idx) => (
            <motion.div
              key={tech.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col items-center text-center shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-350 group relative overflow-hidden"
            >
              {/* Verified Badge */}
              <span className="absolute top-4 right-4 z-20 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-green-600 font-bold text-white text-[10px] uppercase tracking-wider shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                Đã xác minh
              </span>

              {/* Avatar Box */}
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-slate-50 group-hover:border-blue-200 transition-colors mb-4 shrink-0 shadow-sm">
                <img
                  src={tech.avatar}
                  alt={tech.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              {/* Info content */}
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-none mb-2">
                {tech.name}
              </h3>
              
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100/50 px-2.5 py-0.5 rounded-lg mb-3">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{tech.rating.toFixed(1)}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-medium">{tech.experience}</span>
              </div>

              <p className="text-xs text-slate-600 font-semibold leading-snug min-h-[2rem] max-w-[20ch]">
                {tech.specialty}
              </p>

              {/* Extra stats */}
              <div className="w-full border-t border-slate-50 pt-4 mt-4 flex flex-col gap-2 text-left">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Briefcase className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Hoàn thành: <strong className="text-slate-800 font-semibold">{tech.completedJobs}+ việc</strong></span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-500">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    Khu vực: <strong className="text-slate-800 font-semibold">{tech.areas.join(', ')}</strong>
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
