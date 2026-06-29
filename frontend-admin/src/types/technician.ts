export interface Technician {
  key?: string;
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  rating: number;
  skills: string[]; // e.g. ['sua-dieu-hoa', 've-sinh-dieu-hoa']
  workingAreas: string[]; // e.g. ['Cầu Giấy', 'Đống Đa']
  status: 'available' | 'busy' | 'offline' | 'inactive';
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
