import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { useAuthStore } from '@/store/authStore';
import type { ApiErrorResponse } from '@/types/api';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

function createRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  if (!config.headers.has('X-Request-Id')) config.headers.set('X-Request-Id', createRequestId());
  return config;
});

let refreshPromise: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url ?? '';
    const isRefresh = requestUrl.includes('/auth/refresh');
    const isCredentialRequest = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/verify-email',
    ].some((path) => requestUrl.includes(path));

    if (status === 401 && originalRequest && !originalRequest._retry && !isRefresh && !isCredentialRequest) {
      originalRequest._retry = true;
      try {
        refreshPromise ??= api.post('/auth/refresh').then(() => undefined);
        await refreshPromise;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearSession();
        const currentHash = window.location.hash.replace(/^#/, '') || '/';
        const protectedPath = ['/account', '/orders', '/my-services'].some((path) => currentHash.startsWith(path));
        if (protectedPath) {
          window.location.hash = `#/login?returnTo=${encodeURIComponent(currentHash)}`;
        }
        return Promise.reject(refreshError);
      } finally {
        refreshPromise = null;
      }
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown, fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.') {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return error instanceof Error ? error.message : fallback;
  }
  return error.response?.data?.error?.message ?? error.response?.data?.message ?? fallback;
}

export default api;
