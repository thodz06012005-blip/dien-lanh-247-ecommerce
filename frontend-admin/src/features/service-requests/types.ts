export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
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
  images?: string[];
  preferredDate: string;
  preferredTimeSlot: string;
  note?: string;
  status: 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedTechnicianId?: string | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimatedPrice?: number;
  inspectionNote?: string;
  customerApprovalStatus?: 'not_requested' | 'pending' | 'approved' | 'rejected';
  customerApprovedAt?: string | null;
  finalPrice?: number;
  paymentStatus?: 'unpaid' | 'paid';
  createdAt: string;
  updatedAt: string;
  technician?: {
    id: string;
    name: string;
    phone: string;
    avatar?: string;
    rating?: number;
    skills?: string[];
  } | null;
  statusHistory?: {
    status: string;
    note: string;
    updatedBy: string;
    createdAt: string;
  }[];
  activityLog?: { action: string; label: string; actor: string; detail?: string; createdAt: string }[];
}

export type ServiceRequestWithKey = ServiceRequest & { key: string };
