export interface ApplianceConfig {
  id: string;
  name: string;
  active: boolean;
  issues: string[];
  priceMin: number;
  priceMax: number;
}

export interface ServiceAreaConfig {
  id: string;
  name: string;
  active: boolean;
  travelFee: number;
}

export interface TimeSlotConfig {
  id: string;
  label: string;
  active: boolean;
}

export interface RequestStatusConfig {
  id: string;
  label: string;
  color: string;
  active: boolean;
}

export interface RoleConfig {
  id: string;
  name: string;
  description: string;
}

export interface BusinessConfig {
  appliances: ApplianceConfig[];
  serviceAreas: ServiceAreaConfig[];
  timeSlots: TimeSlotConfig[];
  pricing: {
    inspectionFee: number;
    emergencySurcharge: number;
    showPriceRanges: boolean;
    disclaimer: string;
  };
  requestStatuses: RequestStatusConfig[];
  roles: RoleConfig[];
  finance: {
    revenueRecognition: 'completed' | 'paid';
    technicianPayType: 'percentage' | 'fixed';
    technicianPayRate: number;
    includePartsInCommission: boolean;
  };
}

export interface SystemSettings {
  storeName: string;
  hotline: string;
  zalo: string;
  email: string;
  address: string;
  shippingFee: number;
  freeShippingThreshold: number;
  businessConfig: BusinessConfig;
}
