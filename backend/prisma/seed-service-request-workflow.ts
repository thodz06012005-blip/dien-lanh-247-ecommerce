import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Synchronizing Phase 6 service-request workflow data...');

  await prisma.$executeRawUnsafe(`
    UPDATE ServiceRequest
    SET
      workflowStatus = CASE status
        WHEN 'pending' THEN 'NEW'
        WHEN 'confirmed' THEN 'CONFIRMED'
        WHEN 'assigned' THEN 'ASSIGNED'
        WHEN 'completed' THEN 'COMPLETED'
        WHEN 'cancelled' THEN 'CANCELLED'
        ELSE workflowStatus
      END,
      lookupLastFour = RIGHT(REGEXP_REPLACE(customerPhone, '[^0-9]', ''), 4),
      confirmedAt = CASE
        WHEN status IN ('confirmed', 'assigned', 'completed') THEN COALESCE(confirmedAt, updatedAt)
        ELSE confirmedAt
      END,
      assignedAt = CASE
        WHEN status IN ('assigned', 'completed') THEN COALESCE(assignedAt, updatedAt)
        ELSE assignedAt
      END,
      completedAt = CASE
        WHEN status = 'completed' THEN COALESCE(completedAt, updatedAt)
        ELSE completedAt
      END,
      lastStatusChangedAt = COALESCE(lastStatusChangedAt, updatedAt)
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO ServiceRequestStatusEvent
      (requestId, fromStatus, toStatus, note, actorType, actorName, metadata, createdAt)
    SELECT
      request.id,
      NULL,
      request.workflowStatus,
      'Khởi tạo lịch sử trạng thái cho dữ liệu mẫu',
      'SYSTEM',
      'Phase 6 seed',
      JSON_OBJECT('legacyStatus', request.status),
      request.createdAt
    FROM ServiceRequest request
    WHERE NOT EXISTS (
      SELECT 1
      FROM ServiceRequestStatusEvent event
      WHERE event.requestId = request.id
    )
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO ServiceRequestAudit
      (requestId, action, actorType, actorName, metadata, createdAt)
    SELECT
      request.id,
      'WORKFLOW_SEEDED',
      'SYSTEM',
      'Phase 6 seed',
      JSON_OBJECT('workflowStatus', request.workflowStatus),
      CURRENT_TIMESTAMP(3)
    FROM ServiceRequest request
    WHERE NOT EXISTS (
      SELECT 1
      FROM ServiceRequestAudit audit
      WHERE audit.requestId = request.id
        AND audit.action = 'WORKFLOW_SEEDED'
    )
  `);

  console.log('Phase 6 service-request workflow seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
