export type BackendMode = 'MOCK' | 'REAL';

export const SERVICE_ONLY = import.meta.env.VITE_SERVICE_ONLY !== 'false';
export const BACKEND_MODE: BackendMode = import.meta.env.VITE_BACKEND_MODE === 'REAL' ? 'REAL' : 'MOCK';

const configuredApiUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim();

if (import.meta.env.PROD && !configuredApiUrl) {
  throw new Error('VITE_API_BASE_URL is required for a production build.');
}

export const API_BASE_URL = configuredApiUrl || (BACKEND_MODE === 'REAL'
  ? 'http://localhost:3000/api/v1'
  : 'http://localhost:3001/api/v1');
