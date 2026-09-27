-- ====================================================================
-- SKOLLA BSC & OKR SUITE - PRODUCTION DATABASE MIGRATION SCRIPT
-- Versi       : Full Production Migration (Latest Features)
-- Tanggal     : September 2026
-- Lingkungan  : Production MySQL 8.0+
-- Deskripsi   : Migrasi skema database aman & non-destruktif untuk fitur:
--               1. BSC & Annual Key Result (Hierarchical Rollup)
--               2. Department Management & Audit Trail Logging
--               3. Sprint Cadence (13 Sprints, Lock/Unlock, Rollup Snapshot)
--               4. Cross-Department Tasks, Comments & Kanban Status
--               5. Task & Initiative KPI / Link & Documentation
-- ====================================================================
-- PETUNJUK EKSEKUSI DI DBEAVER / MYSQL CLIENT:
-- 1. Buka DBeaver, sambungkan ke database Production.
-- 2. Pastikan database target aktif (contoh: USE `okr_dashboard`; atau USE `skolla_okr`;)
-- 3. Buka file ini lalu jalankan sebagai Script (Alt + X).
-- 4. Semua perintah dibuat IDEMPOTENT (aman dijalankan berulang kali tanpa duplikasi error).
-- ====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ────────────────────────────────────────────────────────────────────
-- BAGIAN 1: TABEL-TABEL BARU (CREATE TABLE IF NOT EXISTS)
-- ────────────────────────────────────────────────────────────────────

