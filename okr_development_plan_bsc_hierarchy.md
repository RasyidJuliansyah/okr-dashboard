# 📋 Technical Implementation Document

## OKR Dashboard — Keterkaitan Task ↔ Inisiatif ↔ KR Bulanan ↔ BSC Tahunan

**Tanggal:** 19 Agustus 2026
**Dibuat oleh:** Senior Developer / AI Architect
**Dieksekusi oleh:** Junior Developer (dengan bantuan AI model kecil, mis. untuk boilerplate CRUD/Vue form)
**Prasyarat baca:** [docs/ERD.md](docs/ERD.md), [backend/src/prisma/schema.prisma](backend/src/prisma/schema.prisma)

---

## 0. Model Bisnis yang Disepakati

```
Objective (tahunan, per BSC perspective)
  └─ AnnualKeyResult (BSC Tahunan)         ← ENTITAS BARU
       └─ KeyResult (KR Bulanan, existing) ← tambah bulan + bobot
            └─ Initiative (P-level, existing)
                 └─ Task (T-level, rename dari Kpi)
```

Aturan korelasi:

1. **Task (T-level)** WAJIB dibuat di bawah sebuah **Initiative** (P-level). Sudah terpenuhi di schema saat ini (`Kpi.initiativeId` wajib) — hanya perlu rename konsep + tambah `weight`.
2. **Initiative (P-level)** WAJIB berdampak ke sebuah **KeyResult Bulanan**. Sudah terpenuhi (`Initiative.keyResultId` wajib).
3. **KeyResult Bulanan** capaiannya **HANYA** boleh berasal dari agregasi Task → Initiative dalam bulan/sprint tsb (bukan input manual bebas). Ini perubahan kebijakan — lihat §3.4.
4. **AnnualKeyResult (BSC Tahunan)** capaiannya = agregasi weighted-average dari 12 (atau sejumlah) `KeyResult` bulanan yang menjadi anaknya. Entitas baru dengan relasi one-to-many eksplisit ke `KeyResult`.
5. Formula agregasi di semua level: **weighted average**, bobot disimpan sebagai field `weight` di level anak (`Task.weight`, `Initiative.weight` — sudah ada, `KeyResult.monthWeight` — baru).

### Keputusan desain yang disengaja (baca dulu sebelum protes ke reviewer)

- **Model `KeyResult` TIDAK di-rename jadi `MonthlyKeyResult`.** Nama tabel tetap `KeyResult`, tapi secara semantik sekarang = "KR Bulanan". Alasan: model ini dipakai di ±10 file (`keyresult.controller.ts`, `causal.controller.ts`, `bsc.controller.ts`, `dashboard.controller.ts`, `initiative.controller.ts`, frontend `bsc-view.vue`, `strategy-map.vue`, dll). Rename nama model = rename di semua tempat itu tanpa manfaat fungsional — risiko bug jauh lebih besar daripada nilai kerapian nama. `AnnualKeyResult` yang baru sudah cukup untuk membedakan level tahunan vs bulanan.
- **`Kpi` DIRENAME jadi `Task`** (sesuai keputusan produk) karena nama ini yang dipakai user-facing untuk menjelaskan hierarki T-level → P-level, dan akan muncul di UI/copy baru.
- **Migrasi dilakukan bertahap (additive-first)**: kolom baru selalu ditambah sebagai nullable dulu, diisi (backfill), baru di-*enforce* NOT NULL di migrasi berikutnya. Ini supaya tidak ada downtime/data hilang, dan supaya setiap fase bisa dites terpisah.

---

## FASE 1 — Perubahan Schema Prisma

File: [backend/src/prisma/schema.prisma](backend/src/prisma/schema.prisma)

### 1.1 Rename `Kpi` → `Task` (dan turunannya)

Ganti nama model & field, JANGAN ganti nama tabel fisik lewat drop+create (lihat §2 soal migrasi aman). Field yang berubah nama:

