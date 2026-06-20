import { create } from 'zustand';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    
    const duration = toast.duration === undefined ? 3000 : toast.duration;
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  
  showSuccess: (message, title = 'Thành công') =>
    get().addToast({ type: 'success', title, message }),
  
  showError: (message, title = 'Lỗi') =>
    get().addToast({ type: 'error', title, message }),
  
  showInfo: (message, title = 'Thông báo') =>
    get().addToast({ type: 'info', title, message }),
  
  showWarning: (message, title = 'Cảnh báo') =>
    get().addToast({ type: 'warning', title, message }),
}));
