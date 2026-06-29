export interface ProductSpec {
  name: string;
  value: string;
}

export interface Product {
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

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  productCount: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
}

export type SaveProductPayload = Omit<Product, 'key' | 'createdAt' | 'updatedAt' | 'id'> & { id?: string };
