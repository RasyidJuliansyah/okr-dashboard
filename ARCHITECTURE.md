n# ARCHITECTURE & TECH STACK - SKOLLA BSC & OKR SUITE

Dokumen acuan arsitektur sistem, konvensi teknis, dan standar implementasi untuk pengembangan dan vibecoding agen AI selanjutnya.

---

## 1. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                        CLIENT BROWSER (Desktop / Mobile)                          |
+-----------------------------------------------------------------------------------+
                                      |
                                      | HTTPS (:443) / SSL Termination
                                      v
+-----------------------------------------------------------------------------------+
| REVERSE PROXY: Nginx Host                                                         |
| - Route `/`     -> http://localhost:3000 (Nuxt Frontend)                          |
| - Route `/api`  -> http://localhost:3001/api (Express Backend)                    |
+-----------------------------------------------------------------------------------+
                                      |
                  +-------------------+-------------------+
                  |                                       |
                  v                                       v
+-----------------------------------+   +-------------------------------------------+
| FRONTEND CONTAINER: okr-frontend  |   | BACKEND CONTAINER: okr-backend            |
| Port: 3000 (Internal)             |   | Port: 3001 (Internal)                     |
| Image: node:20-alpine (Multi-stage)|  | Image: node:20-alpine (Multi-stage)       |
| Runtime: Nuxt 4 (Nitro Engine)    |   | Runtime: Node.js 20 LTS + TypeScript 5.3  |
| State: Pinia 3                    |   | Framework: Express.js 4.18                |
| UI: Vue 3.5, Chart.js, Vue-Flow   |   | ORM: Prisma 5.10.2                        |
+-----------------------------------+   +-------------------------------------------+
                                                          |
                                                          | TCP :3306 (MySQL Protocol)
                                                          v
                                        +-------------------------------------------+
                                        | DATABASE INSTANCE: MySQL 8.0+             |
                                        | Database Name: `skolla_okr`               |
                                        | Charset: utf8mb4 / Collation: utf8mb4_gen |
                                        +-------------------------------------------+
