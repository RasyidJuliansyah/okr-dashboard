# 📘 Panduan Deployment Resmi OKR & BSC Suite (Production Guide)

Dokumen ini adalah **Panduan Deployment Tunggal (Single Source of Truth)** untuk melakukan rilis / deployment fitur dan perubahan aplikasi OKR & BSC Dashboard ke server production.

---

## 🏗️ Ringkasan Arsitektur Production

| Komponen                | Spesifikasi / Technology Stack                                                      |
| ----------------------- | ----------------------------------------------------------------------------------- |
| **Frontend Service**    | Nuxt 3 (SSR/SPA) · Docker Container `okr-frontend` (Port `3000`)                    |
| **Backend Service**     | Express.js + TypeScript + Prisma ORM · Docker Container `okr-backend` (Port `3001`) |
| **Orchestration**       | Docker & Docker Compose (`docker-compose.yml`)                                      |
| **Database**            | Managed MySQL Production (Database Name: `okr_dashboard`)                           |
| **Database Client**     | **DBeaver** (untuk eksekusi script SQL alterasi manual)                             |
| **File Transfer & SSH** | **FileZilla** (FTP/SFTP) & **Termius** (Terminal SSH Client)                        |

---

## ⚠️ Aturan Utama Update Database Production (Mandatory)

> [!IMPORTANT]
> **ATURAN UTAMA MIGRASI DATABASE:**
>
> 1. **DILARANG MENGGUNAKAN PRISMA MIGRATE DI PRODUCTION**
>    - Jangan pernah menjalankan `npx prisma db push` atau `npx prisma migrate dev` langsung menargetkan MySQL Production.
> 2. **DB UPDATE MANUAL VIA DBEAVER**
>    - Setiap perubahan struktur schema database **wajib dieksekusi secara manual via DBeaver** menggunakan SQL script alterasi (`.sql`) yang telah disediakan.
> 3. **URUTAN DEPLOYMENT:**
>    - **Langkah A**: Jalankan SQL script di DBeaver ➔ **Langkah B**: Upload file terupdate via FileZilla ➔ **Langkah C**: Rebuild Docker container via Termius.

---

## 🚀 Langkah-Langkah Deployment Step-by-Step

### 📍 Fase 1: Update Database Production (DBeaver)

1. Buka aplikasi **DBeaver** di komputer Anda.
2. Hubungkan koneksi database ke **MySQL Production**.
3. Buka file SQL migrasi terbaru yang terdapat di repositori:
   `backend/migrate_cascading_assignment.sql`
4. Jalankan (Execute Script `Alt + X`) seluruh query di DBeaver.

   _Script ini secara otomatis menambahkan kolom `assignedLeaderId`, `assignedTeamMemberId`, `sprintMonth`, tabel `Notification`, serta index performa tanpa menghapus data yang sudah ada._

---

### 📍 Fase 2: Transfer Source Code Terbaru (FileZilla)

Buka **FileZilla**, hubungkan ke server production via SFTP, lalu upload/overwrite **hanya file-file source code yang diubah** sesuai lokasinya di bawah ini:

#### 📂 File Backend (ke folder `/backend/...` di server)

- `backend/src/controllers/dashboard.controller.ts`
- `backend/src/controllers/initiative.controller.ts`
- `backend/src/controllers/notification.controller.ts`
- `backend/src/index.ts`
- `backend/src/prisma/schema.prisma`
- `backend/src/routes/initiative.routes.ts`
- `backend/src/routes/notification.routes.ts`
- `backend/migrate_cascading_assignment.sql`

#### 📂 File Frontend (ke folder `/frontend/...` di server)

- `frontend/app/pages/dashboard.vue`
- `frontend/app/pages/member-achievement.vue`
- `frontend/app/pages/initiatives.vue`
- `frontend/app/pages/team/my-work.vue`
- `frontend/app/pages/leader/my-krs.vue`
- `frontend/app/pages/admin/initiatives-kanban.vue`
- `frontend/app/components/AppHeader.vue`
- `frontend/app/components/AppSidebar.vue`
- `frontend/app/composables/useAssignment.ts`
- `frontend/app/stores/notification.ts`

> [!CAUTION]
> **JANGAN UPLOAD:**
>
> - ❌ `node_modules/` (Backend maupun Frontend)
> - ❌ `.output/` atau `dist/`
> - ❌ `.env` (Gunakan file `.env` yang sudah ada di server)

---

### 📍 Fase 3: Rebuild & Restart Container (Termius / SSH)

1. Buka aplikasi **Termius** dan SSH ke server production.
2. Masuk ke direktori root proyek di server:
   ```bash
   cd /path/to/okr-dashboard2
   ```
3. Jalankan rebuild container Docker:

   ```bash
   docker compose up --build -d
   ```

   _Proses ini akan meng-compile ulang TypeScript backend dan Nuxt frontend secara otomatis di dalam Docker container._

---

### 📍 Fase 4: Verifikasi & Audit Log (Post-Deploy)

1. **Cek Status Container:**

   ```bash
   docker compose ps
   ```

   _Pastikan container `okr-backend` dan `okr-frontend` berstatus `Up` / `running`._

2. **Cek Output Log Aplikasi:**

   ```bash
   docker compose logs -f --tail=50
   ```

   _Pastikan tidak ada error runtime Prisma atau Nuxt._

3. **Uji Coba Fungsi Utama di Browser:**
   - Akses aplikasi di `https://bsc.proc.skolla.online` (atau domain prod Anda).
   - Test login role **LEADER** (P Level) dan **TEAM** (T Level): Buka `/dashboard` (sudah lancar tanpa error).
   - Cek halaman **Capaian Task Member** (`/member-achievement`): Verifikasi rincian pembobotan Inisiatif (Bobot 2) vs Task (Bobot 1).
   - Cek halaman **Pekerjaan Saya** (`/team/my-work`) & **Inisiatif Kanban** (`/initiatives`).

---

## 🛠️ Troubleshooting & Re-sync

| Masalah                                          | Solusi                                                                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Prisma Schema Drift / Error Column Not Found** | Re-check DBeaver, pastikan query `ALTER TABLE` pada `backend/migrate_cascading_assignment.sql` sudah dieksekusi dengan status SUCCESS. |
| **Build Frontend Error saat Docker Build**       | Jalankan `docker compose build --no-cache frontend` untuk memastikan cache Nuxt bersih.                                                |
| **Error Port In Use**                            | Pastikan tidak ada process node lokal/PM2 yang menghalangi port `3000` atau `3001` dengan komando `sudo netstat -tlpn`.                |

---

_Dokumen ini dibuat dan diverifikasi untuk rilis versi OKR & BSC Suite Production._
