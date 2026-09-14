import { create } from 'zustand';
import api from '../services/api';
import { clearAdminQueries } from '../lib/queryClient';

export type AdminAuthStatus = 'unknown' | 'loading' | 'authenticated' | 'anonymous';
export interface AdminUser { id: string; name: string; email: string; role: string; status: string; }
interface AdminAuthState {
  admin: AdminUser | null; token: string | null; status: AdminAuthStatus; isAuthenticated: boolean; expiresAt: number | null; isLoading: boolean;
  bootstrap: () => Promise<boolean>; login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>; fetchCurrentUser: () => Promise<boolean>; checkAuth: () => boolean; clearAuth: () => void; setServerExpiry: (expiresAt: number) => void;
}
let bootstrapPromise: Promise<boolean> | null = null;
const cacheAdmin = (admin: AdminUser | null) => admin ? localStorage.setItem('dl247_admin_user', JSON.stringify(admin)) : localStorage.removeItem('dl247_admin_user');

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  admin: null, token: null, status: 'unknown', isAuthenticated: false, expiresAt: null, isLoading: true,
  bootstrap: () => {
    if (!bootstrapPromise) {
      set({ status: 'loading', isLoading: true });
      bootstrapPromise = api.get('/admin/auth/me').then(response => {
        const admin = response.data.data.admin as AdminUser; cacheAdmin(admin);
        set({ admin, token: 'session_active', status: 'authenticated', isAuthenticated: true, isLoading: false });
        return true;
      }).catch(() => { get().clearAuth(); return false; }).finally(() => { bootstrapPromise = null; });
    }
    return bootstrapPromise;
  },
  login: async (email, password) => {
    try {
      const response = await api.post('/admin/auth/login', { email, password });
      const { admin, expiresAt } = response.data.data; cacheAdmin(admin);
      if (expiresAt) localStorage.setItem('dl247_admin_expires_at', String(expiresAt));
      set({ admin, token: 'session_active', status: 'authenticated', isAuthenticated: true, expiresAt: expiresAt || null, isLoading: false });
      return { success: true, message: response.data.message || 'Đăng nhập thành công' };
    } catch (error) {
      const err = error as { response?: { data?: { message?: string }; status?: number } };
      return { success: false, message: err.response?.status === 429 ? 'Bạn thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.' : err.response?.data?.message || 'Email hoặc mật khẩu không chính xác' };
    }
  },
  logout: async () => { try { await api.post('/admin/auth/logout'); } finally { get().clearAuth(); } },
  fetchCurrentUser: () => get().bootstrap(),
  checkAuth: () => get().status === 'authenticated' && !!get().admin,
  setServerExpiry: (expiresAt) => { localStorage.setItem('dl247_admin_expires_at', String(expiresAt)); set({ expiresAt }); },
  clearAuth: () => {
    localStorage.removeItem('dl247_admin_user'); localStorage.removeItem('dl247_admin_expires_at'); clearAdminQueries();
    set({ admin: null, token: null, status: 'anonymous', isAuthenticated: false, expiresAt: null, isLoading: false });
  },
}));
