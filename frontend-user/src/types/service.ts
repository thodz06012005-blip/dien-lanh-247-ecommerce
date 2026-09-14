export interface PublicTechnician {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  rating: number;
  skills: string[];
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
}

export interface StatusHistoryEntry {
  status: string;
  note: string;
  updatedBy: 'customer' | 'admin' | 'system';
  createdAt: string;
}

export interface ServiceRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  district: string;
  serviceCategoryId: string;
  applianceType: string;
  issueDescription: string;
  images: string[];
  mediaMetadata?: { name: string; type: string; size: number }[];
  preferredDate: string;
  preferredTimeSlot: string;
  note: string;
  status: 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'waiting_customer_approval' | 'cancelled' | 'completed';
  assignedTechnicianId: string | null;
  technician?: PublicTechnician | null;
  estimatedPrice: number;
  inspectionNote?: string;
  customerApprovalStatus?: 'not_requested' | 'pending' | 'approved' | 'rejected';
  customerApprovedAt?: string | null;
  indicativePriceRange?: { min: number; max: number; disclaimer: string } | null;
  finalPrice: number;
  paymentStatus: 'unpaid' | 'paid';
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}
export interface ServiceQuote { id: string; version: number; diagnosis: string; labor: number; parts: number; travel: number; other: number; total: number; status: 'draft'|'sent'|'approved'|'rejected'|'superseded'; validUntil: string; }

export type CustomerServiceRequest = ServiceRequest;
export type GuestLookupServiceRequest = Pick<ServiceRequest,
  'id' | 'serviceCategoryId' | 'applianceType' | 'issueDescription' | 'preferredDate' |
  'preferredTimeSlot' | 'district' | 'status' | 'estimatedPrice' | 'finalPrice' |
  'paymentStatus' | 'createdAt' | 'updatedAt' | 'technician'
> & { quote?: ServiceQuote | null };
