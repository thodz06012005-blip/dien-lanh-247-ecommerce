-- Phase 10: operations dispatch, SLA, quotation, payment, completion and warranty.
-- Additive migration: no table or column from Phase 1-9 is removed or renamed.

CREATE TABLE `CustomerDevice` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `userId` INT NULL,
  `serviceRequestId` VARCHAR(191) NULL,
  `customerName` VARCHAR(191) NOT NULL,
  `customerPhone` VARCHAR(32) NOT NULL,
  `customerEmail` VARCHAR(191) NULL,
  `label` VARCHAR(120) NULL,
  `applianceType` VARCHAR(191) NOT NULL,
  `brand` VARCHAR(191) NULL,
  `model` VARCHAR(191) NULL,
  `serialNumber` VARCHAR(191) NULL,
  `installationAddress` VARCHAR(500) NULL,
  `district` VARCHAR(191) NULL,
  `installedAt` DATE NULL,
  `warrantyUntil` DATE NULL,
  `metadata` JSON NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `CustomerDevice_userId_idx` (`userId`),
  INDEX `CustomerDevice_phone_idx` (`customerPhone`),
  INDEX `CustomerDevice_serial_idx` (`serialNumber`),
  INDEX `CustomerDevice_request_idx` (`serviceRequestId`),
  CONSTRAINT `CustomerDevice_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `CustomerDevice_requestId_fkey` FOREIGN KEY (`serviceRequestId`) REFERENCES `ServiceRequest` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `TechnicianSchedule` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `technicianId` VARCHAR(191) NOT NULL,
  `requestId` VARCHAR(191) NULL,
  `scheduleType` VARCHAR(32) NOT NULL DEFAULT 'WORK',
  `status` VARCHAR(32) NOT NULL DEFAULT 'CONFIRMED',
  `startAt` DATETIME(3) NOT NULL,
  `endAt` DATETIME(3) NOT NULL,
  `note` TEXT NULL,
  `createdById` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `TechnicianSchedule_technician_time_idx` (`technicianId`, `startAt`, `endAt`),
  INDEX `TechnicianSchedule_request_idx` (`requestId`),
  INDEX `TechnicianSchedule_status_time_idx` (`status`, `startAt`),
  CONSTRAINT `TechnicianSchedule_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `Technician` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `TechnicianSchedule_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `ServiceRequest` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `TechnicianSchedule_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `TechnicianSchedule_time_check` CHECK (`endAt` > `startAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SlaPolicy` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `serviceCategoryId` VARCHAR(191) NULL,
  `priority` VARCHAR(32) NOT NULL,
  `responseMinutes` INT NOT NULL,
  `assignMinutes` INT NOT NULL,
  `arrivalMinutes` INT NOT NULL,
  `resolutionMinutes` INT NOT NULL,
  `warrantyResponseMinutes` INT NOT NULL DEFAULT 240,
  `businessHoursOnly` BOOLEAN NOT NULL DEFAULT FALSE,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `SlaPolicy_service_priority_key` (`serviceCategoryId`, `priority`),
  INDEX `SlaPolicy_active_idx` (`isActive`),
  CONSTRAINT `SlaPolicy_serviceCategoryId_fkey` FOREIGN KEY (`serviceCategoryId`) REFERENCES `ServiceCategory` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ServiceRequestSla` (
  `requestId` VARCHAR(191) NOT NULL,
  `policyId` BIGINT NULL,
  `responseDueAt` DATETIME(3) NULL,
  `assignDueAt` DATETIME(3) NULL,
  `arrivalDueAt` DATETIME(3) NULL,
  `resolutionDueAt` DATETIME(3) NULL,
  `firstRespondedAt` DATETIME(3) NULL,
  `assignedWithinSlaAt` DATETIME(3) NULL,
  `arrivedAt` DATETIME(3) NULL,
  `resolvedAt` DATETIME(3) NULL,
  `pausedAt` DATETIME(3) NULL,
  `totalPausedMinutes` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  `breachStage` VARCHAR(32) NULL,
  `breachedAt` DATETIME(3) NULL,
  `lastEvaluatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`requestId`),
  INDEX `ServiceRequestSla_policy_idx` (`policyId`),
  INDEX `ServiceRequestSla_status_resolution_idx` (`status`, `resolutionDueAt`),
  INDEX `ServiceRequestSla_breach_idx` (`breachStage`, `breachedAt`),
  CONSTRAINT `ServiceRequestSla_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `ServiceRequest` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ServiceRequestSla_policyId_fkey` FOREIGN KEY (`policyId`) REFERENCES `SlaPolicy` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `DispatchAssignment` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `requestId` VARCHAR(191) NOT NULL,
  `technicianId` VARCHAR(191) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  `scheduledStart` DATETIME(3) NOT NULL,
  `scheduledEnd` DATETIME(3) NOT NULL,
  `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `endedAt` DATETIME(3) NULL,
  `reason` VARCHAR(500) NULL,
  `createdById` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `DispatchAssignment_request_status_idx` (`requestId`, `status`),
  INDEX `DispatchAssignment_technician_time_idx` (`technicianId`, `scheduledStart`, `scheduledEnd`),
  CONSTRAINT `DispatchAssignment_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `ServiceRequest` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `DispatchAssignment_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `Technician` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `DispatchAssignment_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `DispatchAssignment_time_check` CHECK (`scheduledEnd` > `scheduledStart`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ServiceRequestInternalNote` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `requestId` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `visibility` VARCHAR(32) NOT NULL DEFAULT 'INTERNAL',
  `authorId` INT NULL,
  `authorName` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `ServiceRequestInternalNote_request_created_idx` (`requestId`, `createdAt`),
  CONSTRAINT `ServiceRequestInternalNote_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `ServiceRequest` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ServiceRequestInternalNote_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ServiceQuote` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `quoteNumber` VARCHAR(64) NOT NULL,
  `requestId` VARCHAR(191) NOT NULL,
  `version` INT NOT NULL DEFAULT 1,
  `status` VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
  `laborSubtotal` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `materialSubtotal` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `discountType` VARCHAR(24) NOT NULL DEFAULT 'FIXED',
  `discountValue` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `discountAmount` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `taxRate` DECIMAL(6,3) NOT NULL DEFAULT 0,
  `taxAmount` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `totalAmount` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `notes` TEXT NULL,
  `validUntil` DATETIME(3) NULL,
  `confirmationTokenHash` VARCHAR(64) NULL,
  `sentAt` DATETIME(3) NULL,
  `customerConfirmedAt` DATETIME(3) NULL,
  `customerRejectedAt` DATETIME(3) NULL,
  `createdById` INT NULL,
  `updatedById` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ServiceQuote_quoteNumber_key` (`quoteNumber`),
  INDEX `ServiceQuote_request_status_idx` (`requestId`, `status`),
  INDEX `ServiceQuote_token_idx` (`confirmationTokenHash`),
  CONSTRAINT `ServiceQuote_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `ServiceRequest` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ServiceQuote_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ServiceQuote_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ServiceQuoteLine` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `quoteId` BIGINT NOT NULL,
  `lineType` VARCHAR(24) NOT NULL,
  `description` VARCHAR(500) NOT NULL,
  `sku` VARCHAR(120) NULL,
  `quantity` DECIMAL(12,3) NOT NULL DEFAULT 1,
  `unit` VARCHAR(32) NOT NULL DEFAULT 'lần',
  `unitPrice` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `lineTotal` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `sortOrder` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `ServiceQuoteLine_quote_sort_idx` (`quoteId`, `sortOrder`),
  CONSTRAINT `ServiceQuoteLine_quoteId_fkey` FOREIGN KEY (`quoteId`) REFERENCES `ServiceQuote` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ServicePaymentRecord` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `paymentNumber` VARCHAR(64) NOT NULL,
  `requestId` VARCHAR(191) NOT NULL,
  `quoteId` BIGINT NULL,
  `method` VARCHAR(32) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
  `amount` DECIMAL(12,2) NOT NULL,
  `transactionReference` VARCHAR(191) NULL,
  `note` VARCHAR(500) NULL,
  `receivedById` INT NULL,
  `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ServicePaymentRecord_number_key` (`paymentNumber`),
  INDEX `ServicePaymentRecord_request_paid_idx` (`requestId`, `paidAt`),
  CONSTRAINT `ServicePaymentRecord_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `ServiceRequest` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ServicePaymentRecord_quoteId_fkey` FOREIGN KEY (`quoteId`) REFERENCES `ServiceQuote` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ServicePaymentRecord_receivedById_fkey` FOREIGN KEY (`receivedById`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CompletionReport` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `reportNumber` VARCHAR(64) NOT NULL,
  `requestId` VARCHAR(191) NOT NULL,
  `technicianId` VARCHAR(191) NULL,
  `diagnosis` TEXT NOT NULL,
  `workPerformed` TEXT NOT NULL,
  `materialsUsed` JSON NULL,
  `recommendations` TEXT NULL,
  `customerName` VARCHAR(191) NULL,
  `customerConfirmedAt` DATETIME(3) NULL,
  `customerSignatureUrl` VARCHAR(1024) NULL,
  `technicianSignatureUrl` VARCHAR(1024) NULL,
  `completedAt` DATETIME(3) NOT NULL,
  `createdById` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `CompletionReport_number_key` (`reportNumber`),
  UNIQUE INDEX `CompletionReport_request_key` (`requestId`),
  CONSTRAINT `CompletionReport_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `ServiceRequest` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CompletionReport_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `Technician` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `CompletionReport_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `WarrantyRecord` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `warrantyNumber` VARCHAR(64) NOT NULL,
  `requestId` VARCHAR(191) NOT NULL,
  `completionReportId` BIGINT NULL,
  `deviceId` BIGINT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  `coverage` TEXT NOT NULL,
  `exclusions` TEXT NULL,
  `startsAt` DATETIME(3) NOT NULL,
  `endsAt` DATETIME(3) NOT NULL,
  `closedAt` DATETIME(3) NULL,
  `createdById` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `WarrantyRecord_number_key` (`warrantyNumber`),
  INDEX `WarrantyRecord_request_status_idx` (`requestId`, `status`),
  INDEX `WarrantyRecord_endsAt_idx` (`endsAt`),
  CONSTRAINT `WarrantyRecord_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `ServiceRequest` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `WarrantyRecord_completionReportId_fkey` FOREIGN KEY (`completionReportId`) REFERENCES `CompletionReport` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `WarrantyRecord_deviceId_fkey` FOREIGN KEY (`deviceId`) REFERENCES `CustomerDevice` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `WarrantyRecord_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `WarrantyRecord_period_check` CHECK (`endsAt` > `startsAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `WarrantyEvent` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `warrantyId` BIGINT NOT NULL,
  `requestId` VARCHAR(191) NULL,
  `eventType` VARCHAR(32) NOT NULL,
  `status` VARCHAR(32) NOT NULL,
  `description` TEXT NOT NULL,
  `resolution` TEXT NULL,
  `handledById` INT NULL,
  `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `WarrantyEvent_warranty_time_idx` (`warrantyId`, `occurredAt`),
  CONSTRAINT `WarrantyEvent_warrantyId_fkey` FOREIGN KEY (`warrantyId`) REFERENCES `WarrantyRecord` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `WarrantyEvent_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `ServiceRequest` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `WarrantyEvent_handledById_fkey` FOREIGN KEY (`handledById`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `SlaPolicy`
  (`serviceCategoryId`, `priority`, `responseMinutes`, `assignMinutes`, `arrivalMinutes`, `resolutionMinutes`, `warrantyResponseMinutes`)
VALUES
  (NULL, 'low', 120, 240, 480, 2880, 480),
  (NULL, 'medium', 60, 120, 240, 1440, 240),
  (NULL, 'high', 30, 60, 120, 720, 120),
  (NULL, 'urgent', 15, 30, 60, 360, 60);

INSERT INTO `ServiceRequestSla`
  (`requestId`, `policyId`, `responseDueAt`, `assignDueAt`, `arrivalDueAt`, `resolutionDueAt`, `status`)
SELECT
  r.`id`,
  p.`id`,
  DATE_ADD(r.`createdAt`, INTERVAL p.`responseMinutes` MINUTE),
  DATE_ADD(r.`createdAt`, INTERVAL p.`assignMinutes` MINUTE),
  DATE_ADD(r.`createdAt`, INTERVAL p.`arrivalMinutes` MINUTE),
  DATE_ADD(r.`createdAt`, INTERVAL p.`resolutionMinutes` MINUTE),
  CASE WHEN r.`workflowStatus` IN ('COMPLETED','CLOSED','CANCELLED','REJECTED') THEN 'STOPPED' ELSE 'ACTIVE' END
FROM `ServiceRequest` r
JOIN `SlaPolicy` p ON p.`serviceCategoryId` IS NULL AND p.`priority` = r.`priority`;
