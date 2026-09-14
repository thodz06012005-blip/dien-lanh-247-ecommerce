import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAdminAuthStore } from '../store/adminAuthStore';
import { API_BASE_URL } from '../config/runtime';

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };
const api = axios.create({ baseURL: API_BASE_URL, withCredentials: true, headers: { 'Content-Type': 'application/json' } });
let refreshPromise: Promise<void> | null = null;
let redirectingToLogin = false;

api.interceptors.request.use((config) => {
  if (config.method?.toLowerCase() === 'delete') config.headers['X-Confirm-Dangerous-Action'] = 'true';
  return config;
});

const refreshAdminSession = () => {
  if (!refreshPromise) {
    refreshPromise = axios.post(`${API_BASE_URL}/admin/auth/refresh`, {}, { withCredentials: true })
      .then((response) => {
        const expiresAt = response.data?.data?.expiresAt;
        if (expiresAt) useAdminAuthStore.getState().setServerExpiry(expiresAt);
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryConfig | undefined;
    const url = request?.url || '';
    const isAuthEndpoint = url.includes('/admin/auth/login') || url.includes('/admin/auth/refresh');
    if (error.response?.status === 401 && request && !request._retry && !isAuthEndpoint) {
      request._retry = true;
      try {
        await refreshAdminSession();
        return api(request);
      } catch {
        useAdminAuthStore.getState().clearAuth();
        if (!redirectingToLogin) {
          redirectingToLogin = true;
          window.location.hash = '#/login';
          window.setTimeout(() => { redirectingToLogin = false; }, 0);
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
