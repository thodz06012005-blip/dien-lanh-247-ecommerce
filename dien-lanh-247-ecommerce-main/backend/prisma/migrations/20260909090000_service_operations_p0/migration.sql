-- AlterTable
ALTER TABLE `Technician` ADD COLUMN `pinHash` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ServiceRequest` ADD COLUMN `acceptedAt` DATETIME(3) NULL,
    ADD COLUMN `activityLog` JSON NULL,
    ADD COLUMN `amountCollected` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `businessConfigSnapshot` JSON NULL,
    ADD COLUMN `completedAt` DATETIME(3) NULL,
    ADD COLUMN `completionNote` TEXT NULL,
    ADD COLUMN `completionPhotos` JSON NULL,
    ADD COLUMN `customerApprovalStatus` VARCHAR(191) NOT NULL DEFAULT 'not_requested',
    ADD COLUMN `customerApprovedAt` DATETIME(3) NULL,
    ADD COLUMN `financeNote` TEXT NULL,
    ADD COLUMN `financeSnapshot` JSON NULL,
    ADD COLUMN `inspectionNote` TEXT NULL,
    ADD COLUMN `mediaMetadata` JSON NULL,
    ADD COLUMN `paidAt` DATETIME(3) NULL,
    ADD COLUMN `partsCost` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `technicianDecision` VARCHAR(191) NULL,
    ADD COLUMN `technicianSettledAt` DATETIME(3) NULL,
    ADD COLUMN `technicianSettlementStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    MODIFY `status` ENUM('in_progress', 'pending', 'confirmed', 'assigned', 'completed', 'cancelled') NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE `SystemSetting` ADD COLUMN `businessConfig` JSON NULL;

-- CreateTable
CREATE TABLE `TechnicianSession` (
    `tokenHash` CHAR(64) NOT NULL,
    `technicianId` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TechnicianSession_technicianId_idx`(`technicianId`),
    INDEX `TechnicianSession_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`tokenHash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinanceAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NOT NULL,
    `actorName` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `before` JSON NULL,
    `after` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FinanceAuditLog_createdAt_idx`(`createdAt`),
    INDEX `FinanceAuditLog_requestId_idx`(`requestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TechnicianSession` ADD CONSTRAINT `TechnicianSession_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `Technician`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinanceAuditLog` ADD CONSTRAINT `FinanceAuditLog_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `ServiceRequest`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Preserve a stable legacy completion date before later edits change updatedAt.
-- Historical rows without an explicit completion date use their pre-migration updatedAt.
UPDATE `ServiceRequest` SET `completedAt` = `updatedAt` WHERE `status` = 'completed' AND `completedAt` IS NULL;
