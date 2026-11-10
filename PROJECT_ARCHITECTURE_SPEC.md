# BLUEPRINT ARSITEKTUR & SPESIFIKASI PROYEK (SKOLLA BSC & OKR SUITE)

Dokumen ini adalah spesifikasi teknis tunggal (*single source of truth*) yang dirancang agar AI agen atau developer dapat menduplikasi, meregenerasi, dan mengembangkan ulang seluruh sistem tanpa ambiguitas.

---

## 1. IKHTISAR SISTEM & DOMAIN BISNIS

Aplikasi ini bernama **Skolla BSC & OKR Suite**. Sistem menggabungkan framework **Balanced Scorecard (BSC)** dengan **Objectives & Key Results (OKR)**, eksekusi **Sprint**, visualisasi **Roadmap Gantt**, diagram relasi sebab-akibat (**Strategy Map Causal Link**), serta **Role-Based Access Control (RBAC)** bertingkat.

### 1.1 Hierarki Data 4 Tingkat
1. **Objective (Korporat / Level 1)**: Sasaran strategis payung tahunan per tahun kalender (misal `year = '2026'`).
2. **Annual Key Result & Key Result (Metrik Kuantitatif / Level 2)**:
   - Terbagi ke dalam 4 perspektif BSC: `FINANCIAL`, `CUSTOMER`, `INTERNAL_PROCESS`, `LEARNING_GROWTH`.
   - Terikat target bulanan/kuartalan dengan bobot (`monthWeight`).
   - Baseline total korporat: **42 Key Results aktif**.
   - Dilengkapi matriks RACI (`ACCOUNTABLE`, `RESPONSIBLE`, `CONSULTED`, `INFORMED`).
3. **Initiative (Program Kerja / Level 3)**:
   - Program kerja taktis yang diampu oleh **Team Leader** (`assignedLeaderId`) atau owner (`ownerId`).
   - Terikat pada tim (`teamId`) dan siklus sprint (`sprintId`, `sprintMonth`).
   - Memiliki status Kanban: `TODO`, `IN_PROGRESS`, `DONE`.
4. **Task (Tugas Operasional / Level 4)**:
   - Pekerjaan harian yang di-assign ke **Team Member** (`assignedTeamMemberId`).
   - Terikat pada Initiative dan Sprint.
   - Mendukung penugasan lintas departemen (*cross-dept task*) dengan field pelacak `creatorDept` dan `targetDept`.

### 1.2 Invarian Decoupled KR & Sprint
- **Aturan Mutlak**: Key Result (42 KR) bersifat tahunan/makro korporat. Sprint adalah siklus eksekusi jangka pendek (2 mingguan / bulanan).
- Filter dropdown Sprint di dashboard C-Level dan Strategy Map **hanya memfilter Initiative dan Task**. Jumlah 42 KR aktif **tidak boleh terpotong atau hilang** akibat filter sprint.

---

## 2. MATRIKS SKILL & TEKNOLOGI

### 2.1 Frontend Skills
- **Framework**: `Nuxt ^4.4.8` (Nitro engine, SSR + client hydration, file-based routing di `app/pages`).
- **Core UI**: `Vue.js ^3.5.38` (Composition API, `<script setup>`, reactive primitives `ref`, `computed`, `watch`).
- **State Store**: `Pinia ^3.0.4` & `@pinia/nuxt ^0.11.3` (`stores/auth.ts`, `stores/notification.ts`).
- **Chart & Grafik**: `Chart.js ^4.5.1` & `vue-chartjs ^5.3.4` (Visualisasi bar/radar/line capaian BSC per kuartal).
- **Interactive Node Diagram**: `@vue-flow/core ^1.48.2` (Strategy Map interaktif causal link antarnode KR 4 perspektif).
- **Gantt Chart**: `frappe-gantt ^1.2.2` (Timeline roadmap domain -> epic -> feature).
- **Analytics**: `posthog-js ^1.438.19` (Product tracking & event metrics).
- **Styling Architecture**:
  - **DILARANG MENGGUNAKAN TAILWIND**.
  - Menggunakan **Pure Scoped CSS** dengan CSS Custom Properties (Tokens) sesuai `DesignSystem.md`:
    - Brand Navy: `#010571`, Brand Blue: `#0E97D6`, Accent Light Blue: `#30B1E8`.
    - Status Colors: Success `#00A925` / `#10B981`, Danger `#EB3123` / `#EF4444`, Warning `#F2CA17` / `#F59E0B`.
    - Surface & Border: `#FFFFFF`, `#F8FAFC`, `#F0F3F9`, `#E2E8F0`.
    - Tipografi: Google Fonts `Rubik`, `Plus Jakarta Sans`, `Inter`.
