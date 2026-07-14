import { create } from 'zustand';
import { canAccess } from '@/config/adminPermissions';
import api, { getApiErrorMessage } from '@/services/api';
import type { AdminPermission, AdminSessionPayload, AdminUser } from '@/types/admin';

interface AdminAuthState {
  admin: AdminUser | null;
  permissions: AdminPermission[];
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  expiresAt: number | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  bootstrap: () => Promise<boolean>;
  logout: () => Promise<void>;
  setSession: (payload: AdminSessionPayload) => void;
  clearAuth: () => void;
  hasPermission: (permission?: AdminPermission | readonly AdminPermission[], mode?: 'all' | 'any') => boolean;
}

export type { AdminUser } from '@/types/admin';

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  admin: null,
  permissions: [],
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  expiresAt: null,

  setSession: (payload) => {
    const permissions = payload.permissions ?? payload.admin.permissions ?? [];
    set({
      admin: { ...payload.admin, permissions },
      permissions,
      isAuthenticated: true,
      isInitialized: true,
      isLoading: false,
      expiresAt: payload.expiresAt ?? null,
    });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/admin/auth/login', { email, password });
      get().setSession(response.data.data as AdminSessionPayload);
      return { success: true, message: response.data.message || 'Đăng nhập thành công' };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, message: getApiErrorMessage(error, 'Email hoặc mật khẩu không chính xác') };
    }
  },

  bootstrap: async () => {
    if (get().isLoading) return get().isAuthenticated;
    set({ isLoading: true });
    try {
      const response = await api.get('/admin/auth/me');
      get().setSession(response.data.data as AdminSessionPayload);
      return true;
    } catch {
      get().clearAuth();
      return false;
    }
  },

  logout: async () => {
    try {
      await api.post('/admin/auth/logout');
    } catch {
      // Server may already have expired or revoked the session.
    }
    get().clearAuth();
  },

  clearAuth: () => {
    set({
      admin: null,
      permissions: [],
      isAuthenticated: false,
      isInitialized: true,
      isLoading: false,
      expiresAt: null,
    });
  },

  hasPermission: (permission, mode = 'all') => canAccess(get().permissions, permission, mode),
}));
