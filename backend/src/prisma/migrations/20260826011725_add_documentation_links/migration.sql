-- AlterTable
ALTER TABLE `Initiative` ADD COLUMN `documentationLink` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `InitiativeUpdate` ADD COLUMN `link` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Task` ADD COLUMN `documentationLink` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `TaskUpdate` ADD COLUMN `link` VARCHAR(191) NULL;
