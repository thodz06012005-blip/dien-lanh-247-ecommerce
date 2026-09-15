-- Align the existing STAFF application role with databases built from migrations.
ALTER TABLE `User` MODIFY `role` ENUM('CUSTOMER', 'STAFF', 'ADMIN', 'SUPERADMIN') NOT NULL DEFAULT 'CUSTOMER';
