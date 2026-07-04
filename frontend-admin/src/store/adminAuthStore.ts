import { create } from 'zustand';
import api from '../services/api';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface AdminAuthState {
  admin: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  expiresAt: number | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<boolean>;
  checkAuth: () => boolean;
  clearAuth: () => void;
}

const getStoredAdmin = (): AdminUser | null => {
  try {
    const adminStr = localStorage.getItem('dl247_admin_user');
    return adminStr ? JSON.parse(adminStr) : null;
  } catch {
    return null;
  }
};

const getStoredExpiresAt = (): number | null => {
  const expiresStr = localStorage.getItem('dl247_admin_expires_at');
  return expiresStr ? Number(expiresStr) : null;
};

const initialAdmin = getStoredAdmin();
const initialExpiresAt = getStoredExpiresAt();

const isSessionValid = (expiresAt: number | null): boolean => {
  if (!expiresAt) return false;
  return Date.now() < expiresAt;
};

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  admin: isSessionValid(initialExpiresAt) ? initialAdmin : null,
  token: isSessionValid(initialExpiresAt) ? 'session_active' : null,
  isAuthenticated: !!(isSessionValid(initialExpiresAt) && initialAdmin),
  expiresAt: isSessionValid(initialExpiresAt) ? initialExpiresAt : null,
  isLoading: false,

  // Login via API (Security-1B: no more hardcoded credentials in frontend)
  login: async (email, password) => {
    try {
      const response = await api.post('/admin/auth/login', { email, password });
      const { admin, expiresAt } = response.data.data;

      localStorage.setItem('dl247_admin_user', JSON.stringify(admin));
      localStorage.setItem('dl247_admin_expires_at', String(expiresAt));

      set({
        admin,
        token: 'session_active',
        isAuthenticated: true,
        expiresAt
      });

      return { success: true, message: response.data.message || 'Đăng nhập thành công' };
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err?.response?.data?.message || 'Email hoặc mật khẩu không chính xác';
      return { success: false, message };
    }
  },

  // Logout via API (Security-1B: server invalidates the session)
  logout: async () => {
    try {
      const { isAuthenticated } = get();
      if (isAuthenticated) {
        await api.post('/admin/auth/logout');
      }
    } catch {
      // Ignore errors during logout - still clear local state
    }
    get().clearAuth();
  },

  // Fetch current user from server to verify session validity (for F5/page reload)
  fetchCurrentUser: async () => {
    const { isAuthenticated } = get();
    if (!isAuthenticated) return false;

    set({ isLoading: true });
    try {
      const response = await api.get('/admin/auth/me');
      const { admin } = response.data.data;

      localStorage.setItem('dl247_admin_user', JSON.stringify(admin));

      set({
        admin,
        token: 'session_active',
        isAuthenticated: true,
        isLoading: false
      });

      return true;
    } catch {
      // Server rejected the token - clear everything
      get().clearAuth();
      set({ isLoading: false });
      return false;
    }
  },

  // Quick client-side check (for immediate rendering decisions)
  checkAuth: () => {
    const { isAuthenticated, expiresAt } = get();

    if (isAuthenticated) {
      if (!expiresAt || Date.now() > expiresAt) {
        get().clearAuth();
        return false;
      }
      return true;
    }

    return false;
  },

  // Clear all auth data from localStorage and store
  clearAuth: () => {
    localStorage.removeItem('dl247_admin_user');
    localStorage.removeItem('dl247_admin_expires_at');

    set({
      admin: null,
      token: null,
      isAuthenticated: false,
      expiresAt: null
    });
  }
}));
