import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface StatItemProps {
  value: number;
  suffix?: string;
  label: string;
  description: string;
}

function StatItem({ value, suffix = '', label, description }: StatItemProps) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = value;
    if (start === end) return;

    const totalDuration = 1200; // ms
    const steps = 40;
    const increment = Math.ceil(end / steps);
    const incrementTime = Math.floor(totalDuration / steps);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <div ref={ref} className="text-center p-5 md:p-6 bg-slate-50 border border-slate-100 rounded-[1.75rem] hover:border-blue-100/80 hover:shadow-lg hover:shadow-blue-500/10 transition-all group">
      <motion.p 
        initial={{ scale: 0.85, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.4 }}
        className="text-2xl sm:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 tracking-tight leading-none"
      >
        {count}{suffix}
      </motion.p>
      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mt-3.5 leading-none transition-colors group-hover:text-blue-600">{label}</h4>
      <p className="text-xs text-slate-500 mt-2.5 leading-relaxed max-w-[24ch] mx-auto">{description}</p>
    </div>
  );
}

const statsData = [
  { value: 10, suffix: '+ Năm', label: 'Kinh nghiệm ngành', description: 'Hoạt động lâu năm trong lĩnh vực kỹ thuật cơ điện lạnh chuyên nghiệp.' },
  { value: 5000, suffix: '+', label: 'Thiết bị xử lý', description: 'Đã bảo trì, vệ sinh và khắc phục sự cố thành công cho hàng nghìn hộ gia đình.' },
  { value: 50, suffix: '+', label: 'Kỹ thuật viên', description: 'Đội thợ phủ rộng khắp các khu vực, sẵn sàng nhận nhiệm vụ nhanh chóng.' },
  { value: 24, suffix: '/7', label: 'Trực kỹ thuật', description: 'Tiếp nhận yêu cầu sự cố rò rỉ gas, chảy nước, chập điện 24 giờ mỗi ngày.' },
  { value: 98, suffix: '%', label: 'Khách hàng hài lòng', description: 'Khảo sát chất lượng dịch vụ sau sửa chữa ghi nhận phản hồi cực tốt.' },
];

export default function CounterStats() {
  return (
    <section className="py-12 md:py-16 bg-white border-t border-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-10 max-w-xl mx-auto">
          <p className="premium-kicker justify-center mb-2">
            <span className="w-5 h-px bg-blue-500 rounded-full inline-block" />
            Số liệu biết nói
          </p>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Năng lực và uy tín được khẳng định
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statsData.map((stat, i) => (
            <StatItem
              key={i}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              description={stat.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
