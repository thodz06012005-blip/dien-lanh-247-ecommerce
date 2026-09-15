export interface Technician {
  key?: string;
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  rating: number;
  skills: string[]; // e.g. ['sua-dieu-hoa', 've-sinh-dieu-hoa']
  workingAreaIds: string[];
  accountStatus: 'active' | 'inactive';
  presence: 'on_shift' | 'offline';
  busy: boolean;
  operationalStatus: 'available' | 'busy' | 'offline' | 'inactive';
  completedCount: number;
  todayJobs?: number;
  currentJob?: {
    id: string;
    customerName: string;
    district: string;
    preferredTimeSlot: string;
    preferredDate: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
}