-- 1.1 Tabel department
CREATE TABLE IF NOT EXISTS `department` (
  `id`         VARCHAR(191) NOT NULL,
  `name`       VARCHAR(191) NOT NULL,
  `value`      VARCHAR(191) NOT NULL,
  `is_active`  TINYINT(1)   NOT NULL DEFAULT 1,
  `manager_id` VARCHAR(191) NULL,
  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Department_value_key` (`value`),
  KEY `Department_managerId_fkey` (`manager_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 1.2 Tabel annual_key_result
CREATE TABLE IF NOT EXISTS `annual_key_result` (
  `id`              VARCHAR(191) NOT NULL,
  `objective_id`    VARCHAR(191) NOT NULL,
  `title`           VARCHAR(191) NOT NULL,
  `description`     VARCHAR(191) NULL,
  `target_value`    DOUBLE       NOT NULL,
  `current_value`   DOUBLE       NOT NULL DEFAULT 0,
  `unit`            VARCHAR(191) NOT NULL,
  `bsc_perspective` VARCHAR(191) NOT NULL,
  `year`            VARCHAR(191) NOT NULL,
  `status`          VARCHAR(191) NOT NULL DEFAULT 'ON_TRACK',
  `target_type`     VARCHAR(20)  NOT NULL DEFAULT 'AT_LEAST',

  `created_at`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `AnnualKeyResult_objectiveId_fkey` (`objective_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 1.3 Tabel notification
CREATE TABLE IF NOT EXISTS `notification` (
  `id`           VARCHAR(191) NOT NULL,
  `recipient_id` VARCHAR(191) NOT NULL,
  `type`         VARCHAR(100) NOT NULL,
  `title`        VARCHAR(255) NOT NULL,
  `body`         TEXT         NOT NULL,
  `link`         VARCHAR(500) NULL,
  `is_read`      TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Notification_recipientId_isRead_idx` (`recipient_id`, `is_read`),
  KEY `Notification_recipientId_createdAt_idx` (`recipient_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 1.4 Tabel audit_log
CREATE TABLE IF NOT EXISTS `audit_log` (
  `id`          VARCHAR(191) NOT NULL,
  `user_id`     VARCHAR(191) NULL,
  `action`      VARCHAR(50)  NOT NULL,
  `entity_type` VARCHAR(50)  NOT NULL,
  `entity_id`   VARCHAR(100) NULL,
  `old_values`  JSON         NULL,
  `new_values`  JSON         NULL,
  `ip_address`  VARCHAR(50)  NULL,
  `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `AuditLog_entityType_entityId_idx` (`entity_type`, `entity_id`),
  KEY `AuditLog_userId_idx` (`user_id`),
  KEY `AuditLog_createdAt_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 1.5 Tabel sprint
CREATE TABLE IF NOT EXISTS `sprint` (
  `id`          VARCHAR(191) NOT NULL,
  `name`        VARCHAR(191) NOT NULL,
  `start_date`  DATETIME(3)  NOT NULL,
  `end_date`    DATETIME(3)  NOT NULL,
  `status`      VARCHAR(50)  NOT NULL DEFAULT 'UPCOMING',
  `is_locked`   TINYINT(1)   NOT NULL DEFAULT 0,
  `year`        VARCHAR(50)  NOT NULL DEFAULT '2026',
  `order_index` INT          NOT NULL DEFAULT 1,
  `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Sprint_status_idx` (`status`),
  KEY `Sprint_startDate_endDate_idx` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 1.6 Tabel kr_sprint_target
CREATE TABLE IF NOT EXISTS `kr_sprint_target` (
  `id`               VARCHAR(191) NOT NULL,
  `key_result_id`    VARCHAR(191) NOT NULL,
  `sprint_id`        VARCHAR(191) NOT NULL,
  `baseline_value`   DOUBLE       NOT NULL DEFAULT 0,
  `target_value`     DOUBLE       NOT NULL DEFAULT 0,
  `current_value`    DOUBLE       NOT NULL DEFAULT 0,
  `aggregation_type` VARCHAR(50)  NOT NULL DEFAULT 'SUM',
  `created_at`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `KrSprintTarget_keyResultId_sprintId_key` (`key_result_id`, `sprint_id`),
  KEY `KrSprintTarget_sprintId_idx` (`sprint_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 1.7 Tabel member_sprint_progress
CREATE TABLE IF NOT EXISTS `member_sprint_progress` (
  `id`              VARCHAR(191) NOT NULL,
  `sprint_id`       VARCHAR(191) NOT NULL,
  `user_id`         VARCHAR(191) NOT NULL,
  `total_score`     DOUBLE       NOT NULL,
  `task_count`      INT          NOT NULL DEFAULT 0,
  `completed_count` INT          NOT NULL DEFAULT 0,
  `details_json`    JSON         NULL,
  `created_at`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `MemberSprintProgress_sprintId_userId_key` (`sprint_id`, `user_id`),
  KEY `MemberSprintProgress_userId_idx` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 1.8 Tabel task_comment
CREATE TABLE IF NOT EXISTS `task_comment` (
  `id`              VARCHAR(191) NOT NULL,
  `task_id`         VARCHAR(191) NOT NULL,
  `user_id`         VARCHAR(191) NOT NULL,
  `message`         TEXT         NOT NULL,
  `attachment_link` VARCHAR(191) NULL,
  `created_at`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `task_comment_task_id_idx` (`task_id`),
  KEY `task_comment_user_id_idx` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ────────────────────────────────────────────────────────────────────
-- BAGIAN 2: MODIFIKASI KOLOM TABEL department
-- ────────────────────────────────────────────────────────────────────

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'department' AND COLUMN_NAME = 'is_active');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `department` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `value`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'department' AND COLUMN_NAME = 'manager_id');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `department` ADD COLUMN `manager_id` VARCHAR(191) NULL AFTER `value`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;
-- 2.2 Pastikan target_type ada di annual_key_result (jika tabel sudah pernah ada sebelumnya)
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'annual_key_result' AND COLUMN_NAME = 'target_type');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `annual_key_result` ADD COLUMN `target_type` VARCHAR(20) NOT NULL DEFAULT ''AT_LEAST'' AFTER `status`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;




SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'is_active');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `user` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `position`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ────────────────────────────────────────────────────────────────────
-- SOFT DELETE COLUMNS (is_active) FOR RELATIONAL TABLES
-- ────────────────────────────────────────────────────────────────────
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

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'team' AND COLUMN_NAME = 'is_active');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `team` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kpi' AND COLUMN_NAME = 'is_active');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `kpi` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'causal_link' AND COLUMN_NAME = 'is_active');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `causal_link` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sprint' AND COLUMN_NAME = 'is_active');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `sprint` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ────────────────────────────────────────────────────────────────────
-- BAGIAN 3: MODIFIKASI KOLOM TABEL key_result
-- ────────────────────────────────────────────────────────────────────

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'key_result' AND COLUMN_NAME = 'annual_key_result_id');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `key_result` ADD COLUMN `annual_key_result_id` VARCHAR(191) NULL AFTER `objective_id`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'key_result' AND COLUMN_NAME = 'month');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `key_result` ADD COLUMN `month` VARCHAR(191) NULL AFTER `annual_key_result_id`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'key_result' AND COLUMN_NAME = 'month_weight');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `key_result` ADD COLUMN `month_weight` DOUBLE NOT NULL DEFAULT 1.0 AFTER `month`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'key_result' AND COLUMN_NAME = 'is_manual_override');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `key_result` ADD COLUMN `is_manual_override` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'key_result' AND COLUMN_NAME = 'target_type');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `key_result` ADD COLUMN `target_type` VARCHAR(20) NOT NULL DEFAULT ''AT_LEAST'' AFTER `status`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;



SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'key_result' AND INDEX_NAME = 'KeyResult_annualKeyResultId_fkey');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `key_result` ADD INDEX `KeyResult_annualKeyResultId_fkey` (`annual_key_result_id`);', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'key_result' AND INDEX_NAME = 'KeyResult_month_idx');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `key_result` ADD INDEX `KeyResult_month_idx` (`month`);', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- ────────────────────────────────────────────────────────────────────
-- BAGIAN 4: MODIFIKASI KOLOM TABEL initiative
-- ────────────────────────────────────────────────────────────────────

-- 4.1 Jadikan key_result_id nullable
ALTER TABLE `initiative` MODIFY COLUMN `key_result_id` VARCHAR(191) NULL;

-- 4.2 Tambah kolom-kolom baru
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'initiative' AND COLUMN_NAME = 'assigned_leader_id');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `initiative` ADD COLUMN `assigned_leader_id` VARCHAR(191) NULL AFTER `owner_id`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'initiative' AND COLUMN_NAME = 'assigned_by');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `initiative` ADD COLUMN `assigned_by` VARCHAR(191) NULL AFTER `assigned_leader_id`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'initiative' AND COLUMN_NAME = 'kanban_status');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `initiative` ADD COLUMN `kanban_status` VARCHAR(191) NOT NULL DEFAULT ''TODO'' AFTER `status`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'initiative' AND COLUMN_NAME = 'target_type');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `initiative` ADD COLUMN `target_type` VARCHAR(20) NOT NULL DEFAULT ''AT_LEAST'' AFTER `status`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;


SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'initiative' AND COLUMN_NAME = 'finish_date');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `initiative` ADD COLUMN `finish_date` DATETIME(3) NULL AFTER `due_date`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'initiative' AND COLUMN_NAME = 'sprint_month');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `initiative` ADD COLUMN `sprint_month` VARCHAR(191) NULL AFTER `finish_date`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'initiative' AND COLUMN_NAME = 'sprint_id');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `initiative` ADD COLUMN `sprint_id` VARCHAR(191) NULL AFTER `sprint_month`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'initiative' AND COLUMN_NAME = 'documentation_link');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `initiative` ADD COLUMN `documentation_link` VARCHAR(191) NULL AFTER `sprint_id`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4.3 Index untuk initiative
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'initiative' AND INDEX_NAME = 'Initiative_sprintId_idx');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `initiative` ADD INDEX `Initiative_sprintId_idx` (`sprint_id`);', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'initiative' AND INDEX_NAME = 'Initiative_sprintMonth_idx');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `initiative` ADD INDEX `Initiative_sprintMonth_idx` (`sprint_month`);', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'initiative' AND INDEX_NAME = 'Initiative_assignedLeaderId_idx');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `initiative` ADD INDEX `Initiative_assignedLeaderId_idx` (`assigned_leader_id`);', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- ────────────────────────────────────────────────────────────────────
-- BAGIAN 5: MODIFIKASI KOLOM TABEL task
-- ────────────────────────────────────────────────────────────────────

