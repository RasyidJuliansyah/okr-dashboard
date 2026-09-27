-- ====================================================================
-- SKOLLA BSC & OKR SUITE - DELTA PRODUCTION MIGRATION
-- Deployment: 27 September 2026
-- Lingkungan: Production MySQL 8.0+
-- Fitur     :
--   1. Soft-delete column (`is_active`) on tables
--   2. C-Board Strategic Sponsorship (`c_level_id`) on `department`
--   3. Auto-create Team for orphan Departments & User `team_id` linking
--   4. Role sync for C-Level executives
-- Petunjuk  : Buka DBeaver / MySQL CLI -> Run Script (Alt+X)
-- Aman & Idempotent (bisa dijalankan berulang kali).
-- ====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Pastikan kolom is_active ada pada tabel-tabel utama
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'is_active');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `user` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `position`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'team' AND COLUMN_NAME = 'is_active');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `team` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `department`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'department' AND COLUMN_NAME = 'is_active');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `department` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `value`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'objective' AND COLUMN_NAME = 'is_active');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `objective` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'annual_key_result' AND COLUMN_NAME = 'is_active');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `annual_key_result` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;


SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'key_result' AND COLUMN_NAME = 'is_active');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `key_result` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'initiative' AND COLUMN_NAME = 'is_active');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `initiative` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND COLUMN_NAME = 'is_active');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'causal_link' AND COLUMN_NAME = 'is_active');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `causal_link` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kpi' AND COLUMN_NAME = 'is_active');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `kpi` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sprint' AND COLUMN_NAME = 'is_active');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `sprint` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. C-Board Strategic Sponsorship (c_level_id) pada department
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'department' AND COLUMN_NAME = 'c_level_id');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `department` ADD COLUMN `c_level_id` VARCHAR(191) NULL AFTER `manager_id`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'department' AND CONSTRAINT_NAME = 'Department_cLevelId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `department` ADD CONSTRAINT `Department_cLevelId_fkey` FOREIGN KEY (`c_level_id`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Sinkronisasi role C_LEVEL untuk akun C-Board
UPDATE `user`
SET `role` = 'C_LEVEL'
WHERE `email` IN ('devlin@skolla.education', 'akbar@skolla.education', 'yazid@skolla.education');

-- 4. Auto-backfill Team untuk setiap Department yang belum punya record di team
UPDATE `team` SET `department` = 'B2B_CORPORATE' WHERE `department` = 'B2B_CORPORATION';

INSERT INTO `team` (`id`, `name`, `manager_id`, `leader_id`, `department`, `is_active`)
SELECT
  UUID(),
  d.`name`,
  d.`manager_id`,
  NULL,
  d.`value`,
  1
FROM `department` d
WHERE NOT EXISTS (
  SELECT 1 FROM `team` t WHERE t.`department` = d.`value`
);

-- 5. Sinkronisasi team_id pegawai yang sudah punya department tapi team_id masih NULL
UPDATE `user` u
INNER JOIN `team` t ON t.`department` = u.`department`
SET u.`team_id` = t.`id`
WHERE u.`team_id` IS NULL AND u.`department` IS NOT NULL;

-- 6. Backfill default data NULL
UPDATE `department` SET `is_active` = 1 WHERE `is_active` IS NULL;
UPDATE `user` SET `is_active` = 1 WHERE `is_active` IS NULL;
UPDATE `team` SET `is_active` = 1 WHERE `is_active` IS NULL;

SET FOREIGN_KEY_CHECKS = 1;
