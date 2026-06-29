import { useState } from 'react';
import Table, { type TableColumn } from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import { Edit2, Trash2, Package } from 'lucide-react';
import type { Product, Category, Brand } from '../types';
import ProductStatusBadge from './ProductStatusBadge';

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

interface ProductTableProps {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}

export default function ProductTable({ products, categories, brands, onEdit, onDelete }: ProductTableProps) {
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
        const cat = categories.find((c) => c.id === row.categoryId);
        return <span className="text-slate-600 font-medium">{cat?.name || row.categoryId}</span>;
      }
    },
    {
      title: 'Thương hiệu',
      key: 'brand',
      render: (row) => {
        const br = brands.find((b) => b.id === row.brandId);
        return <span className="text-slate-600 font-medium">{br?.name || row.brandId}</span>;
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
      render: (row) => <ProductStatusBadge status={row.status} />
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(row)}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center cursor-pointer shadow-sm"
            title="Chỉnh sửa"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(row.id)}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center justify-center cursor-pointer shadow-sm"
            title="Xóa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={products.map((p) => ({ ...p, key: p.id }))}
      emptyText="Không tìm thấy sản phẩm nào khớp với tìm kiếm."
    />
  );
}