| Lama | Baru |
|---|---|
| `model Kpi` | `model Task` |
| `model KpiAssignment` | `model TaskAssignment` |
| `model KpiUpdate` | `model TaskUpdate` |
| `Kpi.initiativeId` / relasi `initiative` | tetap sama, cuma model induknya ganti nama |
| `KpiAssignment.kpiId` | `TaskAssignment.taskId` |
| `KpiUpdate.kpiId` | `TaskUpdate.taskId` |
| relasi `Initiative.kpis` | `Initiative.tasks` |

Tambahkan field baru di `Task` (untuk weighted average, keputusan §0):

```prisma
model Task {
  id           String          @id @default(uuid())
  initiativeId String
  initiative   Initiative      @relation(fields: [initiativeId], references: [id])
  title        String
  targetValue  Float
  currentValue Float           @default(0)
  weight       Float           @default(1.0)   // BARU — bobot task dalam agregasi ke Initiative
  unit         String?
  status       String          @default("ON_TRACK")
  assignments  TaskAssignment[]
  updates      TaskUpdate[]
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
}
```

`TaskAssignment` dan `TaskUpdate` sama persis dengan `KpiAssignment`/`KpiUpdate` lama, cuma field `kpiId` → `taskId` dan unique constraint `[taskId, userId]`.

Update juga relasi di `Initiative`: `kpis Kpi[]` → `tasks Task[]`.

### 1.2 Model baru `AnnualKeyResult`

```prisma
model AnnualKeyResult {
  id             String      @id @default(uuid())
  objectiveId    String
  objective      Objective   @relation(fields: [objectiveId], references: [id])
  title          String
  description    String?
  targetValue    Float
  currentValue   Float       @default(0)
  unit           String
  bscPerspective String
  year           String      // contoh: "2026"
  status         String      @default("ON_TRACK")
  keyResults     KeyResult[]
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  @@index([objectiveId])
  @@index([year])
}
```

Tambahkan relasi balik di `Objective`: `annualKeyResults AnnualKeyResult[]`.
Tambahkan field `year String?` di `Objective` (nullable dulu, backfill dari `quarter`, contoh `"Q3-2026"` → `"2026"`). Field `quarter` **tidak dihapus** — masih dipakai fitur existing (per-kuartal), `year` cuma dipakai untuk mengelompokkan BSC tahunan.

### 1.3 Update `KeyResult` (jadi KR Bulanan eksplisit)

```prisma
model KeyResult {
  id                String           @id @default(uuid())
  objectiveId       String
  objective         Objective        @relation(fields: [objectiveId], references: [id])
  annualKeyResultId String?          // BARU, nullable di Fase 1
  annualKeyResult   AnnualKeyResult? @relation(fields: [annualKeyResultId], references: [id])
  month             String?          // BARU, contoh "2026-08", nullable di Fase 1
  monthWeight       Float            @default(1.0)  // BARU — bobot bulan ini dalam agregasi ke AnnualKeyResult
  title             String
  targetValue       Float
  currentValue      Float            @default(0)
  unit              String
  bscPerspective    String
  status            String           @default("ON_TRACK")
  isManualOverride  Boolean          @default(false)  // BARU, lihat §3.4
  ...
  @@index([annualKeyResultId])
  @@index([month])
}
```

`objectiveId` pada `KeyResult` **tetap dipertahankan** (jangan dihapus) — dipakai sebagai fallback selama masa transisi dan oleh KR lama yang belum di-assign ke `AnnualKeyResult` manapun.

### 1.4 Checklist migrasi Prisma

```bash
cd backend
npx prisma migrate dev --name add_annual_kr_and_task_rename --create-only
```

**JANGAN langsung `prisma migrate dev` tanpa `--create-only`.** Prisma akan generate diff otomatis, tapi untuk rename model (`Kpi`→`Task` dll) diff default-nya adalah **DROP TABLE Kpi + CREATE TABLE Task** yang **menghapus semua data**. Edit file SQL yang di-generate secara manual sebelum di-apply — lihat FASE 2.

---

## FASE 2 — Migrasi Data Aman (Rename Tabel Tanpa Kehilangan Data)