-- 5.1 Jadikan initiative_id dan target_value nullable (kebutuhan Cross-Dept Task)
ALTER TABLE `task` MODIFY COLUMN `initiative_id` VARCHAR(191) NULL;
ALTER TABLE `task` MODIFY COLUMN `target_value` DOUBLE NULL DEFAULT 0;

-- 5.2 Tambah kolom-kolom baru
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND COLUMN_NAME = 'baseline_value');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD COLUMN `baseline_value` DOUBLE NOT NULL DEFAULT 0 AFTER `current_value`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND COLUMN_NAME = 'assigned_team_member_id');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD COLUMN `assigned_team_member_id` VARCHAR(191) NULL AFTER `unit`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND COLUMN_NAME = 'assigned_by');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD COLUMN `assigned_by` VARCHAR(191) NULL AFTER `assigned_team_member_id`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND COLUMN_NAME = 'sprint_month');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD COLUMN `sprint_month` VARCHAR(191) NULL AFTER `assigned_by`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND COLUMN_NAME = 'sprint_id');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD COLUMN `sprint_id` VARCHAR(191) NULL AFTER `sprint_month`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND COLUMN_NAME = 'start_date');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD COLUMN `start_date` DATETIME(3) NULL AFTER `sprint_id`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND COLUMN_NAME = 'finish_date');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD COLUMN `finish_date` DATETIME(3) NULL AFTER `start_date`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND COLUMN_NAME = 'kanban_status');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD COLUMN `kanban_status` VARCHAR(191) NULL DEFAULT ''TODO'' AFTER `status`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND COLUMN_NAME = 'target_type');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD COLUMN `target_type` VARCHAR(20) NOT NULL DEFAULT ''AT_LEAST'' AFTER `status`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;


SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND COLUMN_NAME = 'documentation_link');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD COLUMN `documentation_link` VARCHAR(191) NULL AFTER `kanban_status`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND COLUMN_NAME = 'is_cross_dept');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD COLUMN `is_cross_dept` TINYINT(1) NOT NULL DEFAULT 0 AFTER `documentation_link`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND COLUMN_NAME = 'creator_id');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD COLUMN `creator_id` VARCHAR(191) NULL AFTER `is_cross_dept`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND COLUMN_NAME = 'creator_dept');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD COLUMN `creator_dept` VARCHAR(191) NULL AFTER `creator_id`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND COLUMN_NAME = 'target_dept');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD COLUMN `target_dept` VARCHAR(191) NULL AFTER `creator_dept`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND COLUMN_NAME = 'description');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD COLUMN `description` TEXT NULL AFTER `target_dept`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND COLUMN_NAME = 'link');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD COLUMN `link` VARCHAR(191) NULL AFTER `description`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5.3 Index untuk task
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND INDEX_NAME = 'Task_sprintId_idx');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD INDEX `Task_sprintId_idx` (`sprint_id`);', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND INDEX_NAME = 'Task_creatorId_idx');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD INDEX `Task_creatorId_idx` (`creator_id`);', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND INDEX_NAME = 'Task_targetDept_idx');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD INDEX `Task_targetDept_idx` (`target_dept`);', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND INDEX_NAME = 'Task_assignedTeamMemberId_idx');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD INDEX `Task_assignedTeamMemberId_idx` (`assigned_team_member_id`);', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND INDEX_NAME = 'Task_sprintMonth_idx');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD INDEX `Task_sprintMonth_idx` (`sprint_month`);', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- ────────────────────────────────────────────────────────────────────
-- BAGIAN 6: MODIFIKASI KOLOM TABEL task_update & initiative_update
-- ────────────────────────────────────────────────────────────────────

