-- ============================================================
-- MIGRATION SCRIPT: OKR Hierarchical Achievement Tracking
-- Versi: Standar (Kompatibel dengan MySQL 5.7+ / MariaDB / DBeaver)
-- Deskripsi: Menambahkan tabel & kolom baru untuk OKR & Initiative
-- ============================================================
-- PETUNJUK:
-- Jika DBeaver memunculkan error "Duplicate column name" atau 
-- "Duplicate key name", artinya kolom/index tersebut sudah ada 
-- di database Anda. Anda bisa melewati (skip) baris tersebut.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- BAGIAN 1: Tabel AnnualKeyResult (BARU)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `AnnualKeyResult` (
  `id`             VARCHAR(191) NOT NULL,
  `objectiveId`    VARCHAR(191) NOT NULL,
  `title`          VARCHAR(191) NOT NULL,
  `description`    VARCHAR(191) NULL,
  `targetValue`    DOUBLE NOT NULL,
  `currentValue`   DOUBLE NOT NULL DEFAULT 0,
  `unit`           VARCHAR(191) NOT NULL,
  `bscPerspective` VARCHAR(191) NOT NULL,
  `year`           VARCHAR(191) NOT NULL,
  `status`         VARCHAR(191) NOT NULL DEFAULT 'ON_TRACK',
  `createdAt`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `AnnualKeyResult_objectiveId_idx` (`objectiveId`),
  INDEX `AnnualKeyResult_year_idx` (`year`),
  CONSTRAINT `AnnualKeyResult_objectiveId_fkey`
    FOREIGN KEY (`objectiveId`) REFERENCES `Objective` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- ─────────────────────────────────────────────────────────────
-- BAGIAN 2: Kolom Baru di tabel KeyResult
-- Jalankan satu per satu. Jika kolom sudah ada, lewati ke baris berikutnya.
-- ─────────────────────────────────────────────────────────────

-- 2a. Tambah kolom-kolom baru
ALTER TABLE `KeyResult` ADD COLUMN `annualKeyResultId` VARCHAR(191) NULL AFTER `objectiveId`;
ALTER TABLE `KeyResult` ADD COLUMN `month` VARCHAR(191) NULL AFTER `annualKeyResultId`;
ALTER TABLE `KeyResult` ADD COLUMN `monthWeight` DOUBLE NOT NULL DEFAULT 1.0 AFTER `month`;
ALTER TABLE `KeyResult` ADD COLUMN `isManualOverride` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`;

-- 2b. Tambah index untuk kolom baru
ALTER TABLE `KeyResult` ADD INDEX `KeyResult_annualKeyResultId_idx` (`annualKeyResultId`);
ALTER TABLE `KeyResult` ADD INDEX `KeyResult_month_idx` (`month`);

-- 2c. Tambah foreign key relasi ke AnnualKeyResult
ALTER TABLE `KeyResult` ADD CONSTRAINT `KeyResult_annualKeyResultId_fkey` 
  FOREIGN KEY (`annualKeyResultId`) REFERENCES `AnnualKeyResult` (`id`) 
  ON DELETE SET NULL ON UPDATE CASCADE;


-- ─────────────────────────────────────────────────────────────
-- BAGIAN 3: Kolom Baru di tabel InitiativeUpdate
-- ─────────────────────────────────────────────────────────────

-- 3a. Tambah kolom-kolom status approval
ALTER TABLE `InitiativeUpdate` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING_APPROVAL' AFTER `submittedBy`;
ALTER TABLE `InitiativeUpdate` ADD COLUMN `reviewedBy` VARCHAR(191) NULL AFTER `status`;
ALTER TABLE `InitiativeUpdate` ADD COLUMN `reviewedAt` DATETIME(3) NULL AFTER `reviewedBy`;

-- 3b. Isi nilai default untuk data inisiatif lama yang sudah disubmit
UPDATE `InitiativeUpdate` SET `status` = 'APPROVED' WHERE `status` = '' OR `status` IS NULL;


-- ─────────────────────────────────────────────────────────────
-- BAGIAN 4: Tabel Department & Relasi Manager
-- ─────────────────────────────────────────────────────────────

-- Buat tabel Department jika belum ada
CREATE TABLE IF NOT EXISTS `Department` (
  `id`        VARCHAR(191) NOT NULL,
  `name`      VARCHAR(191) NOT NULL,
  `value`     VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Department_value_key` (`value`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tambah kolom managerId ke Department (jika tabel sudah ada sebelumnya)
ALTER TABLE `Department` ADD COLUMN `managerId` VARCHAR(191) NULL AFTER `value`;

-- Tambah foreign key managerId ke User
ALTER TABLE `Department` ADD CONSTRAINT `Department_managerId_fkey` 
  FOREIGN KEY (`managerId`) REFERENCES `User` (`id`) 
  ON DELETE SET NULL ON UPDATE CASCADE;
