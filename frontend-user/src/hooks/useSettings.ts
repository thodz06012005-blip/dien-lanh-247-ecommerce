import { useQuery } from '@tanstack/react-query';

export interface PublicSettings {
  hotline: string;
  zalo: string;
  email: string;
  address: string;
  shippingFee: number;
  freeShippingThreshold: number;
}

export const defaultSettings: PublicSettings = {
  hotline: '1900 1234',
  zalo: '0987654321',
  email: 'support@dienlanh247.vn',
  address: '123 Đường Cầu Giấy, Hà Nội',
  shippingFee: 30000,
  freeShippingThreshold: 5000000,
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1').replace(/\/$/, '');
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000);

function extractSettings(payload: unknown): PublicSettings {
  const first = payload as { data?: unknown };
  const second = first?.data as { data?: unknown } | undefined;
  const value = second?.data || first?.data || payload;
  return value as PublicSettings;
}

export function useSettings() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/settings/public`, {
        headers: { Accept: 'application/json' },
        credentials: 'omit',
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`Public settings request failed: ${response.status}`);
      return extractSettings(await response.json());
    },
    staleTime: 5 * 60_000,
  });

  return {
    settings: data || defaultSettings,
    isLoading,
    error,
  };
}
