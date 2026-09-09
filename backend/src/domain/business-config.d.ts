export interface FinancePolicy { revenueRecognition: 'completed' | 'paid'; technicianPayType: 'percentage' | 'fixed'; technicianPayRate: number; includePartsInCommission: boolean; }
export interface BusinessConfig {
  appliances: { id: string; name: string; active: boolean; issues: string[]; priceMin: number; priceMax: number }[];
  serviceAreas: { id: string; name: string; active: boolean; travelFee: number }[];
  timeSlots: { id: string; label: string; active: boolean }[];
  pricing: { inspectionFee: number; emergencySurcharge: number; showPriceRanges: boolean; disclaimer: string };
  requestStatuses: { id: string; label: string; color: string; active: boolean }[];
  roles: { id: string; name: string; description: string }[];
  finance: FinancePolicy;
}
export const EMPTY_BUSINESS_CONFIG: BusinessConfig;
export function validateBusinessConfig(value: unknown): BusinessConfig;
