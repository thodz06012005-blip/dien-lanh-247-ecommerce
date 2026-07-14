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
  | 'RESCHEDULED'
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'completed'
  | 'cancelled';

export type ServiceRequestPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface ServiceRequestStatusEvent {
  id: string | number;
  fromStatus?: ServiceRequestStatus | null;
  toStatus: ServiceRequestStatus;
  note?: string | null;
  actorType: string;
  actorId?: string | null;
  actorName?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface ServiceRequestMedia {
  id: string | number;
  stage: 'CUSTOMER_BEFORE' | 'BEFORE' | 'DIAGNOSTIC' | 'AFTER' | 'WARRANTY';
  url: string;
  mimeType: string;
  sizeBytes?: number | null;
  width?: number | null;
  height?: number | null;
  caption?: string | null;
  uploadedByType: string;
  uploadedById?: string | null;
  createdAt: string;
}

export interface ServiceRequestAudit {
  id: string | number;
  action: string;
  actorType: string;
  actorId?: string | null;
  actorName?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface ServiceRequest {
  id: string;
  code?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerAddress: string;
  district: string;
  serviceCategoryId: string;
  serviceCategoryName?: string;
  applianceType: string;
  issueDescription: string;
  images?: string[];
  preferredDate: string;
  preferredTimeSlot: string;
  scheduledAt?: string | null;
  note?: string | null;
  status: ServiceRequestStatus;
  workflowStatus: ServiceRequestStatus;
  requestVersion: number;
  source: string;
  assignedTechnicianId?: string | null;
  technicianName?: string | null;
  technicianAvatar?: string | null;
  technician?: {
    id: string;
    name: string;
    phone?: string;
    avatar?: string;
    rating?: number;
    skills?: string[];
  } | null;
  priority: ServiceRequestPriority;
  estimatedPrice: number;
  finalPrice: number;
  paymentStatus: 'unpaid' | 'paid';
  createdAt: string;
  updatedAt: string;
  lastStatusChangedAt: string;
  allowedTransitions: ServiceRequestStatus[];
  timeline?: ServiceRequestStatusEvent[];
  media?: ServiceRequestMedia[];
  audits?: ServiceRequestAudit[];
  statusHistory?: Array<{
    status: string;
    note: string;
    updatedBy: string;
    createdAt: string;
  }>;
}

export interface ServiceRequestListResponse {
  success: true;
  data: ServiceRequest[];
  meta: { page: number; limit: number; total: number; totalPages: number };
  stats: {
    newCount: number;
    unassignedCount: number;
    activeCount: number;
    waitingPartsCount: number;
    warrantyCount: number;
    overdueCount: number;
  };
}

export type ServiceRequestWithKey = ServiceRequest & { key: string };
