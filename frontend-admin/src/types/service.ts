import type { Technician } from './technician';

export interface StatusHistoryEntry {
  status: string;
  note: string;
  updatedBy: 'customer' | 'admin' | 'system';
  createdAt: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
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
  status: 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'cancelled' | 'completed';
  assignedTechnicianId: string | null;
  technician?: Technician | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimatedPrice: number;
  inspectionNote?: string;
  customerApprovalStatus?: 'not_requested' | 'pending' | 'approved' | 'rejected';
  customerApprovedAt?: string | null;
  indicativePriceRange?: { min: number; max: number; disclaimer: string } | null;
  finalPrice: number;
  paymentStatus: 'unpaid' | 'paid';
  statusHistory: StatusHistoryEntry[];
  activityLog?: { action: string; label: string; actor: string; detail?: string; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
}
