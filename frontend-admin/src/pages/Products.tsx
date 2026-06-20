import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Card from '../components/ui/Card';
import Table, { type TableColumn } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import { Edit2, Trash2, Plus, Search, Package } from 'lucide-react';

interface ProductSpec {
  name: string;
  value: string;
}

function ProductThumbnail({ src, alt }: { src: string; alt: string }) {
  const [isError, setIsError] = useState(false);
  if (isError || !src) {
    return (
      <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
        <Package className="w-5 h-5" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setIsError(true)}
      className="w-12 h-12 object-cover rounded-xl border border-slate-200 bg-slate-50 shrink-0"
    />
  );
}

interface Product {
  key: string;
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  brandId: string;
  basePrice: number;
  salePrice: number;
  stock: number;
  lowStockThreshold: number;
  status: 'active' | 'hidden' | 'out_of_stock';
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  thumbnail: string;
  images: string[];
  specifications: ProductSpec[];
  features: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

export default function Products() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [searchText, setSearchText] = useState('');
  
  // Specs and Features states for form
  const [formSpecs, setFormSpecs] = useState<ProductSpec[]>([]);
  const [formFeatures, setFormFeatures] = useState<string[]>([]);
  const [newSpecName, setNewSpecName] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  const [newFeatureText, setNewFeatureText] = useState('');

  // Form Fields
  const [formValues, setFormValues] = useState({
    name: '',
    slug: '',
    sku: '',
    categoryId: 'dieu-hoa',
    brandId: 'daikin',
    basePrice: 0,
    salePrice: 0,
    stock: 0,
    lowStockThreshold: 3,
    status: 'active' as 'active' | 'hidden' | 'out_of_stock',
    thumbnail: '',
    description: '',
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
  });

