import axios from 'axios';
import { useAdminAuthStore } from '../store/adminAuthStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: automatically add confirmation header for DELETE requests to satisfy Dangerous Action Guard
api.interceptors.request.use((config) => {
  if (config.method?.toLowerCase() === 'delete') {
    config.headers['X-Confirm-Dangerous-Action'] = 'true';
  }
  return config;
});

// Response interceptor: auto-logout on 401 Unauthorized (Security-1B)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const { clearAuth } = useAdminAuthStore.getState();

      // Only clear and redirect if currently authenticated
      // (avoids redirect loop on the login page itself)
      const { isAuthenticated } = useAdminAuthStore.getState();
      if (isAuthenticated) {
        clearAuth();
        // Use hash-based routing redirect (HashRouter)
        window.location.href = window.location.pathname + '#/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
