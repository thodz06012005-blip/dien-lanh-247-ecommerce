import { create } from 'zustand';
import type { Product, Voucher } from '../mock/data';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  voucher: Voucher | null;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyVoucher: (voucher: Voucher | null) => void;
  getTotals: (customShippingFee?: number, customFreeShippingThreshold?: number) => {
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
  };
}

const saveCartToStorage = (items: CartItem[], voucher: Voucher | null) => {
  localStorage.setItem('dl247_cart_items', JSON.stringify(items));
  localStorage.setItem('dl247_cart_voucher', JSON.stringify(voucher));
};

export const useCartStore = create<CartState>((set, get) => ({
  items: JSON.parse(localStorage.getItem('dl247_cart_items') || '[]'),
  voucher: JSON.parse(localStorage.getItem('dl247_cart_voucher') || 'null'),

  addItem: (product, quantity = 1) => {
    set((state) => {
      const existingIndex = state.items.findIndex((item) => item.product.id === product.id);
      const newItems = [...state.items];
      
      if (existingIndex > -1) {
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + quantity,
        };
      } else {
        newItems.push({ product, quantity });
      }
      
      saveCartToStorage(newItems, state.voucher);
      return { items: newItems };
    });
  },

  removeItem: (productId) => {
    set((state) => {
      const newItems = state.items.filter((item) => item.product.id !== productId);
      saveCartToStorage(newItems, state.voucher);
      return { items: newItems };
    });
  },

  updateQuantity: (productId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        const newItems = state.items.filter((item) => item.product.id !== productId);
        saveCartToStorage(newItems, state.voucher);
        return { items: newItems };
      }
      
      const newItems = state.items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
      saveCartToStorage(newItems, state.voucher);
      return { items: newItems };
    });
  },

  clearCart: () => {
    set({ items: [], voucher: null });
    saveCartToStorage([], null);
  },

  applyVoucher: (voucher) => {
    set((state) => {
      saveCartToStorage(state.items, voucher);
      return { voucher };
    });
  },

  getTotals: (customShippingFee?: number, customFreeShippingThreshold?: number) => {
    const { items, voucher } = get();
    
    // Subtotal
    const subtotal = items.reduce((acc, item) => {
      const price = item.product.salePrice || item.product.basePrice;
      return acc + price * item.quantity;
    }, 0);

    const threshold = customFreeShippingThreshold !== undefined ? customFreeShippingThreshold : 5000000;
    const baseShippingFee = customShippingFee !== undefined ? customShippingFee : 30000;

    // Dynamic shipping fee calculation
    let shipping = 0;
    if (subtotal > 0 && subtotal < threshold) {
      // Check if there are large appliances in cart
      const hasLargeAppliance = items.some((item) =>
        ['dieu-hoa', 'tu-lanh', 'may-giat', 'may-say', 'tu-dong'].includes(item.product.categoryId)
      );
      // Flat rate shipping
      shipping = hasLargeAppliance ? 150000 : baseShippingFee;
    } else if (subtotal >= threshold) {
      shipping = 0; // Free shipping over threshold
    }

    // Check if voucher is MIENPHIYENTAM which discounts shipping
    let discount = 0;
    if (voucher) {
      if (subtotal >= voucher.minOrderValue) {
        if (voucher.discountType === 'percentage') {
          discount = (subtotal * voucher.value) / 100;
          if (voucher.maxDiscount && discount > voucher.maxDiscount) {
            discount = voucher.maxDiscount;
          }
        } else {
          discount = voucher.value;
        }
      }
    }

    // Grand total
    const total = Math.max(0, subtotal - discount + shipping);

    return {
      subtotal,
      discount,
      shipping,
      total,
    };
  },
}));
