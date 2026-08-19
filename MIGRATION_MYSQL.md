# Panduan Migrasi Database: SQLite ke MySQL

Dokumen ini berisi panduan teknis langkah demi langkah untuk melakukan migrasi database sistem OKR & BSC Dashboard dari **SQLite** (lokal development) ke **MySQL** (staging / production).

---

## 📋 Ringkasan Perbedaan Utama (SQLite vs MySQL pada Prisma)

| Fitur / Komponen | SQLite (Saat Ini) | MySQL (Tujuan Migrasi) |
|---|---|---|
| **Prisma Datasource Provider** | `"sqlite"` | `"mysql"` |
| **DATABASE_URL** | `file:./dev.db` | `mysql://user:password@localhost:3306/okr_db` |
| **String / Text Attribute** | Tidak mendukung `@db.Text` | Mendukung `@db.Text` atau `@db.VarChar(n)` |
| **Migration Tool** | `npx prisma db push` | `npx prisma migrate dev` (menciptakan `.sql` migration files) |
| **Tipe Data Waktu** | Simpan sebagai string ISO | Native `DATETIME(3)` / `TIMESTAMP` |

---

## 🛠️ Langkah-Langkah Migrasi

### 1. Persiapan Server & Database MySQL
Pastikan server MySQL (versi 8.0+ direkomendasikan) sudah berjalan.
Buat database baru bernama `okr_dashboard`:
```sql
CREATE DATABASE okr_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### 2. Update Environment Variables (`.env`)

Ubah file `backend/.env`:

```env
# Sebelum (SQLite):
# DATABASE_URL="file:./dev.db"

# Sesudah (MySQL):
DATABASE_URL="mysql://root:password_anda@localhost:3306/okr_dashboard"
JWT_SECRET="rahasia_jwt_anda"
PORT=3001
```

---

### 3. Update `schema.prisma` untuk MySQL

Buka file `backend/src/prisma/schema.prisma` dan sesuaikan blok `datasource`:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

> **Catatan Penting `@db.Text` di MySQL:**
> Untuk kolom bermuatan teks panjang seperti `description` di `Objective`/`Initiative` atau `note`/`reviewNote` di `KpiUpdate` & `InitiativeUpdate`, secara opsional dapat ditambahkan atribut `@db.Text` agar MySQL menyimpannya sebagai tipe data `TEXT` (hingga 64KB) alih-alih `VARCHAR(191/255)`.

#### Schema MySQL Rekomendasi (`schema.prisma`):

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id             String          @id @default(uuid())
  name           String
  email          String          @unique
  password       String
  role           String          @default("TEAM") // ADMIN, MANAGER, C_LEVEL, LEADER, TEAM
  department     String?
  position       String?
  teamId         String?
  team           Team?           @relation("TeamMembers", fields: [teamId], references: [id])
  leadingTeams   Team[]          @relation("TeamLeader")
  assignments    KrAssignment[]
  kpiAssignments KpiAssignment[]
  managedDepartments Department[]  @relation("DepartmentManager")
  ownedInitiatives Initiative[]  @relation("InitiativeOwner")
  createdAt      DateTime        @default(now())
}

model Team {
  id          String       @id @default(uuid())
  name        String
  managerId   String?
  leaderId    String?
  leader      User?        @relation("TeamLeader", fields: [leaderId], references: [id])
  department  String?
  users       User[]       @relation("TeamMembers")
  initiatives Initiative[]
}

model Objective {
  id          String      @id @default(uuid())
  title       String
  description String?     @db.Text
  quarter     String
  ownerId     String?
  keyResults  KeyResult[]
  createdAt   DateTime    @default(now())
}

model KeyResult {
  id             String         @id @default(uuid())
  objectiveId    String
  objective      Objective      @relation(fields: [objectiveId], references: [id])
  title          String
  targetValue    Float
  currentValue   Float          @default(0)
  unit           String
  bscPerspective String
  status         String         @default("ON_TRACK")
  assignments    KrAssignment[]
  departments    KrDepartment[]
  updates        KrUpdate[]
  initiatives    Initiative[]
  sourceLinksA   CausalLink[]   @relation("SourceKR")
  sourceLinksB   CausalLink[]   @relation("TargetKR")
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
}

model KrAssignment {
  id          String    @id @default(uuid())
  keyResultId String
  keyResult   KeyResult @relation(fields: [keyResultId], references: [id])
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  assignedBy  String
  assignedAt  DateTime  @default(now())
  raciRole    String    @default("RESPONSIBLE")

  @@unique([keyResultId, userId])
  @@index([keyResultId])
  @@index([userId])
}

model KrDepartment {
  id          String    @id @default(uuid())
  keyResultId String
  keyResult   KeyResult @relation(fields: [keyResultId], references: [id])
  department  String
  createdAt   DateTime  @default(now())

  @@unique([keyResultId, department])
  @@index([keyResultId])
}

model KrUpdate {
  id          String    @id @default(uuid())
  keyResultId String
  keyResult   KeyResult @relation(fields: [keyResultId], references: [id])
  oldValue    Float
  newValue    Float
  note        String?   @db.Text
  updatedBy   String
  updatedAt   DateTime  @default(now())

  @@index([keyResultId, updatedAt])
}

model CausalLink {
  id           String    @id @default(uuid())
  sourceKrId   String
  sourceKr     KeyResult @relation("SourceKR", fields: [sourceKrId], references: [id])
  targetKrId   String
  targetKr     KeyResult @relation("TargetKR", fields: [targetKrId], references: [id])
  relationship String
  note         String?   @db.Text
  createdBy    String
  createdAt    DateTime  @default(now())
}

model Initiative {
  id            String    @id @default(uuid())
  keyResultId   String
  keyResult     KeyResult @relation(fields: [keyResultId], references: [id])
  teamId        String
  team          Team      @relation(fields: [teamId], references: [id])
  ownerId       String?
  owner         User?     @relation("InitiativeOwner", fields: [ownerId], references: [id])
  title         String
  description   String?   @db.Text
  targetValue   Float     @default(0)
  currentValue  Float     @default(0)
  achievedValue Float?
  unit          String?
  status        String    @default("ON_TRACK")
  kanbanStatus  String    @default("TODO")
  weight        Float     @default(1.0)
  startDate     DateTime?
  dueDate       DateTime?
  sprintMonth   String?
  kpis          Kpi[]
  progressUpdates InitiativeUpdate[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([sprintMonth])
}

model Kpi {
  id           String          @id @default(uuid())
  initiativeId String
  initiative   Initiative      @relation(fields: [initiativeId], references: [id])
  title        String
  targetValue  Float
  currentValue Float           @default(0)
  unit         String?
  status       String          @default("ON_TRACK")
  assignments  KpiAssignment[]
  updates      KpiUpdate[]
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
}

model KpiAssignment {
  id         String   @id @default(uuid())
  kpiId      String
  kpi        Kpi      @relation(fields: [kpiId], references: [id])
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  assignedAt DateTime @default(now())

  @@unique([kpiId, userId])
  @@index([kpiId])
  @@index([userId])
}

model KpiUpdate {
  id          String    @id @default(uuid())
  kpiId       String
  kpi         Kpi       @relation(fields: [kpiId], references: [id])
  oldValue    Float
  newValue    Float
  note        String?   @db.Text
  submittedBy String
  status      String    @default("PENDING_APPROVAL")
  reviewedBy  String?
  reviewNote  String?   @db.Text
  reviewedAt  DateTime?
  createdAt   DateTime  @default(now())

  @@index([kpiId, createdAt])
}

model Department {
  id        String   @id @default(uuid())
  name      String
  value     String   @unique
  managerId String?
  manager   User?    @relation("DepartmentManager", fields: [managerId], references: [id])
  createdAt DateTime @default(now())
}

model InitiativeUpdate {
  id           String     @id @default(uuid())
  initiativeId String
  initiative   Initiative @relation(fields: [initiativeId], references: [id])
  oldValue     Float
  newValue     Float
  note         String?    @db.Text
  kanbanStatus String?
  submittedBy  String
  createdAt    DateTime   @default(now())

  @@index([initiativeId, createdAt])
}
```

