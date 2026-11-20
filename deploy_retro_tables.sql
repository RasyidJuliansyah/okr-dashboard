-- ====================================================================
-- SKOLLA SPRINT RETROSPECTIVE - DATABASE MIGRATION SCRIPT
-- Rilis       : Sprint Retrospective Canvas (Stop / Start / Continue)
-- Tanggal     : November 2026
-- Database    : MySQL 8.0+ (`skolla_okr`)
-- Petunjuk    : Buka DBeaver -> Hubungkan ke skolla_okr -> Run Script (Alt+X)
-- Sifat Script: Idempotent & Aman dijalankan berulang kali
-- Catatan     : Collation utf8mb4_0900_ai_ci mengikuti tabel user/sprint/department
--               (wajib sama untuk FK). Kolom emoji pakai utf8mb4_bin.
--               Log buka/tutup board memakai tabel audit_log yang sudah ada.
-- ====================================================================

SET NAMES utf8mb4;

-- 1. Board retro: 1 per sprint per departemen
CREATE TABLE IF NOT EXISTS `retro_board` (
  `id` VARCHAR(191) NOT NULL,
  `sprint_id` VARCHAR(191) NOT NULL,
  `department_id` VARCHAR(191) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  `opened_by_id` VARCHAR(191) NOT NULL,
  `closed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `RetroBoard_sprintId_departmentId_key` (`sprint_id`, `department_id`),
  KEY `RetroBoard_departmentId_idx` (`department_id`),
  CONSTRAINT `RetroBoard_sprintId_fkey` FOREIGN KEY (`sprint_id`) REFERENCES `sprint` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `RetroBoard_departmentId_fkey` FOREIGN KEY (`department_id`) REFERENCES `department` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Kartu feedback (STOP / START / CONTINUE)
CREATE TABLE IF NOT EXISTS `retro_card` (
  `id` VARCHAR(191) NOT NULL,
  `board_id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `column` VARCHAR(20) NOT NULL,
  `content` VARCHAR(500) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `RetroCard_boardId_idx` (`board_id`),
  KEY `RetroCard_userId_idx` (`user_id`),
  CONSTRAINT `RetroCard_boardId_fkey` FOREIGN KEY (`board_id`) REFERENCES `retro_board` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `RetroCard_userId_fkey` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. Mood per user per board
CREATE TABLE IF NOT EXISTS `retro_mood` (
  `id` VARCHAR(191) NOT NULL,
  `board_id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `emoji` VARCHAR(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `RetroMood_boardId_userId_key` (`board_id`, `user_id`),
  KEY `RetroMood_userId_idx` (`user_id`),
  CONSTRAINT `RetroMood_boardId_fkey` FOREIGN KEY (`board_id`) REFERENCES `retro_board` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `RetroMood_userId_fkey` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. Reaksi emoji per kartu
CREATE TABLE IF NOT EXISTS `retro_reaction` (
  `id` VARCHAR(191) NOT NULL,
  `card_id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `emoji` VARCHAR(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `RetroReaction_cardId_userId_emoji_key` (`card_id`, `user_id`, `emoji`),
  KEY `RetroReaction_userId_idx` (`user_id`),
  CONSTRAINT `RetroReaction_cardId_fkey` FOREIGN KEY (`card_id`) REFERENCES `retro_card` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `RetroReaction_userId_fkey` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
