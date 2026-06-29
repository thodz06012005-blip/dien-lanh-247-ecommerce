import { useId } from 'react';
import clsx from 'clsx';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { CheckCircle, TrendingUp, ShoppingCart } from 'lucide-react';

// ----------------------------------------------------
// 1. Mini Sparklines (For KPI Cards)
// ----------------------------------------------------
export function MiniSparkline({ data, color = 'blue' }: { data: number[]; color?: 'blue' | 'green' | 'purple' | 'orange' }) {
  const uniqueId = useId().replace(/:/g, '');
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min;
  
  const width = 100;
  const height = 40;
  
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / (range || 1)) * height;
    return `${x},${y}`;
  }).join(' L ');

  const pathD = `M ${points}`;
  const fillPathD = `M 0,${height} L ${points} L ${width},${height} Z`;

  // Standardize unique linearGradient IDs to avoid SVG conflicts in lists
  const gradId = `spark-grad-${color}-${uniqueId}`;

  const colorConfig = {
    blue: { stroke: '#3b82f6', stopColor: '#3b82f6' },
    green: { stroke: '#10b981', stopColor: '#10b981' },
    purple: { stroke: '#8b5cf6', stopColor: '#8b5cf6' },
    orange: { stroke: '#f97316', stopColor: '#f97316' },
  };

  const { stroke, stopColor } = colorConfig[color];

  return (
    <div className="mini-sparkline">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full preserve-aspect-ratio-none">
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={stopColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={stopColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillPathD} fill={`url(#${gradId})`} />
        <path d={pathD} fill="none" stroke={stroke} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ----------------------------------------------------
// 2. Revenue Trend Chart (7 Days)
// ----------------------------------------------------
export function SimpleLineChart({ data, labels, orderCounts = [] }: { data: number[]; labels: string[]; orderCounts?: number[] }) {
  const uniqueId = useId().replace(/:/g, '');
  const hasData = data && data.length > 0 && data.reduce((sum, val) => sum + val, 0) > 0;
  
  if (!hasData) {
    return (
      <Card 
        title="Doanh thu 7 ngày gần nhất" 
        subtitle="Theo đơn hàng đã giao"
        headerRight={<span className="bg-blue-50 text-blue-600 px-2.5 py-1 text-[10px] font-bold rounded-lg border border-blue-100 uppercase tracking-wide">7 ngày</span>}
      >
        <div className="h-64 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6">
          <TrendingUp className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-700">Chưa có dữ liệu doanh thu</p>
          <p className="text-xs text-slate-500 mt-1">Hệ thống sẽ cập nhật khi có đơn hàng được giao thành công.</p>
        </div>
      </Card>
    );
  }

  const max = Math.max(...data, 1);
  const min = 0; 
  const range = max - min;
  
  const width = 800;
  const height = 240;
  const paddingX = 50;
  const paddingY = 25;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = data.map((val, idx) => {
    const x = paddingX + (idx / Math.max(1, data.length - 1)) * chartWidth;
    const y = paddingY + chartHeight - ((val - min) / (range || 1)) * chartHeight;
    return { x, y, val };
  });

  const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const fillPathD = `M ${points[0].x},${paddingY + chartHeight} L ${points.map(p => `${p.x},${p.y}`).join(' L ')} L ${points[points.length - 1].x},${paddingY + chartHeight} Z`;

  // Grid Lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
    const y = paddingY + chartHeight - ratio * chartHeight;
    const val = min + ratio * range;
    return { y, val };
  });

  // Calculate summary metrics
  const totalRevenue = data.reduce((sum, val) => sum + val, 0);
  const totalOrders = orderCounts.reduce((sum, val) => sum + val, 0);

  const gradId = `line-grad-${uniqueId}`;

  return (
    <Card 
      title="Doanh thu 7 ngày gần nhất" 
      subtitle="Theo đơn hàng đã giao" 
      headerRight={<span className="bg-blue-50 text-blue-600 px-2.5 py-1 text-[10px] font-bold rounded-lg border border-blue-100 uppercase tracking-wide">7 ngày</span>}
    >
      <div className="flex flex-col gap-4">
        {/* Summary Info Row */}
        <div className="flex gap-6 border-b border-slate-100 pb-4">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tổng doanh thu 7 ngày</span>
            <strong className="text-xl font-bold text-slate-900 mt-1">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue)}
            </strong>
          </div>
          {totalOrders > 0 && (
            <div className="flex flex-col border-l border-slate-200 pl-6">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Số đơn hàng phát sinh</span>
              <strong className="text-xl font-bold text-slate-900 mt-1">
                {totalOrders} đơn hàng
              </strong>
            </div>
          )}
        </div>

        {/* SVG Chart */}
        <div className="w-full overflow-x-auto overflow-y-hidden">
          <div className="min-w-[500px]">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full font-sans">
              <defs>
                <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Grid Lines */}
              {gridLines.map((line, i) => (
                <g key={i}>
                  <line x1={paddingX} y1={line.y} x2={width - paddingX} y2={line.y} stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
                  <text x={paddingX - 12} y={line.y + 4} textAnchor="end" fill="#64748b" fontSize="11" className="font-semibold">
                    {line.val >= 1000000 ? `${(line.val / 1000000).toFixed(1)}M` : line.val >= 1000 ? `${(line.val / 1000).toFixed(0)}K` : line.val}
                  </text>
                </g>
              ))}

              {/* Area Fill */}
              <path d={fillPathD} fill={`url(#${gradId})`} />
              
              {/* Line */}
              <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

              {/* Points & X-Axis Labels */}
              {points.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#3b82f6" strokeWidth="2.5" className="transition-all hover:r-6 hover:stroke-blue-700 cursor-pointer">
                    <title>{`${labels[i]}: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.val)}`}</title>
                  </circle>
                  <text x={p.x} y={height - 2} textAnchor="middle" fill="#64748b" fontSize="12" className="font-semibold">
                    {labels[i]}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ----------------------------------------------------
// 3. Order Status Donut Chart
// ----------------------------------------------------
export function DonutChart({ data, total }: { data: { label: string; count: number; color: string }[]; total: number }) {
  if (total === 0) {
    return (
      <Card title="Tình trạng đơn hàng">
        <div className="h-64 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6">
          <ShoppingCart className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-700">Chưa có đơn hàng nào</p>
        </div>
      </Card>
    );
  }

  // Convert to conic-gradient string using a pure local loop
  const stops: string[] = [];
  let currentPercentage = 0;
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const start = currentPercentage;
    const end = currentPercentage + (item.count / total) * 100;
    currentPercentage = end;
    stops.push(`${item.color} ${start}% ${end}%`);
  }
  const gradientStops = stops.join(', ');

  return (
    <Card title="Tình trạng đơn hàng">
      <div className="flex flex-col items-center justify-center h-full gap-6 py-2">
        {/* Ring */}
        <div className="relative w-44 h-44 rounded-full flex-shrink-0" style={{ background: `conic-gradient(${gradientStops})` }}>
          <div className="absolute inset-4.5 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
            <span className="text-xs font-medium text-slate-500">Tổng đơn</span>
            <strong className="text-3xl font-bold text-slate-950 mt-0.5">{total}</strong>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full flex flex-col gap-2 mt-2">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-slate-100/50 last:border-0 last:pb-0">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="font-medium text-slate-700">{item.label}</span>
              </div>
              <span className="font-bold text-slate-900">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ----------------------------------------------------
// 4. Monthly Sales Bar Chart
// ----------------------------------------------------
export function SimpleBarChart({ data, labels }: { data: number[]; labels: string[] }) {
  const hasData = data && data.length > 0 && data.reduce((sum, val) => sum + val, 0) > 0;

  if (!hasData) {
    return (
      <Card title="Doanh thu theo tháng" subtitle="6 tháng gần nhất">
        <div className="h-64 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6">
          <TrendingUp className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-700">Chưa có dữ liệu theo tháng</p>
          <p className="text-xs text-slate-500 mt-1">Hệ thống sẽ tự động tổng hợp doanh thu theo từng tháng.</p>
        </div>
      </Card>
    );
  }
  
  const max = Math.max(...data, 1);

  return (
    <Card title="Doanh thu theo tháng" subtitle="6 tháng gần nhất">
      <div className="flex flex-col gap-3">
        <div className="relative h-64 flex items-end justify-between gap-2 md:gap-4 mt-6 border-b border-slate-200 pb-2">
          {/* Baseline is represented by the border-b */}
          {data.map((val, idx) => {
            // Give 0 values a min height of 4px for visibility
            const heightPercent = val === 0 ? 0 : (val / max) * 100;
            return (
              <div key={idx} className="flex flex-col items-center flex-1 gap-2.5 group relative h-full justify-end">
                {/* Bar */}
                <div 
                  className={clsx(
                    "w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-300 group-hover:-translate-y-1 shadow-sm",
                    val === 0 ? "h-1 bg-slate-200/80 rounded-none w-full max-w-[28px]" : "opacity-85 group-hover:opacity-100 group-hover:shadow-md"
                  )}
                  style={val === 0 ? undefined : { height: `${heightPercent}%` }}
                  title={`${labels[idx]}: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)}`}
                />
                {/* Label */}
                <span className="text-xs font-bold text-slate-500">{labels[idx]}</span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-500 italic text-center mt-1">
          Di chuột qua các cột để xem chi tiết doanh thu.
        </p>
      </div>
    </Card>
  );
}

// ----------------------------------------------------
// 5. Top Products / Inventory Progress
// ----------------------------------------------------
export function ProgressList({ title, items }: { title: string; items: { id: string; name: string; sku: string; thumbnail: string; progress: number; max: number; isWarning: boolean; valueLabel: string }[] }) {
  return (
    <Card title={title} noPadding>
      <div className="flex flex-col min-h-[280px] justify-center">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8">
            <CheckCircle className="w-10 h-10 text-emerald-500 mb-3" />
            <p className="text-sm font-semibold text-slate-700">Tồn kho đang ổn định</p>
            <p className="text-xs text-slate-500 mt-1">Chưa có sản phẩm nào dưới ngưỡng cảnh báo.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 flex flex-col justify-start h-full">
            {items.map((item) => {
              const percent = Math.min(100, Math.max(0, (item.progress / item.max) * 100));
              return (
                <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors">
                  <img src={item.thumbnail} alt={item.name} className="w-11 h-11 rounded-xl object-cover border border-slate-200/80 shrink-0" />
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-900 truncate" title={item.name}>{item.name}</h4>
                      <Badge variant={item.isWarning ? 'danger' : 'neutral'} pill dot>
                        {item.isWarning ? 'Cần nhập' : 'Sắp hết'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-400 shrink-0">SKU: {item.sku}</span>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={clsx("h-full rounded-full transition-all duration-500", item.isWarning ? "bg-red-500" : "bg-amber-500")}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 shrink-0 min-w-14 text-right">
                        Tồn: {item.progress}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