-- 6.1 task_update
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task_update' AND COLUMN_NAME = 'link');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task_update` ADD COLUMN `link` VARCHAR(191) NULL AFTER `note`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task_update' AND COLUMN_NAME = 'status');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task_update` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT ''PENDING_APPROVAL'' AFTER `submitted_by`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task_update' AND COLUMN_NAME = 'reviewed_by');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task_update` ADD COLUMN `reviewed_by` VARCHAR(191) NULL AFTER `status`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task_update' AND COLUMN_NAME = 'review_note');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task_update` ADD COLUMN `review_note` TEXT NULL AFTER `reviewed_by`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task_update' AND COLUMN_NAME = 'reviewed_at');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task_update` ADD COLUMN `reviewed_at` DATETIME(3) NULL AFTER `review_note`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 6.2 initiative_update
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'initiative_update' AND COLUMN_NAME = 'kanban_status');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `initiative_update` ADD COLUMN `kanban_status` VARCHAR(191) NULL AFTER `note`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'initiative_update' AND COLUMN_NAME = 'link');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `initiative_update` ADD COLUMN `link` VARCHAR(191) NULL AFTER `kanban_status`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'initiative_update' AND COLUMN_NAME = 'status');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `initiative_update` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT ''PENDING_APPROVAL'' AFTER `submitted_by`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'initiative_update' AND COLUMN_NAME = 'reviewed_by');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `initiative_update` ADD COLUMN `reviewed_by` VARCHAR(191) NULL AFTER `status`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'initiative_update' AND COLUMN_NAME = 'reviewed_at');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `initiative_update` ADD COLUMN `reviewed_at` DATETIME(3) NULL AFTER `reviewed_by`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- ────────────────────────────────────────────────────────────────────
-- BAGIAN 7: FOREIGN KEYS (AMAN DENGAN CEK INFORMATION_SCHEMA)
-- ────────────────────────────────────────────────────────────────────

-- 7.1 department -> user (manager)
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'department' AND CONSTRAINT_NAME = 'Department_managerId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `department` ADD CONSTRAINT `Department_managerId_fkey` FOREIGN KEY (`manager_id`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 7.2 annual_key_result -> objective
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'annual_key_result' AND CONSTRAINT_NAME = 'AnnualKeyResult_objectiveId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `annual_key_result` ADD CONSTRAINT `AnnualKeyResult_objectiveId_fkey` FOREIGN KEY (`objective_id`) REFERENCES `objective` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 7.3 key_result -> annual_key_result
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'key_result' AND CONSTRAINT_NAME = 'KeyResult_annualKeyResultId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `key_result` ADD CONSTRAINT `KeyResult_annualKeyResultId_fkey` FOREIGN KEY (`annual_key_result_id`) REFERENCES `annual_key_result` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 7.4 audit_log -> user
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'audit_log' AND CONSTRAINT_NAME = 'AuditLog_userId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `audit_log` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 7.5 initiative -> sprint
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'initiative' AND CONSTRAINT_NAME = 'initiative_sprint_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `initiative` ADD CONSTRAINT `initiative_sprint_id_fkey` FOREIGN KEY (`sprint_id`) REFERENCES `sprint` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 7.6 task -> sprint
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND CONSTRAINT_NAME = 'task_sprint_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD CONSTRAINT `task_sprint_id_fkey` FOREIGN KEY (`sprint_id`) REFERENCES `sprint` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 7.7 task -> user (creator)
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND CONSTRAINT_NAME = 'task_creator_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task` ADD CONSTRAINT `task_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 7.8 task_comment -> task & user
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task_comment' AND CONSTRAINT_NAME = 'task_comment_task_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task_comment` ADD CONSTRAINT `task_comment_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `task` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task_comment' AND CONSTRAINT_NAME = 'task_comment_user_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `task_comment` ADD CONSTRAINT `task_comment_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 7.9 kr_sprint_target -> key_result & sprint
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kr_sprint_target' AND CONSTRAINT_NAME = 'KrSprintTarget_keyResultId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `kr_sprint_target` ADD CONSTRAINT `KrSprintTarget_keyResultId_fkey` FOREIGN KEY (`key_result_id`) REFERENCES `key_result` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kr_sprint_target' AND CONSTRAINT_NAME = 'KrSprintTarget_sprintId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `kr_sprint_target` ADD CONSTRAINT `KrSprintTarget_sprintId_fkey` FOREIGN KEY (`sprint_id`) REFERENCES `sprint` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 7.10 member_sprint_progress -> sprint & user
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'member_sprint_progress' AND CONSTRAINT_NAME = 'MemberSprintProgress_sprintId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `member_sprint_progress` ADD CONSTRAINT `MemberSprintProgress_sprintId_fkey` FOREIGN KEY (`sprint_id`) REFERENCES `sprint` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'member_sprint_progress' AND CONSTRAINT_NAME = 'MemberSprintProgress_userId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `member_sprint_progress` ADD CONSTRAINT `MemberSprintProgress_userId_fkey` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- ────────────────────────────────────────────────────────────────────
-- BAGIAN 8: SEED DATA SPRINT RESMI (SEPTEMBER 2026 - SEPTEMBER 2027)
-- ────────────────────────────────────────────────────────────────────