- **Konfigurasi Khusus Nuxt (`nuxt.config.ts`)**:
  - `features.inlineStyles: false` wajib di-set agar stylesheet komponen yang di-mount client-side (seperti AppSidebar/AppHeader) tidak hilang saat SSR build.
  - Public runtime config: `apiBase`, `posthogPublicKey`, `posthogHost`.

### 2.2 Backend Skills
- **Runtime**: `Node.js 20 LTS`.
- **API Framework**: `Express.js ^4.18.3` dengan arsitektur modular (`controllers/`, `routes/`, `middleware/`, `services/`).
- **Bahasa**: `TypeScript ^5.3.3` (Strict mode, ES2022 output).
- **Database ORM**: `Prisma ORM ^5.10.2` (Client generation, query filtering, transactional mutations).
- **Database Driver**: `MySQL 8.0+` (`mysql://USER:PASS@HOST:3306/skolla_okr?charset=utf8mb4`).
- **Keamanan & Autentikasi**:
  - `jsonwebtoken ^9.0.2` (Bearer token dengan payload user ID, role, department, name).
  - `bcrypt ^5.1.1` (Password hashing 10 rounds).
  - `cors ^2.8.5` (CORS handling).
  - RBAC Middleware & Guard dengan dukungan impersonasi (`originalRole === 'ADMIN'`).
- **Automasi Background**:
  - Auto-rollover sprint via native background worker (`setInterval` 1 jam + trigger startup). Memeriksa sprint yang kedaluwarsa dan memindahkan task/inisiatif belum selesai ke sprint berikutnya.

### 2.3 Server, DevOps & Infrastruktur
- **Containerization**:
  - Docker multi-stage build untuk Backend (`node:20-alpine`, output compiled TS).
  - Docker multi-stage build untuk Frontend (`node:20-alpine`, output Nitro standalone `.output/server/index.mjs`).
  - Docker Compose v3.8 (`okr-backend` port 3001, `okr-frontend` port 3000).
