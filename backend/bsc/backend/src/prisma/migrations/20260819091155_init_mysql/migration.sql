-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'TEAM',
    `department` VARCHAR(191) NULL,
    `position` VARCHAR(191) NULL,
    `teamId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Team` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `managerId` VARCHAR(191) NULL,
    `leaderId` VARCHAR(191) NULL,
    `department` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Objective` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `year` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnnualKeyResult` (
    `id` VARCHAR(191) NOT NULL,
    `objectiveId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `targetValue` DOUBLE NOT NULL,
    `currentValue` DOUBLE NOT NULL DEFAULT 0,
    `unit` VARCHAR(191) NOT NULL,
    `bscPerspective` VARCHAR(191) NOT NULL,
    `year` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ON_TRACK',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AnnualKeyResult_objectiveId_idx`(`objectiveId`),
    INDEX `AnnualKeyResult_year_idx`(`year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KeyResult` (
    `id` VARCHAR(191) NOT NULL,
    `objectiveId` VARCHAR(191) NOT NULL,
    `annualKeyResultId` VARCHAR(191) NULL,
    `month` VARCHAR(191) NULL,
    `monthWeight` DOUBLE NOT NULL DEFAULT 1.0,
    `title` VARCHAR(191) NOT NULL,
    `targetValue` DOUBLE NOT NULL,
    `currentValue` DOUBLE NOT NULL DEFAULT 0,
    `unit` VARCHAR(191) NOT NULL,
    `bscPerspective` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ON_TRACK',
    `isManualOverride` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `KeyResult_annualKeyResultId_idx`(`annualKeyResultId`),
    INDEX `KeyResult_month_idx`(`month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KrAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `keyResultId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `assignedBy` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `raciRole` VARCHAR(191) NOT NULL DEFAULT 'RESPONSIBLE',

    INDEX `KrAssignment_keyResultId_idx`(`keyResultId`),
    INDEX `KrAssignment_userId_idx`(`userId`),
    UNIQUE INDEX `KrAssignment_keyResultId_userId_key`(`keyResultId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KrDepartment` (
    `id` VARCHAR(191) NOT NULL,
    `keyResultId` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `KrDepartment_keyResultId_idx`(`keyResultId`),
    UNIQUE INDEX `KrDepartment_keyResultId_department_key`(`keyResultId`, `department`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KrUpdate` (
    `id` VARCHAR(191) NOT NULL,
    `keyResultId` VARCHAR(191) NOT NULL,
    `oldValue` DOUBLE NOT NULL,
    `newValue` DOUBLE NOT NULL,
    `note` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `KrUpdate_keyResultId_updatedAt_idx`(`keyResultId`, `updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CausalLink` (
    `id` VARCHAR(191) NOT NULL,
    `sourceKrId` VARCHAR(191) NOT NULL,
    `targetKrId` VARCHAR(191) NOT NULL,
    `relationship` VARCHAR(191) NOT NULL,
    `note` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Initiative` (
    `id` VARCHAR(191) NOT NULL,
    `keyResultId` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `targetValue` DOUBLE NOT NULL DEFAULT 0,
    `currentValue` DOUBLE NOT NULL DEFAULT 0,
    `achievedValue` DOUBLE NULL,
    `unit` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ON_TRACK',
    `kanbanStatus` VARCHAR(191) NOT NULL DEFAULT 'TODO',
    `weight` DOUBLE NOT NULL DEFAULT 1.0,
    `startDate` DATETIME(3) NULL,
    `dueDate` DATETIME(3) NULL,
    `sprintMonth` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Initiative_sprintMonth_idx`(`sprintMonth`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Task` (
    `id` VARCHAR(191) NOT NULL,
    `initiativeId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `targetValue` DOUBLE NOT NULL,
    `currentValue` DOUBLE NOT NULL DEFAULT 0,
    `weight` DOUBLE NOT NULL DEFAULT 1.0,
    `unit` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ON_TRACK',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TaskAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TaskAssignment_taskId_idx`(`taskId`),
    INDEX `TaskAssignment_userId_idx`(`userId`),
    UNIQUE INDEX `TaskAssignment_taskId_userId_key`(`taskId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TaskUpdate` (
    `id` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `oldValue` DOUBLE NOT NULL,
    `newValue` DOUBLE NOT NULL,
    `note` VARCHAR(191) NULL,
    `submittedBy` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING_APPROVAL',
    `reviewedBy` VARCHAR(191) NULL,
    `reviewNote` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TaskUpdate_taskId_createdAt_idx`(`taskId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Department` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `managerId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Department_value_key`(`value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InitiativeUpdate` (
    `id` VARCHAR(191) NOT NULL,
    `initiativeId` VARCHAR(191) NOT NULL,
    `oldValue` DOUBLE NOT NULL,
    `newValue` DOUBLE NOT NULL,
    `note` VARCHAR(191) NULL,
    `kanbanStatus` VARCHAR(191) NULL,
    `submittedBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InitiativeUpdate_initiativeId_createdAt_idx`(`initiativeId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Team` ADD CONSTRAINT `Team_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnnualKeyResult` ADD CONSTRAINT `AnnualKeyResult_objectiveId_fkey` FOREIGN KEY (`objectiveId`) REFERENCES `Objective`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KeyResult` ADD CONSTRAINT `KeyResult_objectiveId_fkey` FOREIGN KEY (`objectiveId`) REFERENCES `Objective`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KeyResult` ADD CONSTRAINT `KeyResult_annualKeyResultId_fkey` FOREIGN KEY (`annualKeyResultId`) REFERENCES `AnnualKeyResult`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KrAssignment` ADD CONSTRAINT `KrAssignment_keyResultId_fkey` FOREIGN KEY (`keyResultId`) REFERENCES `KeyResult`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KrAssignment` ADD CONSTRAINT `KrAssignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KrDepartment` ADD CONSTRAINT `KrDepartment_keyResultId_fkey` FOREIGN KEY (`keyResultId`) REFERENCES `KeyResult`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KrUpdate` ADD CONSTRAINT `KrUpdate_keyResultId_fkey` FOREIGN KEY (`keyResultId`) REFERENCES `KeyResult`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CausalLink` ADD CONSTRAINT `CausalLink_sourceKrId_fkey` FOREIGN KEY (`sourceKrId`) REFERENCES `KeyResult`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CausalLink` ADD CONSTRAINT `CausalLink_targetKrId_fkey` FOREIGN KEY (`targetKrId`) REFERENCES `KeyResult`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Initiative` ADD CONSTRAINT `Initiative_keyResultId_fkey` FOREIGN KEY (`keyResultId`) REFERENCES `KeyResult`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Initiative` ADD CONSTRAINT `Initiative_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Initiative` ADD CONSTRAINT `Initiative_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_initiativeId_fkey` FOREIGN KEY (`initiativeId`) REFERENCES `Initiative`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaskAssignment` ADD CONSTRAINT `TaskAssignment_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaskAssignment` ADD CONSTRAINT `TaskAssignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaskUpdate` ADD CONSTRAINT `TaskUpdate_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Department` ADD CONSTRAINT `Department_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InitiativeUpdate` ADD CONSTRAINT `InitiativeUpdate_initiativeId_fkey` FOREIGN KEY (`initiativeId`) REFERENCES `Initiative`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
