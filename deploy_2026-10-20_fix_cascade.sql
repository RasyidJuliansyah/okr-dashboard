-- ====================================================================
-- SKOLLA BSC & OKR SUITE - PRODUCTION MIGRATION / DATA REPAIR SCRIPT
-- Rilis       : Fix KR Auto-Cascade & Reset Stuck Manual Overrides
-- Tanggal     : 20 Oktober 2026
-- Database    : MySQL 8.0+ (`skolla_okr`)
-- Petunjuk    : Buka DBeaver -> Hubungkan ke skolla_okr -> Run Script (Alt+X)
-- Sifat Script: Idempotent & Aman dijalankan berulang kali
-- ====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Normalisasi Bobot Inisiatif
-- Inisiatif dengan weight = 0 membuat kontribusi progres menjadi 0
UPDATE `initiative`
SET `weight` = 1.0
WHERE `weight` = 0;

-- 2. Buka Kuncian is_manual_override pada Key Result yang memiliki Inisiatif Aktif
-- Memastikan auto-cascade dari inisiatif/task berjalan ke Key Result
UPDATE `key_result` kr
JOIN `initiative` i ON kr.`id` = i.`key_result_id`
SET kr.`is_manual_override` = 0
WHERE i.`is_active` = 1 AND kr.`is_manual_override` = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- Cek hasil Key Result yang memiliki inisiatif aktif dan status override-nya
SELECT 
    kr.id,
    kr.title,
    kr.target_value,
    kr.current_value,
    kr.status,
    kr.is_manual_override,
    COUNT(i.id) AS total_initiatives
FROM `key_result` kr
JOIN `initiative` i ON kr.id = i.key_result_id AND i.is_active = 1
GROUP BY kr.id, kr.title, kr.target_value, kr.current_value, kr.status, kr.is_manual_override
ORDER BY total_initiatives DESC
LIMIT 10;
