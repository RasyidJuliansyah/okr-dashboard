# OKR & BSC Dashboard

Dashboard Manajemen Performa Berbasis OKR (Objectives and Key Results) dan Balanced Scorecard (BSC) dengan fitur pelaporan progress berkala, pelacak inisiatif, dan visibilitas bertingkat berbasis peran (*Role-Based Access Control*).

---

## 🚀 Fitur Utama

### 1. Pelaporan Progress & History Log Berkala
- **Inisiatif Progress Updates**: Anggota tim (`TEAM`) dan pimpinan (`LEADER`) dapat melaporkan realisasi progress inisiatif beserta catatan (*notes*) dan perubahan status Kanban (`TODO`, `IN_PROGRESS`, `DONE`). Laporan langsung tersimpan tanpa perlu persetujuan.
- **KPI Progress Updates**: Update KPI mendukung *approval workflow*:
  - **TEAM**: Mengirimkan update dengan status `PENDING_APPROVAL` yang memerlukan persetujuan Leader/Manager.
  - **LEADER / MANAGER / ADMIN**: Update otomatis berstatus `APPROVED` dan langsung mengkaskade nilai ke Inisiatif dan Key Result (KR).
- **Log History & Timestamps**: Setiap update tersimpan permanen dengan log timestamp lengkap (hari, tanggal, jam).
- **Tampilan Berbasis Role (Role-Based Visibility)**:
  - **TEAM & LEADER**: Melihat *full history timeline* dengan fitur *expand/collapse*.
  - **MANAGER & C-LEVEL**: Melihat ringkasan 1 update terbaru untuk menjaga fokus eksekutif.

### 2. Pemisahan Tugas (Pekerjaan Saya vs Pekerjaan Tim Saya)
- **Pekerjaan Saya (My Work)**: Menampilkan Inisiatif milik pengguna sendiri (`ownerId === userId`) serta KPI yang di-assign langsung kepada pengguna tersebut.
- **Pekerjaan Tim Saya (Team Work)**: Menampilkan Inisiatif tim yang dikerjakan anggota lain (`ownerId !== userId`) serta KPI anggota tim lainnya.

### 3. Balanced Scorecard & OKR Integration
- **4 Perspektif BSC**: Financial, Customer, Internal Process, Learning & Growth.
- **Cascading Progress Auto-Calculation**: Update pada KPI secara otomatis mengkalkulasi ulang progress Inisiatif, Key Result, hingga Objective terkait.
- **Causal Links**: Pemetaan hubungan kausal antar Key Result.

---

## 👥 Matriks Peran & Hak Akses (Role Matrix)

| Peran | Kode Role | Hak Akses Utama |
|---|---|---|
| **System Admin** | `ADMIN` | Akses penuh ke seluruh menu, manajemen user, tim, dan departemen. |
| **C-Level Executive** | `C_LEVEL` | Executive Dashboard (Balanced Scorecard), health score perusahaan, statistik makro (hanya update terbaru). |
| **Manager** | `MANAGER` | Overview departemen, persetujuan (approval) update KPI anggota, pemantauan performa tim. |
| **Team Leader** | `LEADER` | Manajemen KR tim, pembuat inisiatif, pemantau progress tim, pelapor progress mandiri (auto-approve). |
| **Team Member** | `TEAM` | Menu Pekerjaan Saya, pelaporan progress KPI (butuh approval) & Inisiatif (auto-save), full history log. |

---

## 🛠️ Tech Stack

- **Frontend**: Nuxt 3 (Vue 3 Composition API, Pinia Store, Vite, SSR/SPA)
- **Backend**: Node.js + Express.js + TypeScript
- **Database / ORM**: Prisma ORM (SQLite dalam mode dev lokal, kompatibel dengan MySQL)
- **Authentication**: JWT (JSON Web Tokens) + Passwords (Bcrypt hashing)

---

## 📁 Struktur Proyek

```
okr-dashboard/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Controller logika bisnis (initiative, objective, kr, kpi, auth, dll)
│   │   ├── middleware/        # Authentication & Role Guard middleware
│   │   ├── routes/            # Express REST API routes
│   │   └── prisma/
│   │       ├── schema.prisma  # Schema Database Prisma
│   │       └── dev.db         # Database SQLite lokal
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── components/        # Vue reusable components (AppSidebar, Navbar, dll)
│   │   ├── pages/             # Routing halaman Nuxt 3 (team/my-work, manager/overview, c-level, dll)
│   │   └── stores/            # Pinia state management (auth store)
│   └── package.json
├── MIGRATION_MYSQL.md         # Panduan Lengkap Migrasi dari SQLite ke MySQL
└── README.md                  # Dokumentasi Utama
```

---

## 🔌 API Routes Utama (`/api`)

### Initiatives & Work
- `GET /api/initiatives/my-work/all` - Mengambil data "Pekerjaan Saya" & "Pekerjaan Tim Saya" (sesuai role).
- `POST /api/initiatives/:id/progress-updates` - Menambah laporan progress inisiatif baru (auto-save).
- `GET /api/initiatives/:id/progress-updates` - Mengambil seluruh riwayat update inisiatif.
- `POST /api/initiatives/kpis/:id/updates` - Menambah update progress KPI (pending / auto-approved).
- `POST /api/initiatives/kpis/updates/:updateId/approve` - Approve update KPI (Leader/Manager).
- `POST /api/initiatives/kpis/updates/:updateId/reject` - Reject update KPI (Leader/Manager).

---

## 🚀 Cara Menjalankan (Development)

### Backend
```bash
cd backend
npm install
npx prisma db push
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Dashboard frontend dapat diakses di `http://localhost:3000`.

---

## 📦 Migrasi ke MySQL (Production Ready)

Untuk petunjuk lengkap mengenai konversi schema, penyesuaian tipe data, penanganan environment variables, dan eksekusi migrasi database ke MySQL, silakan baca [MIGRATION_MYSQL.md](./MIGRATION_MYSQL.md).
