-- ====================================================================
-- SKOLLA BSC & OKR SUITE - PRODUCTION MIGRATION DELTA
-- Rilis       : Decoupling KR Sprint, Normalisasi Year & Sprint Month
-- Tanggal     : 15 Oktober 2026
-- Database    : MySQL 8.0+ (`skolla_okr`)
-- Petunjuk    : Buka DBeaver -> Hubungkan ke skolla_okr -> Run Script (Alt+X)
-- Sifat Script: Idempotent (Aman dijalankan berulang kali)
-- ====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. DDL: Update default value kolom year pada tabel objective
ALTER TABLE `objective` ALTER COLUMN `year` SET DEFAULT '2026';

-- 2. DML: Normalisasi format year & quarter pada tabel objective
-- Mengubah 'Q3-2026' menjadi '2026' agar terbaca pada filter tahun rilis baru
UPDATE `objective`
SET `year` = '2026', `quarter` = 'Q3'
WHERE `year` = 'Q3-2026' OR `year` LIKE '%Q3%';

UPDATE `objective`
SET `quarter` = 'Q3'
WHERE `year` = '2026' AND (`quarter` IS NULL OR `quarter` = '');

-- 3. Ambil ID dan Nama Sprint yang berstatus ACTIVE
SET @active_sprint_id := (SELECT `id` FROM `sprint` WHERE `status` = 'ACTIVE' LIMIT 1);
SET @active_sprint_name := (SELECT `name` FROM `sprint` WHERE `status` = 'ACTIVE' LIMIT 1);

-- 4. DML: Normalisasi sprint_id & sprint_month pada tabel initiative
-- Isi sprint_id yang kosong dengan sprint aktif
UPDATE `initiative`
SET `sprint_id` = @active_sprint_id
WHERE (`sprint_id` IS NULL OR `sprint_id` = '') AND @active_sprint_id IS NOT NULL;

-- Samakan sprint_month dengan nama sprint yang terhubung
UPDATE `initiative` i
JOIN `sprint` s ON i.`sprint_id` = s.`id`
SET i.`sprint_month` = s.`name`
WHERE i.`sprint_month` IS NULL OR i.`sprint_month` != s.`name`;

-- 5. DML: Normalisasi sprint_id & sprint_month pada tabel task
-- Isi sprint_id yang kosong dengan sprint aktif
UPDATE `task`
SET `sprint_id` = @active_sprint_id
WHERE (`sprint_id` IS NULL OR `sprint_id` = '') AND @active_sprint_id IS NOT NULL;

-- Samakan sprint_month dengan nama sprint yang terhubung
UPDATE `task` t
JOIN `sprint` s ON t.`sprint_id` = s.`id`
SET t.`sprint_month` = s.`name`
WHERE t.`sprint_month` IS NULL OR t.`sprint_month` != s.`name`;

-- 6. DML: Normalisasi kolom month pada key_result aktif
UPDATE `key_result`
SET `month` = @active_sprint_id
WHERE `is_active` = 1 AND @active_sprint_id IS NOT NULL;

-- 7. PENGAMAN: Kolom department_id pada team & user (jika deploy 30 Sep belum dijalankan)
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'team' AND COLUMN_NAME = 'department_id');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `team` ADD COLUMN `department_id` VARCHAR(191) NULL AFTER `leader_id`, ADD INDEX `Team_departmentId_idx` (`department_id`);', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'department_id');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `user` ADD COLUMN `department_id` VARCHAR(191) NULL AFTER `team_id`, ADD INDEX `User_departmentId_idx` (`department_id`);', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE `team` t JOIN `department` d ON t.`department` = d.`value` SET t.`department_id` = d.`id` WHERE t.`department_id` IS NULL;
UPDATE `user` u JOIN `department` d ON u.`department` = d.`value` SET u.`department_id` = d.`id` WHERE u.`department_id` IS NULL;

SET FOREIGN_KEY_CHECKS = 1;
