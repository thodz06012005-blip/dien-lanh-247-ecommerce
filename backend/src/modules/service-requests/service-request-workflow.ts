export const SERVICE_REQUEST_STATUSES = [
  'NEW',
  'CONFIRMED',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_PARTS',
  'COMPLETED',
  'WARRANTY',
  'CLOSED',
  'CANCELLED',
  'REJECTED',
  'RESCHEDULED',
] as const;

export type ServiceRequestWorkflowStatus = (typeof SERVICE_REQUEST_STATUSES)[number];

export const SERVICE_REQUEST_MEDIA_STAGES = [
  'CUSTOMER_BEFORE',
  'BEFORE',
  'DIAGNOSTIC',
  'AFTER',
  'WARRANTY',
] as const;

export type ServiceRequestMediaStage = (typeof SERVICE_REQUEST_MEDIA_STAGES)[number];

export const SERVICE_REQUEST_TRANSITIONS: Record<ServiceRequestWorkflowStatus, ServiceRequestWorkflowStatus[]> = {
  NEW: ['CONFIRMED', 'RESCHEDULED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['ASSIGNED', 'RESCHEDULED', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'RESCHEDULED', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_PARTS', 'COMPLETED', 'CANCELLED'],
  WAITING_PARTS: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETED: ['WARRANTY', 'CLOSED'],
  WARRANTY: ['IN_PROGRESS', 'CLOSED'],
  RESCHEDULED: ['CONFIRMED', 'CANCELLED'],
  CLOSED: [],
  CANCELLED: [],
  REJECTED: [],
};

export function isWorkflowStatus(value: string): value is ServiceRequestWorkflowStatus {
  return SERVICE_REQUEST_STATUSES.includes(value as ServiceRequestWorkflowStatus);
}

export function assertTransitionAllowed(
  currentStatus: ServiceRequestWorkflowStatus,
  nextStatus: ServiceRequestWorkflowStatus,
): boolean {
  return currentStatus === nextStatus || SERVICE_REQUEST_TRANSITIONS[currentStatus].includes(nextStatus);
}

export function mapWorkflowToLegacyStatus(status: ServiceRequestWorkflowStatus) {
  if (status === 'NEW') return 'pending' as const;
  if (status === 'CONFIRMED' || status === 'RESCHEDULED') return 'confirmed' as const;
  if (
    status === 'ASSIGNED' ||
    status === 'IN_PROGRESS' ||
    status === 'WAITING_PARTS' ||
    status === 'WARRANTY'
  ) {
    return 'assigned' as const;
  }
  if (status === 'COMPLETED' || status === 'CLOSED') return 'completed' as const;
  return 'cancelled' as const;
}

export const TERMINAL_SERVICE_REQUEST_STATUSES: ServiceRequestWorkflowStatus[] = [
  'CLOSED',
  'CANCELLED',
  'REJECTED',
];
