-- Migration: add_documentation_links
-- Menambahkan kolom documentationLink / link untuk fitur bukti dokumentasi update progress

ALTER TABLE `Initiative` ADD COLUMN `documentationLink` VARCHAR(191) NULL;
ALTER TABLE `InitiativeUpdate` ADD COLUMN `link` VARCHAR(191) NULL;
ALTER TABLE `Task` ADD COLUMN `documentationLink` VARCHAR(191) NULL;
ALTER TABLE `TaskUpdate` ADD COLUMN `link` VARCHAR(191) NULL;
