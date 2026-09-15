ALTER TABLE `ServicePayment` RENAME TO `ServicePaymentEntry`;
ALTER TABLE `ServicePaymentEntry` DROP FOREIGN KEY `ServicePayment_serviceRequestId_fkey`;
DROP INDEX `ServicePayment_serviceRequestId_receivedAt_idx` ON `ServicePaymentEntry`;
ALTER TABLE `ServicePaymentEntry`
  ADD COLUMN `type` ENUM('collection','refund','adjustment') NOT NULL DEFAULT 'collection',
  ADD COLUMN `idempotencyKey` VARCHAR(191) NULL;
UPDATE `ServicePaymentEntry` SET `idempotencyKey` = CONCAT('legacy-', `id`) WHERE `idempotencyKey` IS NULL;
ALTER TABLE `ServicePaymentEntry` MODIFY `idempotencyKey` VARCHAR(191) NOT NULL;
CREATE UNIQUE INDEX `ServicePaymentEntry_idempotencyKey_key` ON `ServicePaymentEntry`(`idempotencyKey`);
CREATE INDEX `ServicePaymentEntry_serviceRequestId_receivedAt_idx` ON `ServicePaymentEntry`(`serviceRequestId`, `receivedAt`);
ALTER TABLE `ServicePaymentEntry` ADD CONSTRAINT `ServicePaymentEntry_serviceRequestId_fkey` FOREIGN KEY (`serviceRequestId`) REFERENCES `ServiceRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ServiceRequest` ADD COLUMN `completedAt` DATETIME(3) NULL;
CREATE TABLE `ServiceFinanceSnapshot` (
  `id` VARCHAR(191) NOT NULL,
  `serviceRequestId` VARCHAR(191) NOT NULL,
  `approvedQuoteId` VARCHAR(191) NOT NULL,
  `approvedVersion` INTEGER NOT NULL,
  `revenue` DECIMAL(12,2) NOT NULL,
  `partsCost` DECIMAL(12,2) NOT NULL,
  `technicianPay` DECIMAL(12,2) NOT NULL,
  `policySnapshot` JSON NOT NULL,
  `completedAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `ServiceFinanceSnapshot_serviceRequestId_key`(`serviceRequestId`),
  INDEX `ServiceFinanceSnapshot_completedAt_idx`(`completedAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `ServiceFinanceSnapshot_serviceRequestId_fkey` FOREIGN KEY (`serviceRequestId`) REFERENCES `ServiceRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
