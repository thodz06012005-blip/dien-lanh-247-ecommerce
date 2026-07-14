-- Phase 5: managed service, project, editorial and media content.
-- This migration is additive and keeps the existing product and service-request tables intact.

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

-- Editorial categories are separated by categoryType while retaining the existing Category model/table.
INSERT IGNORE INTO `Category` (`name`, `slug`, `description`, `categoryType`, `isActive`, `sortOrder`, `createdAt`, `updatedAt`)
VALUES
  ('Kiến thức điều hòa', 'kien-thuc-dieu-hoa', 'Hướng dẫn sử dụng, bảo trì và tiết kiệm điện cho điều hòa.', 'POST', TRUE, 10, NOW(3), NOW(3)),
  ('Kinh nghiệm sửa chữa', 'kinh-nghiem-sua-chua', 'Nội dung chẩn đoán và phòng tránh lỗi thiết bị điện lạnh.', 'POST', TRUE, 20, NOW(3), NOW(3)),
  ('Tin dự án', 'tin-du-an', 'Câu chuyện triển khai và tiêu chuẩn kỹ thuật tại công trình.', 'POST', TRUE, 30, NOW(3), NOW(3));

INSERT IGNORE INTO `Tag` (`name`, `slug`, `description`, `isActive`, `createdAt`, `updatedAt`)
VALUES
  ('Điều hòa', 'dieu-hoa', 'Nội dung liên quan điều hòa.', TRUE, NOW(3), NOW(3)),
  ('Tiết kiệm điện', 'tiet-kiem-dien', 'Giải pháp vận hành tiết kiệm năng lượng.', TRUE, NOW(3), NOW(3)),
  ('Bảo trì', 'bao-tri', 'Kiến thức bảo trì định kỳ.', TRUE, NOW(3), NOW(3));

