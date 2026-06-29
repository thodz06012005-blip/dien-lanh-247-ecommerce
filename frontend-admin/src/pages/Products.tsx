import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { AxiosError } from 'axios';
import Card from '../components/ui/Card';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ProductTable from '../features/products/components/ProductTable';
import ProductFilters from '../features/products/components/ProductFilters';
import ProductFormModal from '../features/products/components/ProductFormModal';
import type { Product, SaveProductPayload } from '../features/products/types';

export default function Products() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [searchText, setSearchText] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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
    mutationFn: async (payload: SaveProductPayload) => {
      if (editingProduct?.id) {
        return api.patch(`/admin/products/${editingProduct.id}`, payload);
      }
      return api.post('/admin/products', payload);
    },
    onSuccess: () => {
      showToast('Lưu sản phẩm thành công', 'success');
      setIsModalOpen(false);
      setEditingProduct(null);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi lưu sản phẩm', 'error');
    }
  });

  // Delete mutation
  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/admin/products/${id}`);
    },
    onSuccess: () => {
      showToast('Xóa sản phẩm thành công', 'success');
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi xóa sản phẩm', 'error');
    }
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setIsModalOpen(true);
  };

  const handleSaveSubmit = (payload: SaveProductPayload) => {
    saveProduct.mutate(payload);
  };

  // Filter products based on search
  const filteredProducts = productsList.filter((p: Product) => {
    const q = searchText.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q)
    );
  });

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

        <ProductFilters
          searchText={searchText}
          onSearchChange={setSearchText}
          onAddClick={handleOpenAddModal}
        />
      </div>

      <Card noPadding className="overflow-hidden shadow-sm border-slate-200/60">
        <ProductTable
          products={filteredProducts}
          categories={categories}
          brands={brands}
          onEdit={handleOpenEditModal}
          onDelete={setDeleteConfirmId}
        />
      </Card>

      {/* Save Modal */}
      {isModalOpen && (
        <ProductFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          editingProduct={editingProduct}
          categories={categories}
          brands={brands}
          isSaving={saveProduct.isPending}
          onSave={handleSaveSubmit}
          showToast={showToast}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteProduct.mutate(deleteConfirmId!)}
        title="Xác nhận xóa sản phẩm"
        message="Sản phẩm này sẽ bị xóa vĩnh viễn khỏi danh mục hệ thống và không thể phục hồi. Bạn có chắc chắn?"
        isConfirming={deleteProduct.isPending}
      />

      {/* Toast notifications */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold transition-all duration-300 page-fade-in ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
