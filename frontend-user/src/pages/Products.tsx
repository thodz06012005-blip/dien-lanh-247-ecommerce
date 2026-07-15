import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import Breadcrumb from '../components/common/Breadcrumb';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import ImageWithFallback from '../components/common/ImageWithFallback';
import Pagination from '../components/common/Pagination';
import FilterSidebar from '../components/product/FilterSidebar';
import ProductGrid from '../components/product/ProductGrid';
import SortDropdown from '../components/product/SortDropdown';
import Button from '../components/ui/Button';
import { visualAssets } from '../constants/visualAssets';
import useDocumentTitle from '../hooks/useDocumentTitle';
import type { Product } from '../mock/data';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1').replace(/\/$/, '');
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000);

interface NamedOption {
  id: string;
  name: string;
}

interface ProductListPayload {
  data: Product[];
  pagination?: {
    page: number;
    totalPages: number;
    total?: number;
  };
}

function unwrap<T>(payload: unknown): T {
  const first = payload as { data?: unknown; success?: boolean };
  const second = first?.data as { data?: unknown; success?: boolean } | undefined;
  if (second && typeof second === 'object' && ('success' in second || 'pagination' in second)) {
    return second as T;
  }
  return payload as T;
}

async function publicGet<T>(path: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(`${API_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    credentials: 'omit',
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Public product request failed: ${response.status}`);
  return unwrap<T>(await response.json());
}

