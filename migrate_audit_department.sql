-- ============================================================
-- MIGRATION: Department Active Status & Audit Log Table
-- ============================================================

ALTER TABLE `department` ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS `audit_log` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NULL,
  `action` VARCHAR(50) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` VARCHAR(100) NULL,
  `old_values` JSON NULL,
  `new_values` JSON NULL,
  `ip_address` VARCHAR(50) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `AuditLog_entityType_entityId_idx` (`entity_type`, `entity_id`),
  INDEX `AuditLog_userId_idx` (`user_id`),
  INDEX `AuditLog_createdAt_idx` (`created_at`),
  CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
