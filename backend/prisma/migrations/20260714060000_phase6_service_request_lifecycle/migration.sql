-- Phase 6: complete service-request lifecycle, normalized history, audit and media.
-- Additive migration: existing ServiceRequest rows and legacy columns remain available.

ALTER TABLE `ServiceRequest`
  ADD COLUMN `customerEmail` VARCHAR(191) NULL,
  ADD COLUMN `workflowStatus` VARCHAR(32) NOT NULL DEFAULT 'NEW',
  ADD COLUMN `requestVersion` INT NOT NULL DEFAULT 1,
  ADD COLUMN `source` VARCHAR(32) NOT NULL DEFAULT 'WEB',
  ADD COLUMN `scheduledAt` DATETIME(3) NULL,
  ADD COLUMN `confirmedAt` DATETIME(3) NULL,
  ADD COLUMN `assignedAt` DATETIME(3) NULL,
  ADD COLUMN `startedAt` DATETIME(3) NULL,
  ADD COLUMN `completedAt` DATETIME(3) NULL,
  ADD COLUMN `warrantyStartedAt` DATETIME(3) NULL,
  ADD COLUMN `closedAt` DATETIME(3) NULL,
  ADD COLUMN `lastStatusChangedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `lookupLastFour` VARCHAR(4) NULL;

UPDATE `ServiceRequest`
SET
  `workflowStatus` = CASE `status`
    WHEN 'pending' THEN 'NEW'
    WHEN 'confirmed' THEN 'CONFIRMED'
    WHEN 'assigned' THEN 'ASSIGNED'
    WHEN 'completed' THEN 'COMPLETED'
    WHEN 'cancelled' THEN 'CANCELLED'
    ELSE 'NEW'
  END,
  `lookupLastFour` = RIGHT(REGEXP_REPLACE(`customerPhone`, '[^0-9]', ''), 4),
  `confirmedAt` = CASE WHEN `status` IN ('confirmed', 'assigned', 'completed') THEN `updatedAt` ELSE NULL END,
  `assignedAt` = CASE WHEN `status` IN ('assigned', 'completed') THEN `updatedAt` ELSE NULL END,
  `completedAt` = CASE WHEN `status` = 'completed' THEN `updatedAt` ELSE NULL END,
  `lastStatusChangedAt` = `updatedAt`;

CREATE INDEX `ServiceRequest_workflowStatus_createdAt_idx`
  ON `ServiceRequest` (`workflowStatus`, `createdAt`);
CREATE INDEX `ServiceRequest_priority_workflowStatus_idx`
  ON `ServiceRequest` (`priority`, `workflowStatus`);
CREATE INDEX `ServiceRequest_customerPhone_id_idx`
  ON `ServiceRequest` (`customerPhone`, `id`);
CREATE INDEX `ServiceRequest_preferredDate_workflowStatus_idx`
  ON `ServiceRequest` (`preferredDate`, `workflowStatus`);
CREATE INDEX `ServiceRequest_lastStatusChangedAt_idx`
  ON `ServiceRequest` (`lastStatusChangedAt`);

CREATE TABLE `ServiceRequestStatusEvent` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `requestId` VARCHAR(191) NOT NULL,
  `fromStatus` VARCHAR(32) NULL,
  `toStatus` VARCHAR(32) NOT NULL,
  `note` TEXT NULL,
  `actorType` VARCHAR(32) NOT NULL,
  `actorId` VARCHAR(191) NULL,
  `actorName` VARCHAR(191) NULL,
  `metadata` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `ServiceRequestStatusEvent_requestId_createdAt_idx` (`requestId`, `createdAt`),
  INDEX `ServiceRequestStatusEvent_toStatus_createdAt_idx` (`toStatus`, `createdAt`),
  CONSTRAINT `ServiceRequestStatusEvent_requestId_fkey`
    FOREIGN KEY (`requestId`) REFERENCES `ServiceRequest` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ServiceRequestMedia` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `requestId` VARCHAR(191) NOT NULL,
  `stage` VARCHAR(32) NOT NULL,
  `url` VARCHAR(1024) NOT NULL,
  `publicId` VARCHAR(255) NULL,
  `mimeType` VARCHAR(120) NOT NULL,
  `sizeBytes` INT NULL,
  `width` INT NULL,
  `height` INT NULL,
  `caption` VARCHAR(500) NULL,
  `uploadedByType` VARCHAR(32) NOT NULL,
  `uploadedById` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `ServiceRequestMedia_requestId_stage_createdAt_idx` (`requestId`, `stage`, `createdAt`),
  INDEX `ServiceRequestMedia_publicId_idx` (`publicId`),
  CONSTRAINT `ServiceRequestMedia_requestId_fkey`
    FOREIGN KEY (`requestId`) REFERENCES `ServiceRequest` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ServiceRequestAudit` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `requestId` VARCHAR(191) NOT NULL,
  `action` VARCHAR(80) NOT NULL,
  `actorType` VARCHAR(32) NOT NULL,
  `actorId` VARCHAR(191) NULL,
  `actorName` VARCHAR(191) NULL,
  `ipHash` VARCHAR(64) NULL,
  `userAgent` VARCHAR(500) NULL,
  `metadata` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `ServiceRequestAudit_requestId_createdAt_idx` (`requestId`, `createdAt`),
  INDEX `ServiceRequestAudit_action_createdAt_idx` (`action`, `createdAt`),
  CONSTRAINT `ServiceRequestAudit_requestId_fkey`
    FOREIGN KEY (`requestId`) REFERENCES `ServiceRequest` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `ServiceRequestStatusEvent`
  (`requestId`, `fromStatus`, `toStatus`, `note`, `actorType`, `actorName`, `metadata`, `createdAt`)
SELECT
  `id`,
  NULL,
  `workflowStatus`,
  'Khởi tạo lịch sử chuẩn hóa từ dữ liệu trước Giai đoạn 6',
  'SYSTEM',
  'Phase 6 migration',
  JSON_OBJECT('legacyStatus', `status`),
  `createdAt`
FROM `ServiceRequest`;

INSERT INTO `ServiceRequestAudit`
  (`requestId`, `action`, `actorType`, `actorName`, `metadata`, `createdAt`)
SELECT
  `id`,
  'PHASE6_MIGRATED',
  'SYSTEM',
  'Phase 6 migration',
  JSON_OBJECT('workflowStatus', `workflowStatus`),
  CURRENT_TIMESTAMP(3)
FROM `ServiceRequest`;
