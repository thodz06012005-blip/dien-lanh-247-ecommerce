-- Phase 5: managed service, project, editorial and media content.
-- Additive migration only: seed data is executed after the core database seed.

CREATE TABLE `Media` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `url` VARCHAR(1024) NOT NULL,
  `altText` VARCHAR(500) NULL,
  `mimeType` VARCHAR(120) NOT NULL DEFAULT 'image/jpeg',
  `width` INT NULL,
  `height` INT NULL,
  `sizeBytes` INT NULL,
  `provider` VARCHAR(80) NULL,
  `publicId` VARCHAR(255) NULL,
  `folder` VARCHAR(255) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `uploadedById` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `Media_isActive_createdAt_idx` (`isActive`, `createdAt`),
  INDEX `Media_uploadedById_idx` (`uploadedById`),
  CONSTRAINT `Media_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Category`
  ADD COLUMN `categoryType` VARCHAR(20) NOT NULL DEFAULT 'PRODUCT',
  ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN `sortOrder` INT NOT NULL DEFAULT 0,
  ADD COLUMN `seoTitle` VARCHAR(255) NULL,
  ADD COLUMN `seoDescription` VARCHAR(500) NULL;

CREATE INDEX `Category_categoryType_isActive_sortOrder_idx`
  ON `Category` (`categoryType`, `isActive`, `sortOrder`);

ALTER TABLE `ServiceCategory`
  ADD COLUMN `summary` VARCHAR(500) NULL,
  ADD COLUMN `coverMediaId` INT NULL,
  ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN `isFeatured` BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN `sortOrder` INT NOT NULL DEFAULT 0,
  ADD COLUMN `seoTitle` VARCHAR(255) NULL,
  ADD COLUMN `seoDescription` VARCHAR(500) NULL,
  ADD INDEX `ServiceCategory_active_featured_sort_idx` (`isActive`, `isFeatured`, `sortOrder`),
  ADD CONSTRAINT `ServiceCategory_coverMediaId_fkey` FOREIGN KEY (`coverMediaId`) REFERENCES `Media` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `Service` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `excerpt` VARCHAR(500) NULL,
  `content` LONGTEXT NULL,
  `pricing` JSON NULL,
  `process` JSON NULL,
  `warranty` TEXT NULL,
  `faq` JSON NULL,
  `relatedServiceSlugs` JSON NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  `isFeatured` BOOLEAN NOT NULL DEFAULT FALSE,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `publishedAt` DATETIME(3) NULL,
  `seoTitle` VARCHAR(255) NULL,
  `seoDescription` VARCHAR(500) NULL,
  `serviceCategoryId` VARCHAR(191) NOT NULL,
  `coverMediaId` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Service_slug_key` (`slug`),
  INDEX `Service_status_publishedAt_idx` (`status`, `publishedAt`),
  INDEX `Service_category_featured_sort_idx` (`serviceCategoryId`, `isFeatured`, `sortOrder`),
  CONSTRAINT `Service_serviceCategoryId_fkey` FOREIGN KEY (`serviceCategoryId`) REFERENCES `ServiceCategory` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Service_coverMediaId_fkey` FOREIGN KEY (`coverMediaId`) REFERENCES `Media` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Project` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `excerpt` VARCHAR(500) NULL,
  `clientName` VARCHAR(191) NULL,
  `location` VARCHAR(255) NULL,
  `startedAt` DATETIME(3) NULL,
  `completedAt` DATETIME(3) NULL,
  `tasks` JSON NULL,
  `content` LONGTEXT NULL,
  `result` TEXT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  `isFeatured` BOOLEAN NOT NULL DEFAULT FALSE,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `publishedAt` DATETIME(3) NULL,
  `seoTitle` VARCHAR(255) NULL,
  `seoDescription` VARCHAR(500) NULL,
  `coverMediaId` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Project_slug_key` (`slug`),
  INDEX `Project_status_featured_published_idx` (`status`, `isFeatured`, `publishedAt`),
  CONSTRAINT `Project_coverMediaId_fkey` FOREIGN KEY (`coverMediaId`) REFERENCES `Media` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProjectMedia` (
  `projectId` INT NOT NULL,
  `mediaId` INT NOT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `caption` VARCHAR(500) NULL,
  PRIMARY KEY (`projectId`, `mediaId`),
  INDEX `ProjectMedia_mediaId_idx` (`mediaId`),
  CONSTRAINT `ProjectMedia_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ProjectMedia_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `Media` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Tag` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `description` VARCHAR(500) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Tag_slug_key` (`slug`),
  INDEX `Tag_isActive_name_idx` (`isActive`, `name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Post` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `excerpt` VARCHAR(500) NULL,
  `content` LONGTEXT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  `isFeatured` BOOLEAN NOT NULL DEFAULT FALSE,
  `publishedAt` DATETIME(3) NULL,
  `seoTitle` VARCHAR(255) NULL,
  `seoDescription` VARCHAR(500) NULL,
  `canonicalUrl` VARCHAR(1024) NULL,
  `categoryId` INT NOT NULL,
  `authorId` INT NOT NULL,
  `coverMediaId` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Post_slug_key` (`slug`),
  INDEX `Post_status_publishedAt_idx` (`status`, `publishedAt`),
  INDEX `Post_category_featured_idx` (`categoryId`, `isFeatured`),
  INDEX `Post_authorId_idx` (`authorId`),
  CONSTRAINT `Post_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Post_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Post_coverMediaId_fkey` FOREIGN KEY (`coverMediaId`) REFERENCES `Media` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PostTag` (
  `postId` INT NOT NULL,
  `tagId` INT NOT NULL,
  PRIMARY KEY (`postId`, `tagId`),
  INDEX `PostTag_tagId_idx` (`tagId`),
  CONSTRAINT `PostTag_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PostTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
