import { useState, useEffect } from 'react';
import { Filter, RotateCcw, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface FilterState {
  categoryId?: string;
  brandId?: string;
  priceMin?: string;
  priceMax?: string;
  inverter?: string;
  capacity?: string;
  q?: string;
  inStock?: string;
  hasPromo?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onReset: () => void;
  categories: Category[];
  brands: Brand[];
}

export default function FilterSidebar({ filters, onFilterChange, onReset, categories, brands }: FilterSidebarProps) {
  const [minPriceInput, setMinPriceInput] = useState(filters.priceMin || '');
  const [maxPriceInput, setMaxPriceInput] = useState(filters.priceMax || '');

  // Synchronize inputs when filters change externally (like URL changes)
  useEffect(() => {
    setMinPriceInput(filters.priceMin || '');
    setMaxPriceInput(filters.priceMax || '');
  }, [filters.priceMin, filters.priceMax]);

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({
      ...filters,
      priceMin: minPriceInput,
      priceMax: maxPriceInput,
    });
  };

  const handleCategorySelect = (catId: string) => {
    onFilterChange({
      ...filters,
      categoryId: filters.categoryId === catId ? undefined : catId,
    });
  };

  const handleBrandSelect = (brandId: string) => {
    onFilterChange({
      ...filters,
      brandId: filters.brandId === brandId ? undefined : brandId,
    });
  };

  const handleInverterSelect = (value: string) => {
    onFilterChange({
      ...filters,
      inverter: filters.inverter === value ? undefined : value,
    });
  };

  const handleCapacitySelect = (value: string) => {
    onFilterChange({
      ...filters,
      capacity: filters.capacity === value ? undefined : value,
    });
  };

  const handleInStockToggle = () => {
    onFilterChange({
      ...filters,
      inStock: filters.inStock === 'true' ? undefined : 'true',
    });
  };

  const handleHasPromoToggle = () => {
    onFilterChange({
      ...filters,
      hasPromo: filters.hasPromo === 'true' ? undefined : 'true',
    });
  };

  const isAcCategory = filters.categoryId === 'dieu-hoa';

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Title */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <span className="flex items-center gap-2 font-black text-slate-900 text-sm">
          <Filter className="w-4 h-4 text-primary-600" />
          Bộ lọc sản phẩm
        </span>
        <button
          onClick={onReset}
          className="text-3xs font-extrabold text-slate-400 hover:text-primary-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          Đặt lại
        </button>
      </div>

      {/* Category Section */}
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-bold text-slate-900">Danh mục sản phẩm</h4>
        <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`flex justify-between items-center px-4 py-2.5 rounded-2xl text-left text-xs font-bold transition-all cursor-pointer ${
                filters.categoryId === cat.id
                  ? 'bg-primary-50 text-primary-700 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{cat.name}</span>
              <ChevronRight className={`w-3.5 h-3.5 ${filters.categoryId === cat.id ? 'text-primary-600' : 'text-slate-300'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Brand Section */}
      <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-900">Thương hiệu</h4>
        <div className="grid grid-cols-2 gap-2">
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => handleBrandSelect(brand.id)}
              className={`px-3 py-2.5 rounded-2xl text-center text-xs font-bold border transition-all cursor-pointer ${
                filters.brandId === brand.id
                  ? 'bg-primary-50 text-primary-700 border-primary-200 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {brand.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tình trạng & Ưu đãi Section */}
      <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-900">Tình trạng & Ưu đãi</h4>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleInStockToggle}
            className={`w-full py-2.5 px-4 rounded-2xl text-left text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
              filters.inStock === 'true'
                ? 'bg-primary-50 text-primary-700 border-primary-200 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <span>Còn hàng</span>
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${filters.inStock === 'true' ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-300 bg-white'}`}>
              {filters.inStock === 'true' && <span className="text-4xs">✓</span>}
            </div>
          </button>

          <button
            onClick={handleHasPromoToggle}
            className={`w-full py-2.5 px-4 rounded-2xl text-left text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
              filters.hasPromo === 'true'
                ? 'bg-primary-50 text-primary-700 border-primary-200 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <span>Đang khuyến mãi</span>
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${filters.hasPromo === 'true' ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-300 bg-white'}`}>
              {filters.hasPromo === 'true' && <span className="text-4xs">✓</span>}
            </div>
          </button>
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-900">Khoảng giá (₫)</h4>
        <form onSubmit={handlePriceApply} className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Từ"
              type="number"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className="py-2 px-3 text-xs rounded-xl"
              containerClassName="flex-1"
            />
            <span className="text-slate-300">-</span>
            <Input
              placeholder="Đến"
              type="number"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="py-2 px-3 text-xs rounded-xl"
              containerClassName="flex-1"
            />
          </div>
          <Button variant="outline" size="sm" type="submit" className="w-full text-xs font-bold py-2.5 rounded-2xl">
            Áp dụng giá
          </Button>
        </form>
      </div>

      {/* Inverter technology filter */}
      <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-900">Công nghệ tiết kiệm điện</h4>
        <div className="flex gap-2">
          <button
            onClick={() => handleInverterSelect('true')}
            className={`flex-1 py-2.5 rounded-2xl text-center text-xs font-bold border transition-all cursor-pointer ${
              filters.inverter === 'true'
                ? 'bg-primary-50 text-primary-700 border-primary-200'
                : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            Có Inverter
          </button>
          <button
            onClick={() => handleInverterSelect('false')}
            className={`flex-1 py-2.5 rounded-2xl text-center text-xs font-bold border transition-all cursor-pointer ${
              filters.inverter === 'false'
                ? 'bg-primary-50 text-primary-700 border-primary-200'
                : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            Cơ thường
          </button>
        </div>
      </div>

      {/* Horsepower capacity (only for ACs) */}
      {isAcCategory && (
        <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-900">Công suất máy lạnh</h4>
          <div className="flex flex-col gap-2">
            {['1 HP', '1.5 HP', '2 HP'].map((cap) => (
              <button
                key={cap}
                onClick={() => handleCapacitySelect(cap)}
                className={`w-full py-2.5 px-4 rounded-2xl text-left text-xs font-bold border transition-all cursor-pointer flex justify-between items-center ${
                  filters.capacity === cap
                    ? 'bg-primary-50 text-primary-700 border-primary-200'
                    : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <span>{cap} (Phòng {cap === '1 HP' ? 'dưới 15m²' : cap === '1.5 HP' ? '15-20m²' : '20-30m²'})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
