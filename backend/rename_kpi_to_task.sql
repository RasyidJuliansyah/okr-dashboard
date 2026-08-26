-- ============================================================
-- Migrasi: Kpi/KpiAssignment/KpiUpdate -> Task/TaskAssignment/TaskUpdate
-- ============================================================
-- Database Anda saat ini masih pakai nama tabel lama (Kpi, KpiAssignment,
-- KpiUpdate) dari sebelum kode di-rename ke Task. Script ini me-RENAME
-- tabel (data existing TIDAK hilang), me-rename kolom kpiId -> taskId,
-- dan menambahkan kolom baru yang belum ada di skema lama:
--   - Task.weight (default 1.0)
--   - Task.documentationLink
--   - TaskUpdate.link
--
-- Jalankan SEKALI saja. Disarankan backup dulu sebelum eksekusi:
--   mysqldump -h <host> -P <port> -u <user> -p <db> Kpi KpiAssignment KpiUpdate > backup_kpi_tables.sql
-- ============================================================

-- 1) Rename tabel
RENAME TABLE `Kpi` TO `Task`;
RENAME TABLE `KpiAssignment` TO `TaskAssignment`;
RENAME TABLE `KpiUpdate` TO `TaskUpdate`;

-- 2) Rename kolom FK kpiId -> taskId
ALTER TABLE `TaskAssignment` CHANGE COLUMN `kpiId` `taskId` VARCHAR(191) NOT NULL;
ALTER TABLE `TaskUpdate` CHANGE COLUMN `kpiId` `taskId` VARCHAR(191) NOT NULL;

-- 3) Tambah kolom baru yang belum ada di skema lama
ALTER TABLE `Task` ADD COLUMN `weight` DOUBLE NOT NULL DEFAULT 1.0;
ALTER TABLE `Task` ADD COLUMN `documentationLink` VARCHAR(191) NULL;
ALTER TABLE `TaskUpdate` ADD COLUMN `link` VARCHAR(191) NULL;

-- 4) (Opsional, kosmetik) Rename nama index/unique constraint agar konsisten
--    dengan penamaan Prisma saat ini. Tidak wajib -- index tetap berfungsi
--    dengan nama lama, ini hanya agar `prisma db pull` tidak menampilkan diff.
ALTER TABLE `TaskAssignment` RENAME INDEX `KpiAssignment_kpiId_idx` TO `TaskAssignment_taskId_idx`;
ALTER TABLE `TaskAssignment` RENAME INDEX `KpiAssignment_kpiId_userId_key` TO `TaskAssignment_taskId_userId_key`;
ALTER TABLE `TaskUpdate` RENAME INDEX `KpiUpdate_kpiId_createdAt_idx` TO `TaskUpdate_taskId_createdAt_idx`;
