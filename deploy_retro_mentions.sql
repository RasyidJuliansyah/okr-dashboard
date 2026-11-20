-- ====================================================================
-- SKOLLA SPRINT RETROSPECTIVE - MENTION TAGGING MIGRATION
-- Rilis       : Mention tag pegawai lintas-tim dalam manager yang sama
-- Database    : MySQL 8.0+ (`skolla_okr`)
-- Petunjuk    : Buka DBeaver -> Hubungkan ke skolla_okr -> Run Script (Alt+X)
-- Sifat Script: Idempotent & aman dijalankan berulang kali
-- Catatan     : Jalankan setelah deploy_retro_tables.sql (butuh retro_card).
-- ====================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `retro_card_mention` (
  `id` VARCHAR(191) NOT NULL,
  `card_id` VARCHAR(191) NOT NULL,
  `mentioned_user_id` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `RetroCardMention_cardId_mentionedUserId_key` (`card_id`, `mentioned_user_id`),
  KEY `RetroCardMention_mentionedUserId_idx` (`mentioned_user_id`),
  CONSTRAINT `RetroCardMention_cardId_fkey` FOREIGN KEY (`card_id`) REFERENCES `retro_card` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `RetroCardMention_mentionedUserId_fkey` FOREIGN KEY (`mentioned_user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
