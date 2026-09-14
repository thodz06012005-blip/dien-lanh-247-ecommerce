ALTER TABLE `ServiceRequest` ADD COLUMN `userId` INTEGER NULL;
CREATE INDEX `ServiceRequest_userId_createdAt_idx` ON `ServiceRequest`(`userId`, `createdAt`);
ALTER TABLE `ServiceRequest` ADD CONSTRAINT `ServiceRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `ServiceLookupGrant` (
  `id` VARCHAR(191) NOT NULL,
  `serviceRequestId` VARCHAR(191) NOT NULL,
  `tokenHash` VARCHAR(191) NULL,
  `otpHash` VARCHAR(191) NOT NULL,
  `attempts` INTEGER NOT NULL DEFAULT 0,
  `expiresAt` DATETIME(3) NOT NULL,
  `usedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `ServiceLookupGrant_tokenHash_key`(`tokenHash`),
  INDEX `ServiceLookupGrant_serviceRequestId_expiresAt_idx`(`serviceRequestId`, `expiresAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `ServiceLookupGrant_serviceRequestId_fkey` FOREIGN KEY (`serviceRequestId`) REFERENCES `ServiceRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