```

---

## 2. Tech Stack Matrix

| Layer                      | Komponen / Library        | Versi                  | Peruntukan / Alasan Penggunaan                                 |
| -------------------------- | ------------------------- | ---------------------- | -------------------------------------------------------------- |
| **Frontend Framework**     | Nuxt                      | `^4.4.8`               | SSR framework berbasis Vue 3, Nitro engine, file-based routing |
| **Frontend Core**          | Vue.js                    | `^3.5.38`              | Reactive UI framework (Composition API, `<script setup>`)      |
| **State Management**       | Pinia + `@pinia/nuxt`     | `^3.0.4` / `^0.11.3`   | Global state (auth, initiative, theme, navigation)             |
| **Grafik & Visualisasi**   | Chart.js & Vue-ChartJS    | `^4.5.1` / `^5.3.4`    | Visualisasi performa BSC, progres kuartal, target vs aktual    |
| **Diagram Causal / Graph** | `@vue-flow/core`          | `^1.48.2`              | Strategy Map & Causal Link hierarki antar-KR                   |
| **Timeline / Gantt**       | Frappe Gantt              | `^1.2.2`               | Timeline jadwal task & sprint execution                        |
| **Backend Framework**      | Express.js                | `^4.18.3`              | REST API micro-framework cepat & minimalis                     |
| **Language & Runtime**     | Node.js / TypeScript      | `20-alpine` / `^5.3.3` | Type safety end-to-end, compile via `tsc`                      |
| **ORM / Data Access**      | Prisma Client & CLI       | `^5.10.2`              | Type-safe query builder, migration, relation schema            |
| **Security & Auth**        | `jsonwebtoken` + `bcrypt` | `^9.0.2` / `^5.1.1`    | Stateless JWT Bearer Auth + salted password hashing            |
| **Database**               | MySQL                     | `8.0+`                 | Relational storage ACID, InnoDB engine, foreign keys           |
| **Container Engine**       | Docker & Docker Compose   | `3.8 spec`             | Multi-stage build isolation dev & production                   |

---

## 3. Direktori & Struktur Kode

```
okr-dashboard2_dev/
├── backend/
│   ├── Dockerfile                 # Multi-stage build (builder -> node:20-alpine runner)
│   ├── package.json
│   ├── tsconfig.json
│   ├── scripts/                   # Data normalization & invariant check scripts
│   └── src/
│       ├── index.ts               # Entry point Express, CORS, middleware, route mounting
│       ├── controllers/           # Business logic per domain (bsc, sprint, initiative, task, kr)
│       ├── routes/                # Express router mapping
│       ├── middleware/            # Auth JWT, RBAC guards
│       ├── services/              # Complex domain services (sprint cadence, rollup calculation)
│       ├── utils/                 # Formula kalkulasi progress, auditLogger
│       └── prisma/
│           ├── schema.prisma      # Canonical DB Schema (source of truth Prisma)
│           └── migrations/        # Prisma migrations snapshot
├── frontend/
│   ├── Dockerfile                 # Nuxt multi-stage output runner (.output/server/index.mjs)
│   ├── package.json
│   ├── nuxt.config.ts             # Nuxt runtime config, modules, vendor css/js
│   └── app/
│       ├── app.vue                # Root entry Nuxt
│       ├── components/            # Reusable components (AppHeader, AppSidebar, modal, badge)
│       ├── composables/           # Shared logic (useTheme, useAuth)
│       ├── stores/                # Pinia store modules (auth, initiative, bsc)
│       └── pages/                 # File-based routes (/c-level, /admin, /team, /leader, /dashboard)
├── docs/                          # Dokumentasi fungsional, ERD, dan cascading logic
├── docker-compose.yml             # Orchestration backend (:3001) & frontend (:3000)
└── deploy_october_delta.sql       # Delta migration SQL idempotent untuk rilis DB
```

---

## 4. Pola Arsitektur Inti (Core Patterns)

### 4.1 Hierarki Cascading OKR

1. **Corporate Objective**: Strategi payung tahunan (`year = '2026'`).
2. **Key Result (KR)**: Metrik kuantitatif 4 perspektif BSC (`FINANCIAL`, `CUSTOMER`, `INTERNAL_PROCESS`, `LEARNING_GROWTH`). Total target: 42 KR aktif.
3. **Decoupled KR & Sprint**: KR bersifat tahunan/siklus panjang, sedangkan Initiative & Task diikat pada Sprint aktif (`sprint_id`, `sprint_month`). Filter Sprint tidak memotong jumlah 42 KR di dashboard C-Level/Strategy Map.
4. **Initiative**: Inisiatif taktis yang dieksekusi di sprint tertentu, assigned ke Team Leader.
5. **Task**: Pekerjaan harian yang assigned ke Team Member, mendukung inisiatif atau lintas departemen (cross-dept).

### 4.2 Formula Progres (Rollup Engine)

- Target Type: `AT_LEAST` (naik lebih baik) vs `AT_MOST` (turun lebih baik/efisiensi).
- Baseline formula:
  $$\text{Progress \%} = \frac{\text{Current} - \text{Baseline}}{\text{Target} - \text{Baseline}} \times 100$$
- Status otomatis:
  - $\ge 70\%$ : `ON_TRACK` (Badge Blue / Green)
  - $40\% - 69.9\%$ : `AT_RISK` (Badge Yellow)
  - $< 40\%$ : `OFF_TRACK` (Badge Red)
- Capaian Task secara otomatis mengagregasi progress Initiative jika unit berbasis persentase (`%`).

### 4.3 RBAC & RACI Matrix

- **Roles**: `ADMIN`, `C_LEVEL`, `MANAGER`, `LEADER`, `TEAM`.
- **RACI Matrix pada KR**:
  - `ACCOUNTABLE`: Minimal 1 penanggung jawab utama.
  - `RESPONSIBLE`, `CONSULTED`, `INFORMED`.

---

## 5. Pedoman Vibecoding Agen AI (Coding Standards)

Saat agen AI membuat fitur baru atau mengedit codebase ini:

1. **Prinsip Minimal Diff**:
   - Hindari abstraksi prematur. Gunakan helper function sederhana jika cukup.
   - Pakai native runtime/stdlib jika memungkinkan. Jangan tambah dependency baru tanpa kebutuhan mendesak.
2. **Database Integrity & Idempotency**:
   - Skema ada di `backend/src/prisma/schema.prisma`.
   - Update tabel di server produksi dilakukan lewat file SQL delta idempotent (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS` atau conditional schema queries via `INFORMATION_SCHEMA`).
3. **Hydration & SSR Safety di Frontend**:
   - Nuxt menggunakan SSR; simpan state berbasis browser (`localStorage`, cookies) di dalam client lifecycle (`onMounted`) atau composable berpelindung `import.meta.client`.
4. **Validasi Invariant Script**:
   - Setiap perubahan logika agregasi progress atau hierarki KR wajib diverifikasi via test script backend:
     ```bash
     npx ts-node backend/scripts/verify_decoupled_kr_invariant.ts
     ```
   - Target absolut: 42 Key Results aktif tidak boleh tereduksi oleh filter sprint.

---

## 6. Prosedur Deployment & Rollback

- **Deploy Host**: `/mnt/vdb/dashssc/bsc`
- **File Transfer**: FileZilla (Backend: `src/`, `package*.json`, `tsconfig.json`; Frontend: `app/`, `nuxt.config.ts`, `package*.json`).
- **Command Deploy**:
  ```bash
  cd /mnt/vdb/dashssc/bsc
  docker compose down
  docker compose up --build -d
  ```
- **Prosedur Rollback**:
  1. Selalu backup folder kode sebelum upload: `cp -r bsc bsc_backup_$(date +%Y%m%d_%H%M)`
  2. Dump database via DBeaver sebelum deploy.
  3. Jika gagal: stop docker, restore folder backup, lalu `docker compose up --build -d`.
