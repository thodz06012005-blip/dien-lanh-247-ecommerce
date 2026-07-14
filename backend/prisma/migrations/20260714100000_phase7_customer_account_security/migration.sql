-- Phase 7: customer account, secure sessions, password recovery and ownership.
-- Additive migration: no legacy column or table is removed.
-- Deployment invariant: Phase 1–6 data remains readable during staged application rollout.

ALTER TABLE `User`
  ADD COLUMN `normalizedPhone` VARCHAR(32) NULL,
  ADD COLUMN `emailVerifiedAt` DATETIME(3) NULL,
  ADD COLUMN `phoneVerifiedAt` DATETIME(3) NULL,
  ADD COLUMN `tokenVersion` INT NOT NULL DEFAULT 0,
  ADD COLUMN `passwordChangedAt` DATETIME(3) NULL,
  ADD COLUMN `lastLoginAt` DATETIME(3) NULL,
  ADD COLUMN `lockedAt` DATETIME(3) NULL;

UPDATE `User`
SET `normalizedPhone` = CASE
  WHEN `phone` IS NULL OR TRIM(`phone`) = '' THEN NULL
  WHEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(`phone`), ' ', ''), '-', ''), '.', ''), '(', ''), ')', '') LIKE '84%'
    THEN CONCAT('0', SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(`phone`), ' ', ''), '-', ''), '.', ''), '(', ''), ')', ''), 3))
  ELSE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(`phone`), ' ', ''), '-', ''), '.', ''), '(', ''), ')', '')
END;

CREATE INDEX `User_normalizedPhone_idx` ON `User`(`normalizedPhone`);
CREATE INDEX `User_isActive_lockedAt_idx` ON `User`(`isActive`, `lockedAt`);

ALTER TABLE `Address`
  ADD COLUMN `label` VARCHAR(80) NOT NULL DEFAULT 'Địa chỉ',
  ADD COLUMN `note` VARCHAR(500) NULL,
  ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

ALTER TABLE `ServiceRequest`
  ADD COLUMN `customerUserId` INT NULL;

CREATE INDEX `ServiceRequest_customerUserId_createdAt_idx`
  ON `ServiceRequest`(`customerUserId`, `createdAt`);

ALTER TABLE `ServiceRequest`
  ADD CONSTRAINT `ServiceRequest_customerUserId_fkey`
  FOREIGN KEY (`customerUserId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `AuthSession` (
  `id` VARCHAR(64) NOT NULL,
  `userId` INT NOT NULL,
  `familyId` VARCHAR(64) NOT NULL,
  `refreshTokenHash` VARCHAR(255) NOT NULL,
  `userAgent` VARCHAR(500) NULL,
  `ipHash` VARCHAR(64) NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `lastUsedAt` DATETIME(3) NULL,
  `rotatedAt` DATETIME(3) NULL,
  `revokedAt` DATETIME(3) NULL,
  `revokeReason` VARCHAR(120) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `AuthSession_userId_revokedAt_idx` (`userId`, `revokedAt`),
  INDEX `AuthSession_familyId_idx` (`familyId`),
  INDEX `AuthSession_expiresAt_idx` (`expiresAt`),
  CONSTRAINT `AuthSession_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PasswordResetToken` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `tokenHash` VARCHAR(64) NOT NULL,
  `requestedIpHash` VARCHAR(64) NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `usedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `PasswordResetToken_tokenHash_key` (`tokenHash`),
  INDEX `PasswordResetToken_userId_createdAt_idx` (`userId`, `createdAt`),
  INDEX `PasswordResetToken_expiresAt_idx` (`expiresAt`),
  CONSTRAINT `PasswordResetToken_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `EmailVerificationToken` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `tokenHash` VARCHAR(64) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `usedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `EmailVerificationToken_tokenHash_key` (`tokenHash`),
  INDEX `EmailVerificationToken_userId_createdAt_idx` (`userId`, `createdAt`),
  CONSTRAINT `EmailVerificationToken_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CustomerNotification` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `type` VARCHAR(60) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `body` TEXT NOT NULL,
  `data` JSON NULL,
  `readAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `CustomerNotification_userId_readAt_createdAt_idx` (`userId`, `readAt`, `createdAt`),
  CONSTRAINT `CustomerNotification_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ServiceRequestReview` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `requestId` VARCHAR(191) NOT NULL,
  `userId` INT NOT NULL,
  `rating` TINYINT UNSIGNED NOT NULL,
  `comment` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ServiceRequestReview_requestId_key` (`requestId`),
  INDEX `ServiceRequestReview_userId_createdAt_idx` (`userId`, `createdAt`),
  CONSTRAINT `ServiceRequestReview_requestId_fkey`
    FOREIGN KEY (`requestId`) REFERENCES `ServiceRequest`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ServiceRequestReview_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ServiceRequestReview_rating_check` CHECK (`rating` BETWEEN 1 AND 5)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Link requests only when an account already has a verified contact.
UPDATE `ServiceRequest` sr
INNER JOIN `User` u
  ON (
    (u.`emailVerifiedAt` IS NOT NULL AND sr.`customerEmail` = u.`email`)
    OR
    (u.`phoneVerifiedAt` IS NOT NULL AND sr.`customerPhone` = u.`normalizedPhone`)
  )
SET sr.`customerUserId` = u.`id`
WHERE sr.`customerUserId` IS NULL;