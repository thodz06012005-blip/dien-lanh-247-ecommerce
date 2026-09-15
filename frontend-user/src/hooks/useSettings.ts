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
<<<<<<< HEAD
  hotline: '', zalo: '', email: '', address: '', shippingFee: 0, freeShippingThreshold: 0,
  businessConfig: { appliances: [], serviceAreas: [], timeSlots: [],
    pricing: { inspectionFee: 0, emergencySurcharge: 0, showPriceRanges: false, disclaimer: '' } },
=======
  hotline: '1900 1234',
  zalo: '0987654321',
  email: 'support@dienlanh247.vn',
  address: '123 Đường Cầu Giấy, Hà Nội',
  shippingFee: 30000,
  freeShippingThreshold: 5000000,
  businessConfig: {
    appliances: [
      { id: 'air-conditioner', name: 'Điều hòa', active: true, issues: ['Không mát', 'Rò nước', 'Không lên nguồn', 'Kêu to', 'Cần vệ sinh', 'Không rõ lỗi'], priceMin: 150000, priceMax: 650000 },
      { id: 'refrigerator', name: 'Tủ lạnh', active: true, issues: ['Không lạnh', 'Đóng tuyết', 'Chảy nước', 'Kêu to', 'Không rõ lỗi'], priceMin: 250000, priceMax: 900000 },
      { id: 'washing-machine', name: 'Máy giặt', active: true, issues: ['Không vắt', 'Không xả nước', 'Rung mạnh', 'Báo lỗi', 'Không rõ lỗi'], priceMin: 200000, priceMax: 750000 },
    ],
    serviceAreas: [{ id: 'cau-giay', name: 'Quận Cầu Giấy', active: true, travelFee: 0 }],
    timeSlots: [
      { id: 'morning-1', label: '08:00 - 10:00', active: true },
      { id: 'morning-2', label: '10:00 - 12:00', active: true },
      { id: 'afternoon-1', label: '14:00 - 16:00', active: true },
      { id: 'afternoon-2', label: '16:00 - 18:00', active: true },
    ],
    pricing: { inspectionFee: 100000, emergencySurcharge: 100000, showPriceRanges: true, disclaimer: 'Mức giá chỉ để tham khảo. Kỹ thuật viên sẽ thông báo chi phí để khách hàng đồng ý trước khi sửa.' },
  },
>>>>>>> origin/codex/edit-file-zvjidd
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
