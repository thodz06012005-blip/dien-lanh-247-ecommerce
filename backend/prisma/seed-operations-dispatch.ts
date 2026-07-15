import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    INSERT INTO ServiceRequestSla
      (requestId, policyId, responseDueAt, assignDueAt, arrivalDueAt, resolutionDueAt, status)
    SELECT
      r.id,
      p.id,
      DATE_ADD(r.createdAt, INTERVAL p.responseMinutes MINUTE),
      DATE_ADD(r.createdAt, INTERVAL p.assignMinutes MINUTE),
      DATE_ADD(r.createdAt, INTERVAL p.arrivalMinutes MINUTE),
      DATE_ADD(r.createdAt, INTERVAL p.resolutionMinutes MINUTE),
      CASE WHEN r.workflowStatus IN ('COMPLETED','CLOSED','CANCELLED','REJECTED') THEN 'STOPPED' ELSE 'ACTIVE' END
    FROM ServiceRequest r
    JOIN SlaPolicy p ON p.serviceCategoryId IS NULL AND p.priority = r.priority
    LEFT JOIN ServiceRequestSla s ON s.requestId = r.id
    WHERE s.requestId IS NULL
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO CustomerDevice
      (userId, serviceRequestId, customerName, customerPhone, customerEmail, label, applianceType, installationAddress, district, metadata, isActive)
    SELECT
      r.customerUserId,
      r.id,
      r.customerName,
      r.customerPhone,
      r.customerEmail,
      CONCAT('Thiết bị từ ', r.id),
      r.applianceType,
      r.customerAddress,
      r.district,
      JSON_OBJECT('seededFromRequest', TRUE),
      TRUE
    FROM ServiceRequest r
    LEFT JOIN CustomerDevice d ON d.serviceRequestId = r.id
    WHERE d.id IS NULL
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO DispatchAssignment
      (requestId, technicianId, status, scheduledStart, scheduledEnd, reason, createdAt)
    SELECT
      r.id,
      r.assignedTechnicianId,
      CASE WHEN r.workflowStatus IN ('COMPLETED','CLOSED','CANCELLED','REJECTED') THEN 'COMPLETED' ELSE 'ACTIVE' END,
      COALESCE(r.scheduledAt, STR_TO_DATE(CONCAT(r.preferredDate, ' 08:00:00'), '%Y-%m-%d %H:%i:%s')),
      DATE_ADD(COALESCE(r.scheduledAt, STR_TO_DATE(CONCAT(r.preferredDate, ' 08:00:00'), '%Y-%m-%d %H:%i:%s')), INTERVAL 2 HOUR),
      'Đồng bộ phân công từ dữ liệu trước Giai đoạn 10',
      r.createdAt
    FROM ServiceRequest r
    LEFT JOIN DispatchAssignment a ON a.requestId = r.id
    WHERE r.assignedTechnicianId IS NOT NULL AND a.id IS NULL
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO TechnicianSchedule
      (technicianId, requestId, scheduleType, status, startAt, endAt, note, createdAt)
    SELECT
      a.technicianId,
      a.requestId,
      'WORK',
      CASE WHEN a.status='ACTIVE' THEN 'CONFIRMED' ELSE 'COMPLETED' END,
      a.scheduledStart,
      a.scheduledEnd,
      'Đồng bộ lịch từ phân công Giai đoạn 10',
      a.createdAt
    FROM DispatchAssignment a
    LEFT JOIN TechnicianSchedule s ON s.requestId=a.requestId AND s.technicianId=a.technicianId
    WHERE s.id IS NULL
  `);

  console.log('Phase 10 operations seed completed');
}

main()
  .catch((error) => {
    console.error('Phase 10 operations seed failed', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