INSERT INTO `sprint` (`id`, `name`, `start_date`, `end_date`, `status`, `is_locked`, `year`, `order_index`, `created_at`, `updated_at`)
SELECT '6c0f48a0-1874-4665-b990-9f624a6cbb97', 'Sprint September 2026', '2026-08-21 00:00:00.000', '2026-09-20 23:59:59.999', 'CLOSED', 1, '2026', 1, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `sprint` WHERE `name` = 'Sprint September 2026');

INSERT INTO `sprint` (`id`, `name`, `start_date`, `end_date`, `status`, `is_locked`, `year`, `order_index`, `created_at`, `updated_at`)
SELECT '96b2af15-10ab-4a38-8166-a1aab7710057', 'Sprint Oktober 2026', '2026-09-21 00:00:00.000', '2026-10-20 23:59:59.999', 'ACTIVE', 0, '2026', 2, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `sprint` WHERE `name` = 'Sprint Oktober 2026');

INSERT INTO `sprint` (`id`, `name`, `start_date`, `end_date`, `status`, `is_locked`, `year`, `order_index`, `created_at`, `updated_at`)
SELECT '82c8937e-3f49-41f6-8259-aeecb92986ae', 'Sprint November 2026', '2026-10-21 00:00:00.000', '2026-11-20 23:59:59.999', 'UPCOMING', 0, '2026', 3, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `sprint` WHERE `name` = 'Sprint November 2026');

INSERT INTO `sprint` (`id`, `name`, `start_date`, `end_date`, `status`, `is_locked`, `year`, `order_index`, `created_at`, `updated_at`)
SELECT '99c05d76-8e1b-4277-8bd8-f1d427e12b8f', 'Sprint Desember 2026', '2026-11-21 00:00:00.000', '2026-12-20 23:59:59.999', 'UPCOMING', 0, '2026', 4, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `sprint` WHERE `name` = 'Sprint Desember 2026');

