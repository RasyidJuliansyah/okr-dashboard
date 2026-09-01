-- ============================================================
-- MIGRATION: Cascading Assignment + Sprint Correlation + Notification
-- Tanggal: 2026-09-01
-- ============================================================

-- 1. Initiative: field assignment (if not already added)
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Initiative' AND COLUMN_NAME = 'assignedLeaderId');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `Initiative` ADD COLUMN `assignedLeaderId` VARCHAR(191) NULL AFTER `ownerId`, ADD COLUMN `assignedBy` VARCHAR(191) NULL AFTER `assignedLeaderId`, ADD COLUMN `finishDate` DATETIME(3) NULL AFTER `dueDate`;', 'SELECT "assignedLeaderId already exists";');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Task: field assignment + sprint (if not already added)
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Task' AND COLUMN_NAME = 'assignedTeamMemberId');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `Task` ADD COLUMN `assignedTeamMemberId` VARCHAR(191) NULL AFTER `unit`, ADD COLUMN `assignedBy` VARCHAR(191) NULL AFTER `assignedTeamMemberId`, ADD COLUMN `sprintMonth` VARCHAR(191) NULL AFTER `assignedBy`, ADD COLUMN `startDate` DATETIME(3) NULL AFTER `sprintMonth`, ADD COLUMN `finishDate` DATETIME(3) NULL AFTER `startDate`;', 'SELECT "assignedTeamMemberId already exists";');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Tabel Notification (baru)
CREATE TABLE IF NOT EXISTS `Notification` (
  `id`          VARCHAR(191) NOT NULL,
  `recipientId` VARCHAR(191) NOT NULL,
  `type`        VARCHAR(100) NOT NULL,
  `title`       VARCHAR(255) NOT NULL,
  `body`        TEXT         NOT NULL,
  `link`        VARCHAR(500) NULL,
  `isRead`      TINYINT(1)   NOT NULL DEFAULT 0,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `Notification_recipientId_isRead_idx` (`recipientId`, `isRead`),
  INDEX `Notification_recipientId_createdAt_idx` (`recipientId`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Index performa
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Initiative' AND INDEX_NAME = 'Initiative_assignedLeaderId_idx');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `Initiative` ADD INDEX `Initiative_assignedLeaderId_idx` (`assignedLeaderId`);', 'SELECT "Index Initiative_assignedLeaderId_idx exists";');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Task' AND INDEX_NAME = 'Task_assignedTeamMemberId_idx');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `Task` ADD INDEX `Task_assignedTeamMemberId_idx` (`assignedTeamMemberId`), ADD INDEX `Task_sprintMonth_idx` (`sprintMonth`);', 'SELECT "Index Task_assignedTeamMemberId_idx exists";');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. BACKFILL: set assignedLeaderId dari ownerId jika user.role = 'LEADER'
UPDATE `Initiative` i
  INNER JOIN `User` u ON u.id = i.ownerId AND u.role = 'LEADER'
  SET i.assignedLeaderId = i.ownerId
  WHERE i.assignedLeaderId IS NULL;