  // Fetch all products
  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const res = await api.get('/admin/products');
      return res.data;
    }
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    }
  });

  // Fetch brands
  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await api.get('/brands');
      return res.data;
    }
  });

  const categories = categoriesData?.data || [];
  const brands = brandsData?.data || [];
  const productsList = productsData?.data || [];

  // Save (Create or Update) mutation
  const saveProduct = useMutation({
    mutationFn: async (payload: any) => {
      if (editingProduct?.id) {
        return api.patch(`/admin/products/${editingProduct.id}`, payload);
      }
      return api.post('/admin/products', payload);
    },
    onSuccess: () => {
      alert('Lưu sản phẩm thành công');
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu sản phẩm');
    }
  });

  // Delete mutation
  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/admin/products/${id}`);
    },
    onSuccess: () => {
      alert('Xóa sản phẩm thành công');
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa sản phẩm');
    }
  });

  const resetForm = () => {
    setFormValues({
      name: '',
      slug: '',
      sku: '',
      categoryId: categories[0]?.id || 'dieu-hoa',
      brandId: brands[0]?.id || 'daikin',
      basePrice: 0,
      salePrice: 0,
      stock: 0,
      lowStockThreshold: 3,
      status: 'active',
      thumbnail: '',
      description: '',
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: false,
    });
    setFormSpecs([]);
    setFormFeatures([]);
    setEditingProduct(null);
    setNewSpecName('');
    setNewSpecValue('');
    setNewFeatureText('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormValues({
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      categoryId: p.categoryId,
      brandId: p.brandId,
      basePrice: p.basePrice,
      salePrice: p.salePrice || p.basePrice,
      stock: p.stock,
      lowStockThreshold: p.lowStockThreshold || 3,
      status: p.status,
      thumbnail: p.thumbnail || '',
      description: p.description || '',
      isFeatured: !!p.isFeatured,
      isBestSeller: !!p.isBestSeller,
      isNewArrival: !!p.isNewArrival,
    });
    setFormSpecs(p.specifications || []);
    setFormFeatures(p.features || []);
    setIsModalOpen(true);
  };

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
    if (!formValues.name || !formValues.sku || !formValues.slug) {
      alert('Vui lòng nhập đầy đủ Tên, SKU và Slug của sản phẩm');
      return;
    }
    const payload = {
      ...formValues,
      specifications: formSpecs,
      features: formFeatures,
      // If thumbnail is empty, give it a placeholder
      thumbnail: formValues.thumbnail || 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=400',
      images: [formValues.thumbnail || 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=400']
    };
    saveProduct.mutate(payload);
  };

  // Filter products based on search
  const filteredProducts = productsList.filter((p: any) => {
    const q = searchText.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q)
    );
  });

  const columns: TableColumn<Product>[] = [
    {
      title: 'Ảnh',
      key: 'thumbnail',
      render: (row) => <ProductThumbnail src={row.thumbnail} alt={row.name} />
    },
    {
      title: 'SKU',
      key: 'sku',
      render: (row) => <span className="text-xs text-slate-400 font-medium">{row.sku}</span>
    },
    {
      title: 'Tên sản phẩm',
      key: 'name',
      render: (row) => (
        <div className="max-w-xs truncate font-semibold text-slate-900" title={row.name}>
          {row.name}
        </div>
      )
    },
    {
      title: 'Danh mục',
      key: 'category',
      render: (row) => {
        const cat = categories.find((c: any) => c.id === row.categoryId);
        return <span className="text-slate-655 font-medium">{cat?.name || row.categoryId}</span>;
      }
    },
    {
      title: 'Thương hiệu',
      key: 'brand',
      render: (row) => {
        const br = brands.find((b: any) => b.id === row.brandId);
        return <span className="text-slate-655 font-medium">{br?.name || row.brandId}</span>;
      }
    },
    {
      title: 'Giá bán',
      key: 'price',
      className: 'text-right',
      render: (row) => {
        const hasSale = !!row.salePrice && row.salePrice < row.basePrice;
        return (
          <div className="flex flex-col text-right">
            <strong className="text-blue-600 font-bold text-sm">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.salePrice || row.basePrice)}
            </strong>
            {hasSale && (
              <span className="text-xs text-slate-400 line-through mt-0.5">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.basePrice)}
              </span>
            )}
          </div>
        );
      }
    },
    {
      title: 'Tồn kho',
      key: 'stock',
      render: (row) => {
        const isLow = row.stock <= (row.lowStockThreshold || 3);
        if (isLow) {
          return <Badge variant="danger" pill dot>{row.stock} chiếc (Sắp hết)</Badge>;
        }
        return <Badge variant="neutral" pill>{row.stock} chiếc</Badge>;
      }
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (row) => {
        if (row.status === 'active') return <Badge variant="success" dot>Hoạt động</Badge>;
        if (row.status === 'hidden') return <Badge variant="neutral" dot>Đang ẩn</Badge>;
        return <Badge variant="danger" dot>Hết hàng</Badge>;
      }
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEditModal(row)}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center cursor-pointer shadow-sm"
            title="Chỉnh sửa"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteConfirmId(row.id)}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-655 hover:bg-red-50 hover:text-red-650 hover:border-red-200 transition-colors flex items-center justify-center cursor-pointer shadow-sm"
            title="Xóa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (isLoading) {
    return <LoadingState message="Đang tải danh sách sản phẩm..." />;
  }

  if (error || !productsData?.success) {
    return (
      <EmptyState
        message="Lỗi kết nối dữ liệu"
        subMessage="Không thể kết nối Mock API để tải danh sách sản phẩm."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Quản lý sản phẩm
          </h1>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Xem, sửa và thêm mới các sản phẩm điện lạnh của Điện Lạnh 247.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:w-80">
            <Input
              placeholder="Tìm theo tên, SKU..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 h-10 w-full bg-white shadow-sm border-slate-200"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAddModal}
            className="rounded-xl flex-shrink-0 h-10 font-bold"
          >
            Thêm sản phẩm
          </Button>
        </div>
      </div>

      <Card noPadding className="overflow-hidden shadow-sm border-slate-200/60">
        <Table
          columns={columns}
          dataSource={filteredProducts.map((p: any) => ({ ...p, key: p.id }))}
          emptyText="Không tìm thấy sản phẩm nào khớp với tìm kiếm."
        />
      </Card>

      {/* Save Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct?.id ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        size="lg"
      >
        <form onSubmit={handleSaveSubmit} className="flex flex-col gap-6 text-xs">
          {/* Section 1: Basic Info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col gap-4">
            <h3 className="text-[15px] font-semibold text-slate-950 flex items-center gap-2 mb-1">
              <div className="w-1.5 h-4 bg-blue-650 rounded-full"></div>
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
                options={categories.map((c: any) => ({ label: c.name, value: c.id }))}
                className="bg-white"
              />
              <Select
                label="Thương hiệu"
                name="brandId"
                value={formValues.brandId}
                onChange={handleFormChange}
                options={brands.map((b: any) => ({ label: b.name, value: b.id }))}
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
                      <button type="button" onClick={() => handleRemoveSpec(idx)} className="text-red-500 hover:text-red-750 hover:bg-red-50 px-2 py-1 rounded text-xs font-semibold transition-colors cursor-pointer">Xóa</button>
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
                      <button type="button" onClick={() => handleRemoveFeature(idx)} className="text-red-500 hover:text-red-750 hover:bg-red-50 px-2 py-1 rounded text-xs font-semibold transition-colors cursor-pointer shrink-0">Xóa</button>
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
              onClick={() => setIsModalOpen(false)}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={saveProduct.isPending}
            >
              Lưu sản phẩm
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteProduct.mutate(deleteConfirmId!)}
        title="Xác nhận xóa sản phẩm"
        message="Sản phẩm này sẽ bị xóa vĩnh viễn khỏi danh mục hệ thống và không thể phục hồi. Bạn có chắc chắn?"
        isConfirming={deleteProduct.isPending}
      />
    </div>
  );
}
