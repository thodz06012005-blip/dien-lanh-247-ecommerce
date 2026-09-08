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

// Fallback settings in case of connection errors or API boot delay
export const defaultSettings: PublicSettings = {
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
