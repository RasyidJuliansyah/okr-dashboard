# Status Pengembangan — OKR Dashboard

**Tanggal audit:** 18 Agustus 2026 · **Commit:** `a8ffde8` · **Working tree:** bersih

Dokumen ini memetakan apa yang **benar-benar ada di kode** per hari ini — bukan apa yang direncanakan — supaya perencanaan fitur berikutnya berangkat dari kondisi nyata. Semua klaim di sini punya rujukan file dan baris.

Dokumen pendamping:

- [ERD.md](ERD.md) — struktur data lengkap
- [../okr-dashboard-rbac-visibility-prd.md](../okr-dashboard-rbac-visibility-prd.md) — PRD 11 Agustus 2026
- [../okr_development_plan.md](../okr_development_plan.md) — dokumen teknis FASE 0–4 (10 Agustus 2026)
- [../DesignSystem.md](../DesignSystem.md) — token desain Skolla

---

## 1. Ringkasan

|              |                                                                                       |
| ------------ | ------------------------------------------------------------------------------------- |
| **Backend**  | Express 4 + TypeScript + Prisma 5 + SQLite · 10 controller (3.355 baris), 55 endpoint |
| **Frontend** | Nuxt 4 + Vue 3 + Pinia · 19 halaman, 4 komponen (21.214 baris) · Chart.js, Vue Flow   |
| **Auth**     | JWT HS256, masa berlaku 24 jam, disimpan di `localStorage`                            |
| **Deploy**   | Dockerfile backend + frontend, `docker-compose.yml`, `ecosystem.config.js` (PM2)      |
| **Kualitas** | Tidak ada test, CI, linter, maupun formatter                                          |
| **Database** | 1 file migration (6 tabel) — 7 tabel sisanya dibuat lewat `db push`                   |

### Riwayat pengembangan

| Tanggal       | Commit               | Isi                                                                                 |
| ------------- | -------------------- | ----------------------------------------------------------------------------------- |
| 3–10 Jul 2026 | `6b7873c`…`696db01`  | MVP: OKR, strategy map, responsive shell, perbandingan rentang tanggal              |
| 12 Agu 2026   | `6356924`            | C-Level Executive BSC Dashboard, perbaikan cascade delete KR, perbaikan bulk upload |
| 13 Agu 2026   | `4e8cd02`            | Dukungan Docker                                                                     |
| 18 Agu 2026   | `5f391a3`, `a8ffde8` | Kartu inisiatif, bulk upload, update schema Prisma, tambah `prod.db`                |

---

## 2. Arsitektur otorisasi

Setiap request melewati tiga gerbang, tapi hanya dua yang sistematis:

| Gerbang               | Letak                                                                     | Cakupan                                  |
| --------------------- | ------------------------------------------------------------------------- | ---------------------------------------- |
| 1. `authMiddleware`   | [auth.middleware.ts:16](../backend/src/middleware/auth.middleware.ts#L16) | Semua endpoint kecuali `/api/auth/login` |
| 2. `roleGuard([...])` | [auth.middleware.ts:37](../backend/src/middleware/auth.middleware.ts#L37) | Terpasang per route, deklaratif          |
| 3. Scoping query      | Di dalam masing-masing controller                                         | **Ad-hoc — 4 endpoint melewatinya**      |

Gerbang 3 adalah yang menentukan "role ini boleh lihat baris yang mana", dan tidak ada abstraksi bersama untuk itu. Setiap controller menuliskan logikanya sendiri, sehingga definisi "departemen milik Manager" pun berbeda antar file:

- [dashboard.controller.ts:76](../backend/src/controllers/dashboard.controller.ts#L76) memakai `User.department`
- [initiative.controller.ts:78](../backend/src/controllers/initiative.controller.ts#L78) memakai `Department.managerId` **union** `User.department`
- [keyresult.controller.ts:443](../backend/src/controllers/keyresult.controller.ts#L443) memakai `Department.managerId` **union** `User.department`

---

## 3. Peta kemampuan per role

Diambil dari `roleGuard` di folder [routes/](../backend/src/routes/) digabung dengan pengecekan di dalam controller.

| Kemampuan                             |   ADMIN    |  C_LEVEL   |  MANAGER   |    LEADER    |        TEAM        |
| ------------------------------------- | :--------: | :--------: | :--------: | :----------: | :----------------: |
| Lihat dashboard (ter-scope)           | perusahaan | perusahaan | departemen | tim dipimpin |    tim sendiri     |
| Buat / hapus Objective                |     ✅     |     —      |     —      |      —       |         —          |
| Buat / ubah / hapus KR                |     ✅     |     —      |     —      |      —       |         —          |
| Update capaian KR                     |     ✅     |     —      |     —      |      —       |         —          |
| Assign RACI ke KR                     |     ✅     |     —      |     ✅     |      —       |         —          |
| Lihat riwayat KR                      |     ✅     |     ✅     |     ✅     |      ✅      |         ✅         |
| Buat / ubah Initiative                |     ✅     |     —      |     ✅     |      ✅      | ✅ (milik sendiri) |
| Hapus Initiative                      |     ✅     |     —      |     ✅     |      ✅      |         —          |
| Geser kartu Kanban                    |     ✅     |     —      |     ✅     |      ✅      | ✅ (milik sendiri) |
| Buat / ubah KPI                       |     ✅     |     —      |     ✅     |      ✅      |         —          |
| Hapus KPI                             |     ✅     |     —      |     —      |      —       |         —          |
| Assign user ke KPI                    |     ✅     |     —      |     ✅     |      ✅      |         —          |
| Submit update KPI                     |     —      |     —      |     —      |      —       |         ✅         |
| Approve / reject update KPI           |     ✅     |     —      |     ✅     |      ✅      |         —          |
| Buat causal link                      |     ✅     |     —      |     —      |      —       |         —          |
| **Ubah / hapus causal link**          |     ✅     |     ✅     |     ✅     |      ✅      |         ✅         |
| Kelola pegawai & tim                  |     ✅     |     —      |     —      |      —       |         —          |
| Bulk upload (Objective/KR/Initiative) |     ✅     |     —      |     —      |      —       |         —          |

Baris yang ditebalkan adalah celah otorisasi, bukan keputusan desain — lihat temuan S-1.

### Pergeseran dari PRD

PRD menetapkan Non-Goal: _"Tidak membangun kemampuan create/edit Initiative atau KPI oleh role selain Admin."_ Implementasi sekarang mengizinkan MANAGER, LEADER, dan TEAM membuat Initiative, serta MANAGER dan LEADER membuat KPI. Ini pergeseran yang disengaja dan masuk akal (akuntabilitas turun ke tim), tapi **PRD belum diperbarui**, sehingga dokumen rujukan dan kode sudah tidak sinkron.

---

## 4. Status fitur

| Fitur                               | Backend | Frontend | Catatan                                           |
| ----------------------------------- | ------- | -------- | ------------------------------------------------- |
| Login & sesi JWT                    | ✅      | ✅       | Tidak ada refresh token, tidak ada ganti password |
| Objective & Key Result CRUD         | ✅      | ✅       | `admin/objectives.vue` (2.634 baris)              |
| RACI Matrix                         | ✅      | ✅       | Validasi tepat 1 R + minimal 1 A                  |
| Update capaian KR + riwayat         | ✅      | ✅       | Status otomatis: <50% OFF_TRACK, <80% AT_RISK     |
| BSC 4 perspektif                    | ✅      | ✅       | `bsc-view.vue`                                    |
| Strategy / Causal Map               | ✅      | ✅       | Vue Flow · **0 causal link di database**          |
| C-Level Executive Dashboard         | ✅      | ⚠️       | Base URL di-hardcode — lihat B-3                  |
| Initiative + Kanban 4 kolom         | ✅      | ✅       | TODO / IN_PROGRESS / DONE / **DROP**              |
| KPI di bawah Initiative             | ✅      | ✅       | **0 KPI di database**                             |
| Submit → approve update KPI         | ✅      | ✅       | **0 update di database**                          |
| Auto-rollup KPI → Initiative → KR   | ✅      | —        | Hanya berjalan saat approve; lihat C-2            |
| Manajemen pegawai + bulk CSV        | ✅      | ✅       | Password default `SkollaEdu` untuk semua          |
| Struktur departemen & tim           | ✅      | ✅       | `departments.vue`                                 |
| Bulk upload Objective/KR/Initiative | ✅      | ✅       | `BulkUploadModal.vue` (1.308 baris)               |
| Perbandingan rentang tanggal        | ❌      | ✅       | **Regresi** — lihat R-1                           |
| Dark / light mode                   | —       | ❌       | Dinonaktifkan; lihat R-3                          |

---

## 5. Kondisi data aktual

Dari `backend/src/prisma/dev.db` per 18 Agustus 2026:

| Tabel        | Baris |     | Tabel         | Baris |
| ------------ | ----: | --- | ------------- | ----: |
| User         |    53 |     | Initiative    | **3** |
| Team         |    17 |     | Kpi           | **0** |
| Department   |    16 |     | KpiAssignment | **0** |
| Objective    |    14 |     | KpiUpdate     | **0** |
| KeyResult    |    52 |     | CausalLink    | **0** |
| KrAssignment |    95 |     |               |       |

**Ini temuan paling penting untuk perencanaan.** Lapisan atas (Objective → KR → RACI) sudah dipakai sungguhan: 52 KR dengan 95 penugasan RACI. Lapisan bawah — Initiative, KPI, alur approval — yang justru jadi inti PRD dan menyerap porsi pengembangan terbesar bulan Agustus, praktis **belum terpakai**: 3 inisiatif, nol KPI, nol update.

Konsekuensinya:

1. Alur approval Team → Manager belum pernah dijalankan dengan data nyata, jadi belum tervalidasi di lapangan.
2. Auto-rollup KPI → Initiative → KR belum pernah aktif, sehingga bug C-2 belum kelihatan.
3. Strategy Map merender 52 node tanpa satu pun garis penghubung — halaman causal map secara efektif kosong.

Sebelum menambah fitur baru di lapisan ini, yang lebih dibutuhkan kemungkinan besar adalah **adopsi**: mengapa tim belum mengisinya. Menambah fitur di atas lapisan yang belum dipakai berisiko menumpuk kode yang tidak tervalidasi.

---

## 6. Temuan teknis

Diurutkan dari yang paling menghambat. Kode temuan dipakai lagi di bagian backlog.

### Blocker deployment

**B-1 · Migration drift: 7 dari 13 tabel tidak punya file migration**

Satu-satunya migration, `20260706074420_init`, hanya membuat `User`, `Team`, `Objective`, `KeyResult`, `KrUpdate`, `CausalLink`. Tujuh tabel lain — `KrAssignment`, `KrDepartment`, `Initiative`, `Kpi`, `KpiAssignment`, `KpiUpdate`, `Department` — ada di database dan di `schema.prisma`, tapi dibuat lewat `prisma db push` tanpa migration.

Akibatnya `prisma migrate deploy` di server baru menghasilkan database yang kehilangan separuh schema, dan aplikasi gagal di hampir semua endpoint.

**B-2 · Docker tidak pernah menyiapkan schema database**

[backend/Dockerfile](../backend/Dockerfile) menjalankan `prisma generate` dan `tsc`, lalu langsung `node dist/index.js`. Tidak ada `migrate deploy`, `db push`, maupun seed. Sementara [docker-compose.yml](../docker-compose.yml) mengarahkan `DATABASE_URL` ke `/app/database/prod.db` di volume kosong. Container backend menyala dengan database **tanpa tabel sama sekali**.

`backend/src/prisma/prod.db` yang ikut ter-commit berukuran 0 byte, jadi tidak menolong.

**B-3 · Base URL di-hardcode di halaman C-Level**

[c-level.vue:388](../frontend/app/pages/c-level.vue#L388) memanggil `http://localhost:3001/api/bsc/c-level-dashboard` secara literal, mengabaikan `NUXT_PUBLIC_API_BASE`. Executive Dashboard — fitur terbaru — pasti gagal begitu di-deploy. 18 halaman lain memakai `useRuntimeConfig()` dengan benar.

### Keamanan & otorisasi

**S-1 · Causal link bisa diubah dan dihapus semua role**

[causal.routes.ts:12-13](../backend/src/routes/causal.routes.ts#L12-L13): `PUT` dan `DELETE /api/causal-links/:id` hanya memakai `authMiddleware`, tanpa `roleGuard`, padahal `POST` dibatasi ADMIN. Setiap user yang login — termasuk TEAM — bisa mengubah atau menghapus seluruh peta kausalitas perusahaan.

**S-2 · Manager bisa approve update KPI departemen lain**

[initiative.controller.ts:792](../backend/src/controllers/initiative.controller.ts#L792) hanya memvalidasi scope untuk role LEADER. MANAGER dan ADMIN lolos tanpa pengecekan, sehingga Manager departemen mana pun bisa menyetujui atau menolak update KPI tim mana pun. Berlaku sama di `rejectKpiUpdate` ([baris 898](../backend/src/controllers/initiative.controller.ts#L898)).

**S-3 · Antrean approval tidak ter-scope**

[getPendingKpiUpdates](../backend/src/controllers/initiative.controller.ts#L919) mengembalikan **seluruh** `KpiUpdate` berstatus `PENDING_APPROVAL` se-perusahaan, tanpa filter departemen. Bandingkan dengan versi ter-scope di [dashboard.controller.ts:106](../backend/src/controllers/dashboard.controller.ts#L106) — logika yang benar sudah ada, hanya tidak dipakai di endpoint ini.

**S-4 · `GET /api/objectives` mengembalikan seluruh pohon OKR perusahaan ke semua role**

[objective.controller.ts:60](../backend/src/controllers/objective.controller.ts#L60) tidak punya filter role sama sekali, dan menyertakan `keyResults` → `assignments` → `user`, `departments`, serta `initiatives` → `kpis`. Endpoint ini hanya dijaga `authMiddleware`. `getManagerOverview` ([baris 147](../backend/src/controllers/objective.controller.ts#L147)) juga mengembalikan semua objective tanpa filter departemen.

Ini bertentangan langsung dengan Functional Requirement 12 di PRD: _"Filtering dilakukan di level query backend (bukan disembunyikan di frontend saja) untuk setiap endpoint baru maupun yang sudah ada."_ Dashboard summary memang sudah ter-scope, tapi data yang sama bocor lewat pintu sebelah.

**S-5 · Rahasia dan data produksi ter-commit di git**

`.gitignore` di root hanya berisi `node_modules`. Yang ikut terlacak di git:

- `backend/.env` — berisi `JWT_SECRET`
- `backend/src/prisma/dev.db` — 53 user beserta hash bcrypt-nya
- `backend/dist/` — 24 file hasil kompilasi

`docker-compose.yml` juga menuliskan `JWT_SECRET=super-secret-key-change-me-in-production` sebagai literal, dan [auth.middleware.ts:4](../backend/src/middleware/auth.middleware.ts#L4) punya fallback hardcode kalau env tidak diset — jadi deployment tanpa `JWT_SECRET` tetap jalan dengan secret yang diketahui publik.

**S-6 · Password default seragam, tanpa jalur penggantian**

[user.controller.ts:79](../backend/src/controllers/user.controller.ts#L79) dan [baris 205](../backend/src/controllers/user.controller.ts#L205) meng-hash `"SkollaEdu"` untuk setiap pegawai baru, termasuk lewat bulk upload. Tidak ada endpoint ganti password, reset password, atau pemaksaan ganti saat login pertama. 53 akun yang ada sekarang kemungkinan besar masih memakai password ini.

**S-7 · Role melekat di JWT selama 24 jam**

Token membawa `role` ([auth.controller.ts:31](../backend/src/controllers/auth.controller.ts#L31)) dan `roleGuard` membacanya dari token, bukan dari database. Menurunkan atau mencabut hak akses seseorang baru berlaku setelah token lama kedaluwarsa — hingga 24 jam.

### Kebenaran & integritas data

**C-1 · `DELETE /api/objectives/:id` gagal untuk seluruh 14 objective yang ada**

[deleteObjective](../backend/src/controllers/objective.controller.ts#L103) menghapus `KrUpdate`, `CausalLink`, `KeyResult`, lalu `Objective` — tapi melewatkan `KrAssignment`, `KrDepartment`, dan `Initiative`. Foreign key `KrAssignment_keyResultId_fkey` bersifat `ON DELETE RESTRICT`, jadi transaksinya dibatalkan dan user menerima 500.

Query verifikasi menunjukkan **14 dari 14 objective** punya KR yang ber-assignment, artinya fitur hapus objective saat ini gagal 100%. Perbaikannya sudah ada sebagai contoh di [deleteKeyResult](../backend/src/controllers/keyresult.controller.ts#L56) yang cascade-nya sudah lengkap — tinggal diterapkan pola yang sama.

**C-2 · Auto-rollup diam-diam dilewati saat `targetValue` inisiatif nol**

[initiative.controller.ts:821](../backend/src/controllers/initiative.controller.ts#L821) membungkus seluruh kalkulasi cascade dalam `if (initiative && allKpis.length > 0 && initiative.targetValue > 0)`. Padahal `Initiative.targetValue` default-nya `0`, dan form pembuatan inisiatif tidak mewajibkan pengisiannya ([initiative.controller.ts:337](../backend/src/controllers/initiative.controller.ts#L337)).

Jadi untuk inisiatif yang dibuat tanpa target, approve update KPI akan mengubah nilai KPI tapi **tidak** merambat ke Initiative maupun KR — tanpa error, tanpa peringatan. Karena belum ada KPI di database, bug ini belum pernah terlihat.

**C-3 · Bulk upload memasang data ke induk yang salah tanpa memberi tahu**

Tiga jalur fallback diam di [bulkUpload.controller.ts](../backend/src/controllers/bulkUpload.controller.ts):

- [Baris 127](../backend/src/controllers/bulkUpload.controller.ts#L127): KR yang `objectiveId`-nya tidak dikenali dipasang ke `allObjectives[0]` — objective sembarang — dan dihitung `success`.
- [Baris 352](../backend/src/controllers/bulkUpload.controller.ts#L352): Initiative yang timnya tidak dikenali dipasang ke `allTeams[0]`.
- [Baris 116](../backend/src/controllers/bulkUpload.controller.ts#L116): pencocokan objective pakai substring dua arah, sehingga judul pendek gampang menempel ke objective yang keliru.

Ketiganya dilaporkan sebagai sukses, jadi operator tidak punya cara tahu datanya salah tempat.

**C-4 · Bulk upload melewati invarian RACI dan validasi departemen**

[assignUsersToKeyResult](../backend/src/controllers/keyresult.controller.ts#L279-L292) mewajibkan tepat 1 RESPONSIBLE dan minimal 1 ACCOUNTABLE, serta memvalidasi departemen terhadap tabel `Department`. Jalur bulk upload ([baris 189](../backend/src/controllers/bulkUpload.controller.ts#L189) dan [baris 210](../backend/src/controllers/bulkUpload.controller.ts#L210)) tidak melakukan keduanya. KR hasil impor bisa punya nol atau lima RESPONSIBLE, dan `KrDepartment` bisa berisi string departemen yang tidak terdaftar.

**C-5 · Dua sumber kebenaran untuk daftar departemen**

[user.controller.ts:8](../backend/src/controllers/user.controller.ts#L8) memvalidasi departemen pegawai terhadap array hardcode berisi 16 nilai, sementara tabel `Department` punya endpoint `POST /api/departments` untuk menambah departemen baru. Departemen yang dibuat lewat API **tidak bisa** dipakai untuk pegawai sampai array di kode ikut diubah dan backend di-deploy ulang.

**C-6 · `deleteEmployee` hanya memeriksa satu dari tiga relasi**

[user.controller.ts:168](../backend/src/controllers/user.controller.ts#L168) menolak penghapusan bila user punya `KrAssignment`, tapi tidak memeriksa `KpiAssignment` maupun `Initiative.ownerId`. Keduanya juga `RESTRICT`, jadi kasus itu jatuh ke 500 alih-alih pesan yang jelas.

**C-7 · `assignedBy` menyimpan dua jenis nilai**

[keyresult.controller.ts:326](../backend/src/controllers/keyresult.controller.ts#L326) mengisi `req.user.id`; [bulkUpload.controller.ts:204](../backend/src/controllers/bulkUpload.controller.ts#L204) mengisi nama user. Kolom audit lain pun tidak seragam — `KrUpdate.updatedBy` dan `CausalLink.createdBy` menyimpan nama, `KpiUpdate.submittedBy` menyimpan id.

**C-8 · Scope TEAM tidak konsisten antar endpoint**

[getInitiatives](../backend/src/controllers/initiative.controller.ts#L20) memberi role TEAM akses ke inisiatif **seluruh tim dalam departemennya**, sedangkan [getKpisForInitiative](../backend/src/controllers/initiative.controller.ts#L555) menolak dengan 403 bila `initiative.teamId` bukan tim user itu sendiri. Anggota tim bisa melihat kartu inisiatif tim tetangga di board, lalu kena 403 saat membukanya.

### Regresi & kode mati

**R-1 · Perbandingan rentang tanggal: UI utuh, backend-nya hilang**

`dashboard.vue` masih punya date picker, tombol banding, chip delta, dan perhitungan selisih yang membaca `summaryData.previousMetrics` — dan mengirim `compareFrom`/`compareTo` sebagai query param ([dashboard.vue:741](../frontend/app/pages/dashboard.vue#L741)).

Logika itu dulu ada di `dashboard.controller.ts` pada commit `a113bbd` (baris 112–209 versi lama). Commit `6356924` menulis ulang controller untuk scoping role dan **menghapusnya**. Versi sekarang tidak membaca `req.query` sama sekali. Hasilnya UI selalu jatuh ke cabang peringatan "data tidak tersedia".

**R-2 · Sekitar 3.200 baris halaman Vue tidak bisa dijangkau**

Tidak ada satu pun link ke halaman-halaman ini dari sidebar maupun halaman lain:

| Halaman                                                                            | Baris | Duplikat dari     |
| ---------------------------------------------------------------------------------- | ----: | ----------------- |
| [admin/initiatives-kanban.vue](../frontend/app/pages/admin/initiatives-kanban.vue) | 1.448 | `initiatives.vue` |
| [admin/departments.vue](../frontend/app/pages/admin/departments.vue)               | 1.270 | `departments.vue` |
| [leader/initiatives.vue](../frontend/app/pages/leader/initiatives.vue)             |   511 | `initiatives.vue` |

Karena Nuxt memakai file-based routing, semuanya tetap bisa diakses lewat URL langsung. `/leader/initiatives` bahkan tidak dijaga middleware, yang hanya mengecek prefix `/admin` dan `/c-level` ([auth.global.ts:18-24](../frontend/app/middleware/auth.global.ts#L18-L24)).

**R-3 · Sistem tema dimatikan tapi kodenya masih terpasang**

[useTheme.ts](../frontend/app/composables/useTheme.ts) memaksa `dark-theme` dan `toggleTheme()` berisi komentar `// Disabled`. [ThemeToggle.vue](../frontend/app/components/ThemeToggle.vue) hanya berisi komentar, tapi masih dirender di [index.vue:11](../frontend/app/pages/index.vue#L11) sebagai elemen kosong.

**R-4 · Status `DROP` tidak terdokumentasi di schema**

Kanban punya 4 kolom dan backend menerima `DROP` ([initiative.controller.ts:403](../backend/src/controllers/initiative.controller.ts#L403)), tapi komentar di [schema.prisma:134](../backend/src/prisma/schema.prisma#L134) masih menulis `// TODO, IN_PROGRESS, DONE`. Docstring bulk upload ([baris 266](../backend/src/controllers/bulkUpload.controller.ts#L266)) juga masih menyebut tiga status.

### Kebersihan rekayasa

**E-1 · Tidak ada test, CI, linter, atau formatter.** Untuk sistem dengan aturan otorisasi lima role, ini berarti tidak ada jaring pengaman terhadap regresi visibility — persis risiko yang sudah diantisipasi PRD (_"Kesalahan implementasi row-level filtering adalah risiko keamanan data... wajib test khusus per role"_), dan belum tertangani.

**E-2 · 116 pemanggilan `fetch()` manual dengan 52 header `Authorization` yang ditulis ulang.** Tidak ada composable API terpusat, tidak ada penanganan 401 global. Saat token 24 jam kedaluwarsa, halaman gagal diam-diam alih-alih mengarahkan user ke login.

**E-3 · Tidak ada pagination di endpoint mana pun.** `getObjectives` mengambil pohon lengkap sampai level KPI dalam satu query. PRD sudah menandai ini sebagai TBD; dengan 52 KR belum terasa, tapi akan jadi masalah seiring bertambahnya Initiative dan KPI.

**E-4 · SQLite sebagai basis data produksi**, dengan file di volume Docker. Tidak ada backup otomatis, tidak ada replikasi, dan penulisan bersamaan terbatas.

---

## 7. Backlog improvement

Urutan di bawah mendahulukan "buat yang ada sekarang benar dan bisa di-deploy" sebelum "tambah fitur baru", karena data di bagian 5 menunjukkan fitur terakhir yang dibangun pun belum terpakai.

### Fase A — Bisa di-deploy (prasyarat semua yang lain)

| #   | Pekerjaan                                                                                                                        | Rujukan |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ------- |
| A1  | Buat migration untuk 7 tabel yang hilang; jadikan `migrate deploy` satu-satunya jalur perubahan schema                           | B-1     |
| A2  | Tambahkan `prisma migrate deploy` + seed departemen ke entrypoint container                                                      | B-2     |
| A3  | Ganti URL hardcode di `c-level.vue` dengan `useRuntimeConfig()`                                                                  | B-3     |
| A4  | Perluas `.gitignore`; keluarkan `.env`, `*.db`, dan `dist/` dari riwayat git; rotasi `JWT_SECRET`; hapus fallback secret di kode | S-5     |

### Fase B — Tutup celah otorisasi

| #   | Pekerjaan                                                                                                                 | Rujukan  |
| --- | ------------------------------------------------------------------------------------------------------------------------- | -------- |
| B1  | Pasang `roleGuard(['ADMIN'])` pada `PUT`/`DELETE /api/causal-links/:id`                                                   | S-1      |
| B2  | Validasi departemen Manager di `approveKpiUpdate` dan `rejectKpiUpdate`                                                   | S-2      |
| B3  | Scope `getPendingKpiUpdates` per departemen (logikanya sudah ada di dashboard controller)                                 | S-3      |
| B4  | Terapkan scoping role di `getObjectives` dan `getManagerOverview`                                                         | S-4      |
| B5  | Tarik logika scope ke satu helper bersama (`buildScopeFilter(role, userId)`) supaya definisi "departemen Manager" tunggal | Bagian 2 |
| B6  | Endpoint ganti password + pemaksaan ganti saat login pertama                                                              | S-6      |
| B7  | Baca role dari database di `roleGuard`, atau perpendek masa token dan tambahkan refresh                                   | S-7      |

### Fase C — Perbaiki kebenaran data

| #   | Pekerjaan                                                                                   | Rujukan       |
| --- | ------------------------------------------------------------------------------------------- | ------------- |
| C1  | Lengkapi cascade di `deleteObjective` mengikuti pola `deleteKeyResult`                      | C-1           |
| C2  | Hilangkan syarat `targetValue > 0` dari rollup, atau wajibkan target saat membuat inisiatif | C-2           |
| C3  | Ubah fallback diam di bulk upload jadi baris error yang eksplisit                           | C-3           |
| C4  | Satukan validasi RACI dan departemen antara jalur manual dan bulk upload                    | C-4           |
| C5  | Jadikan tabel `Department` satu-satunya sumber kebenaran; buang array hardcode              | C-5           |
| C6  | Periksa `KpiAssignment` dan `Initiative.ownerId` di `deleteEmployee`                        | C-6           |
| C7  | Seragamkan kolom audit ke user id, dengan migrasi data yang ada                             | C-7           |
| C8  | Samakan definisi scope TEAM antara `getInitiatives` dan `getKpisForInitiative`              | C-8           |
| C9  | Tambahkan `onDelete` di schema supaya cascade dijamin database, bukan controller            | ERD catatan 5 |

### Fase D — Bereskan utang frontend

| #   | Pekerjaan                                                                                    | Rujukan |
| --- | -------------------------------------------------------------------------------------------- | ------- |
| D1  | Kembalikan endpoint perbandingan rentang tanggal, atau lepas UI-nya                          | R-1     |
| D2  | Hapus tiga halaman duplikat yang tak terjangkau (±3.200 baris)                               | R-2     |
| D3  | Perluas `auth.global.ts` agar semua prefix role terjaga, bukan hanya `/admin` dan `/c-level` | R-2     |
| D4  | Hapus sisa sistem tema, atau hidupkan kembali                                                | R-3     |
| D5  | Buat composable `useApi()` dengan header otomatis dan penanganan 401 terpusat                | E-2     |
| D6  | Perbarui komentar schema dan docstring bulk upload untuk status `DROP`                       | R-4     |

### Fase E — Fondasi kualitas

| #   | Pekerjaan                                                                             | Rujukan |
| --- | ------------------------------------------------------------------------------------- | ------- |
| E1  | Test otomatis per role untuk setiap endpoint — satu kasus per sel di matriks bagian 3 | E-1     |
| E2  | Linter, formatter, dan CI yang menjalankan `tsc --noEmit` + test pada setiap push     | E-1     |
| E3  | Pagination pada endpoint list yang berpotensi besar                                   | E-3     |
| E4  | Rencana migrasi SQLite → PostgreSQL, plus backup terjadwal                            | E-4     |

### Fase F — Fitur baru

Ditaruh paling akhir dengan sengaja. Sebelum masuk ke sini, jawab dulu pertanyaan dari bagian 5: **kenapa Initiative dan KPI belum dipakai?** Bila hambatannya adalah kemudahan pakai atau proses, menambah fitur tidak akan menolong.

Kandidat, berurut dari yang paling terhubung dengan kondisi sekarang:

1. **Onboarding lapisan eksekusi** — template inisiatif, bulk upload KPI, panduan di halaman kosong. Menyerang langsung angka nol di bagian 5.
2. **Notifikasi in-app** — sudah ada di PRD sebagai Non-Goal fase lalu. Approver tidak punya cara tahu ada antrean tanpa membuka dashboard.
3. **Bulk approve update KPI** — risiko bottleneck yang sudah diantisipasi PRD, tapi baru relevan setelah volume update nyata muncul.
4. **Highlight causal chain** saat KR diklik — item **[Could]** nomor 15 di PRD yang belum dikerjakan. Baru bermakna setelah ada causal link (sekarang nol).
5. **Ekspor laporan** (PDF/Excel) per departemen atau kuartal — belum ada sama sekali dan sering diminta untuk review berkala.
6. **Riwayat approval KPI per KPI** — item **[Should]** nomor 10 di PRD; endpoint `GET /api/initiatives/kpis/:id/updates` sudah ada, tampilan khususnya belum.

---

## 8. Pertanyaan terbuka

1. **Apakah `manager/overview`, `leader/my-krs`, dan `team/my-work` masih dipakai**, atau sudah tergantikan oleh dashboard yang merender berbeda per role? PRD memilih pendekatan satu dashboard ([FR-13, Should]), tapi kode punya keduanya.
2. **Siapa pemilik hubungan Team ↔ Department?** `Team.department` adalah string bebas tanpa foreign key, dan `Team.managerId` bahkan bukan relasi Prisma. Ini pertanyaan terbuka yang sama dengan yang tercatat di PRD dan masih belum terjawab.
3. **Apakah `DROP` adalah status final yang setara `DONE`** dalam perhitungan progres? Sekarang inisiatif ber-status `DROP` tetap ikut dihitung dalam rata-rata progres KR.
4. **Berapa lama sesi seharusnya berlaku?** 24 jam tanpa refresh token adalah kompromi yang belum pernah diputuskan secara eksplisit.
