export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  thumbnail: string;
  price: number;
  quantity: number;
  total: number;
}

export interface OrderAddress {
  province: string;
  district: string;
  detail: string;
}

export interface Order {
  key: string;
  id: string;
  code: string;
  customerName: string;
  phone: string;
  email?: string;
  address: OrderAddress;
  note?: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

export type OrderWithKey = Order & { key: string };
