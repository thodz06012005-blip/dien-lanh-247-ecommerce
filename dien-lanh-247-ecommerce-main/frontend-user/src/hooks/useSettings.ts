import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface PublicSettings {
  hotline: string;
  zalo: string;
  email: string;
  address: string;
  shippingFee: number;
  freeShippingThreshold: number;
  businessConfig: {
    appliances: { id: string; name: string; active: boolean; issues: string[]; priceMin: number; priceMax: number }[];
    serviceAreas: { id: string; name: string; active: boolean; travelFee: number }[];
    timeSlots: { id: string; label: string; active: boolean }[];
    pricing: { inspectionFee: number; emergencySurcharge: number; showPriceRanges: boolean; disclaimer: string };
  };
}

// Inert placeholder only: never activate demo prices, phone numbers or service areas on API failure.
export const defaultSettings: PublicSettings = {
  hotline: '', zalo: '', email: '', address: '', shippingFee: 0, freeShippingThreshold: 0,
  businessConfig: { appliances: [], serviceAreas: [], timeSlots: [],
    pricing: { inspectionFee: 0, emergencySurcharge: 0, showPriceRanges: false, disclaimer: '' } },
};


export function useSettings() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const [res, { publicSettingsSchema }] = await Promise.all([
        api.get('/settings/public'),
        import('./publicSettingsSchema'),
      ]);
      if (res.data?.success !== true) throw new Error('Không thể tải cấu hình dịch vụ');
      return publicSettingsSchema.parse(res.data.data);
    },
    staleTime: 60000, // Cache for 1 minute
  });

  return {
    settings: data || defaultSettings,
    isLoading,
    isReady: Boolean(data),
    refetch,
    error,
  };
}
