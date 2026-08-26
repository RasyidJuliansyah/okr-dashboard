-- ============================================================
-- Membuat tabel Task, TaskAssignment, TaskUpdate (kalau belum ada)
-- Sudah termasuk kolom documentationLink/link (lihat add_documentation_links.sql)
-- Jalankan hanya jika ketiga tabel ini BELUM ada di database.
-- Cek dulu dengan: SHOW TABLES LIKE 'Task%';
-- ============================================================

CREATE TABLE `Task` (
    `id` VARCHAR(191) NOT NULL,
    `initiativeId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `targetValue` DOUBLE NOT NULL,
    `currentValue` DOUBLE NOT NULL DEFAULT 0,
    `weight` DOUBLE NOT NULL DEFAULT 1.0,
    `unit` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ON_TRACK',
    `documentationLink` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

CREATE TABLE `TaskUpdate` (
    `id` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `oldValue` DOUBLE NOT NULL,
    `newValue` DOUBLE NOT NULL,
    `note` VARCHAR(191) NULL,
    `link` VARCHAR(191) NULL,
    `submittedBy` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING_APPROVAL',
    `reviewedBy` VARCHAR(191) NULL,
    `reviewNote` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TaskUpdate_taskId_createdAt_idx`(`taskId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Foreign keys (jalankan setelah ketiga tabel di atas berhasil dibuat)
ALTER TABLE `Task` ADD CONSTRAINT `Task_initiativeId_fkey` FOREIGN KEY (`initiativeId`) REFERENCES `Initiative`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `TaskAssignment` ADD CONSTRAINT `TaskAssignment_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `TaskAssignment` ADD CONSTRAINT `TaskAssignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `TaskUpdate` ADD CONSTRAINT `TaskUpdate_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
