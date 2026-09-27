-- Migration: Add c_level_id to department table and link to strategic C-Board
-- Executed on Local: 2026-09-23
-- For Production: Execute via DBeaver on MySQL Production before deploying backend.

ALTER TABLE `department`
  ADD COLUMN `c_level_id` VARCHAR(191) NULL AFTER `manager_id`,
  ADD CONSTRAINT `Department_cLevelId_fkey` FOREIGN KEY (`c_level_id`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Ensure C-Board users have role C_LEVEL
UPDATE `user`
SET `role` = 'C_LEVEL'
WHERE `email` IN ('devlin@skolla.education', 'akbar@skolla.education', 'yazid@skolla.education');
