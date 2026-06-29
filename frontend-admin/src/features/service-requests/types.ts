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
  status: 'pending' | 'confirmed' | 'assigned' | 'completed' | 'cancelled';
  assignedTechnicianId?: string | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimatedPrice?: number;
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
}

export type ServiceRequestWithKey = ServiceRequest & { key: string };
