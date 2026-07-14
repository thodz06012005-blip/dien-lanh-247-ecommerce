import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import type { ApiErrorResponse } from '@/types/api';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

function createRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
  return config;
});

let refreshPromise: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url ?? '';
    const isAuthenticationRequest =
      requestUrl.includes('/auth/refresh') || requestUrl.includes('/auth/login');

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthenticationRequest) {
      originalRequest._retry = true;

      try {
        refreshPromise ??= api.post('/auth/refresh').then(() => undefined);
        await refreshPromise;
        return api(originalRequest);
      } catch (refreshError) {
        window.location.hash = '#/login';
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
