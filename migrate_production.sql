-- ============================================================
-- MIGRATION SCRIPT: OKR Hierarchical Achievement Tracking
-- Versi: Snake_case (Sesuai dengan schema.prisma MySQL)
-- Deskripsi: Menambahkan tabel & kolom baru untuk OKR, Initiative, & Task
-- ============================================================
-- PETUNJUK:
-- Jika DBeaver memunculkan error "Duplicate column name" atau 
-- "Duplicate key name", artinya kolom/index tersebut sudah ada 
-- di database Anda. Anda bisa melewati (skip) baris tersebut.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- BAGIAN 1: Tabel annual_key_result (BARU)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `annual_key_result` (
  `id`              VARCHAR(191) NOT NULL,
  `objective_id`    VARCHAR(191) NOT NULL,
  `title`           VARCHAR(191) NOT NULL,
  `description`     VARCHAR(191) NULL,
  `target_value`    DOUBLE NOT NULL,
  `current_value`   DOUBLE NOT NULL DEFAULT 0,
  `unit`            VARCHAR(191) NOT NULL,
  `bsc_perspective` VARCHAR(191) NOT NULL,
  `year`            VARCHAR(191) NOT NULL,
  `status`          VARCHAR(191) NOT NULL DEFAULT 'ON_TRACK',
  `created_at`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `AnnualKeyResult_objectiveId_fkey` (`objective_id`),
  CONSTRAINT `AnnualKeyResult_objectiveId_fkey`
    FOREIGN KEY (`objective_id`) REFERENCES `objective` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- ─────────────────────────────────────────────────────────────
-- BAGIAN 2: Kolom Baru di tabel key_result
-- Jalankan satu per satu. Jika kolom sudah ada, lewati ke baris berikutnya.
-- ─────────────────────────────────────────────────────────────

-- 2a. Tambah kolom-kolom baru
ALTER TABLE `key_result` ADD COLUMN `annual_key_result_id` VARCHAR(191) NULL AFTER `objective_id`;
ALTER TABLE `key_result` ADD COLUMN `month` VARCHAR(191) NULL AFTER `annual_key_result_id`;
ALTER TABLE `key_result` ADD COLUMN `month_weight` DOUBLE NOT NULL DEFAULT 1.0 AFTER `month`;
ALTER TABLE `key_result` ADD COLUMN `is_manual_override` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`;

-- 2b. Tambah index untuk kolom baru
ALTER TABLE `key_result` ADD INDEX `KeyResult_annualKeyResultId_fkey` (`annual_key_result_id`);
ALTER TABLE `key_result` ADD INDEX `KeyResult_month_idx` (`month`);

-- 2c. Tambah foreign key relasi ke annual_key_result
ALTER TABLE `key_result` ADD CONSTRAINT `KeyResult_annualKeyResultId_fkey` 
  FOREIGN KEY (`annual_key_result_id`) REFERENCES `annual_key_result` (`id`) 
  ON DELETE SET NULL ON UPDATE CASCADE;


-- ─────────────────────────────────────────────────────────────
-- BAGIAN 3: Kolom Baru di tabel initiative_update
-- ─────────────────────────────────────────────────────────────

-- 3a. Tambah kolom-kolom status approval
ALTER TABLE `initiative_update` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING_APPROVAL' AFTER `submitted_by`;
ALTER TABLE `initiative_update` ADD COLUMN `reviewed_by` VARCHAR(191) NULL AFTER `status`;
ALTER TABLE `initiative_update` ADD COLUMN `reviewed_at` DATETIME(3) NULL AFTER `reviewed_by`;

-- 3b. Isi nilai default untuk data inisiatif lama yang sudah disubmit
UPDATE `initiative_update` SET `status` = 'APPROVED' WHERE `status` = '' OR `status` IS NULL;


-- ─────────────────────────────────────────────────────────────
-- BAGIAN 4: Tabel department & Relasi Manager
-- ─────────────────────────────────────────────────────────────

-- Buat tabel department jika belum ada
CREATE TABLE IF NOT EXISTS `department` (
  `id`         VARCHAR(191) NOT NULL,
  `name`       VARCHAR(191) NOT NULL,
  `value`      VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Department_value_key` (`value`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tambah kolom manager_id ke department (jika tabel sudah ada sebelumnya)
ALTER TABLE `department` ADD COLUMN `manager_id` VARCHAR(191) NULL AFTER `value`;

-- Tambah foreign key manager_id ke user
ALTER TABLE `department` ADD CONSTRAINT `Department_managerId_fkey` 
  FOREIGN KEY (`manager_id`) REFERENCES `user` (`id`) 
  ON DELETE SET NULL ON UPDATE CASCADE;


-- ─────────────────────────────────────────────────────────────
-- BAGIAN 5: Kolom kanban_status di tabel task
-- ─────────────────────────────────────────────────────────────
-- Tambah kolom kanban_status untuk melacak stage Kanban Task (TODO, IN_PROGRESS, DONE, DROP)
ALTER TABLE `task` ADD COLUMN `kanban_status` VARCHAR(191) NULL DEFAULT 'TODO';


-- ─────────────────────────────────────────────────────────────
-- BAGIAN 6: keyResultId nullable di tabel initiative
-- (Improvement: card inisiatif boleh tidak terhubung ke KR)
-- ─────────────────────────────────────────────────────────────
-- 6a. Drop FK constraint dulu
ALTER TABLE `initiative` DROP FOREIGN KEY `Initiative_keyResultId_fkey`;

-- 6b. Ubah kolom menjadi nullable
ALTER TABLE `initiative` MODIFY COLUMN `key_result_id` VARCHAR(191) NULL;

-- 6c. Tambah ulang FK dengan ON DELETE SET NULL
ALTER TABLE `initiative` ADD CONSTRAINT `Initiative_keyResultId_fkey`
  FOREIGN KEY (`key_result_id`) REFERENCES `key_result` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

