-- ============================================================
-- MIGRATION: Target Type Support (AT_LEAST, AT_MOST, EXACT)
-- ============================================================

ALTER TABLE `annual_key_result` ADD COLUMN `target_type` VARCHAR(20) NOT NULL DEFAULT 'AT_LEAST';
ALTER TABLE `key_result` ADD COLUMN `target_type` VARCHAR(20) NOT NULL DEFAULT 'AT_LEAST';
ALTER TABLE `initiative` ADD COLUMN `target_type` VARCHAR(20) NOT NULL DEFAULT 'AT_LEAST';
ALTER TABLE `task` ADD COLUMN `target_type` VARCHAR(20) NOT NULL DEFAULT 'AT_LEAST';