export default function Products() {
  useDocumentTitle('Sản phẩm Điện Lạnh chính hãng | Điện Lạnh 247');
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    if (!isMobileFilterOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileFilterOpen(false);
    };
    document.addEventListener('keydown', close);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', close);
    };
  }, [isMobileFilterOpen]);

  const { data: categoriesList = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => publicGet<NamedOption[]>('/categories'),
    staleTime: 5 * 60_000,
  });
  const { data: brandsList = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => publicGet<NamedOption[]>('/brands'),
    staleTime: 5 * 60_000,
  });

  const page = Math.max(1, Number(searchParams.get('page') || '1'));
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

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products', page, sort, currentFilters],
    queryFn: () =>
      publicGet<ProductListPayload>('/products', {
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
      }),
  });

  const updateParams = (changes: Record<string, string | undefined>, resetPage = true) => {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (resetPage) params.set('page', '1');
    setSearchParams(params);
  };

  const handleFilterChange = (newFilters: Partial<typeof currentFilters>) => {
    updateParams(newFilters);
    setIsMobileFilterOpen(false);
  };

  const handleSortChange = (newSort: string) => updateParams({ sort: newSort });
  const handlePageChange = (newPage: number) => {
    updateParams({ page: String(newPage) }, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleResetFilters = () => {
    setSearchParams({ page: '1', sort: 'newest' });
    setIsMobileFilterOpen(false);
  };

  const activeCategoryName = categoryId
    ? categoriesList.find((category) => String(category.id) === categoryId)?.name ||
      categoryId.charAt(0).toUpperCase() + categoryId.slice(1).replace('-', ' ')
    : undefined;
  const breadcrumbItems = [
    { name: 'Sản phẩm', path: '/products' },
    ...(activeCategoryName ? [{ name: activeCategoryName }] : []),
  ];

  const activeChips: Array<{ id: string; label: string; onClear: () => void }> = [];
  const category = categoriesList.find((item) => String(item.id) === categoryId);
  const brand = brandsList.find((item) => String(item.id) === brandId);
  if (category) activeChips.push({ id: 'category', label: `Danh mục: ${category.name}`, onClear: () => handleFilterChange({ categoryId: undefined }) });
  if (brand) activeChips.push({ id: 'brand', label: `Hãng: ${brand.name}`, onClear: () => handleFilterChange({ brandId: undefined }) });
  if (priceMin || priceMax) {
    const label = priceMin && priceMax
      ? `Giá: ${Number(priceMin) / 1_000_000}M - ${Number(priceMax) / 1_000_000}M`
      : priceMin
        ? `Giá: Trên ${Number(priceMin) / 1_000_000}M`
        : `Giá: Dưới ${Number(priceMax) / 1_000_000}M`;
    activeChips.push({ id: 'price', label, onClear: () => handleFilterChange({ priceMin: undefined, priceMax: undefined }) });
  }
  if (inverter) activeChips.push({ id: 'inverter', label: inverter === 'true' ? 'Công nghệ: Inverter' : 'Công nghệ: Cơ thường', onClear: () => handleFilterChange({ inverter: undefined }) });
  if (capacity) activeChips.push({ id: 'capacity', label: `Công suất: ${capacity}`, onClear: () => handleFilterChange({ capacity: undefined }) });
  if (inStock === 'true') activeChips.push({ id: 'inStock', label: 'Tình trạng: Còn hàng', onClear: () => handleFilterChange({ inStock: undefined }) });
  if (hasPromo === 'true') activeChips.push({ id: 'hasPromo', label: 'Ưu đãi: Khuyến mãi', onClear: () => handleFilterChange({ hasPromo: undefined }) });
  if (q) activeChips.push({ id: 'search', label: `Từ khóa: “${q}”`, onClear: () => handleFilterChange({ q: undefined }) });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumb items={breadcrumbItems} />

      <section className="relative mb-10 overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900 shadow-xl">
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#061527] via-[#061527]/95 to-transparent" />
        <div className="absolute bottom-0 right-0 top-0 z-0 hidden w-1/2 md:block">
          <ImageWithFallback src={visualAssets.productsHero} alt="Thiết bị điện lạnh chính hãng" width={800} height={500} sizes="50vw" className="h-full w-full object-cover opacity-25" />
        </div>
        <div className="relative z-20 flex max-w-2xl flex-col gap-5 px-6 py-8 md:px-12 md:py-12">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-300">Điện Lạnh 247</span>
            <h1 className="text-xl font-black leading-tight text-white md:text-3xl">Sản phẩm điện lạnh chính hãng</h1>
            <p className="max-w-xl text-sm leading-7 text-slate-300">Điều hòa, tủ lạnh, máy giặt, bình nóng lạnh và dịch vụ lắp đặt được chọn lọc cho gia đình Việt.</p>
          </div>
          <div className="grid max-w-lg grid-cols-2 gap-2.5">
            {['Giao lắp 2h', 'Bảo hành chính hãng', 'Thanh toán COD', 'Tư vấn kỹ thuật miễn phí'].map((badge) => (
              <div key={badge} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                <span>{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-lg font-black leading-tight text-slate-900">{activeCategoryName || 'Tất cả sản phẩm'}</h2>
          {q && <p className="mt-1 text-xs text-slate-600">Kết quả tìm kiếm cho từ khóa: <strong className="text-primary-700">“{q}”</strong></p>}
        </div>
        <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end">
          <Button variant="outline" leftIcon={<SlidersHorizontal aria-hidden="true" className="h-4 w-4" />} onClick={() => setIsMobileFilterOpen(true)} className="px-4 py-2 text-xs font-bold md:hidden">Lọc sản phẩm</Button>
          <SortDropdown value={sort} onChange={handleSortChange} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <aside className="hidden h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-28 lg:col-span-1 lg:block" aria-label="Bộ lọc sản phẩm">
          <FilterSidebar filters={currentFilters} onFilterChange={handleFilterChange} onReset={handleResetFilters} categories={categoriesList} brands={brandsList} />
        </aside>

        <div className="lg:col-span-3">
          {activeChips.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <span className="mr-2 text-xs font-extrabold uppercase tracking-wider text-slate-700">Đang lọc theo:</span>
              {activeChips.map((chip) => (
                <div key={chip.id} className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800">
                  <span>{chip.label}</span>
                  <button type="button" onClick={chip.onClear} aria-label={`Xóa bộ lọc ${chip.label}`} className="ml-0.5 cursor-pointer rounded-full p-1 text-blue-700 transition hover:bg-blue-100 hover:text-blue-900"><X aria-hidden="true" className="h-3 w-3" /></button>
                </div>
              ))}
              <button type="button" onClick={handleResetFilters} className="ml-auto cursor-pointer pl-2 text-xs font-extrabold uppercase tracking-wider text-orange-800 hover:underline">Xóa tất cả</button>
            </div>
          )}

          {isLoading ? (
            <ProductGrid products={[]} isLoading skeletonCount={8} />
          ) : error ? (
            <ErrorState onRetry={refetch} />
          ) : !data?.data?.length ? (
            <EmptyState icon={<ImageWithFallback src={visualAssets.productsEmpty} alt="Không có sản phẩm phù hợp" width={240} height={240} className="h-48 w-48 object-contain" />} title="Không tìm thấy sản phẩm phù hợp" description="Hãy thử xóa bớt bộ lọc hoặc tìm kiếm bằng từ khóa khác." actionText="Xóa bộ lọc" onAction={handleResetFilters} />
          ) : (
            <>
              <ProductGrid products={data.data} isLoading={false} />
              {data.pagination && data.pagination.totalPages > 1 && <Pagination currentPage={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={handlePageChange} />}
            </>
          )}
        </div>
      </div>

      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-filter-title">
          <button type="button" aria-label="Đóng bộ lọc" onClick={() => setIsMobileFilterOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
          <aside className="relative z-10 flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 id="mobile-filter-title" className="text-sm font-black text-slate-900">Bộ lọc tìm kiếm</h2>
              <button type="button" aria-label="Đóng bộ lọc" onClick={() => setIsMobileFilterOpen(false)} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"><X aria-hidden="true" className="h-5 w-5" /></button>
            </div>
            <FilterSidebar filters={currentFilters} onFilterChange={handleFilterChange} onReset={handleResetFilters} categories={categoriesList} brands={brandsList} />
          </aside>
        </div>
      )}
    </div>
  );
}
