import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface PublicSettings {
  hotline: string;
  zalo: string;
  email: string;
  address: string;
  shippingFee: number;
  freeShippingThreshold: number;
}

// Fallback settings in case of connection errors or API boot delay
export const defaultSettings: PublicSettings = {
  hotline: '1900 1234',
  zalo: '0987654321',
  email: 'support@dienlanh247.vn',
  address: '123 Đường Cầu Giấy, Hà Nội',
  shippingFee: 30000,
  freeShippingThreshold: 5000000,
};

export function useSettings() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const res = await api.get('/settings/public');
      return res.data?.data as PublicSettings;
    },
    staleTime: 60000, // Cache for 1 minute
  });

  return {
    settings: data || defaultSettings,
    isLoading,
    error,
  };
}
