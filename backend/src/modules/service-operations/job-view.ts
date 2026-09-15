type RequestRecord = Record<string, any>;
import { paymentSummary } from '../../domain/finance';

const numberValue = (value: unknown) => Number(value || 0);
const technician = (value: RequestRecord | null | undefined, includePhone = false) => value ? {
  id: value.id,
  name: value.name,
  ...(includePhone ? { phone: value.phone } : {}),
  avatar: value.avatar,
  rating: numberValue(value.rating),
  skills: value.skills,
} : null;

const publicCore = (row: RequestRecord) => {
  const summary = paymentSummary(numberValue(row.finalPrice), row.paymentEntries || []);
  return ({
  id: row.id,
  serviceCategoryId: row.serviceCategoryId,
  applianceType: row.applianceType,
  issueDescription: row.issueDescription,
  preferredDate: row.preferredDate,
  preferredTimeSlot: row.preferredTimeSlot,
  district: row.district,
  status: row.status,
  estimatedPrice: numberValue(row.estimatedPrice),
  finalPrice: numberValue(row.finalPrice),
  paymentStatus: summary.status,
  paymentSummary: summary,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  });
};

export const toCustomerDetail = (row: RequestRecord) => ({
  ...publicCore(row),
  customerName: row.customerName,
  customerPhone: row.customerPhone,
  customerAddress: row.customerAddress,
  note: row.note,
  images: row.images || [],
  statusHistory: row.statusHistory || [],
  technician: technician(row.assignedTechnician, true),
});

export const toGuestLookupDetail = (row: RequestRecord) => ({
  ...publicCore(row),
  technician: technician(row.assignedTechnician),
  quote: row.quotes?.[0] ? { id: row.quotes[0].id, version: row.quotes[0].version, diagnosis: row.quotes[0].diagnosis, labor: numberValue(row.quotes[0].labor), parts: numberValue(row.quotes[0].parts), travel: numberValue(row.quotes[0].travel), other: numberValue(row.quotes[0].other), total: numberValue(row.quotes[0].total), status: row.quotes[0].status, validUntil: row.quotes[0].validUntil } : null,
});

export const toAdminList = (row: RequestRecord) => ({
  ...publicCore(row), customerName: row.customerName, customerPhone: row.customerPhone,
  customerAddress: row.customerAddress, priority: row.priority,
  assignedTechnicianId: row.assignedTechnicianId, technician: technician(row.assignedTechnician, true),
});

export const toAdminDetail = (row: RequestRecord) => ({
  ...toAdminList(row), note: row.note, images: row.images || [], mediaMetadata: row.mediaMetadata || [],
  inspectionNote: row.inspectionNote, customerApprovalStatus: row.customerApprovalStatus,
  customerApprovedAt: row.customerApprovedAt, statusHistory: row.statusHistory || [], activityLog: row.activityLog || [],
});

export const toTechnicianJob = (row: RequestRecord) => ({
  ...publicCore(row), customerName: row.customerName, customerPhone: row.customerPhone,
  customerAddress: row.customerAddress, note: row.note,
});