Setelah `--create-only`, buka file migrasi baru di `backend/src/prisma/migrations/<timestamp>_add_annual_kr_and_task_rename/migration.sql`, dan **ganti isinya** (bukan tambah) dengan urutan berikut:

```sql
-- 1. Rename tabel (bukan drop+create!)
RENAME TABLE `Kpi` TO `Task`;
RENAME TABLE `KpiAssignment` TO `TaskAssignment`;
RENAME TABLE `KpiUpdate` TO `TaskUpdate`;

-- 2. Rename kolom FK di tabel yang baru di-rename
ALTER TABLE `TaskAssignment` RENAME COLUMN `kpiId` TO `taskId`;
ALTER TABLE `TaskUpdate` RENAME COLUMN `kpiId` TO `taskId`;

-- 3. Tambah kolom baru (semua nullable / ada default supaya aman untuk data existing)
ALTER TABLE `Task` ADD COLUMN `weight` DOUBLE NOT NULL DEFAULT 1.0;

ALTER TABLE `Objective` ADD COLUMN `year` VARCHAR(191) NULL;

ALTER TABLE `KeyResult` ADD COLUMN `annualKeyResultId` VARCHAR(191) NULL;
ALTER TABLE `KeyResult` ADD COLUMN `month` VARCHAR(191) NULL;
ALTER TABLE `KeyResult` ADD COLUMN `monthWeight` DOUBLE NOT NULL DEFAULT 1.0;
ALTER TABLE `KeyResult` ADD COLUMN `isManualOverride` BOOLEAN NOT NULL DEFAULT false;

-- 4. Tabel baru
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
  PRIMARY KEY (`id`),
  INDEX `AnnualKeyResult_objectiveId_idx`(`objectiveId`),
  INDEX `AnnualKeyResult_year_idx`(`year`)
) DEFAULT CHARACTER SET utf8mb4;

ALTER TABLE `AnnualKeyResult` ADD CONSTRAINT `AnnualKeyResult_objectiveId_fkey`
  FOREIGN KEY (`objectiveId`) REFERENCES `Objective`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `KeyResult` ADD CONSTRAINT `KeyResult_annualKeyResultId_fkey`
  FOREIGN KEY (`annualKeyResultId`) REFERENCES `AnnualKeyResult`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
```

> Sesuaikan tipe kolom (`VARCHAR(191)`, `DOUBLE`, dll) dengan konvensi Prisma+MySQL yang sudah dipakai di migrasi sebelumnya (cek `backend/src/prisma/migrations/*/migration.sql` yang sudah ada dari migrasi MySQL kemarin, [MIGRATION_MYSQL.md](MIGRATION_MYSQL.md)/[docs/MYSQL_MIGRATION.md](docs/MYSQL_MIGRATION.md)).

Baru setelah file SQL ini benar, jalankan:

```bash
npx prisma migrate dev
npx prisma generate
```

**Verifikasi wajib sebelum lanjut:** `npx prisma studio` → cek tabel `Task` masih berisi data lama yang sebelumnya ada di `Kpi` (jumlah baris sama), begitu juga `TaskAssignment`/`TaskUpdate`.

### 2.1 Backfill data (script sekali jalan)

Buat `backend/src/prisma/backfill-annual-kr.ts`:

- Untuk setiap `Objective`, isi `year` dari `quarter` (ambil 4 digit angka terakhir, kalau tidak ada pakai `"2026"` sebagai default eksplisit — TANYA product owner kalau ada data ambigu, jangan ditebak diam-diam).
- Untuk setiap `Objective`, buat **satu** `AnnualKeyResult` per kombinasi `(objectiveId unik, bscPerspective unik dari KeyResult anak-anaknya)` — judul = `"BSC Tahunan - " + <bscPerspective> + " - " + <objective.title>`, `targetValue`/`unit` disalin dari salah satu KR anak sebagai starting point (nanti diedit manual oleh admin lewat UI Fase 6).
- Set `KeyResult.annualKeyResultId` mengarah ke `AnnualKeyResult` yang baru dibuat, dan `KeyResult.month` = bulan berjalan saat backfill (`"2026-08"`) sebagai default, supaya tidak NULL.

