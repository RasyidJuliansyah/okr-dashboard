-- ====================================================================
-- SKOLLA PRODUCT ROADMAP - DATABASE MIGRATION SCRIPT
-- Rilis       : Interactive Gantt Chart Product Roadmap (3-Level Hierarchy)
-- Tanggal     : November 2026
-- Database    : MySQL 8.0+ (`skolla_okr`)
-- Petunjuk    : Buka DBeaver -> Hubungkan ke skolla_okr -> Run Script (Alt+X)
-- Sifat Script: Idempotent & Aman dijalankan berulang kali
-- ====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tabel Domain Roadmap
CREATE TABLE IF NOT EXISTS `roadmap_domain` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(100) NOT NULL,
  `color` VARCHAR(50) NOT NULL DEFAULT '#0e97d6',
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `RoadmapDomain_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel Epic Roadmap
CREATE TABLE IF NOT EXISTS `roadmap_epic` (
  `id` VARCHAR(191) NOT NULL,
  `domain_id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `start_date` DATE NULL,
  `end_date` DATE NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'PLANNED',
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `RoadmapEpic_domainId_idx` (`domain_id`),
  CONSTRAINT `RoadmapEpic_domainId_fkey` FOREIGN KEY (`domain_id`) REFERENCES `roadmap_domain` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel Feature Roadmap
CREATE TABLE IF NOT EXISTS `roadmap_feature` (
  `id` VARCHAR(191) NOT NULL,
  `epic_id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `start_date` DATE NULL,
  `end_date` DATE NULL,
  `progress_percent` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(50) NOT NULL DEFAULT 'PLANNED',
  `pic_name` VARCHAR(100) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `RoadmapFeature_epicId_idx` (`epic_id`),
  CONSTRAINT `RoadmapFeature_epicId_fkey` FOREIGN KEY (`epic_id`) REFERENCES `roadmap_epic` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
