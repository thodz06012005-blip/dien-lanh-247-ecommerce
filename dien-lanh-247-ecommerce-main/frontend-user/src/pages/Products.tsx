import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal } from 'lucide-react';
import api from '../services/api';
import Breadcrumb from '../components/common/Breadcrumb';
import ProductGrid from '../components/product/ProductGrid';
import FilterSidebar from '../components/product/FilterSidebar';
import SortDropdown from '../components/product/SortDropdown';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Button from '../components/ui/Button';
import ImageWithFallback from '../components/common/ImageWithFallback';
import { visualAssets } from '../constants/visualAssets';

import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Products() {
  useDocumentTitle('Sản phẩm Điện Lạnh chính hãng | Điện Lạnh 247');
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // React Query to load categories and brands from API
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
  });
  const categoriesList = categoriesData?.data || [];

  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await api.get('/brands');
      return res.data;
    },
  });
  const brandsList = brandsData?.data || [];

  // Read initial filter values from URL
  const page = Number(searchParams.get('page') || '1');
  const sort = searchParams.get('sort') || 'newest';
  const categoryId = searchParams.get('categoryId') || undefined;
  const brandId = searchParams.get('brandId') || undefined;
  const priceMin = searchParams.get('priceMin') || undefined;
  const priceMax = searchParams.get('priceMax') || undefined;
  const inverter = searchParams.get('inverter') || undefined;
  const capacity = searchParams.get('capacity') || undefined;
  const q = searchParams.get('q') || undefined;
  const inStock = searchParams.get('inStock') || undefined;
  const hasPromo = searchParams.get('hasPromo') || undefined;

  const currentFilters = {
    categoryId,
    brandId,
    priceMin,
    priceMax,
    inverter,
    capacity,
    q,
    inStock,
    hasPromo,
  };

  // React Query to load filtered paginated products
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products', page, sort, currentFilters],
    queryFn: async () => {
      const res = await api.get('/products', {
        params: {
          page,
          limit: 12,
          sort,
          categoryId,
          brandId,
          priceMin,
          priceMax,
          inverter,
          capacity,
          q,
          inStock,
          hasPromo,
        },
      });
      return res.data;
    },
  });

  const handleFilterChange = (newFilters: Partial<typeof currentFilters>) => {
    const params: Record<string, string> = { page: '1', sort }; // Reset to page 1 on filter change
    
    const targetCategoryId = 'categoryId' in newFilters ? newFilters.categoryId : categoryId;
    const targetBrandId = 'brandId' in newFilters ? newFilters.brandId : brandId;

    if (targetCategoryId) params.categoryId = targetCategoryId;
    if (targetBrandId) params.brandId = targetBrandId;

    const targetPriceMin = 'priceMin' in newFilters ? newFilters.priceMin : priceMin;
    if (targetPriceMin) params.priceMin = targetPriceMin;

    const targetPriceMax = 'priceMax' in newFilters ? newFilters.priceMax : priceMax;
    if (targetPriceMax) params.priceMax = targetPriceMax;

    const targetInverter = 'inverter' in newFilters ? newFilters.inverter : inverter;
    if (targetInverter) params.inverter = targetInverter;

    const targetCapacity = 'capacity' in newFilters ? newFilters.capacity : capacity;
    if (targetCapacity) params.capacity = targetCapacity;

    const targetQ = 'q' in newFilters ? newFilters.q : q;
    if (targetQ) params.q = targetQ;

    const targetInStock = 'inStock' in newFilters ? newFilters.inStock : inStock;
    if (targetInStock) params.inStock = targetInStock;

    const targetHasPromo = 'hasPromo' in newFilters ? newFilters.hasPromo : hasPromo;
    if (targetHasPromo) params.hasPromo = targetHasPromo;

    setSearchParams(params);
    setIsMobileFilterOpen(false);
  };

  const handleSortChange = (newSort: string) => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    params.sort = newSort;
    params.page = '1'; // Reset page to 1
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    params.page = newPage.toString();
    setSearchParams(params);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setSearchParams({ page: '1', sort: 'newest' });
    setIsMobileFilterOpen(false);
  };

  // Get matching category name for breadcrumbs
  const activeCategoryName = categoryId
    ? categoryId.charAt(0).toUpperCase() + categoryId.slice(1).replace('-', ' ')
    : undefined;

  const breadcrumbItems = [
    { name: 'Sản phẩm', path: '/products' },
    ...(activeCategoryName ? [{ name: activeCategoryName }] : []),
  ];

  // Active filter chips generation
  const activeChips: { id: string; label: string; onClear: () => void }[] = [];

  if (categoryId) {
    const cat = categoriesList.find((c: any) => c.id === categoryId);
    if (cat) {
      activeChips.push({
        id: 'category',
        label: `Danh mục: ${cat.name}`,
        onClear: () => handleFilterChange({ categoryId: undefined }),
      });
    }
  }

  if (brandId) {
    const br = brandsList.find((b: any) => b.id === brandId);
    if (br) {
      activeChips.push({
        id: 'brand',
        label: `Hãng: ${br.name}`,
        onClear: () => handleFilterChange({ brandId: undefined }),
      });
    }
  }

  if (priceMin || priceMax) {
    let priceLabel = 'Giá: ';
    if (priceMin && priceMax) {
      priceLabel += `${(Number(priceMin) / 1000000)}M - ${(Number(priceMax) / 1000000)}M`;
    } else if (priceMin) {
      priceLabel += `Trên ${(Number(priceMin) / 1000000)}M`;
    } else if (priceMax) {
      priceLabel += `Dưới ${(Number(priceMax) / 1000000)}M`;
    }
    activeChips.push({
      id: 'price',
      label: priceLabel,
      onClear: () => handleFilterChange({ priceMin: undefined, priceMax: undefined }),
    });
  }

  if (inverter) {
    activeChips.push({
      id: 'inverter',
      label: inverter === 'true' ? 'Công nghệ: Inverter' : 'Công nghệ: Cơ thường',
      onClear: () => handleFilterChange({ inverter: undefined }),
    });
  }

  if (capacity) {
    activeChips.push({
      id: 'capacity',
      label: `Công suất: ${capacity}`,
      onClear: () => handleFilterChange({ capacity: undefined }),
    });
  }

  if (inStock === 'true') {
    activeChips.push({
      id: 'inStock',
      label: 'Tình trạng: Còn hàng',
      onClear: () => handleFilterChange({ inStock: undefined }),
    });
  }

  if (hasPromo === 'true') {
    activeChips.push({
      id: 'hasPromo',
      label: 'Ưu đãi: Khuyến mãi',
      onClear: () => handleFilterChange({ hasPromo: undefined }),
    });
  }

  if (q) {
    activeChips.push({
      id: 'search',
      label: `Từ khóa: "${q}"`,
      onClear: () => handleFilterChange({ q: undefined }),
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Premium Hero Banner */}
      <div className="relative mb-10 overflow-hidden bg-slate-900 rounded-[2rem] shadow-xl border border-slate-800">
        {/* Background gradient & image overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#061527] via-[#061527]/95 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden md:block z-0">
          <ImageWithFallback
            src={visualAssets.productsHero}
            alt="Products Hero"
            className="w-full h-full object-cover opacity-25"
          />
        </div>
        
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[80%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-[-20%] right-[10%] w-[40%] h-[70%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none z-0" />

        {/* Content Container */}
        <div className="relative z-20 px-6 py-8 md:py-12 md:px-12 max-w-2xl flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <span className="text-4xs font-black text-cyan-400 uppercase tracking-widest leading-none">Điện Lạnh 247</span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-tight">
              Sản phẩm điện lạnh chính hãng
            </h1>
            <p className="text-3xs md:text-xs text-slate-300 leading-relaxed max-w-xl">
              Điều hòa, tủ lạnh, máy giặt, bình nóng lạnh và dịch vụ lắp đặt được chọn lọc cho gia đình Việt.
            </p>
          </div>

          {/* Trust Badges Grid */}
          <div className="grid grid-cols-2 gap-2.5 mt-1 max-w-md">
            {[
              { text: 'Giao lắp 2h', bg: 'bg-white/5 border-white/10 text-white' },
              { text: 'Bảo hành chính hãng', bg: 'bg-white/5 border-white/10 text-white' },
              { text: 'Thanh toán COD', bg: 'bg-white/5 border-white/10 text-white' },
              { text: 'Tư vấn kỹ thuật miễn phí', bg: 'bg-white/5 border-white/10 text-white' },
            ].map((badge, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-3xs font-bold ${badge.bg}`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar sort + filter trigger */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-base md:text-lg font-black text-slate-900 leading-tight">
            {activeCategoryName || 'Tất cả sản phẩm'}
          </h2>
          {q && (
            <p className="text-3xs text-slate-400 mt-1">
              Kết quả tìm kiếm cho từ khóa: <strong className="text-primary-600">"{q}"</strong>
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Mobile Filter Trigger */}
          <Button
            variant="outline"
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden text-xs font-bold px-4 py-2"
          >
            Lọc sản phẩm
          </Button>

          {/* Sort Dropdown */}
          <SortDropdown value={sort} onChange={handleSortChange} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left column: Desktop Filters */}
        <div className="hidden lg:block lg:col-span-1 bg-white p-6 rounded-[2rem] border border-slate-100/80 shadow-sm h-fit sticky top-28">
          <FilterSidebar
            filters={currentFilters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            categories={categoriesList}
            brands={brandsList}
          />
        </div>

        {/* Right column: Product listings */}
        <div className="lg:col-span-3">
          {/* Active Filter Chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/80 shadow-2xs">
              <span className="text-3xs font-extrabold text-slate-400 uppercase tracking-widest mr-2">Đang lọc theo:</span>
              {activeChips.map(chip => (
                <div key={chip.id} className="flex items-center gap-1.5 bg-blue-50/50 border border-blue-100 text-3xs text-blue-700 font-bold px-3 py-1.5 rounded-full shadow-2xs hover:bg-blue-50 transition-colors">
                  <span>{chip.label}</span>
                  <button onClick={chip.onClear} className="text-blue-400 hover:text-blue-600 transition-colors p-0.5 ml-0.5 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={handleResetFilters}
                className="text-3xs font-extrabold text-[#F97316] hover:text-[#ef4444] transition-colors ml-auto pl-2 cursor-pointer uppercase tracking-wider hover:underline"
              >
                Xóa tất cả
              </button>
            </div>
          )}

          {isLoading ? (
            <ProductGrid products={[]} isLoading={true} skeletonCount={8} />
          ) : error ? (
            <ErrorState onRetry={refetch} />
          ) : !data?.data || data.data.length === 0 ? (
            <EmptyState
              icon={<ImageWithFallback src={visualAssets.productsEmpty} alt="Trống" className="w-48 h-48 object-contain" />}
              title="Không tìm thấy sản phẩm phù hợp"
              description="Hãy thử xóa bớt bộ lọc hoặc tìm kiếm bằng từ khóa khác."
              actionText="Xóa bộ lọc"
              onAction={handleResetFilters}
            />
          ) : (
            <>
              {/* Product grid list */}
              <ProductGrid products={data.data} isLoading={false} />

              {/* Pagination controls */}
              {data.pagination && data.pagination.totalPages > 1 && (
                <Pagination
                  currentPage={data.pagination.page}
                  totalPages={data.pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer (Modal overlay) */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex justify-end md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="relative w-full max-w-xs h-full bg-white shadow-2xl flex flex-col z-10 p-6 overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
                <span className="font-bold text-sm text-slate-900">Bộ lọc tìm kiếm</span>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <FilterSidebar
                filters={currentFilters}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                categories={categoriesList}
                brands={brandsList}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