Jalankan sekali: `npx ts-node src/prisma/backfill-annual-kr.ts`, lalu cek manual lewat Prisma Studio bahwa setiap `KeyResult` sudah punya `annualKeyResultId` dan `month`.

---

## FASE 3 — Backend: Logika Cascade & Agregasi

File: [backend/src/controllers/initiative.controller.ts](backend/src/controllers/initiative.controller.ts)

### 3.1 Rename semua fungsi/endpoint Kpi → Task

Cari-dan-ganti (case sensitive) di `initiative.controller.ts`, `initiative.routes.ts`, dan file frontend yang memanggilnya:

| Lama | Baru |
|---|---|
| `createKpi`, `updateKpi`, `deleteKpi` | `createTask`, `updateTask`, `deleteTask` |
| `assignUsersToKpi` | `assignUsersToTask` |
| `submitKpiUpdate`, `approveKpiUpdate`, `rejectKpiUpdate`, `getPendingKpiUpdates` | `submitTaskUpdate`, `approveTaskUpdate`, `rejectTaskUpdate`, `getPendingTaskUpdates` |
| `cascadeKpiValueUpdate` | `cascadeTaskValueUpdate` |
| `prisma.kpi` / `prisma.kpiAssignment` / `prisma.kpiUpdate` | `prisma.task` / `prisma.taskAssignment` / `prisma.taskUpdate` |
| route `/api/kpis/...` | `/api/tasks/...` (pertahankan `/api/kpis/...` sebagai alias redirect 301 selama 1 rilis transisi kalau frontend lama masih dipakai, opsional) |

### 3.2 Update `cascadeTaskValueUpdate` — tambah bobot Task

