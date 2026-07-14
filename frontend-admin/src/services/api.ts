import axios, { AxiosError } from 'axios';
import { env } from '@/config/env';
import type { ApiErrorResponse } from '@/types/api';

function createRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `admin-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (!config.headers.has('X-Request-Id')) {
    config.headers.set('X-Request-Id', createRequestId());
  }

  if (config.method?.toLowerCase() === 'delete') {
    config.headers.set('X-Confirm-Dangerous-Action', 'true');
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const requestUrl = error.config?.url ?? '';
    const isLoginRequest = requestUrl.includes('/admin/auth/login');

    if (error.response?.status === 401 && !isLoginRequest) {
      const { useAdminAuthStore } = await import('@/store/adminAuthStore');
      const authState = useAdminAuthStore.getState();

      if (authState.isAuthenticated) {
        authState.clearAuth();
        window.location.href = `${window.location.pathname}#/login`;
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
