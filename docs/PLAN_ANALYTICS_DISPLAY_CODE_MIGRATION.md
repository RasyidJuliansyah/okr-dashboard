# Plan: Penambahan Kolom Bantu Display ID / Human-Friendly Code untuk Analytics

**Status**: DRAFT (Siap dieksekusi)  
**Tanggal**: 5 Oktober 2026  
**Target Environment**: MySQL 8.0+ (Local Port 3307 & Production)  

---

## 1. Latar Belakang & Kebutuhan
- **Masalah**: Primary key eksisting menggunakan format UUID (`CHAR(36)` / string acak). Hal ini menyulitkan proses analitik, BI report (Metabase, Tableau), referensi data silang antar-tim, dan pelacakan manual.
- **Kebutuhan**: Kolom bantu berurutan (*autoincrement*) dengan format teks *zero-padded* (misal `001`, `000001`, `TSK-000001`) yang bersifat *human-friendly* tanpa merusak relasi Foreign Key UUID yang sudah berjalan.

---

## 2. Arsitektur Teknis MySQL

MySQL mensyaratkan kolom `AUTO_INCREMENT` bertipe integer dan memiliki indeks (`UNIQUE` / `KEY`). Generated Column tidak bisa langsung diberi atribut `AUTO_INCREMENT`.

Solusi standar dan skalabel:
1. **Kolom Mesin (`seq`)**:
   - Tipe: `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE`
   - Fungsi: Menghasilkan counter urutan nomor secara native & thread-safe di level engine InnoDB.
2. **Kolom Teks / Human-Friendly (`code` / `display_code`)**:
   - Tipe: `VARCHAR(24) GENERATED ALWAYS AS (CONCAT('<PREFIX>-', LPAD(seq, 6, '0'))) STORED`
   - Fungsi: Otomatis dihitung dan disimpan secara fisik (*STORED*) sehingga query `SELECT`, `WHERE`, dan `JOIN` untuk analitik sangat cepat (bisa diindeks).

---

## 3. Rekomendasi Format & Penamaan (Scalable Pattern)

Format standar: `<PREFIX>-<6_DIGIT_SEQ>`  
Kapasitas: 1 s/d 999.999 data per tabel (sangat aman untuk Task, KR, Inisiatif jangka panjang tanpa overflow).

| Tabel | Prefix | Contoh Nilai | Prioritas |
|---|---|---|---|
| `objective` | `OBJ` | `OBJ-000001` | Utama (Bisnis) |
| `annual_key_result` | `AKR` | `AKR-000001` | Utama (Bisnis) |
| `key_result` | `KR` | `KR-000001` | Utama (Bisnis) |
| `initiative` | `INT` | `INT-000001` | Utama (Bisnis) |
| `task` | `TSK` | `TSK-000001` | Utama (Bisnis & Analitik) |
| `user` | `USR` | `USR-000001` | Entitas Master |
| `team` | `TEM` | `TEM-000001` | Entitas Master |
| `department` | `DPT` | `DPT-000001` | Entitas Master |
| `sprint` | `SPT` | `SPT-000001` | Entitas Pendukung |
| `kpi` | `KPI` | `KPI-000001` | Entitas Pendukung |
| `task_comment` | `CMT` | `CMT-000001` | Log/Aktivitas |
| `task_update` | `TKU` | `TKU-000001` | Log/Aktivitas |
| `kr_update` | `KRU` | `KRU-000001` | Log/Aktivitas |
| `audit_log` | `LOG` | `LOG-000001` | Log/Aktivitas |
| `notification` | `NTF` | `NTF-000001` | Log/Aktivitas |
| Pivot Tables (`task_assignment`, `kr_assignment`, dll.) | *Opsional* | Cukup `seq` atau diabaikan jika murni relasi M-to-M. |

---

## 4. Pola SQL Alteration Template

Contoh penambahan pada tabel `task`:

```sql
-- 1. Tambah kolom seq autoincrement
ALTER TABLE `task`
ADD COLUMN `seq` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
ADD UNIQUE KEY `uq_task_seq` (`seq`);

-- 2. Tambah virtual/generated column untuk display ID
ALTER TABLE `task`
ADD COLUMN `display_code` VARCHAR(24)
GENERATED ALWAYS AS (CONCAT('TSK-', LPAD(`seq`, 6, '0'))) STORED,
ADD INDEX `idx_task_display_code` (`display_code`);
```

---

## 5. Pertimbangan & Checklist Eksekusi Besok

1. **Konfirmasi Final Lingkup Tabel**:
   - Opsi A: Hanya entitas bisnis utama (Objective, AKR, KR, Initiative, Task, User, Team, Department) — Total ~8 tabel.
   - Opsi B: Seluruh tabel dalam skema (24 tabel termasuk audit log & pivot).
2. **Urutan Backfill Data Lama**:
   - Jika ingin urutan `seq` sama persis dengan urutan pembuatan data lama (`created_at ASC`), MySQL perlu diurutkan sebelum `AUTO_INCREMENT` dibuat aktif, atau dibiarkan urutan alami fisik tabel.
3. **Sinkronisasi `schema.prisma`**:
   - Menambahkan field `seq BigInt?` dan `displayCode String? @map("display_code")` di `schema.prisma` agar Prisma Client bisa membaca nilai ini ke frontend/API bila sewaktu-waktu dibutuhkan.
