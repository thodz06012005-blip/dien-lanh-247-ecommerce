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
  preferredDate: string;
  preferredTimeSlot: string;
  note: string;
  status: 'pending' | 'confirmed' | 'assigned' | 'cancelled' | 'completed';
  assignedTechnicianId: string | null;
  technician?: PublicTechnician | null;
  estimatedPrice: number;
  finalPrice: number;
  paymentStatus: 'unpaid' | 'paid';
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}
