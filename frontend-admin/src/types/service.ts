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
  preferredDate: string;
  preferredTimeSlot: string;
  note: string;
  status: 'pending' | 'confirmed' | 'assigned' | 'cancelled' | 'completed';
  assignedTechnicianId: string | null;
  technician?: Technician | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimatedPrice: number;
  finalPrice: number;
  paymentStatus: 'unpaid' | 'paid';
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}
