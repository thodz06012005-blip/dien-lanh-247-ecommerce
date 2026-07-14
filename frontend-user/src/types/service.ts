export type ServiceRequestStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_PARTS'
  | 'COMPLETED'
  | 'WARRANTY'
  | 'CLOSED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'RESCHEDULED';

export type ServiceRequestPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface PublicTechnician {
  name: string;
  avatar?: string | null;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}

export interface StatusHistoryEntry {
  id: string;
  fromStatus?: ServiceRequestStatus | null;
  toStatus: ServiceRequestStatus;
  note?: string | null;
  actorType: string;
  actorName?: string | null;
  createdAt: string;
}

export interface ServiceRequestMedia {
  id: string;
  stage: 'CUSTOMER_BEFORE' | 'BEFORE' | 'DIAGNOSTIC' | 'AFTER' | 'WARRANTY';
  url: string;
  mimeType: string;
  caption?: string | null;
  createdAt: string;
}

export interface ServiceRequest {
  id: string;
  code?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string | null;
  district?: string;
  serviceCategoryId?: string;
  serviceCategory?: { id: string; name: string };
  applianceType: string;
  issueDescription?: string;
  preferredDate: string;
  preferredTimeSlot: string;
  status: ServiceRequestStatus;
  priority: ServiceRequestPriority;
  technician?: PublicTechnician | null;
  estimatedPrice: number;
  finalPrice: number;
  paymentStatus?: 'unpaid' | 'paid';
  timeline?: StatusHistoryEntry[];
  media?: ServiceRequestMedia[];
  createdAt: string;
  updatedAt: string;
}
