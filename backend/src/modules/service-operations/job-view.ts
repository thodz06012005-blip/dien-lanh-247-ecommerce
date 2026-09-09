import { Prisma } from '@prisma/client';
export const technicianSelect = { id: true, name: true, phone: true, avatar: true, rating: true, skills: true, workingAreas: true, status: true, completedCount: true } satisfies Prisma.TechnicianSelect;
export const jobInclude = { serviceCategory: true, assignedTechnician: { select: technicianSelect } } satisfies Prisma.ServiceRequestInclude;
type Job = Prisma.ServiceRequestGetPayload<{ include: typeof jobInclude }>;
export function jobView(job: Job) {
  const technician = job.assignedTechnician ? { ...job.assignedTechnician, rating: Number(job.assignedTechnician.rating) } : null;
  return { ...job, estimatedPrice: Number(job.estimatedPrice), finalPrice: Number(job.finalPrice), partsCost: Number(job.partsCost), amountCollected: Number(job.amountCollected), technician, assignedTechnician: technician };
}
export function publicJobView(job: Job) {
  const value = jobView(job);
  return {
    id: value.id, customerName: value.customerName, customerPhone: value.customerPhone,
    customerAddress: value.customerAddress, district: value.district, applianceType: value.applianceType,
    serviceCategoryId: value.serviceCategoryId, issueDescription: value.issueDescription,
    preferredDate: value.preferredDate, preferredTimeSlot: value.preferredTimeSlot,
    status: value.status, estimatedPrice: value.estimatedPrice, finalPrice: value.finalPrice,
    customerApprovalStatus: value.customerApprovalStatus, paymentStatus: value.paymentStatus,
    createdAt: value.createdAt, updatedAt: value.updatedAt,
    technician: value.technician ? { id: value.technician.id, name: value.technician.name, rating: value.technician.rating, avatar: value.technician.avatar } : null,
    statusHistory: value.statusHistory, images: value.images || [], note: value.note || '', assignedTechnicianId: value.assignedTechnicianId,
  };
}
export const jsonValue = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
export const normalizePhone = (phone: string) => phone.replace(/[\s.-]/g, '').replace(/^\+84/, '0');