INSERT INTO `sprint` (`id`, `name`, `start_date`, `end_date`, `status`, `is_locked`, `year`, `order_index`, `created_at`, `updated_at`)
SELECT '226f05bd-1007-4528-b0e1-c6db7fea7bbe', 'Sprint Januari 2027', '2026-12-21 00:00:00.000', '2027-01-20 23:59:59.999', 'UPCOMING', 0, '2027', 5, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `sprint` WHERE `name` = 'Sprint Januari 2027');

INSERT INTO `sprint` (`id`, `name`, `start_date`, `end_date`, `status`, `is_locked`, `year`, `order_index`, `created_at`, `updated_at`)
SELECT '3a928013-80fb-4a8e-98e3-3288dfad4a90', 'Sprint Februari 2027', '2027-01-21 00:00:00.000', '2027-02-20 23:59:59.999', 'UPCOMING', 0, '2027', 6, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `sprint` WHERE `name` = 'Sprint Februari 2027');

INSERT INTO `sprint` (`id`, `name`, `start_date`, `end_date`, `status`, `is_locked`, `year`, `order_index`, `created_at`, `updated_at`)
SELECT '52588d27-c6bf-44d2-b59e-06366205b82e', 'Sprint Maret 2027', '2027-02-21 00:00:00.000', '2027-03-20 23:59:59.999', 'UPCOMING', 0, '2027', 7, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `sprint` WHERE `name` = 'Sprint Maret 2027');

INSERT INTO `sprint` (`id`, `name`, `start_date`, `end_date`, `status`, `is_locked`, `year`, `order_index`, `created_at`, `updated_at`)
SELECT 'b734efca-d76f-4aaa-9d72-a930e2b51149', 'Sprint April 2027', '2027-03-21 00:00:00.000', '2027-04-20 23:59:59.999', 'UPCOMING', 0, '2027', 8, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `sprint` WHERE `name` = 'Sprint April 2027');

INSERT INTO `sprint` (`id`, `name`, `start_date`, `end_date`, `status`, `is_locked`, `year`, `order_index`, `created_at`, `updated_at`)
SELECT '91309b9a-2d8e-4016-87d7-e2e06516b874', 'Sprint Mei 2027', '2027-04-21 00:00:00.000', '2027-05-20 23:59:59.999', 'UPCOMING', 0, '2027', 9, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `sprint` WHERE `name` = 'Sprint Mei 2027');

INSERT INTO `sprint` (`id`, `name`, `start_date`, `end_date`, `status`, `is_locked`, `year`, `order_index`, `created_at`, `updated_at`)
SELECT '64d1e759-3866-46e6-8782-61c537cc515e', 'Sprint Juni 2027', '2027-05-21 00:00:00.000', '2027-06-20 23:59:59.999', 'UPCOMING', 0, '2027', 10, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `sprint` WHERE `name` = 'Sprint Juni 2027');

INSERT INTO `sprint` (`id`, `name`, `start_date`, `end_date`, `status`, `is_locked`, `year`, `order_index`, `created_at`, `updated_at`)
SELECT '7aadf595-409c-4770-bf29-ae772eb83dd0', 'Sprint Juli 2027', '2027-06-21 00:00:00.000', '2027-07-20 23:59:59.999', 'UPCOMING', 0, '2027', 11, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `sprint` WHERE `name` = 'Sprint Juli 2027');

INSERT INTO `sprint` (`id`, `name`, `start_date`, `end_date`, `status`, `is_locked`, `year`, `order_index`, `created_at`, `updated_at`)
SELECT '80a00801-940c-4d37-81db-08c6d64d41e9', 'Sprint Agustus 2027', '2027-07-21 00:00:00.000', '2027-08-20 23:59:59.999', 'UPCOMING', 0, '2027', 12, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `sprint` WHERE `name` = 'Sprint Agustus 2027');

