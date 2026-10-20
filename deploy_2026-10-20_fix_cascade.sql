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


-- 3. Sinkronisasi Nilai dan Status Key Result Terkalkulasi
UPDATE `key_result` SET `current_value` = 0, `status` = 'OFF_TRACK', `is_manual_override` = 0 WHERE `id` = '05a80565-526a-425b-8981-25695e0d63ea'; -- Cash on hand sebesar IDR 3,8 M pada akhir tahun
UPDATE `key_result` SET `current_value` = 85.01, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = '0f46f082-7fb4-4221-9779-04f53b344b73'; -- Dashboard single source of truth live & jadi rujukan utama manajemen (adopsi ≥90%)
UPDATE `key_result` SET `current_value` = 4189.04, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = '12ec1725-9586-4b0e-91e5-a8aa15bea5d1'; -- Mencapai target Organic Leads
UPDATE `key_result` SET `current_value` = 90, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = '1d4f6310-1835-4e05-97c9-5d440ce272e9'; -- Adopsi dashboard single source of truth live dan menjadi rujukan utama manajemen
UPDATE `key_result` SET `current_value` = 0, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = '244e93f3-c46f-486a-ba60-b1bce58e9ba7'; -- [Website App] Solving bug error P0-P1 <24 jam
UPDATE `key_result` SET `current_value` = 3, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = '2ed130af-5dd5-4af9-a7d1-99bb1b7f14d8'; -- Minimal 3 Improvement per Bulan
UPDATE `key_result` SET `current_value` = 0, `status` = 'ON_TRACK', `is_manual_override` = 1 WHERE `id` = '31751644-56e6-4049-a89f-94c48f9ed310'; -- Downtime <7 menit/hari
UPDATE `key_result` SET `current_value` = 0, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = '34274189-2641-448f-a82f-31189d5f0554'; -- Menjaga functional platform <20 mins
UPDATE `key_result` SET `current_value` = 0, `status` = 'OFF_TRACK', `is_manual_override` = 0 WHERE `id` = '3f241267-6259-4517-9823-5ddfc73c8f02'; -- Efisiensi pemrosesan data kepegawaian & akurasi dokumen >98%
UPDATE `key_result` SET `current_value` = 0, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = '405b4e98-44d0-4be0-9bd4-7f292310b46d'; -- Penyelesaian Problem <24 jam
UPDATE `key_result` SET `current_value` = 0.9, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = '42e7d36e-69b8-4185-b0e1-df8a9a9bb466'; -- Menyusun laporan temuan & rekomendasi perbaikan kepada manajemen setiap bulan
UPDATE `key_result` SET `current_value` = 20, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = '4b16f90a-080e-41c9-b505-05896212ea3e'; -- [Mobile App] Solving bug error P0-P1 <2x24 jam 
UPDATE `key_result` SET `current_value` = 0, `status` = 'OFF_TRACK', `is_manual_override` = 0 WHERE `id` = '52fdd9e7-2189-4ac9-bf91-880a97e9e5e9'; -- Skor Employee Net Promoter Score (eNPS) khusus layanan & support HR ke angka minimal +40 pada survei kepuasan tahunan
UPDATE `key_result` SET `current_value` = 100, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = '556bd17e-178f-4562-b640-e7ab805cbc71'; -- Evaluasi ketaatan standar, risiko, dan efektivitas kontrol teknologi
UPDATE `key_result` SET `current_value` = 95, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = '5aa46188-dbaf-4d36-a842-bb0aee8d0992'; -- 100% laporan performa BSC & BU tersedia real-time/self-service
UPDATE `key_result` SET `current_value` = 12, `status` = 'AT_RISK', `is_manual_override` = 0 WHERE `id` = '697860d9-c547-418f-9e9e-892b210380fa'; -- Tercapainya pembelian berulang (retention) dari 16 Sekolah hingga Akhir tahun sebanyak 100%
UPDATE `key_result` SET `current_value` = 0, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = '6b929e25-61be-4fc8-8a54-5e15e739ee90'; -- Rata-rata penyelesaian design per request 2–5 hari (brief masuk)
UPDATE `key_result` SET `current_value` = 0, `status` = 'OFF_TRACK', `is_manual_override` = 0 WHERE `id` = '73da0037-ed91-4279-bc5c-11a5d8aa2980'; -- Tercapainya peningkatan nilai transaksi (up-selling) dari existing/active customer 10%
UPDATE `key_result` SET `current_value` = 0, `status` = 'OFF_TRACK', `is_manual_override` = 0 WHERE `id` = '7553e0ed-ddb7-4489-b9f1-36203cf45d18'; -- Mencapai Deal Kerja Sama Sekolah via Forum Kepala Sekolah (@55juta/Paket LMS Juara Rombel Menengah)
UPDATE `key_result` SET `current_value` = 90, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = '80f2a953-f30e-4b06-b32d-0962f1bb719c'; -- Tingkat Keterselesaian Ujian 90%
UPDATE `key_result` SET `current_value` = 32.57, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = '81087745-1f87-46af-a5e4-a83bd8e7ef77'; -- Mengumpulkan dan Mengkonversi Prospect Leads
UPDATE `key_result` SET `current_value` = 396, `status` = 'OFF_TRACK', `is_manual_override` = 0 WHERE `id` = '865fc65b-8dc6-46cd-87ec-d2c5087e5d87'; -- Mencapai target Paid Leads
UPDATE `key_result` SET `current_value` = 0, `status` = 'OFF_TRACK', `is_manual_override` = 0 WHERE `id` = '8b8902db-4c6c-41a1-874e-16af11dfabe8'; -- Net Profit Margin mencapai 24% pada akhir tahun
UPDATE `key_result` SET `current_value` = 0, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = '961d26a3-41d9-4ea8-8222-8f80b793f2cb'; -- Menjaga downtime infrastructure <30 mins
UPDATE `key_result` SET `current_value` = 60, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = '9e484e4b-ffeb-4612-a069-4d68a1db551a'; -- Tingkat Adopsi User 60%
UPDATE `key_result` SET `current_value` = 81.94, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = 'a6793196-025b-4958-be89-92255cf6a6e5'; -- Tingkat Kepuasaan >82%
UPDATE `key_result` SET `current_value` = 0, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = 'abba8f2d-05e8-4223-bd54-c42cf6bac17f'; -- Menjaga jumlah sekolah terkategori merah <20%
UPDATE `key_result` SET `current_value` = 0, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = 'b4742437-4c46-46fb-8397-e8526673468b'; -- Akurasi Layanan 100%
UPDATE `key_result` SET `current_value` = 0, `status` = 'ON_TRACK', `is_manual_override` = 1 WHERE `id` = 'b6ca80dc-4fca-4ebf-9df5-cb55bd7fa128'; -- Penyelesaian Bug <24 jam
UPDATE `key_result` SET `current_value` = 0, `status` = 'OFF_TRACK', `is_manual_override` = 1 WHERE `id` = 'b817f395-b2af-4b6f-985a-5ed449f9f516'; -- Tingkat Keaktifan User 80%
UPDATE `key_result` SET `current_value` = 9860000, `status` = 'OFF_TRACK', `is_manual_override` = 0 WHERE `id` = 'bce3553f-816e-47d8-a2fb-76e684ff31cd'; -- Mencapai Revenue Net B2B
UPDATE `key_result` SET `current_value` = 0, `status` = 'OFF_TRACK', `is_manual_override` = 0 WHERE `id` = 'c15377b6-9c5a-484c-8cb2-a9e36da9f315'; -- Kelengkapan Materi Belajar 100%
UPDATE `key_result` SET `current_value` = 0, `status` = 'OFF_TRACK', `is_manual_override` = 0 WHERE `id` = 'cf3604ca-e17b-4135-8e8a-41c939535a53'; -- Memastikan Retention Rate
UPDATE `key_result` SET `current_value` = 0, `status` = 'OFF_TRACK', `is_manual_override` = 0 WHERE `id` = 'd797e2df-1215-4166-a3fc-633c71dceb79'; -- Membuat Event Kerja Sama dengan Forum Kepala Sekolah Besar (@500 Juta/Forum)
UPDATE `key_result` SET `current_value` = 0, `status` = 'OFF_TRACK', `is_manual_override` = 0 WHERE `id` = 'dafca01b-bda6-40a2-af40-3bce7002d158'; -- Mencapai Deal Kerja Sama Sekolah via Direct to School (@55juta/Paket LMS Juara Rombel Menengah)
UPDATE `key_result` SET `current_value` = 0, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = 'dbc7b786-b855-42df-9ba4-3201d403d013'; -- 100% laporan performa SSC & BU tersedia real-time/self-service, tanpa proses manual berulang
UPDATE `key_result` SET `current_value` = 0.9, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = 'e02c076e-d044-4c38-b8a3-6644115d9f8d'; -- Minimal 1 kajian R&D pengembangan bisnis/produk per kuartal
UPDATE `key_result` SET `current_value` = 575785714.29, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = 'e381a0dd-447a-4b89-a7ca-9299af6c69ff'; -- Mencapai Revenue Net B2C
UPDATE `key_result` SET `current_value` = 1, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = 'ea227e76-f697-4c84-afc1-0ff7bdc1f0a8'; -- Minimal 1 New Features per Bulan
UPDATE `key_result` SET `current_value` = 277380000, `status` = 'OFF_TRACK', `is_manual_override` = 0 WHERE `id` = 'edd8a7d7-cb1c-4a8d-bf7a-1317c4210b7d'; -- Mencapai Revenue Net B2S ( 365 sekolah/@55jt)
UPDATE `key_result` SET `current_value` = 80, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = 'f9d74595-5e69-4772-aff1-ca42e10d7efb'; -- Tingkat Kesuksesan Layanan 80%
UPDATE `key_result` SET `current_value` = 80, `status` = 'ON_TRACK', `is_manual_override` = 0 WHERE `id` = 'fd30d389-129a-476c-a307-c0c3d911be46'; -- 80% coverage audit & verifikasi keandalan data single source of truth development (Sprint backlog)

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