INSERT IGNORE INTO `Media` (`id`, `name`, `url`, `altText`, `mimeType`, `width`, `height`, `provider`, `publicId`, `folder`, `isActive`, `createdAt`, `updatedAt`)
VALUES
  (5001, 'Kỹ thuật viên kiểm tra điều hòa', 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=1200&q=80', 'Kỹ thuật viên kiểm tra hệ thống điều hòa', 'image/jpeg', 1200, 800, 'unsplash', 'phase5-service-aircon', 'phase5', TRUE, NOW(3), NOW(3)),
  (5002, 'Vệ sinh dàn lạnh', 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=80', 'Kỹ thuật viên vệ sinh thiết bị điện lạnh', 'image/jpeg', 1200, 800, 'unsplash', 'phase5-service-cleaning', 'phase5', TRUE, NOW(3), NOW(3)),
  (5003, 'Dự án văn phòng', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80', 'Hệ thống điều hòa tại văn phòng hiện đại', 'image/jpeg', 1400, 900, 'unsplash', 'phase5-project-office', 'phase5', TRUE, NOW(3), NOW(3)),
  (5004, 'Bài viết tiết kiệm điện', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=1200&q=80', 'Giải pháp tiết kiệm năng lượng', 'image/jpeg', 1200, 800, 'unsplash', 'phase5-post-energy', 'phase5', TRUE, NOW(3), NOW(3));

INSERT IGNORE INTO `Service` (`title`, `slug`, `excerpt`, `content`, `pricing`, `process`, `warranty`, `faq`, `relatedServiceSlugs`, `status`, `isFeatured`, `sortOrder`, `publishedAt`, `seoTitle`, `seoDescription`, `serviceCategoryId`, `coverMediaId`, `createdAt`, `updatedAt`)
VALUES
  ('Sửa chữa điều hòa tại nhà', 'sua-chua-dieu-hoa-tai-nha', 'Chẩn đoán và khắc phục điều hòa không lạnh, rò nước, mất nguồn hoặc báo lỗi.', '<p>Kỹ thuật viên kiểm tra nguồn điện, gas, cảm biến, bo mạch và hệ thống thoát nước trước khi báo giá.</p><p>Khách hàng chỉ xác nhận sửa chữa sau khi đã hiểu nguyên nhân và chi phí dự kiến.</p>', JSON_ARRAY(JSON_OBJECT('label','Kiểm tra và vệ sinh cơ bản','price','Từ 250.000đ'), JSON_OBJECT('label','Xử lý rò nước','price','Từ 300.000đ'), JSON_OBJECT('label','Sửa bo mạch','price','Báo giá sau kiểm tra')), JSON_ARRAY('Tiếp nhận thông tin','Xác nhận lịch hẹn','Chẩn đoán và báo giá','Sửa chữa và chạy thử','Bàn giao bảo hành'), 'Bảo hành 3-12 tháng theo hạng mục và linh kiện thay thế.', JSON_ARRAY(JSON_OBJECT('question','Bao lâu kỹ thuật viên có mặt?','answer','Thông thường 30-60 phút tại khu vực nội thành, tùy thời điểm và khoảng cách.'), JSON_OBJECT('question','Có báo giá trước không?','answer','Có. Kỹ thuật viên chỉ thực hiện sau khi khách hàng xác nhận chi phí.')), JSON_ARRAY('ve-sinh-dieu-hoa-chuyen-sau','bao-tri-dieu-hoa-doanh-nghiep'), 'PUBLISHED', TRUE, 10, NOW(3), 'Sửa điều hòa tại nhà - Điện Lạnh 247', 'Sửa điều hòa minh bạch, báo giá trước và bảo hành rõ ràng.', 'sua-dieu-hoa', 5001, NOW(3), NOW(3)),
  ('Vệ sinh điều hòa chuyên sâu', 've-sinh-dieu-hoa-chuyen-sau', 'Vệ sinh dàn nóng, dàn lạnh, máng nước và kiểm tra thông số vận hành.', '<p>Quy trình sử dụng bơm áp lực phù hợp, che chắn khu vực thi công và đo lại nhiệt độ sau vệ sinh.</p>', JSON_ARRAY(JSON_OBJECT('label','Máy treo tường','price','Từ 150.000đ'), JSON_OBJECT('label','Máy âm trần','price','Từ 450.000đ')), JSON_ARRAY('Khảo sát thiết bị','Che chắn khu vực','Vệ sinh chuyên sâu','Kiểm tra dòng và nhiệt độ','Bàn giao'), 'Bảo hành vệ sinh và thoát nước 30 ngày.', JSON_ARRAY(JSON_OBJECT('question','Bao lâu nên vệ sinh một lần?','answer','Gia đình nên vệ sinh 4-6 tháng/lần; môi trường kinh doanh nên kiểm tra 2-3 tháng/lần.')), JSON_ARRAY('sua-chua-dieu-hoa-tai-nha'), 'PUBLISHED', TRUE, 20, NOW(3), 'Vệ sinh điều hòa chuyên sâu', 'Vệ sinh điều hòa sạch sâu, kiểm tra vận hành và đường thoát nước.', 've-sinh-dieu-hoa', 5002, NOW(3), NOW(3));

INSERT IGNORE INTO `Project` (`title`, `slug`, `excerpt`, `clientName`, `location`, `startedAt`, `completedAt`, `tasks`, `content`, `result`, `status`, `isFeatured`, `sortOrder`, `publishedAt`, `seoTitle`, `seoDescription`, `coverMediaId`, `createdAt`, `updatedAt`)
VALUES
  ('Bảo trì hệ thống điều hòa văn phòng 1.200m²', 'bao-tri-he-thong-dieu-hoa-van-phong-1200m2', 'Kiểm tra, vệ sinh và cân chỉnh hệ thống điều hòa cho văn phòng vận hành liên tục.', 'Khách hàng doanh nghiệp mẫu', 'Cầu Giấy, Hà Nội', DATE_SUB(NOW(3), INTERVAL 14 DAY), DATE_SUB(NOW(3), INTERVAL 10 DAY), JSON_ARRAY('Khảo sát tải lạnh','Vệ sinh 28 dàn lạnh','Kiểm tra tủ điện và đường gas','Đo nhiệt độ từng khu vực'), '<p>Đội dự án chia thành ba nhóm để thi công ngoài giờ, hạn chế ảnh hưởng hoạt động văn phòng.</p><p>Mỗi thiết bị được gắn mã kiểm tra và ghi nhận thông số trước/sau bảo trì.</p>', 'Nhiệt độ ổn định hơn, giảm tiếng ồn và phát hiện sớm hai vị trí rò nước cần xử lý.', 'PUBLISHED', TRUE, 10, NOW(3), 'Dự án bảo trì điều hòa văn phòng', 'Quy trình bảo trì hệ thống điều hòa văn phòng 1.200m².', 5003, NOW(3), NOW(3));

INSERT IGNORE INTO `ProjectMedia` (`projectId`, `mediaId`, `sortOrder`, `caption`)
SELECT p.`id`, 5003, 10, 'Không gian văn phòng sau khi hoàn tất bảo trì'
FROM `Project` p WHERE p.`slug` = 'bao-tri-he-thong-dieu-hoa-van-phong-1200m2';

INSERT IGNORE INTO `Post` (`title`, `slug`, `excerpt`, `content`, `status`, `isFeatured`, `publishedAt`, `seoTitle`, `seoDescription`, `canonicalUrl`, `categoryId`, `authorId`, `coverMediaId`, `createdAt`, `updatedAt`)
SELECT '5 cách sử dụng điều hòa tiết kiệm điện nhưng vẫn thoải mái', '5-cach-su-dung-dieu-hoa-tiet-kiem-dien', 'Các nguyên tắc cài nhiệt độ, vệ sinh và bố trí phòng giúp giảm điện năng tiêu thụ.', '<p>Nên đặt nhiệt độ chênh lệch vừa phải so với môi trường bên ngoài, đóng kín cửa và vệ sinh lưới lọc định kỳ.</p><h2>Ưu tiên vận hành ổn định</h2><p>Không bật tắt liên tục trong thời gian ngắn. Kết hợp quạt giúp luồng khí phân bố đều hơn.</p><h2>Kiểm tra định kỳ</h2><p>Dàn nóng bẩn, thiếu gas hoặc cảm biến sai có thể làm máy chạy lâu và tốn điện.</p>', 'PUBLISHED', TRUE, NOW(3), '5 cách dùng điều hòa tiết kiệm điện', 'Hướng dẫn sử dụng điều hòa tiết kiệm điện và duy trì sự thoải mái.', NULL, c.`id`, u.`id`, 5004, NOW(3), NOW(3)
FROM `Category` c
JOIN `User` u ON u.`role` IN ('ADMIN','SUPERADMIN')
WHERE c.`slug` = 'kien-thuc-dieu-hoa'
ORDER BY u.`id` ASC
LIMIT 1;

INSERT IGNORE INTO `PostTag` (`postId`, `tagId`)
SELECT p.`id`, t.`id`
FROM `Post` p
JOIN `Tag` t ON t.`slug` IN ('dieu-hoa','tiet-kiem-dien')
WHERE p.`slug` = '5-cach-su-dung-dieu-hoa-tiet-kiem-dien';