- **Web Server & Reverse Proxy**:
  - Nginx Host dengan SSL termination (Let's Encrypt / Certbot).
  - Reverse proxy routing: `/` diarahkan ke container frontend port 3000, `/api` diarahkan ke container backend port 3001.
- **Process Manager**: `ecosystem.config.js` untuk PM2 deployment alternatif.
- **Prosedur Migrasi DB Produksi (Aturan Mutlak)**:
  - **Dilarang menggunakan `prisma migrate` atau `prisma db push` di MySQL produksi**.
  - Setiap alterasi database wajib menggunakan skrip SQL delta manual idempotent (`.sql`) yang dieksekusi via database client (misal DBeaver).
  - Skema di `schema.prisma` diperbarui untuk menjaga sinkronisasi model Prisma Client.

---

## 3. SKEMA DATABASE UTAMA (PRISMA SCHEMA)

Model inti pada `backend/src/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                    String           @id @default(uuid())
  name                  String
  email                 String           @unique
  password              String
  role                  String           @default("TEAM") // ADMIN, C_LEVEL, MANAGER, LEADER, TEAM
  department            String?
  departmentId          String?          @map("department_id")
  departmentRel         Department?      @relation("UserDepartment", fields: [departmentId], references: [id])
  position              String?
  isActive              Boolean          @default(true) @map("is_active")
  teamId                String?          @map("team_id")
  team                  Team?            @relation("TeamMembers", fields: [teamId], references: [id])
  leadingTeams          Team[]           @relation("TeamLeader")
  assignments           KrAssignment[]
  taskAssignments       TaskAssignment[]
  managedDepartments    Department[]     @relation("DepartmentManager")
  strategicDepartments  Department[]     @relation("DepartmentCLevel")
  ownedInitiatives      Initiative[]     @relation("InitiativeOwner")
  assignedInitiatives   Initiative[]     @relation("InitiativeLeader")
  assignedTasks         Task[]           @relation("TaskAssignedMember")
  createdCrossDeptTasks Task[]           @relation("CrossDeptTaskCreator")
  taskComments          TaskComment[]
  notifications         Notification[]
  auditLogs             AuditLog[]       @relation("UserAuditLogs")
  sprintProgress        MemberSprintProgress[]
  createdAt             DateTime         @default(now()) @map("created_at")

  @@map("user")
}

model Team {
  id            String       @id @default(uuid())
  name          String
  managerId     String?      @map("manager_id")
  leaderId      String?      @map("leader_id")
  leader        User?        @relation("TeamLeader", fields: [leaderId], references: [id])
  department    String?
  departmentId  String?      @map("department_id")
  departmentRel Department?  @relation("TeamDepartment", fields: [departmentId], references: [id])
  isActive      Boolean      @default(true) @map("is_active")
  users         User[]       @relation("TeamMembers")
  initiatives   Initiative[]

  @@map("team")
}

model Department {
  id              String       @id @default(uuid())
  name            String
  value           String       @unique
  color           String       @default("#0e97d6")
  managerId       String?      @map("manager_id")
  manager         User?        @relation("DepartmentManager", fields: [managerId], references: [id])
  cLevelId        String?      @map("c_level_id")
  cLevel          User?        @relation("DepartmentCLevel", fields: [cLevelId], references: [id])
  isActive        Boolean      @default(true) @map("is_active")
  deactivatedAt   DateTime?    @map("deactivated_at")
  deactivatedById String?      @map("deactivated_by_id")
  teams           Team[]       @relation("TeamDepartment")
  users           User[]       @relation("UserDepartment")
  krDepartments   KrDepartment[]

  @@map("department")
}
```

```prisma
model Objective {
  id               String            @id @default(uuid())
  title            String
  description      String?           @db.Text
  quarter          String?
  year             String            @default("2026")
  ownerId          String?           @map("owner_id")
  isActive         Boolean           @default(true) @map("is_active")
  keyResults       KeyResult[]
  annualKeyResults AnnualKeyResult[]
  createdAt        DateTime          @default(now()) @map("created_at")

  @@map("objective")
}

model AnnualKeyResult {
  id             String      @id @default(uuid())
  objectiveId    String      @map("objective_id")
  objective      Objective   @relation(fields: [objectiveId], references: [id])
  title          String
  description    String?
  targetValue    Float       @map("target_value")
  currentValue   Float       @default(0) @map("current_value")
  unit           String
  bscPerspective String      @map("bsc_perspective") // FINANCIAL, CUSTOMER, INTERNAL_PROCESS, LEARNING_GROWTH
  year           String
  status         String      @default("ON_TRACK")
  targetType     String      @default("AT_LEAST")
  isActive       Boolean     @default(true) @map("is_active")
  keyResults     KeyResult[]
  createdAt      DateTime    @default(now()) @map("created_at")
  updatedAt      DateTime    @updatedAt @map("updated_at")

  @@map("annual_key_result")
}

model KeyResult {
  id                String           @id @default(uuid())
  objectiveId       String           @map("objective_id")
  objective         Objective        @relation(fields: [objectiveId], references: [id])
  annualKeyResultId String?          @map("annual_key_result_id")
  annualKeyResult   AnnualKeyResult? @relation(fields: [annualKeyResultId], references: [id])
  month             String?
  monthWeight       Float            @default(1.0) @map("month_weight")
  title             String
  targetValue       Float            @map("target_value")
  currentValue      Float            @default(0) @map("current_value")
  unit              String
  bscPerspective    String           @map("bsc_perspective")
  status            String           @default("ON_TRACK")
  targetType        String           @default("AT_LEAST") @map("target_type")
  isManualOverride  Boolean          @default(false) @map("is_manual_override")
  isActive          Boolean          @default(true) @map("is_active")
  assignments       KrAssignment[]
  departments       KrDepartment[]
  updates           KrUpdate[]
  initiatives       Initiative[]
  sprintTargets     KrSprintTarget[]
  sourceLinksA      CausalLink[]     @relation("SourceKR")
  sourceLinksB      CausalLink[]     @relation("TargetKR")
  createdAt         DateTime         @default(now()) @map("created_at")
  updatedAt         DateTime         @updatedAt @map("updated_at")

  @@map("key_result")
}

model KrAssignment {
  id          String    @id @default(uuid())
  keyResultId String    @map("key_result_id")
  keyResult   KeyResult @relation(fields: [keyResultId], references: [id])
  userId      String    @map("user_id")
  user        User      @relation(fields: [userId], references: [id])
  role        String    @default("ACCOUNTABLE") // ACCOUNTABLE, RESPONSIBLE, CONSULTED, INFORMED
  assignedAt  DateTime  @default(now()) @map("assigned_at")

  @@unique([keyResultId, userId, role])
  @@map("kr_assignment")
}

model CausalLink {
  id           String    @id @default(uuid())
  sourceKrId   String    @map("source_kr_id")
  sourceKr     KeyResult @relation("SourceKR", fields: [sourceKrId], references: [id])
  targetKrId   String    @map("target_kr_id")
  targetKr     KeyResult @relation("TargetKR", fields: [targetKrId], references: [id])
  strength     String    @default("MEDIUM") // STRONG, MEDIUM, WEAK
  hypothesis   String?   @db.Text
  createdAt    DateTime  @default(now()) @map("created_at")

  @@map("causal_link")
}
```

```prisma
model Initiative {
  id                String             @id @default(uuid())
  keyResultId       String             @map("key_result_id")
  keyResult         KeyResult          @relation(fields: [keyResultId], references: [id])
  teamId            String             @map("team_id")
  team              Team               @relation(fields: [teamId], references: [id])
  ownerId           String?            @map("owner_id")
  owner             User?              @relation("InitiativeOwner", fields: [ownerId], references: [id])
  assignedLeaderId  String?            @map("assigned_leader_id")
  assignedLeader    User?              @relation("InitiativeLeader", fields: [assignedLeaderId], references: [id])
  title             String
  description       String?            @db.Text
  targetValue       Float              @default(0) @map("target_value")
  currentValue      Float              @default(0) @map("current_value")
  achievedValue     Float?             @map("achieved_value")
  unit              String?
  status            String             @default("ON_TRACK")
  targetType        String             @default("AT_LEAST") @map("target_type")
  kanbanStatus      String             @default("TODO") @map("kanban_status") // TODO, IN_PROGRESS, DONE
  weight            Float              @default(1.0)
  startDate         DateTime?          @map("start_date")
  dueDate           DateTime?          @map("due_date")
  finishDate        DateTime?          @map("finish_date")
  sprintMonth       String?            @map("sprint_month")
  sprintId          String?            @map("sprint_id")
  sprint            Sprint?            @relation(fields: [sprintId], references: [id])
  documentationLink String?            @map("documentation_link")
  isActive          Boolean            @default(true) @map("is_active")
  tasks             Task[]
  progressUpdates   InitiativeUpdate[]
  createdAt         DateTime           @default(now()) @map("created_at")
  updatedAt         DateTime           @updatedAt @map("updated_at")

  @@map("initiative")
}

model Task {
  id                   String           @id @default(uuid())
  initiativeId         String?          @map("initiative_id")
  initiative           Initiative?      @relation(fields: [initiativeId], references: [id])
  assignedTeamMemberId String?          @map("assigned_team_member_id")
  assignedTeamMember   User?            @relation("TaskAssignedMember", fields: [assignedTeamMemberId], references: [id])
  sprintMonth          String?          @map("sprint_month")
  sprintId             String?          @map("sprint_id")
  sprint               Sprint?          @relation(fields: [sprintId], references: [id])
  title                String
  description          String?          @db.Text
  targetValue          Float?           @default(0) @map("target_value")
  currentValue         Float            @default(0) @map("current_value")
  baselineValue        Float            @default(0) @map("baseline_value")
  weight               Float            @default(1.0)
  unit                 String?
  status               String           @default("ON_TRACK")
  targetType           String           @default("AT_LEAST") @map("target_type")
  kanbanStatus         String?          @default("TODO") @map("kanban_status")
  documentationLink    String?          @map("documentation_link")
  isCrossDept          Boolean          @default(false) @map("is_cross_dept")
  creatorId            String?          @map("creator_id")
  creator              User?            @relation("CrossDeptTaskCreator", fields: [creatorId], references: [id])
  creatorDept          String?          @map("creator_dept")
  targetDept           String?          @map("target_dept")
  isActive             Boolean          @default(true) @map("is_active")
  assignments          TaskAssignment[]
  updates              TaskUpdate[]
  comments             TaskComment[]
  createdAt            DateTime         @default(now()) @map("created_at")
  updatedAt            DateTime         @updatedAt @map("updated_at")

  @@map("task")
}
```

```prisma
model Sprint {
  id           String                 @id @default(uuid())
  name         String
  startDate    DateTime               @map("start_date")
  endDate      DateTime               @map("end_date")
  status       String                 @default("UPCOMING") // UPCOMING, ACTIVE, CLOSED
  isLocked     Boolean                @default(false) @map("is_locked")
  year         String                 @default("2026")
  orderIndex   Int                    @default(1) @map("order_index")
  isActive     Boolean                @default(true) @map("is_active")
  initiatives  Initiative[]
  tasks        Task[]
  krTargets    KrSprintTarget[]
  memberScores MemberSprintProgress[]
  createdAt    DateTime               @default(now()) @map("created_at")
  updatedAt    DateTime               @updatedAt @map("updated_at")

  @@map("sprint")
}

model KrSprintTarget {
  id              String    @id @default(uuid())
  keyResultId     String    @map("key_result_id")
  keyResult       KeyResult @relation(fields: [keyResultId], references: [id], onDelete: Cascade)
  sprintId        String    @map("sprint_id")
  sprint          Sprint    @relation(fields: [sprintId], references: [id], onDelete: Cascade)
  baselineValue   Float     @default(0) @map("baseline_value")
  targetValue     Float     @default(0) @map("target_value")
  currentValue    Float     @default(0) @map("current_value")
  aggregationType String    @default("SUM") @map("aggregation_type") // SUM, AVERAGE, LAST_VALUE
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  @@unique([keyResultId, sprintId])
  @@map("kr_sprint_target")
}

model MemberSprintProgress {
  id             String   @id @default(uuid())
  sprintId       String   @map("sprint_id")
  sprint         Sprint   @relation(fields: [sprintId], references: [id], onDelete: Cascade)
  userId         String   @map("user_id")
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  totalScore     Float    @map("total_score")
  taskCount      Int      @default(0) @map("task_count")
  completedCount Int      @default(0) @map("completed_count")
  detailsJson    Json?    @map("details_json")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  @@unique([sprintId, userId])
  @@map("member_sprint_progress")
}

model RoadmapDomain {
  id        String        @id @default(uuid())
  name      String
  code      String        @unique
  color     String        @default("#0e97d6")
  sortOrder Int           @default(0) @map("sort_order")
  epics     RoadmapEpic[]
  createdAt DateTime      @default(now()) @map("created_at")
  updatedAt DateTime      @updatedAt @map("updated_at")

  @@map("roadmap_domain")
}

model RoadmapEpic {
  id          String           @id @default(uuid())
  domainId    String           @map("domain_id")
  domain      RoadmapDomain    @relation(fields: [domainId], references: [id], onDelete: Cascade)
  title       String
  description String?          @db.Text
  startDate   DateTime?        @map("start_date")
  endDate     DateTime?        @map("end_date")
  status      String           @default("PLANNED") // PLANNED, IN_PROGRESS, COMPLETED, DELAYED
  sortOrder   Int              @default(0) @map("sort_order")
  features    RoadmapFeature[]
  createdAt   DateTime         @default(now()) @map("created_at")
  updatedAt   DateTime         @updatedAt @map("updated_at")

  @@map("roadmap_epic")
}

model RoadmapFeature {
  id              String      @id @default(uuid())
  epicId          String      @map("epic_id")
  epic            RoadmapEpic @relation(fields: [epicId], references: [id], onDelete: Cascade)
  title           String
  description     String?     @db.Text
  startDate       DateTime?   @map("start_date")
  endDate         DateTime?   @map("end_date")
  progressPercent Int         @default(0) @map("progress_percent")
  status          String      @default("PLANNED")
  picName         String?     @map("pic_name")
  sortOrder       Int         @default(0) @map("sort_order")
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  @@map("roadmap_feature")
}
```


---

## 4. FORMULASI MATEMATIS & MESIN ROLLUP

Sistem menerapkan perhitungan progress berjenjang dari level operasional (Task) ke strategis (Key Result):

### 4.1 Formulasi Capaian Task
Tiap task memiliki tipe target (`targetType`) dengan rumus persentase capaian:
- **`INCREASE` / `AT_LEAST`**:
  $$\text{Progress} = \min\left(100, \max\left(0, \frac{\text{Current} - \text{Baseline}}{\text{Target} - \text{Baseline}} \times 100\right)\right)$$
- **`DECREASE` / `AT_MOST`**:
  $$\text{Progress} = \min\left(100, \max\left(0, \frac{\text{Baseline} - \text{Current}}{\text{Baseline} - \text{Target}} \times 100\right)\right)$$
- **`EXACTLY`**: `100%` jika $\text{Current} == \text{Target}$, sebaliknya proporsional selisih.

### 4.2 Formulasi Initiative
- **Jika memiliki Task aktif**:
  $$\text{Progress Initiative} = \frac{\sum_{i=1}^{N} \text{Progress Task}_i}{N}$$
- **Jika standalone (tanpa task)**:
  $$\text{Progress Initiative} = \min\left(100, \frac{\text{Current Value}}{\text{Target Value}} \times 100\right)$$

### 4.3 Formulasi Key Result
- **Jika memiliki Initiative aktif**:
  $$\text{Progress KR} = \frac{\sum_{j=1}^{M} \text{Progress Initiative}_j}{M}$$
- **Jika `isManualOverride = true` atau tanpa inisiatif**:
  Nilai progres diambil langsung dari input manual PIC / `(currentValue / targetValue) * 100`.

### 4.4 Formulasi Ringkasan Dashboard (Hero Card vs Initiative Summary)
- **Hero Card Dashboard (`.task-value`)**:
  Dihitung berdasarkan **rata-rata persentase Key Result (KR)** yang diampu user / departemen / korporat.
- **Section Progress Capaian Initiative (`.summary-val`)**:
  Dihitung berdasarkan **rata-rata persentase seluruh Initiative** yang aktif dalam lingkup tersebut.
- **Ambang Batas Status Kesehatan**:
  - $\ge 70\%$: `ON_TRACK` (Badge Hijau `#10b981` / `#00A925`)
  - $40\% - 69.9\%$: `AT_RISK` (Badge Oranye/Kuning `#f59e0b` / `#F2CA17`)
  - $< 40\%$: `OFF_TRACK` (Badge Merah `#ef4444` / `#EB3123`)

### 4.5 Aturan Auto-Rollover Sprint
- Background job berjalan saat start backend dan berulang tiap 1 jam (`setInterval` di `index.ts` memanggil `checkAndAutoRollover`).
- Menyeleksi sprint yang `endDate < now()` dan status bukan `CLOSED`.
- Task dan Initiative yang belum `DONE` / `COMPLETED` otomatis di-roll over ke sprint aktif berikutnya (`UPCOMING` dengan urutan terdekat).


---

## 5. SPESIFIKASI ENDPOINT REST API (`/api`)

Backend Express mengekspos rute terproteksi token JWT (`Authorization: Bearer <TOKEN>`):

### 5.1 Autentikasi (`/api/auth`)
- `POST /login`: Body `{ email, password }` -> Mengembalikan `{ token, user }`.
- `GET /me`: Mengembalikan info session user, role aktif, dan departemen.
- `POST /switch-department`: (Khusus Admin) Mengubah header departemen aktif untuk simulasi pandangan cabang.

### 5.2 Objectives & Key Results (`/api/objectives` & `/api/key-results`)
- `GET /api/objectives`: Mengambil daftar sasaran tahunan beserta relasi KR.
- `POST /api/objectives`: Menambah Objective baru (Admin/C-Level).
- `GET /api/key-results`: Mengambil daftar Key Result (didukung query param `perspective`, `departmentId`).
- `PUT /api/key-results/:id`: Update target, bobot, atau status manual override KR.
- `POST /api/key-results/:id/assignments`: Menetapkan penanggung jawab RACI.

### 5.3 Initiatives & Work (`/api/initiatives`)
- `GET /my-work/all`: Mengambil inisiatif "Pekerjaan Saya" (`ownerId === userId` atau assigned leader) dan "Pekerjaan Tim Saya".
- `POST /`: Membuat inisiatif baru terikat `keyResultId`, `teamId`, dan `sprintId`.
- `PUT /:id`: Update data inisiatif atau status Kanban (`TODO`, `IN_PROGRESS`, `DONE`).
- `POST /:id/progress-updates`: Melaporkan update progress berkala (auto-save untuk Leader/Admin).
- `GET /:id/progress-updates`: Riwayat seluruh laporan progres inisiatif.

### 5.4 Tasks & Kolaborasi (`/api/tasks`)
- `GET /`: Mengambil daftar task per inisiatif atau per member.
- `POST /`: Membuat task operasional baru (mendukung `isCrossDept`, `creatorDept`, `targetDept`).
- `PUT /:id`: Update progres nilai atau status task.
- `POST /:id/updates`: Submit pelaporan progress (status `PENDING_APPROVAL` jika dibuat Team Member).
- `POST /updates/:id/approve` & `/reject`: Approval progress oleh Leader / Manager.
- `GET /:id/comments` & `POST /:id/comments`: Diskusi komentar dan link bukti penyelesaian.

### 5.5 Sprints & Reports (`/api/sprints`)
- `GET /`: Daftar sprint (Urut tanggal & orderIndex).
- `POST /`: Buat periode sprint baru (`startDate`, `endDate`).
- `PUT /:id/close`: Tutup sprint secara manual dan pemicu rollover task menggantung.
- `GET /:id/report`: Ringkasan velocity, completion rate, dan skor pencapaian per anggota.

### 5.6 Product Roadmap (`/api/roadmap`)
- `GET /domains`: Hirarki Domain -> Epics -> Features untuk konsumsi Frappe Gantt.
- `POST /domains`, `POST /epics`, `POST /features`: Manajemen item roadmap.
- `PUT /features/:id`: Update tanggal `startDate`, `endDate`, dan `progressPercent`.

### 5.7 Strategy Map & BSC (`/api/bsc` & `/api/causal`)
- `GET /api/bsc/perspectives`: Agregasi progres 4 perspektif BSC korporat.
- `GET /api/causal-links`: Node dan edge relasi kausal antar Key Result untuk `@vue-flow/core`.
- `POST /api/causal-links`: Menambahkan koneksi hipotesis kausal baru.


---

## 6. STRUKTUR HALAMAN & NAVIGASI FRONTEND

Folder `frontend/app/pages/` menggunakan file-based routing Nuxt:

| Rute URL | Komponen Halaman | Deskripsi & Akses Peran |
|---|---|---|
| `/login` | `login.vue` | Form login JWT + penyimpanan session ke Pinia & cookie |
| `/dashboard` | `dashboard.vue` | Hub performa utama, Hero Card (`.task-value`), ringkasan inisiatif (`.summary-val`), filter departemen/sprint |
| `/c-level` | `c-level.vue` | Executive Dashboard: 4 perspektif BSC, chart tren 8 minggu, health score makro |
| `/strategy-map` | `strategy-map.vue` | Diagram interaktif `@vue-flow/core` pemetaan kausal 4 perspektif BSC korporat |
| `/bsc-view` | `bsc-view.vue` | Tampilan matriks tabel Balanced Scorecard & Key Result korporat |
| `/initiatives` | `initiatives.vue` | Daftar inisiatif program kerja & papan Kanban status (`TODO`, `IN_PROGRESS`, `DONE`) |
| `/product-roadmap`| `product-roadmap.vue` | Visualisasi Frappe Gantt timeline domain, epic, dan feature |
| `/sprint-report` | `sprint-report.vue` | Metrik evaluasi sprint: velocity, task completion rate, member scores |
| `/member-achievement` | `member-achievement.vue` | Rincian capaian performa individual anggota tim |
| `/approvals` | `approvals.vue` | Antrean persetujuan (approval) update progress task/KPI untuk Leader & Manager |
| `/team/my-work` | `team/my-work.vue` | Halaman eksekusi anggota tim: daftar tugas pribadi, update capaian, dan log riwayat |
| `/leader/my-krs` | `leader/my-krs.vue` | Manajemen Key Result dan alokasi program inisiatif tingkat Team Leader |
| `/departments` | `departments.vue` | Monitoring kesehatan departemen & banner peringatan jika departemen nonaktif |
| `/admin/*` | `admin/*.vue` | Manajemen User, Tim, Departemen, RACI assignment, Audit Log, dan Bulk Upload data |


---

## 7. PANDUAN SETUP, RUNNING & DEPLOYMENT

### 7.1 Environment Variables
**Backend (`backend/.env`)**:
```env
PORT=3001
DATABASE_URL="mysql://root:password@127.0.0.1:3306/skolla_okr?charset=utf8mb4"
JWT_SECRET="super-secret-key-okr-bsc-dashboard-2026"
```

**Frontend (`frontend/.env`)**:
```env
PORT=3000
NUXT_PUBLIC_API_BASE="http://localhost:3001/api"
NUXT_PUBLIC_POSTHOG_KEY=""
NUXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
```

### 7.2 Menjalankan di Mode Development
```bash
# Terminal 1: Backend
cd backend
npm install
npx prisma generate
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

### 7.3 Menjalankan via Docker Compose
```bash
docker compose up --build -d
```
Container `okr-backend` aktif di port 3001, container `okr-frontend` aktif di port 3000.

---

## 8. PROMPT SALIN-TEMPEL UNTUK AI DUPLIKATOR

Salin dan kirim instruksi blok di bawah ini kepada AI lain saat ingin meregenerasi / menduplikasi proyek ini:

```markdown
Kamu adalah Principal Full-Stack Engineer. Tugasmu adalah membuat / menduplikasi ulang sistem "Skolla BSC & OKR Suite" secara lengkap dan fungsional berdasarkan spesifikasi di bawah:

### 1. TECH STACK (WAJIB DIPATUHI)
- Frontend: Nuxt 4 (^4.4.8) + Vue 3.5 (Composition API, <script setup>) + Pinia 3.
  - Visual: Chart.js / vue-chartjs (BSC bar & radar), @vue-flow/core (Causal map), Frappe Gantt (Roadmap).
  - Styling: PURE SCOPED CSS dengan CSS Custom Properties (Navy #010571, Blue #0E97D6, border #F0F3F9, font Rubik & Inter). JANGAN GUNAKAN TAILWIND.
  - Nuxt Config: Set `features: { inlineStyles: false }` dan load Frappe Gantt stylesheet.
- Backend: Node.js 20 LTS + Express.js 4.18 + TypeScript 5.3 + Prisma ORM 5.10.2 + MySQL 8.0+.
- Auth: JWT Bearer auth, Bcrypt hashing, RBAC Guard (ADMIN, C_LEVEL, MANAGER, LEADER, TEAM) dengan fitur admin switch department/impersonation.
- Deployment: Docker & Docker Compose (port 3001 backend, port 3000 frontend) dan Nginx reverse proxy.

### 2. STRUKTUR DATA UTAMA (PRISMA)
Buat skema Prisma dengan model:
- `User`, `Team`, `Department` (mendukung toggle nonaktif & banner peringatan).
- `Objective` (Tahunan korporat), `AnnualKeyResult`, `KeyResult` (4 perspektif BSC: FINANCIAL, CUSTOMER, INTERNAL_PROCESS, LEARNING_GROWTH; RACI matrix KrAssignment; targetType INCREASE/DECREASE/EXACTLY/AT_LEAST).
- `Initiative` (Program kerja tim, status TODO/IN_PROGRESS/DONE, terikat Sprint & KR).
- `Task` (Tugas harian member, cross-dept targetDept/creatorDept, progress reporting, approval workflow).
- `Sprint` (Periode eksekusi, auto-rollover job untuk task tertinggal).
- `RoadmapDomain` -> `RoadmapEpic` -> `RoadmapFeature` (Integrasi Frappe Gantt).
- `CausalLink` (Relasi keterkaitan sebab-akibat antar KR untuk Strategy Map).

### 3. LOGIKA FORMULA & INVARIAN KRITIS
1. Invarian 42 KR: Filter Sprint di dashboard C-Level & Strategy Map HANYA memfilter Initiative & Task. Total 42 KR aktif tidak boleh berkurang akibat filter sprint.
2. Rollup Engine:
   - Task Progress dihitung berdasarkan `targetType`.
   - Initiative Progress = Rata-rata progress Task aktif (atau current/target jika standalone).
   - KR Progress = Rata-rata progress Initiative aktif (atau manual override jika `isManualOverride = true`).
   - Hero Card Dashboard (`.task-value`) = Rata-rata KR yang diampu scope user.
   - Section Initiative Summary (`.summary-val`) = Rata-rata seluruh inisiatif aktif.
3. Status Health: >= 70% ON_TRACK (Hijau), 40% - 69.9% AT_RISK (Kuning), < 40% OFF_TRACK (Merah).
4. Auto-Rollover Background Job: Berjalan tiap 1 jam untuk menutup sprint kedaluwarsa dan memindahkan task sisa ke sprint aktif berikutnya.

Bangun kode secara modular: backend dengan controller-routes terpisah per domain, frontend dengan layout AppSidebar & AppHeader dinamis berbasis role.
```

