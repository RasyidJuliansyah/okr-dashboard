# Rencana Aksi: Decoupling Key Result dari Sprint & Normalisasi Data

## 1. Analisis & Baseline
- Total Objective: 18 (15 dengan `year = 'Q3-2026'`, 3 dengan `year = '2026'`).
- Total KR aktif: 42 (25 di bawah Q3-2026, 17 di bawah 2026).
- Sprint aktif: `96b2af15-10ab-4a38-8166-a1aab7710057` (`Sprint Oktober 2026`).
- Masalah utama:
  1. Fragmentasi `year` pada Objective (`Q3-2026` vs `2026`).
  2. `sprint.service.ts` memfilter KR hanya yang memiliki inisiatif/sprintTarget di sprint bersangkutan sehingga total KR drop dari 42 ke 19.
  3. `bsc.controller.ts` memfilter `KeyResult.month` secara strict string match.
  4. Kolom `month` pada KR dan `sprintMonth` pada Initiative/Task bercampur string nama bulan dan UUID sprint.

---

## 2. Rencana Eksekusi

### Langkah 1: Script Migrasi & Normalisasi DB
- Objective:
  - Update semua `Objective` dengan `year = 'Q3-2026'` menjadi `year = '2026'`, `quarter = 'Q3'`.
- Initiative & Task:
  - Set `sprintMonth = sprintId` pada seluruh record.
- KeyResult:
  - Set `month` pada KR menjadi `sprint.id` aktif (`96b2af15-10ab-4a38-8166-a1aab7710057`) jika null atau format YYYY-MM.
- Schema Prisma:
  - Ubah default `Objective.year` dari `"Q3-2026"` menjadi `"2026"`.

### Langkah 2: Update Controller & Service
- `backend/src/services/sprint.service.ts`:
  - Di `getSprintReportData`: jangan buang KR yang tidak punya inisiatif sprint.
  - Return semua 42 KR aktif tahun 2026.
  - Inisiatif dan Task tetap discoped per sprint.
- `backend/src/controllers/bsc.controller.ts`:
  - Di `getCLevelBscDashboard`: hilangkan filter strict `KeyResult.month`.
  - KR selalu di-query seluruhnya (42 KR aktif).
  - Filter `month` hanya membatasi relasi inisiatif di dalam KR.
- `backend/src/controllers/keyresult.controller.ts`, `initiative.controller.ts`, `task.controller.ts`:
  - Pastikan fallback `month` dan `sprintMonth` mengacu ke sprint UUID aktif, bukan string manual.

### Langkah 3: Penyesuaian Frontend
- `frontend/app/pages/admin/objectives.vue`:
  - Ubah filter tahun: ganti opsi `Q1-2026..Q4-2026` dengan `2026`, `2027`, `Semua`. Default: `2026`.
  - Form create/edit Objective default `year: '2026'`.
- `frontend/app/pages/c-level.vue`:
  - Pastikan filter bulan kompatibel dan jumlah KR tetap 42.

---

## 3. Verifikasi
1. Hitung record via Prisma Node CLI:
   - 18 Objective ber-`year = '2026'`.
   - 42 Key Result aktif.
   - 101 Inisiatif dengan `sprintMonth = sprintId`.
   - 287 Task dengan `sprintMonth = sprintId`.
2. Tes API endpoints:
   - `GET /api/objectives?year=2026` -> 42 KR.
   - `GET /api/bsc/c-level-dashboard` -> 42 KR.
   - `GET /api/sprints/96b2af15-10ab-4a38-8166-a1aab7710057/report` -> 42 KR.
