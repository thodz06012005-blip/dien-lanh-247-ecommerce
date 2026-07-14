import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import type { AdminSessionPayload } from '@/types/admin';
import type { ApiErrorResponse } from '@/types/api';

interface RetryableRequest extends InternalAxiosRequestConfig {
  _adminRetry?: boolean;
}

function createRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return `admin-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

let refreshPromise: Promise<AdminSessionPayload> | null = null;

api.interceptors.request.use((config) => {
  if (!config.headers.has('X-Request-Id')) config.headers.set('X-Request-Id', createRequestId());
  if (config.method?.toLowerCase() === 'delete') config.headers.set('X-Confirm-Dangerous-Action', 'true');
  return config;
});

async function refreshAdminSession() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${env.apiBaseUrl}/admin/auth/refresh`, {}, { withCredentials: true, timeout: env.apiTimeoutMs })
      .then(async (response) => {
        const payload = response.data.data as AdminSessionPayload;
        const { useAdminAuthStore } = await import('@/store/adminAuthStore');
        useAdminAuthStore.getState().setSession(payload);
        return payload;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryableRequest | undefined;
    const requestUrl = request?.url ?? '';
    const isAuthEndpoint = requestUrl.includes('/admin/auth/login') || requestUrl.includes('/admin/auth/refresh');

    if (error.response?.status === 401 && request && !request._adminRetry && !isAuthEndpoint) {
      request._adminRetry = true;
      try {
        await refreshAdminSession();
        return api(request);
      } catch {
        const { useAdminAuthStore } = await import('@/store/adminAuthStore');
        useAdminAuthStore.getState().clearAuth();
        const current = `${window.location.hash.replace(/^#/, '') || '/'}${window.location.search}`;
        window.location.hash = `/login?returnTo=${encodeURIComponent(current)}`;
      }
    }

    if (error.response?.status === 403 && !requestUrl.includes('/admin/auth/')) {
      window.location.hash = '/403';
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