---

### 4. Eksekusi Migrasi Struktur Database Ke MySQL

Jalankan perintah berikut di direktori `backend/`:

```bash
cd backend

# 1. Generate Prisma Client baru sesuai schema MySQL
npx prisma generate

# 2. Buat & jalankan migrasi ke MySQL
npx prisma migrate dev --name init_mysql
```

Jika tidak ingin membuat file folder `prisma/migrations` dan langsung mendorong struktur tabel:
```bash
npx prisma db push
```

---

### 5. Transfer Data dari SQLite (`dev.db`) ke MySQL (Opsional)

Jika Anda memiliki data pengembangan di SQLite lokal yang ingin dipindahkan ke MySQL:

#### Opsi A: Menggunakan Tool `sqlite3` + Mysql Dump Converter
Gunakan paket CLI seperti `sqlite3-to-mysql` atau `pgloader` / DB management tool (DBeaver / DataGrip).

#### Opsi B: Menggunakan Script Node.js Data Migration (Rekomendasi)
Anda dapat membuat script sejenis `backend/src/scripts/migrate-data.ts`:

```typescript
import { PrismaClient as SqliteClient } from '@prisma/client'; // dari SQLite dev.db
import { PrismaClient as MysqlClient } from '@prisma/client';  // dari MySQL DB

// 1. Baca data dari SQLite dev.db
// 2. Insert bertahap sesuai urutan FK (User -> Team -> Objective -> KeyResult -> Initiative -> Kpi -> Updates)
```

---

### 6. Verifikasi Setelah Migrasi

Setelah migrasi selesai:
1. Pastikan server backend berjalan tanpa error: `npm run dev` atau `npm run build && npm start`.
2. Lakukan uji coba login untuk semua role (`TEAM`, `LEADER`, `MANAGER`, `C_LEVEL`, `ADMIN`).
3. Coba lakukan update progress pada Inisiatif dan KPI untuk memastikan transaksi MySQL dan CASCADE berjalan dengan sempurna.
