-- ====================================================================
-- SKOLLA BSC & OKR SUITE - PRODUCTION MIGRATION DELTA
-- Rilis       : Relasi Foreign Key Department - Team - User
-- Tanggal     : 30 September 2026
-- Database    : MySQL 8.0+ (`skolla_okr`)
-- Petunjuk    : Buka DBeaver -> Hubungkan ke skolla_okr -> Run Script (Alt+X)
-- Sifat Script: Idempotent (Aman dijalankan berulang kali)
-- ====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tambah kolom department_id ke tabel `team` jika belum ada
SET @exist := (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'team' 
    AND COLUMN_NAME = 'department_id'
);
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE `team` ADD COLUMN `department_id` VARCHAR(191) NULL AFTER `leader_id`, ADD INDEX `Team_departmentId_idx` (`department_id`);', 
  'SELECT 1;'
);
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Tambah kolom department_id ke tabel `user` jika belum ada
SET @exist := (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'user' 
    AND COLUMN_NAME = 'department_id'
);
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE `user` ADD COLUMN `department_id` VARCHAR(191) NULL AFTER `team_id`, ADD INDEX `User_departmentId_idx` (`department_id`);', 
  'SELECT 1;'
);
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Backfill department_id pada `team` berdasarkan matching value department
UPDATE `team` t
JOIN `department` d ON t.`department` = d.`value`
SET t.`department_id` = d.`id`
WHERE t.`department_id` IS NULL;

-- 4. Backfill department_id pada `user` berdasarkan matching value department
UPDATE `user` u
JOIN `department` d ON u.`department` = d.`value`
SET u.`department_id` = d.`id`
WHERE u.`department_id` IS NULL;

-- 5. Foreign Key Constraint pada `team.department_id` -> `department.id`
SET @exist := (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'team' 
    AND CONSTRAINT_NAME = 'Team_departmentId_fkey' 
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE `team` ADD CONSTRAINT `Team_departmentId_fkey` FOREIGN KEY (`department_id`) REFERENCES `department` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;', 
  'SELECT 1;'
);
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 6. Foreign Key Constraint pada `user.department_id` -> `department.id`
SET @exist := (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'user' 
    AND CONSTRAINT_NAME = 'User_departmentId_fkey' 
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE `user` ADD CONSTRAINT `User_departmentId_fkey` FOREIGN KEY (`department_id`) REFERENCES `department` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;', 
  'SELECT 1;'
);
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;
