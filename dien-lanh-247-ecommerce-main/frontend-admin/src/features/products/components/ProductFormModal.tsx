import { useState } from 'react';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import type { Product, ProductSpec, Category, Brand, SaveProductPayload } from '../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Partial<Product> | null;
  categories: Category[];
  brands: Brand[];
  isSaving: boolean;
  onSave: (payload: SaveProductPayload) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export default function ProductFormModal({
  isOpen,
  onClose,
  editingProduct,
  categories,
  brands,
  isSaving,
  onSave,
  showToast
}: ProductFormModalProps) {
  // Specs and Features states for form
  const [formSpecs, setFormSpecs] = useState<ProductSpec[]>(
    editingProduct?.specifications || []
  );
  const [formFeatures, setFormFeatures] = useState<string[]>(
    editingProduct?.features || []
  );
  const [newSpecName, setNewSpecName] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  const [newFeatureText, setNewFeatureText] = useState('');

  // Form Fields
  const [formValues, setFormValues] = useState({
    name: editingProduct?.name || '',
    slug: editingProduct?.slug || '',
    sku: editingProduct?.sku || '',
    categoryId: editingProduct?.categoryId || categories[0]?.id || 'dieu-hoa',
    brandId: editingProduct?.brandId || brands[0]?.id || 'daikin',
    basePrice: editingProduct?.basePrice || 0,
    salePrice: editingProduct?.salePrice || editingProduct?.basePrice || 0,
    stock: editingProduct?.stock || 0,
    lowStockThreshold: editingProduct?.lowStockThreshold || 3,
    status: editingProduct?.status || 'active',
    thumbnail: editingProduct?.thumbnail || '',
    description: editingProduct?.description || '',
    isFeatured: !!editingProduct?.isFeatured,
    isBestSeller: !!editingProduct?.isBestSeller,
    isNewArrival: !!editingProduct?.isNewArrival,
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? Number(value) : value;
    
    setFormValues((prev) => {
      const next = { ...prev, [name]: val };
      // Generate slug automatically when name changes and we are creating a new product
      if (name === 'name' && !editingProduct?.id) {
        next.slug = value
          .toLowerCase()
          .trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/[\s-]+/g, '-');
      }
      return next;
    });
  };

  const handleCheckboxChange = (name: 'isFeatured' | 'isBestSeller' | 'isNewArrival', checked: boolean) => {
    setFormValues((prev) => ({ ...prev, [name]: checked }));
  };

  // Specs Actions
  const handleAddSpec = () => {
    if (!newSpecName || !newSpecValue) return;
    setFormSpecs((prev) => [...prev, { name: newSpecName, value: newSpecValue }]);
    setNewSpecName('');
    setNewSpecValue('');
  };

  const handleRemoveSpec = (idx: number) => {
    setFormSpecs((prev) => prev.filter((_, i) => i !== idx));
  };

  // Features Actions
  const handleAddFeature = () => {
    if (!newFeatureText) return;
    setFormFeatures((prev) => [...prev, newFeatureText]);
    setNewFeatureText('');
  };

  const handleRemoveFeature = (idx: number) => {
    setFormFeatures((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.name.trim()) {
      showToast('Vui lòng nhập tên sản phẩm', 'error');
      return;
    }
    if (!formValues.sku.trim()) {
      showToast('Vui lòng nhập mã SKU sản phẩm', 'error');
      return;
    }
    if (!formValues.slug.trim()) {
      showToast('Vui lòng nhập đường dẫn tĩnh (Slug) sản phẩm', 'error');
      return;
    }
    if (!formValues.categoryId) {
      showToast('Vui lòng chọn danh mục sản phẩm', 'error');
      return;
    }
    if (!formValues.brandId) {
      showToast('Vui lòng chọn thương hiệu sản phẩm', 'error');
      return;
    }
    if (formValues.basePrice <= 0) {
      showToast('Giá gốc sản phẩm phải lớn hơn 0', 'error');
      return;
    }
    if (formValues.salePrice !== undefined && formValues.salePrice !== null && Number(formValues.salePrice) !== 0) {
      if (Number(formValues.salePrice) <= 0) {
        showToast('Giá khuyến mãi phải lớn hơn 0', 'error');
        return;
      }
      if (Number(formValues.salePrice) > Number(formValues.basePrice)) {
        showToast('Giá khuyến mãi không được lớn hơn giá gốc', 'error');
        return;
      }
    }
    if (formValues.stock < 0) {
      showToast('Số lượng tồn kho không được âm', 'error');
      return;
    }
    if (!formValues.thumbnail.trim()) {
      showToast('Vui lòng nhập URL ảnh đại diện sản phẩm', 'error');
      return;
    }

    const fallbackImage = 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=400';
    const finalThumbnail = formValues.thumbnail || fallbackImage;

    let imagesPayload: string[];
    if (editingProduct?.id && Array.isArray(editingProduct.images) && editingProduct.images.length > 0) {
      imagesPayload = [...editingProduct.images];
      // Keep gallery synchronized if first image is the main thumbnail being edited
      if (formValues.thumbnail && editingProduct.thumbnail && imagesPayload[0] === editingProduct.thumbnail) {
        imagesPayload[0] = formValues.thumbnail;
      }
    } else {
      imagesPayload = [finalThumbnail];
    }

    const payload = {
      ...formValues,
      specifications: formSpecs,
      features: formFeatures,
      thumbnail: finalThumbnail,
      images: imagesPayload
    };
    onSave(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingProduct?.id ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
      size="lg"
    >
      <form onSubmit={handleSaveSubmit} className="flex flex-col gap-6 text-xs">
        {/* Section 1: Basic Info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col gap-4">
          <h3 className="text-[15px] font-semibold text-slate-950 flex items-center gap-2 mb-1">
            <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
            Thông tin cơ bản
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Tên sản phẩm (*)"
              name="name"
              value={formValues.name}
              onChange={handleFormChange}
              required
              className="bg-white"
            />
            <Input
              label="Mã SKU (*)"
              name="sku"
              value={formValues.sku}
              onChange={handleFormChange}
              required
              className="bg-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Đường dẫn tĩnh (Slug) (*)"
              name="slug"
              value={formValues.slug}
              onChange={handleFormChange}
              required
              className="bg-white"
            />
            <Input
              label="Ảnh đại diện (URL)"
              name="thumbnail"
              value={formValues.thumbnail}
              onChange={handleFormChange}
              placeholder="https://images.unsplash.com/..."
              className="bg-white"
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[13px] font-medium text-slate-700">
              Mô tả chi tiết sản phẩm
            </label>
            <textarea
              name="description"
              rows={3}
              value={formValues.description}
              onChange={handleFormChange}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-600 hover:border-slate-300"
              placeholder="Nhập thông tin mô tả giới thiệu chi tiết sản phẩm..."
            />
          </div>
        </div>

        {/* Section 2: Categories & Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col gap-4">
          <h3 className="text-[15px] font-semibold text-slate-950 flex items-center gap-2 mb-1">
            <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
            Phân loại & Trạng thái
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Danh mục"
              name="categoryId"
              value={formValues.categoryId}
              onChange={handleFormChange}
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
              className="bg-white"
            />
            <Select
              label="Thương hiệu"
              name="brandId"
              value={formValues.brandId}
              onChange={handleFormChange}
              options={brands.map((b) => ({ label: b.name, value: b.id }))}
              className="bg-white"
            />
            <Select
              label="Trạng thái"
              name="status"
              value={formValues.status}
              onChange={handleFormChange}
              options={[
                { label: 'Hoạt động', value: 'active' },
                { label: 'Đang ẩn', value: 'hidden' },
                { label: 'Hết hàng', value: 'out_of_stock' }
              ]}
              className="bg-white"
            />
          </div>
          
          <div className="flex flex-wrap gap-6 items-center pt-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={formValues.isFeatured}
                onChange={(e) => handleCheckboxChange('isFeatured', e.target.checked)}
                className="w-4.5 h-4.5 rounded border-slate-200 text-primary-600 focus:ring-primary-500/20"
              />
              <span>Nổi bật</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={formValues.isBestSeller}
                onChange={(e) => handleCheckboxChange('isBestSeller', e.target.checked)}
                className="w-4.5 h-4.5 rounded border-slate-200 text-primary-600 focus:ring-primary-500/20"
              />
              <span>Bán chạy</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={formValues.isNewArrival}
                onChange={(e) => handleCheckboxChange('isNewArrival', e.target.checked)}
                className="w-4.5 h-4.5 rounded border-slate-200 text-primary-600 focus:ring-primary-500/20"
              />
              <span>Hàng mới</span>
            </label>
          </div>
        </div>

        {/* Section 3: Prices & Inventory */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col gap-4">
          <h3 className="text-[15px] font-semibold text-slate-950 flex items-center gap-2 mb-1">
            <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
            Giá bán & Tồn kho
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Giá gốc (VNĐ) (*)"
              name="basePrice"
              type="number"
              value={formValues.basePrice}
              onChange={handleFormChange}
              required
              className="bg-white"
            />
            <Input
              label="Giá KM (VNĐ)"
              name="salePrice"
              type="number"
              value={formValues.salePrice}
              onChange={handleFormChange}
              className="bg-white"
            />
            <Input
              label="Tồn kho (*)"
              name="stock"
              type="number"
              value={formValues.stock}
              onChange={handleFormChange}
              required
              className="bg-white"
            />
          </div>
        </div>

        {/* Section 4: Specifications & Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col gap-4">
            <h3 className="text-[15px] font-semibold text-slate-950 flex items-center gap-2 mb-1">
              <div className="w-1.5 h-4 bg-cyan-500 rounded-full"></div>
              Thông số kỹ thuật
            </h3>
            <div className="flex flex-col gap-3">
              <Input
                label="Tên thông số"
                value={newSpecName}
                onChange={(e) => setNewSpecName(e.target.value)}
                className="bg-white"
              />
              <Input
                label="Giá trị"
                value={newSpecValue}
                onChange={(e) => setNewSpecValue(e.target.value)}
                className="bg-white"
              />
              <Button type="button" variant="secondary" onClick={handleAddSpec} className="rounded-xl mt-1 py-2 font-bold bg-white hover:bg-slate-100 border border-slate-200">
                Thêm thông số
              </Button>
            </div>

            {formSpecs.length > 0 && (
              <div className="mt-2 flex flex-col gap-2 bg-slate-50 rounded-xl border border-slate-200 p-3 max-h-48 overflow-y-auto">
                {formSpecs.map((spec, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-200/60 pb-2 last:border-0 last:pb-0">
                    <span className="truncate pr-2 text-slate-700"><strong>{spec.name}:</strong> {spec.value}</span>
                    <button type="button" onClick={() => handleRemoveSpec(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded text-xs font-semibold transition-colors cursor-pointer">Xóa</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col gap-4">
            <h3 className="text-[15px] font-semibold text-slate-950 flex items-center gap-2 mb-1">
              <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
              Tính năng nổi bật
            </h3>
            <div className="flex flex-col gap-3">
              <Input
                label="Nội dung tính năng"
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                className="bg-white"
              />
              <Button type="button" variant="secondary" onClick={handleAddFeature} className="rounded-xl mt-1 py-2 font-bold bg-white hover:bg-slate-100 border border-slate-200">
                Thêm tính năng
              </Button>
            </div>

            {formFeatures.length > 0 && (
              <ul className="mt-2 flex flex-col gap-2 bg-slate-50 rounded-xl border border-slate-200 p-3 max-h-48 overflow-y-auto text-xs text-slate-700">
                {formFeatures.map((feat, idx) => (
                  <li key={idx} className="flex justify-between items-start border-b border-slate-200/60 pb-2 last:border-0 last:pb-0">
                    <span className="pr-2 leading-tight flex-1">- {feat}</span>
                    <button type="button" onClick={() => handleRemoveFeature(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded text-xs font-semibold transition-colors cursor-pointer shrink-0">Xóa</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sticky Form buttons */}
        <div className="flex justify-end gap-3.5 py-4 px-6 -mx-6 -mb-6 border-t border-slate-100 bg-white sticky bottom-0 z-10 rounded-b-2xl shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
          >
            Lưu sản phẩm
          </Button>
        </div>
      </form>
    </Modal>
  );
}
