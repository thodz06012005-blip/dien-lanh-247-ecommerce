-- Phase 9: Editorial CMS
-- Additive migration only. Existing Phase 1-8 tables and public contracts remain intact.

ALTER TABLE `Service`
  ADD COLUMN `socialImageMediaId` INT NULL,
  ADD COLUMN `updatedById` INT NULL,
  ADD COLUMN `publishedById` INT NULL,
  ADD COLUMN `deletedAt` DATETIME(3) NULL,
  ADD COLUMN `version` INT NOT NULL DEFAULT 1,
  ADD INDEX `Service_deletedAt_status_publishedAt_idx` (`deletedAt`, `status`, `publishedAt`),
  ADD CONSTRAINT `Service_socialImageMediaId_fkey` FOREIGN KEY (`socialImageMediaId`) REFERENCES `Media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Service_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Service_publishedById_fkey` FOREIGN KEY (`publishedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Project`
  ADD COLUMN `socialImageMediaId` INT NULL,
  ADD COLUMN `updatedById` INT NULL,
  ADD COLUMN `publishedById` INT NULL,
  ADD COLUMN `deletedAt` DATETIME(3) NULL,
  ADD COLUMN `version` INT NOT NULL DEFAULT 1,
  ADD INDEX `Project_deletedAt_status_publishedAt_idx` (`deletedAt`, `status`, `publishedAt`),
  ADD CONSTRAINT `Project_socialImageMediaId_fkey` FOREIGN KEY (`socialImageMediaId`) REFERENCES `Media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Project_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Project_publishedById_fkey` FOREIGN KEY (`publishedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Post`
  ADD COLUMN `socialImageMediaId` INT NULL,
  ADD COLUMN `updatedById` INT NULL,
  ADD COLUMN `publishedById` INT NULL,
  ADD COLUMN `deletedAt` DATETIME(3) NULL,
  ADD COLUMN `version` INT NOT NULL DEFAULT 1,
  ADD INDEX `Post_deletedAt_status_publishedAt_idx` (`deletedAt`, `status`, `publishedAt`),
  ADD CONSTRAINT `Post_socialImageMediaId_fkey` FOREIGN KEY (`socialImageMediaId`) REFERENCES `Media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Post_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Post_publishedById_fkey` FOREIGN KEY (`publishedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `ServiceCategory`
  ADD COLUMN `socialImageMediaId` INT NULL,
  ADD COLUMN `updatedById` INT NULL,
  ADD COLUMN `deletedAt` DATETIME(3) NULL,
  ADD COLUMN `version` INT NOT NULL DEFAULT 1,
  ADD INDEX `ServiceCategory_deletedAt_active_idx` (`deletedAt`, `isActive`),
  ADD CONSTRAINT `ServiceCategory_socialImageMediaId_fkey` FOREIGN KEY (`socialImageMediaId`) REFERENCES `Media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ServiceCategory_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Category`
  ADD COLUMN `socialImageMediaId` INT NULL,
  ADD COLUMN `updatedById` INT NULL,
  ADD COLUMN `deletedAt` DATETIME(3) NULL,
  ADD COLUMN `version` INT NOT NULL DEFAULT 1,
  ADD INDEX `Category_deletedAt_type_active_idx` (`deletedAt`, `categoryType`, `isActive`),
  ADD CONSTRAINT `Category_socialImageMediaId_fkey` FOREIGN KEY (`socialImageMediaId`) REFERENCES `Media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Category_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Tag`
  ADD COLUMN `updatedById` INT NULL,
  ADD COLUMN `deletedAt` DATETIME(3) NULL,
  ADD COLUMN `version` INT NOT NULL DEFAULT 1,
  ADD INDEX `Tag_deletedAt_active_idx` (`deletedAt`, `isActive`),
  ADD CONSTRAINT `Tag_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Media`
  ADD COLUMN `updatedById` INT NULL,
  ADD COLUMN `deletedAt` DATETIME(3) NULL,
  ADD COLUMN `version` INT NOT NULL DEFAULT 1,
  ADD INDEX `Media_deletedAt_active_idx` (`deletedAt`, `isActive`),
  ADD CONSTRAINT `Media_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `AuthorProfile` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `displayName` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NULL,
  `bio` TEXT NULL,
  `avatarMediaId` INT NULL,
  `socialLinks` JSON NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `updatedById` INT NULL,
  `deletedAt` DATETIME(3) NULL,
  `version` INT NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `AuthorProfile_userId_key` (`userId`),
  INDEX `AuthorProfile_active_deleted_idx` (`isActive`, `deletedAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `AuthorProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `AuthorProfile_avatarMediaId_fkey` FOREIGN KEY (`avatarMediaId`) REFERENCES `Media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `AuthorProfile_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Banner` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `eyebrow` VARCHAR(191) NULL,
  `title` VARCHAR(255) NOT NULL,
  `subtitle` TEXT NULL,
  `ctaLabel` VARCHAR(120) NULL,
  `ctaUrl` VARCHAR(500) NULL,
  `secondaryCtaLabel` VARCHAR(120) NULL,
  `secondaryCtaUrl` VARCHAR(500) NULL,
  `placement` VARCHAR(80) NOT NULL DEFAULT 'HOME_HERO',
  `theme` VARCHAR(40) NOT NULL DEFAULT 'DARK',
  `desktopMediaId` INT NULL,
  `mobileMediaId` INT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `publishedAt` DATETIME(3) NULL,
  `startsAt` DATETIME(3) NULL,
  `endsAt` DATETIME(3) NULL,
  `updatedById` INT NULL,
  `publishedById` INT NULL,
  `deletedAt` DATETIME(3) NULL,
  `version` INT NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `Banner_public_idx` (`placement`, `status`, `isActive`, `publishedAt`, `startsAt`, `endsAt`, `deletedAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `Banner_desktopMediaId_fkey` FOREIGN KEY (`desktopMediaId`) REFERENCES `Media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Banner_mobileMediaId_fkey` FOREIGN KEY (`mobileMediaId`) REFERENCES `Media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Banner_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Banner_publishedById_fkey` FOREIGN KEY (`publishedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Partner` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `websiteUrl` VARCHAR(500) NULL,
  `logoMediaId` INT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  `isFeatured` BOOLEAN NOT NULL DEFAULT FALSE,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `publishedAt` DATETIME(3) NULL,
  `updatedById` INT NULL,
  `publishedById` INT NULL,
  `deletedAt` DATETIME(3) NULL,
  `version` INT NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `Partner_public_idx` (`status`, `isActive`, `isFeatured`, `publishedAt`, `deletedAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `Partner_logoMediaId_fkey` FOREIGN KEY (`logoMediaId`) REFERENCES `Media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Partner_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Partner_publishedById_fkey` FOREIGN KEY (`publishedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Testimonial` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `customerName` VARCHAR(191) NOT NULL,
  `customerTitle` VARCHAR(191) NULL,
  `company` VARCHAR(191) NULL,
  `quote` TEXT NOT NULL,
  `rating` INT NOT NULL DEFAULT 5,
  `avatarMediaId` INT NULL,
  `serviceId` INT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  `isFeatured` BOOLEAN NOT NULL DEFAULT FALSE,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `publishedAt` DATETIME(3) NULL,
  `updatedById` INT NULL,
  `publishedById` INT NULL,
  `deletedAt` DATETIME(3) NULL,
  `version` INT NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `Testimonial_public_idx` (`status`, `isActive`, `isFeatured`, `publishedAt`, `deletedAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `Testimonial_avatarMediaId_fkey` FOREIGN KEY (`avatarMediaId`) REFERENCES `Media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Testimonial_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Testimonial_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Testimonial_publishedById_fkey` FOREIGN KEY (`publishedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SiteSection` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sectionKey` VARCHAR(120) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `eyebrow` VARCHAR(191) NULL,
  `title` VARCHAR(255) NULL,
  `content` LONGTEXT NULL,
  `config` JSON NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `publishedAt` DATETIME(3) NULL,
  `seoTitle` VARCHAR(255) NULL,
  `seoDescription` VARCHAR(500) NULL,
  `canonicalUrl` VARCHAR(500) NULL,
  `socialImageMediaId` INT NULL,
  `updatedById` INT NULL,
  `publishedById` INT NULL,
  `deletedAt` DATETIME(3) NULL,
  `version` INT NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `SiteSection_sectionKey_key` (`sectionKey`),
  INDEX `SiteSection_public_idx` (`status`, `isActive`, `publishedAt`, `deletedAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `SiteSection_socialImageMediaId_fkey` FOREIGN KEY (`socialImageMediaId`) REFERENCES `Media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `SiteSection_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `SiteSection_publishedById_fkey` FOREIGN KEY (`publishedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ContentRevision` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `entityType` VARCHAR(80) NOT NULL,
  `entityId` VARCHAR(191) NOT NULL,
  `action` VARCHAR(40) NOT NULL,
  `version` INT NOT NULL,
  `summary` VARCHAR(500) NULL,
  `snapshot` JSON NULL,
  `actorId` INT NULL,
  `actorName` VARCHAR(191) NULL,
  `actorEmail` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ContentRevision_entity_idx` (`entityType`, `entityId`, `createdAt`),
  INDEX `ContentRevision_actor_idx` (`actorId`, `createdAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `ContentRevision_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