INSERT INTO `sprint` (`id`, `name`, `start_date`, `end_date`, `status`, `is_locked`, `year`, `order_index`, `created_at`, `updated_at`)
SELECT '8d8a9525-9e95-4190-89fd-4ed74a0c1afa', 'Sprint September 2027', '2027-08-21 00:00:00.000', '2027-09-20 23:59:59.999', 'UPCOMING', 0, '2027', 13, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `sprint` WHERE `name` = 'Sprint September 2027');


-- ────────────────────────────────────────────────────────────────────
-- BAGIAN 9: DATA CLEANUP & BACKFILL AMAN
-- ────────────────────────────────────────────────────────────────────

-- 9.1 Isi nilai default data update lama
UPDATE `initiative_update` SET `status` = 'APPROVED' WHERE `status` = '' OR `status` IS NULL;
UPDATE `task_update` SET `status` = 'APPROVED' WHERE `status` = '' OR `status` IS NULL;

-- 9.2 Backfill kanban status jika kosong
UPDATE `initiative` SET `kanban_status` = 'TODO' WHERE `kanban_status` = '' OR `kanban_status` IS NULL;
UPDATE `task` SET `kanban_status` = 'TODO' WHERE `kanban_status` = '' OR `kanban_status` IS NULL;

-- 9.3 Backfill baseline_value pada task
UPDATE `task` SET `baseline_value` = 0 WHERE `baseline_value` IS NULL;

-- 9.4 Backfill is_active pada department
UPDATE `department` SET `is_active` = 1 WHERE `is_active` IS NULL;

-- 9.5 Hubungkan task lama ke sprint_id berdasarkan nama sprint_month (jika ada)
UPDATE `task` t
INNER JOIN `sprint` s ON s.name = t.sprint_month
SET t.sprint_id = s.id
WHERE t.sprint_id IS NULL AND t.sprint_month IS NOT NULL;

-- 9.6 Hubungkan initiative lama ke sprint_id berdasarkan nama sprint_month (jika ada)
UPDATE `initiative` i
INNER JOIN `sprint` s ON s.name = i.sprint_month
SET i.sprint_id = s.id
WHERE i.sprint_id IS NULL AND i.sprint_month IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────
-- BAGIAN 10: C-BOARD LEVEL & STRATEGIC SPONSORSHIP (c_level_id)
-- ────────────────────────────────────────────────────────────────────

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'department' AND COLUMN_NAME = 'c_level_id');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `department` ADD COLUMN `c_level_id` VARCHAR(191) NULL AFTER `manager_id`;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'department' AND CONSTRAINT_NAME = 'Department_cLevelId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `department` ADD CONSTRAINT `Department_cLevelId_fkey` FOREIGN KEY (`c_level_id`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;', 'SELECT 1;');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Sinkronisasi role C_LEVEL untuk C-Board
UPDATE `user`
SET `role` = 'C_LEVEL'
WHERE `email` IN ('devlin@skolla.education', 'akbar@skolla.education', 'yazid@skolla.education');

-- ────────────────────────────────────────────────────────────────────
-- BAGIAN 11: AUTO-BACKFILL TEAM & SINKRONISASI DEPARTEMEN
-- ────────────────────────────────────────────────────────────────────

-- 11.1 Sinkronisasi B2B_CORPORATION / B2B_CORPORATE jika ada mismatch
UPDATE `team` SET `department` = 'B2B_CORPORATE' WHERE `department` = 'B2B_CORPORATION';

-- 11.2 Buat default Team untuk setiap Department yang belum punya record di tabel team
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

-- 11.3 Sinkronisasi team_id pegawai yang sudah punya department tapi team_id masih NULL
UPDATE `user` u
INNER JOIN `team` t ON t.`department` = u.`department`
SET u.`team_id` = t.`id`
WHERE u.`team_id` IS NULL AND u.`department` IS NOT NULL;


SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- MIGRASI SELESAI DENGAN SUKSES
-- ====================================================================