Kode saat ini di [initiative.controller.ts:1077-1127](backend/src/controllers/initiative.controller.ts#L1077-L1127) memakai **rata-rata sederhana** untuk Task→Initiative (`avgKpiPercent`), padahal Initiative→KR sudah weighted. Ubah supaya konsisten weighted di semua level:

```typescript
async function cascadeTaskValueUpdate(taskId: string, initiativeId: string): Promise<void> {
  // 1. Initiative.currentValue = weighted average dari Task.weight
  const allTasks = await prisma.task.findMany({ where: { initiativeId } });
  const initiative = await prisma.initiative.findUnique({ where: { id: initiativeId } });

  if (initiative && allTasks.length > 0 && initiative.targetValue > 0) {
    const totalTaskWeight = allTasks.reduce((s, t) => s + (t.weight || 1), 0);
    const weightedTaskPercent = allTasks.reduce((sum, t) => {
      const pct = t.targetValue > 0 ? t.currentValue / t.targetValue : 0;
      return sum + pct * (t.weight || 1);
    }, 0) / (totalTaskWeight || 1);
    const newInitiativeValue = Math.round(weightedTaskPercent * initiative.targetValue * 100) / 100;

    await prisma.initiative.update({
      where: { id: initiative.id },
      data: { currentValue: newInitiativeValue },
    });

    // 2. KeyResult (bulanan).currentValue = weighted average Initiative progress (LOGIKA TIDAK BERUBAH)
    //    ... (sama seperti kode existing baris 1093-1124, ganti `kpis` -> `tasks`)

    // 3. BARU — cascade satu level lagi ke AnnualKeyResult
    if (kr?.annualKeyResultId) {
      await cascadeMonthlyKrToAnnual(kr.annualKeyResultId);
    }
  }
}
```

### 3.3 Fungsi baru `cascadeMonthlyKrToAnnual`

Tambahkan di `keyresult.controller.ts` (atau file baru `annualKeyResult.controller.ts` — pilih file baru supaya `initiative.controller.ts` tidak makin gemuk, sudah 1380 baris):

```typescript
export async function cascadeMonthlyKrToAnnual(annualKeyResultId: string): Promise<void> {
  const monthlyKrs = await prisma.keyResult.findMany({ where: { annualKeyResultId } });
  const annualKr = await prisma.annualKeyResult.findUnique({ where: { id: annualKeyResultId } });

  if (!annualKr || monthlyKrs.length === 0 || annualKr.targetValue <= 0) return;

  const totalWeight = monthlyKrs.reduce((s, kr) => s + (kr.monthWeight || 1), 0);
  const weightedPercent = monthlyKrs.reduce((sum, kr) => {
    const pct = kr.targetValue > 0 ? kr.currentValue / kr.targetValue : 0;
    return sum + pct * (kr.monthWeight || 1);
  }, 0) / (totalWeight || 1);

  const newAnnualValue = Math.round(weightedPercent * annualKr.targetValue * 100) / 100;
  const progress = newAnnualValue / annualKr.targetValue;
  const newStatus = progress < 0.5 ? 'OFF_TRACK' : progress < 0.8 ? 'AT_RISK' : 'ON_TRACK';

  await prisma.annualKeyResult.update({
    where: { id: annualKeyResultId },
    data: { currentValue: newAnnualValue, status: newStatus },
  });
}
```

Panggil fungsi ini juga dari: penghapusan `KeyResult` (Fase existing sudah recalc parent saat delete Initiative — tambahkan pemanggilan `cascadeMonthlyKrToAnnual` di titik yang sama), dan dari endpoint update `KeyResult.monthWeight`/`AnnualKeyResult.targetValue` (recalculate saat bobot/target berubah, bukan cuma saat value berubah).

### 3.4 Selesaikan konflik: input manual vs derivasi otomatis

**Masalah existing:** [keyresult.controller.ts:121](backend/src/controllers/keyresult.controller.ts#L121) `updateKeyResultProgress` menulis `KeyResult.currentValue` langsung, terpisah dari `cascadeTaskValueUpdate`. Dua jalur ini bisa saling menimpa nilai satu sama lain.

**Keputusan (sesuai model bisnis §0.3): KR Bulanan yang punya Initiative aktif TIDAK BOLEH lagi diupdate manual.** Nilainya murni derivasi dari Task/Initiative.

Implementasi di `updateKeyResultProgress`:

```typescript
const initiativeCount = await prisma.initiative.count({ where: { keyResultId: id } });
if (initiativeCount > 0) {
  return res.status(400).json({
    message: 'KR ini punya Initiative aktif — update progress harus lewat Task/Initiative, bukan manual.',
  });
}
// Kalau initiativeCount === 0 (KR legacy / belum ada inisiatif), izinkan manual update
// TAPI set isManualOverride = true supaya kelihatan di UI bahwa ini bukan derivasi otomatis.
```

Ini satu-satunya jalan keluar yang konsisten dengan aturan "capaian KR bulanan diperoleh dari task dan inisiatif" tanpa menghapus fitur lama secara destruktif — KR lama yang belum punya Initiative tetap bisa diisi manual sampai ada yang membuat Initiative-nya.

---

## FASE 4 — Endpoint API Baru/Berubah

Tambahkan router baru [backend/src/routes/annualKeyResult.routes.ts](backend/src/routes/annualKeyResult.routes.ts) dan controller [backend/src/controllers/annualKeyResult.controller.ts](backend/src/controllers/annualKeyResult.controller.ts):

| Method | Endpoint | Role | Fungsi |
|---|---|---|---|
| GET | `/api/annual-key-results` | semua | List, filter by `?year=` `?bscPerspective=` |
| GET | `/api/annual-key-results/:id` | semua | Detail + KR bulanan anaknya |
| POST | `/api/annual-key-results` | ADMIN | Create |
| PUT | `/api/annual-key-results/:id` | ADMIN | Update target/title/perspective |
| DELETE | `/api/annual-key-results/:id` | ADMIN | Delete (hanya jika tidak ada KR bulanan anak — validasi dulu) |
| POST | `/api/annual-key-results/:id/link-kr/:krId` | ADMIN | Assign KR bulanan existing ke AnnualKeyResult ini (set `annualKeyResultId`, `monthWeight`) — lalu panggil `cascadeMonthlyKrToAnnual` |

`keyresult.routes.ts`: tambah field `month`, `monthWeight`, `annualKeyResultId` di payload create/update KR (tetap ADMIN only, konsisten dengan aturan role existing).

`initiative.routes.ts`: ganti prefix `/api/kpis` → `/api/tasks` sesuai §3.1.

---

## FASE 5 — Role & Permission (T-level / P-level)

Tidak perlu role baru. Mapping ke role existing:

| Level konsep | Role existing | Aturan create |
|---|---|---|
| Company (BSC Tahunan) | ADMIN, C_LEVEL | create/edit `AnnualKeyResult` — samakan dengan permission `KeyResult` (ADMIN only untuk create, C_LEVEL read + approve) |
| KR Bulanan | ADMIN | tidak berubah dari sekarang |
| P-level (Initiative) | ADMIN, MANAGER, LEADER, TEAM | tidak berubah dari sekarang |
| T-level (Task) | ADMIN, MANAGER, LEADER (create); TEAM (submit update saja) | tidak berubah dari sekarang, cuma rename |

Validasi baru yang WAJIB ditambahkan di `createTask`/`updateTask` (backend/src/controllers/initiative.controller.ts, fungsi `createKpi` sebelum di-rename): **tolak create Task tanpa `initiativeId` valid** (kemungkinan besar sudah begitu karena FK NOT NULL — cukup pastikan error message-nya jelas: `"Task harus terhubung ke Initiative yang valid"`). Sama untuk `createInitiative`: pastikan `keyResultId` valid dan KR tersebut adalah KR Bulanan (`month` tidak null) — tolak kalau initiative dicoba dibuat langsung ke `AnnualKeyResult` (arsitektur tidak mengizinkan Initiative loncat level).

---

## FASE 6 — Frontend (Nuxt/Vue)

### 6.1 Rename Kpi → Task di semua tempat

Cari string `kpi`/`Kpi`/`KPI` (case-insensitive) di `frontend/app/` — kemungkinan besar ada di:
- `frontend/app/pages/admin/initiatives.vue`, `initiatives-kanban.vue`, `update-progress.vue`
- `frontend/app/pages/team/my-work.vue`
- `frontend/app/pages/leader/initiatives.vue`
- `frontend/app/pages/initiatives.vue`

Ganti label UI dari "KPI" jadi "Task" (user-facing), ganti nama variabel/fungsi API call (`fetchKpis`→`fetchTasks`, dll), sesuaikan endpoint ke `/api/tasks`.

### 6.2 Halaman baru: BSC Tahunan

Buat `frontend/app/pages/admin/annual-bsc.vue` (mirip pola `objectives.vue` yang sudah ada):
- List `AnnualKeyResult` per `year` + `bscPerspective`, tampil progress bar dari `currentValue/targetValue`.
- Expand tiap Annual KR → tampilkan daftar `KeyResult` bulanan anaknya (bulan, progress, status) — read-only di sini, editing tetap di halaman KR bulanan existing.
- Form create/edit Annual KR (ADMIN only), termasuk pemilihan `Objective` induk.

### 6.3 Halaman existing yang perlu disentuh

| File | Perubahan |
|---|---|
| `frontend/app/pages/bsc-view.vue` | Ganti sumber data dari agregasi ad-hoc KR (kalau ada) ke `GET /api/annual-key-results` supaya BSC yang ditampilkan konsisten dengan backend, bukan dihitung ulang di frontend |
| `frontend/app/pages/admin/objectives.vue` | Tambah field `month`, `monthWeight` di form create/edit KR; tambah dropdown pilih `AnnualKeyResult` induk (opsional, boleh kosong dulu sampai admin assign lewat halaman 6.2) |
| `frontend/app/pages/kr-history.vue` | Tampilkan badge "Auto (dari Task/Initiative)" vs "Manual Override" berdasarkan `KeyResult.isManualOverride` |
| `frontend/app/components/AppSidebar.vue` | Tambah nav item "BSC Tahunan" untuk role ADMIN/C_LEVEL |

---

## FASE 7 — Testing & Acceptance Criteria

Jalankan berurutan, jangan skip:

1. **Migrasi:** `npx prisma studio` — tabel `Task`/`TaskAssignment`/`TaskUpdate` berisi data yang sama persis dengan `Kpi`/`KpiAssignment`/`KpiUpdate` sebelumnya (cek jumlah baris & beberapa sample row).
2. **Backfill:** setiap `KeyResult` existing punya `annualKeyResultId` dan `month` terisi (query `SELECT COUNT(*) FROM KeyResult WHERE annualKeyResultId IS NULL` harus 0 setelah backfill, kecuali memang sengaja dibiarkan NULL untuk KR yang belum dikelompokkan — dokumentasikan mana yang sengaja).
3. **Cascade end-to-end:** submit Task update (role LEADER, auto-approve) → cek `Initiative.currentValue` berubah sesuai weighted average → cek `KeyResult.currentValue` berubah → cek `AnnualKeyResult.currentValue` ikut berubah. Ulangi dengan 2+ Task berbobot beda (`weight` 1 vs 3) untuk memastikan bukan rata-rata sederhana.
4. **Guard manual override:** coba `PUT /api/key-results/:id/progress` pada KR yang punya Initiative → harus ditolak 400. Pada KR tanpa Initiative → harus tetap bisa manual dan `isManualOverride=true` tersimpan.
5. **Role guard:** TEAM coba `POST /api/tasks` tanpa `initiativeId` → 400 dengan pesan jelas. TEAM coba buat Initiative langsung ke `AnnualKeyResult` (kirim `keyResultId` yang sebenarnya adalah id AnnualKeyResult) → 400.
6. **Frontend smoke test:** buka `admin/annual-bsc.vue`, cek angka yang tampil match dengan hasil query manual di Prisma Studio untuk 1 contoh Annual KR.

---

## FASE 8 — Urutan Eksekusi (Checklist Ringkas)

Kerjakan berurutan, satu fase = satu commit, jangan lompat sebelum fase sebelumnya lulus testing di §7:

- [ ] 1. Schema Prisma (§1) — buat migrasi `--create-only`, JANGAN apply dulu
- [ ] 2. Edit SQL migrasi manual (§2), apply, backfill script, verifikasi Prisma Studio
- [ ] 3. Backend: rename Kpi→Task di controller+routes (§3.1)
- [ ] 4. Backend: update `cascadeTaskValueUpdate` + `cascadeMonthlyKrToAnnual` (§3.2-3.3)
- [ ] 5. Backend: guard manual override di `updateKeyResultProgress` (§3.4)
- [ ] 6. Backend: endpoint `AnnualKeyResult` CRUD (§4)
- [ ] 7. Backend: validasi role/hierarki create Task & Initiative (§5)
- [ ] 8. Testing backend murni via curl/Postman sebelum sentuh frontend (§7 poin 1-5)
- [ ] 9. Frontend: rename Kpi→Task di semua halaman (§6.1)
- [ ] 10. Frontend: halaman `annual-bsc.vue` baru (§6.2)
- [ ] 11. Frontend: sentuh halaman existing (§6.3)
- [ ] 12. Testing end-to-end + update [docs/ERD.md](docs/ERD.md) supaya diagram-nya sinkron dengan schema baru

---

## Risiko & Keputusan Terbuka (perlu jawaban product owner sebelum FASE 2)

1. Untuk `Objective` yang `quarter`-nya tidak mengandung 4 digit tahun yang jelas — default `year` apa? (Rekomendasi: `"2026"`, tapi flag manual review.)
2. Satu `Objective` bisa punya lebih dari satu `AnnualKeyResult` (satu per BSC perspective)? Dokumen ini asumsikan **ya** (§2.1). Kalau ternyata harus 1:1, backfill script perlu diubah.
3. KR bulanan lama yang statusnya sudah "selesai" (kuartal lalu) — apa perlu tetap di-link ke `AnnualKeyResult` tahun tsb untuk histori, atau dibiarkan orphan? Rekomendasi: tetap di-link supaya histori BSC tahunan akurat.
