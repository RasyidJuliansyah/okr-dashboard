# 📋 Technical Implementation Document

## OKR Dashboard — KR Assignment, RACI Matrix & BSC Metrics Framework

**Tanggal:** 28 Juli 2026 (Update: BSC KR + RACI, 28 Juli 2026 | Update: Revisi Logika RACI + Modal Edit, 10 Agustus 2026)  
**Dibuat oleh:** Senior Developer / AI Architect  
**Dieksekusi oleh:** Junior Developer  
**Estimasi waktu:** 6–9 jam kerja (termasuk FASE 0 BSC Framework)

---

## 🗂️ Struktur Proyek (Referensi)

```
okr-dashboard/
├── backend/
│   └── src/
│       ├── controllers/
│       │   ├── auth.controller.ts
│       │   ├── keyresult.controller.ts   ← MODIFY
│       │   ├── dashboard.controller.ts   ← MODIFY
│       │   ├── bsc.controller.ts         ← MODIFY
│       │   └── user.controller.ts        ← CREATE NEW
│       ├── routes/
│       │   ├── keyresult.routes.ts       ← MODIFY
│       │   └── user.routes.ts            ← CREATE NEW
│       ├── prisma/
│       │   └── schema.prisma             ← MODIFY (tambah RACI fields + departments)
│       └── index.ts                      ← MODIFY (daftarkan user routes)
└── frontend/
    └── app/
        ├── pages/
        │   ├── dashboard.vue             ← MODIFY
        │   ├── admin/
        │   │   ├── objectives.vue        ← MODIFY
        │   │   └── update-progress.vue   ← MODIFY
        │   └── kr-history.vue            ← CREATE NEW
        └── app.vue / AppSidebar.vue      ← MODIFY (tambah nav link)
```

---

## 🎯 FASE 0 — BSC METRICS FRAMEWORK (KR + RACI + DEPARTEMEN)

> **Konteks:** Setiap metrik BSC (_Balanced Scorecard_) harus memiliki **Key Result (KR)** yang terukur. Setiap KR dapat di-assign ke **lebih dari satu pegawai**, melibatkan **satu atau lebih departemen**, serta memiliki **RACI Matrix** minimal untuk kolom **Responsible** (siapa yang mengerjakan) dan **Accountable** (siapa yang bertanggung jawab penuh atas hasil).

> [!IMPORTANT]
> **Seluruh Objective, Metrics BSC, dan KR bersifat CUSTOMIZABLE sepenuhnya oleh Admin.**
> Tabel-tabel di bawah ini adalah **contoh referensi** saja — bukan data yang di-hardcode ke sistem.
> Admin tetap bisa membuat, mengedit, dan menghapus Objective/KR secara bebas dari halaman admin di frontend.
> Perspektif BSC (`FINANCIAL`, `CUSTOMER`, `INTERNAL_PROCESS`, `LEARNING_GROWTH`) hanya digunakan sebagai **kategori/label** yang dipilih Admin saat membuat KR.

---

### 0.1 Contoh Referensi KR per Perspektif BSC

> **Catatan:** Data di bawah adalah **contoh/panduan isian**, bukan fixed schema. Admin bebas membuat Objective dan KR apapun — BSC Perspective hanya dipilih dari dropdown saat create/edit KR.

BSC memiliki 4 perspektif. Setiap perspektif memiliki **Objective** dan setiap Objective memiliki **KR-KR** yang spesifik.

---

#### 📊 PERSPEKTIF 1: FINANCIAL (Keuangan)

**Objective:** _Meningkatkan profitabilitas dan efisiensi biaya operasional_

| KR    | Deskripsi KR                                                        | Target | Unit  | Departemen Terlibat              | Responsible                      | Accountable |
| ----- | ------------------------------------------------------------------- | ------ | ----- | -------------------------------- | -------------------------------- | ----------- |
| KR-F1 | Meningkatkan Revenue perusahaan                                     | 15     | % YoY | Finance, Sales, Marketing        | Finance Manager, Sales Lead      | CFO         |
| KR-F2 | Menurunkan COGS (Cost of Goods Sold)                                | 10     | %     | Finance, Operations, Engineering | Finance Analyst, Ops Manager     | CFO         |
| KR-F3 | Meningkatkan Net Profit Margin                                      | 20     | %     | Finance                          | Finance Manager                  | CFO         |
| KR-F4 | Mengurangi biaya operasional overhead                               | 8      | %     | Finance, Operations, HR          | Ops Analyst, Finance Analyst     | COO         |
| KR-F5 | Meningkatkan ARR (Annual Recurring Revenue) dari pelanggan existing | 25     | %     | Sales, Product                   | Account Manager, Product Manager | CEO         |

**Catatan RACI per KR Finansial:**

- **Responsible**: Tim yang secara langsung **melaksanakan** pekerjaan untuk mencapai KR ini. Bisa lebih dari satu orang/departemen.
- **Accountable**: Eksekutif/Manager yang **bertanggung jawab penuh** atas hasil akhir. Hanya **satu orang** per KR.
- **Consulted** _(opsional, untuk fase berikutnya)_: Pihak yang dimintai pendapat/input.
- **Informed** _(opsional, untuk fase berikutnya)_: Pihak yang perlu diinformasikan progress.

---

#### 👥 PERSPEKTIF 2: CUSTOMER (Pelanggan)

**Objective:** _Meningkatkan kepuasan dan loyalitas pelanggan_

| KR    | Deskripsi KR                                      | Target | Unit              | Departemen Terlibat                  | Responsible                     | Accountable |
| ----- | ------------------------------------------------- | ------ | ----------------- | ------------------------------------ | ------------------------------- | ----------- |
| KR-C1 | Meningkatkan Net Promoter Score (NPS)             | 70     | Skor (0-100)      | Product, Marketing, Customer Success | CS Manager, Product Manager     | CPO         |
| KR-C2 | Menurunkan Customer Churn Rate                    | 5      | % per kuartal     | Sales, Product, CS                   | Account Manager, CS Lead        | CCO / CPO   |
| KR-C3 | Meningkatkan Customer Satisfaction Score (CSAT)   | 4.5    | dari 5            | CS, Product                          | CS Analyst, UX Designer         | CPO         |
| KR-C4 | Menurunkan rata-rata waktu resolusi tiket support | 4      | jam               | Engineering, CS                      | Support Engineer, CS Manager    | CTO         |
| KR-C5 | Meningkatkan jumlah pelanggan aktif baru          | 200    | pelanggan/kuartal | Marketing, Sales                     | Sales Rep, Marketing Specialist | CMO         |
| KR-C6 | Meningkatkan Customer Retention Rate              | 90     | %                 | CS, Sales, Product                   | CS Manager, Account Manager     | CCO         |

---

#### ⚙️ PERSPEKTIF 3: INTERNAL PROCESS (Proses Internal)

**Objective:** _Meningkatkan efisiensi dan kualitas proses bisnis internal_

| KR     | Deskripsi KR                                    | Target | Unit          | Departemen Terlibat         | Responsible                  | Accountable |
| ------ | ----------------------------------------------- | ------ | ------------- | --------------------------- | ---------------------------- | ----------- |
| KR-IP1 | Menurunkan bug escape rate ke production        | 2      | %             | Engineering, QA             | QA Lead, Engineering Manager | CTO         |
| KR-IP2 | Meningkatkan deployment frequency (CI/CD)       | 10     | deploy/minggu | Engineering, DevOps         | DevOps Engineer, Tech Lead   | CTO         |
| KR-IP3 | Menurunkan mean time to recovery (MTTR) insiden | 30     | menit         | Engineering, Operations     | SRE/DevOps, Ops Manager      | CTO         |
| KR-IP4 | Meningkatkan test coverage codebase             | 80     | %             | Engineering                 | Engineering Manager, QA Lead | CTO         |
| KR-IP5 | Menyelesaikan cycle time pengembangan fitur     | 14     | hari          | Engineering, Product        | Tech Lead, Product Manager   | CPO         |
| KR-IP6 | Mengurangi waktu onboarding pelanggan baru      | 3      | hari          | CS, Operations, Engineering | CS Lead, Ops Manager         | COO         |
| KR-IP7 | Meningkatkan cakupan SLA terpenuhi              | 99.5   | % uptime      | Engineering, Operations     | DevOps, Ops Manager          | CTO         |

---

#### 🌱 PERSPEKTIF 4: LEARNING & GROWTH (Pembelajaran & Pertumbuhan)

**Objective:** _Meningkatkan kapabilitas SDM dan budaya inovasi organisasi_

| KR     | Deskripsi KR                                                         | Target | Unit             | Departemen Terlibat                  | Responsible                 | Accountable |
| ------ | -------------------------------------------------------------------- | ------ | ---------------- | ------------------------------------ | --------------------------- | ----------- |
| KR-LG1 | Meningkatkan Employee Engagement Score                               | 80     | %                | HR, Management                       | HR Manager, People Partner  | CHRO        |
| KR-LG2 | Menyelesaikan jam pelatihan/sertifikasi per pegawai                  | 40     | jam/kuartal      | HR, Engineering, Product             | HR Specialist, L&D Manager  | CHRO        |
| KR-LG3 | Menurunkan Employee Turnover Rate                                    | 10     | %                | HR, Finance                          | HR Manager, Finance Analyst | CHRO        |
| KR-LG4 | Meningkatkan skor penilaian kinerja rata-rata                        | 4.2    | dari 5           | HR, semua dept                       | HR Manager                  | CHRO        |
| KR-LG5 | Meningkatkan jumlah inovasi/proposal internal yang diimplementasikan | 5      | proposal/kuartal | HR, Engineering, Product, Management | Innovation Lead, HR Manager | CEO         |
| KR-LG6 | Meningkatkan adoption rate tools internal baru                       | 85     | %                | Engineering, HR, Operations          | System Admin, HR Trainer    | CTO         |

---

### 0.2 RACI Matrix — Definisi & Aturan

#### Definisi Peran RACI

| Peran           | Simbol | Definisi                                                                                                                                     | Jumlah per KR              |
| --------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| **Responsible** | R      | Orang yang **secara langsung mengerjakan** tugas untuk mencapai KR. **Tepat 1 orang** — dipilih via radio button.                            | = 1 (selalu tunggal) ⚠️    |
| **Accountable** | A      | Orang yang **bertanggung jawab penuh** atas hasil KR. Bisa lebih dari satu, namun minimal 1 — dipilih via checkbox.                          | ≥ 1 (bisa lebih dari satu) |
| **Consulted**   | C      | Pihak yang **dimintai masukan/pendapat** selama proses berlangsung _(fase lanjutan)_                                                         | 0 atau lebih               |
| **Informed**    | I      | Pihak yang **diinformasikan progress** tapi tidak terlibat langsung _(fase lanjutan)_                                                        | 0 atau lebih               |

> ⚠️ **Aturan RACI yang Wajib Diikuti** _(diperbarui 10 Agustus 2026)_:
>
> 1. Setiap KR **HARUS** memiliki tepat **1 Responsible** — dipilih via **radio button** di UI
> 2. Setiap KR **HARUS** memiliki minimal **1 Accountable** — dipilih via **checkbox** di UI (boleh lebih dari 1)
> 3. **Satu user TIDAK BOLEH memiliki dua peran berbeda dalam satu KR yang sama** (tidak bisa sekaligus R dan A). Constraint ini dikenforce di database level via `@@unique([keyResultId, userId])` pada model `KrAssignment`, dan di UI level via disable state pada checkbox/radio
> 4. Jangan membebani satu orang terlalu banyak sebagai Responsible di banyak KR sekaligus

---

### 0.3 Contoh RACI per KR — Detail

#### KR-F1: Meningkatkan Revenue 15% YoY

```
┌──────────────────────────┬──────────────┬──────────────┐
│ Pegawai / Departemen     │ Peran RACI   │ Keterangan   │
├──────────────────────────┼──────────────┼──────────────┤
│ Finance Manager          │ R            │ Analisis & laporan revenue │
│ Sales Lead               │ R            │ Eksekusi target penjualan │
│ Marketing Specialist     │ R            │ Campaign akuisisi pelanggan │
│ CFO                      │ A            │ Final decision & pelaporan board │
│ CEO                      │ I            │ Informed via dashboard bulanan │
└──────────────────────────┴──────────────┴──────────────┘
Departemen terlibat: Finance, Sales, Marketing
```

#### KR-C1: Meningkatkan NPS ke skor 70

```
┌──────────────────────────┬──────────────┬──────────────┐
│ Pegawai / Departemen     │ Peran RACI   │ Keterangan   │
├──────────────────────────┼──────────────┼──────────────┤
│ CS Manager               │ R            │ Program kepuasan pelanggan │
│ Product Manager          │ R            │ Perbaikan fitur berdasar feedback │
│ UX Designer              │ R            │ Improvement user experience │
│ CPO                      │ A            │ Pemilik metric NPS │
│ CFO                      │ I            │ Informed karena dampak ke revenue │
└──────────────────────────┴──────────────┴──────────────┘
Departemen terlibat: Product, Marketing, Customer Success
```

#### KR-IP2: Meningkatkan Deployment Frequency 10x/minggu

```
┌──────────────────────────┬──────────────┬──────────────┐
│ Pegawai / Departemen     │ Peran RACI   │ Keterangan   │
├──────────────────────────┼──────────────┼──────────────┤
│ DevOps Engineer          │ R            │ Setup CI/CD pipeline │
│ Tech Lead                │ R            │ Koordinasi deployment cadence │
│ QA Lead                  │ C            │ Validasi kualitas setiap release │
│ CTO                      │ A            │ Bertanggung jawab atas infrastruktur │
│ COO                      │ I            │ Informed dampak ke operasional │
└──────────────────────────┴──────────────┴──────────────┘
Departemen terlibat: Engineering, Operations
```

---

### 0.4 Perubahan Schema Database untuk RACI

Schema Prisma perlu diupdate untuk menyimpan data RACI per KR Assignment dan departemen yang terlibat:

```prisma
// TAMBAHKAN ke model KrAssignment — field raciRole dan departmen

model KrAssignment {
  id          String    @id @default(uuid())
  keyResultId String
  keyResult   KeyResult @relation(fields: [keyResultId], references: [id])
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  assignedBy  String
  assignedAt  DateTime  @default(now())

  // FIELD BARU: RACI Role
  raciRole    String    @default("RESPONSIBLE") // RESPONSIBLE | ACCOUNTABLE | CONSULTED | INFORMED

  @@unique([keyResultId, userId])
  @@index([keyResultId])
  @@index([userId])
}

// TAMBAHKAN model baru: Departemen yang terlibat per KR
model KrDepartment {
  id          String    @id @default(uuid())
  keyResultId String
  keyResult   KeyResult @relation(fields: [keyResultId], references: [id])
  department  String    // ENGINEERING | PRODUCT | MARKETING | FINANCE | HR | OPERATIONS | SALES | CS
  createdAt   DateTime  @default(now())

  @@unique([keyResultId, department])
  @@index([keyResultId])
}
```

Update `model KeyResult` untuk menambahkan relasi ke `KrDepartment`:

```prisma
model KeyResult {
  id             String         @id @default(uuid())
  objectiveId    String
  objective      Objective      @relation(fields: [objectiveId], references: [id])
  title          String
  targetValue    Float
  currentValue   Float          @default(0)
  unit           String
  bscPerspective String         // FINANCIAL | CUSTOMER | INTERNAL_PROCESS | LEARNING_GROWTH
  status         String         @default("ON_TRACK")
  assignments    KrAssignment[]
  departments    KrDepartment[] // ← BARU: departemen yang terlibat
  updates        KrUpdate[]
  sourceLinksA   CausalLink[]   @relation("SourceKR")
  sourceLinksB   CausalLink[]   @relation("TargetKR")
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
}
```

---

### 0.5 Migrasi Database untuk RACI & Departemen

```bash
cd backend

# Jalankan migrasi untuk RACI fields dan KrDepartment
npx prisma migrate dev --name add_raci_role_and_kr_departments

# Generate ulang Prisma Client
npx prisma generate
```

---

### 0.6 Perubahan API untuk RACI & Departemen

#### A. Update `assignUsersToKeyResult` — Sertakan `raciRole` & `departments`

Body request berubah dari:

```json
{ "userIds": ["user-id-1", "user-id-2"] }
```

Menjadi:

```json
{
  "assignments": [
    { "userId": "user-id-1", "raciRole": "RESPONSIBLE" },
    { "userId": "user-id-2", "raciRole": "RESPONSIBLE" },
    { "userId": "user-id-3", "raciRole": "ACCOUNTABLE" }
  ],
  "departments": ["ENGINEERING", "PRODUCT"]
}
```

#### B. Validasi RACI di Backend

Tambahkan validasi di `keyresult.controller.ts`:

```typescript
// Validasi RACI: harus ada tepat 1 ACCOUNTABLE
const accountables = assignments.filter((a) => a.raciRole === "ACCOUNTABLE");
if (accountables.length !== 1) {
  return res.status(400).json({
    message:
      "Setiap KR harus memiliki tepat 1 Accountable (tidak boleh lebih atau kurang dari 1)",
  });
}

// Validasi RACI: harus ada minimal 1 RESPONSIBLE
const responsibles = assignments.filter((a) => a.raciRole === "RESPONSIBLE");
if (responsibles.length < 1) {
  return res.status(400).json({
    message: "Setiap KR harus memiliki minimal 1 Responsible",
  });
}

const validRaciRoles = ["RESPONSIBLE", "ACCOUNTABLE", "CONSULTED", "INFORMED"];
for (const a of assignments) {
  if (!validRaciRoles.includes(a.raciRole)) {
    return res.status(400).json({
      message: `raciRole harus salah satu dari: ${validRaciRoles.join(", ")}`,
    });
  }
}
```

#### C. Update `assignUsersToKeyResult` Controller (Full Function)

```typescript
// POST /api/key-results/:id/assign
// Body: { assignments: [{userId, raciRole}][], departments: string[] }
export async function assignUsersToKeyResult(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { assignments, departments } = req.body;

    // --- Backward compatibility: support lama { userIds: string[] } ---
    let normalizedAssignments: { userId: string; raciRole: string }[] = [];
    if (Array.isArray(req.body.userIds)) {
      // format lama: semua jadi RESPONSIBLE
      normalizedAssignments = req.body.userIds.map((uid: string) => ({
        userId: uid,
        raciRole: "RESPONSIBLE",
      }));
    } else if (Array.isArray(assignments)) {
      normalizedAssignments = assignments;
    } else {
      return res
        .status(400)
        .json({ message: "assignments harus berupa array" });
    }

    // Validasi KR ada
    const kr = await prisma.keyResult.findUnique({ where: { id } });
    if (!kr) return res.status(404).json({ message: "Key Result not found" });

    // Validasi RACI: tepat 1 ACCOUNTABLE
    const accountables = normalizedAssignments.filter(
      (a) => a.raciRole === "ACCOUNTABLE",
    );
    if (accountables.length !== 1) {
      return res.status(400).json({
        message: "Setiap KR harus memiliki tepat 1 Accountable",
      });
    }

    // Validasi RACI: minimal 1 RESPONSIBLE
    const responsibles = normalizedAssignments.filter(
      (a) => a.raciRole === "RESPONSIBLE",
    );
    if (responsibles.length < 1) {
      return res.status(400).json({
        message: "Setiap KR harus memiliki minimal 1 Responsible",
      });
    }

    // Validasi user IDs
    const userIds = normalizedAssignments.map((a) => a.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true },
    });
    if (users.length !== userIds.length) {
      return res
        .status(400)
        .json({ message: "Satu atau lebih user tidak ditemukan" });
    }

    // Validasi departments
    const validDepartments = [
      "ENGINEERING",
      "PRODUCT",
      "MARKETING",
      "FINANCE",
      "HR",
      "OPERATIONS",
      "SALES",
      "CS",
    ];
    if (departments && Array.isArray(departments)) {
      for (const dept of departments) {
        if (!validDepartments.includes(dept)) {
          return res
            .status(400)
            .json({ message: `Department tidak valid: ${dept}` });
        }
      }
    }

    // Transaksi: replace assignments + departments
    await prisma.$transaction([
      // Hapus assignments lama
      prisma.krAssignment.deleteMany({ where: { keyResultId: id } }),
      // Buat assignments baru dengan raciRole
      prisma.krAssignment.createMany({
        data: normalizedAssignments.map((a) => ({
          keyResultId: id,
          userId: a.userId,
          raciRole: a.raciRole,
          assignedBy: req.user?.id || "system",
        })),
      }),
      // Hapus departments lama
      prisma.krDepartment.deleteMany({ where: { keyResultId: id } }),
      // Buat departments baru
      ...(departments && departments.length > 0
        ? [
            prisma.krDepartment.createMany({
              data: departments.map((dept: string) => ({
                keyResultId: id,
                department: dept,
              })),
            }),
          ]
        : []),
    ]);

    // Return KR dengan assignments dan departments terbaru
    const updated = await prisma.keyResult.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
                role: true,
              },
            },
          },
          orderBy: { raciRole: "asc" },
        },
        departments: true,
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Assign users error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
```

---

### 0.7 Frontend — Form RACI di Objectives Page

#### A. State baru di `objectives.vue`

```javascript
// Update state KR untuk support raciAssignments (array of {userId, raciRole})
// dan departments (array of string)

const newObjective = ref({
  title: "",
  description: "",
  quarter: "Q3-2026",
  keyResults: [
    {
      title: "",
      targetValue: null,
      unit: "%",
      bscPerspective: "",
      raciAssignments: [], // [{ userId, raciRole }] — BARU (ganti assigneeIds)
      departments: [], // ['ENGINEERING', 'PRODUCT', ...] — BARU
    },
  ],
});
```

#### B. UI Komponen RACI per KR

Tambahkan blok berikut di template setiap `kr-row-card`, **menggantikan** blok multi-select assignee lama (langkah 3.2 Perubahan 4):

```html
<!-- ========================== -->
<!-- RACI ASSIGNMENT SECTION    -->
<!-- ========================== -->
<div class="raci-section">
  <div class="raci-section-header">
    <span class="raci-title">RACI Assignment</span>
    <span class="raci-hint">Pilih pegawai & tentukan peran RACI mereka</span>
  </div>

  <!-- Responsible Members -->
  <div class="raci-group">
    <div class="raci-role-label responsible">
      <span class="raci-badge r-badge">R</span>
      Responsible
      <span class="raci-role-desc">— Tim yang mengerjakan KR ini</span>
    </div>
    <div class="assignee-multi-select">
      <label
        v-for="user in userList"
        :key="'R-' + user.id"
        class="assignee-checkbox-item"
        :class="{ selected: isAssigned(kr, user.id, 'RESPONSIBLE') }"
      >
        <input
          type="checkbox"
          :checked="isAssigned(kr, user.id, 'RESPONSIBLE')"
          @change="toggleRaciAssignment(kr, user.id, 'RESPONSIBLE', $event)"
        />
        <span class="assignee-name">{{ user.name }}</span>
        <span class="assignee-dept-badge" v-if="user.department"
          >{{ user.department }}</span
        >
        <span class="assignee-role-badge">{{ user.role }}</span>
      </label>
    </div>
  </div>

  <!-- Accountable Member (hanya 1) -->
  <div class="raci-group">
    <div class="raci-role-label accountable">
      <span class="raci-badge a-badge">A</span>
      Accountable
      <span class="raci-role-desc">— Satu orang penanggung jawab akhir</span>
    </div>
    <div class="assignee-multi-select">
      <label
        v-for="user in userList"
        :key="'A-' + user.id"
        class="assignee-checkbox-item"
        :class="{ selected: isAssigned(kr, user.id, 'ACCOUNTABLE'), disabled: hasAccountable(kr) && !isAssigned(kr, user.id, 'ACCOUNTABLE') }"
      >
        <input
          type="radio"
          :name="'accountable-' + index"
          :value="user.id"
          :checked="isAssigned(kr, user.id, 'ACCOUNTABLE')"
          @change="setAccountable(kr, user.id)"
        />
        <span class="assignee-name">{{ user.name }}</span>
        <span class="assignee-dept-badge" v-if="user.department"
          >{{ user.department }}</span
        >
        <span class="assignee-role-badge">{{ user.role }}</span>
      </label>
    </div>
  </div>

  <!-- Departemen yang Terlibat -->
  <div class="raci-group">
    <div class="raci-role-label departments">
      Departemen Terlibat
      <span class="raci-role-desc"
        >— Unit bisnis yang berkontribusi pada KR ini</span
      >
    </div>
    <div class="dept-multi-select">
      <label
        v-for="dept in availableDepartments"
        :key="dept.value"
        class="dept-checkbox-item"
        :class="{ selected: kr.departments.includes(dept.value) }"
      >
        <input type="checkbox" :value="dept.value" v-model="kr.departments" />
        <span class="dept-icon">{{ dept.icon }}</span>
        <span class="dept-name">{{ dept.label }}</span>
      </label>
    </div>
  </div>

  <!-- RACI Preview Summary -->
  <div class="raci-preview" v-if="kr.raciAssignments.length > 0">
    <div class="raci-preview-title">Ringkasan RACI:</div>
    <div
      class="raci-preview-row"
      v-for="item in kr.raciAssignments"
      :key="item.userId + item.raciRole"
    >
      <span class="raci-badge-sm" :class="item.raciRole.toLowerCase() + '-sm'"
        >{{ item.raciRole[0] }}</span
      >
      <span class="raci-user-name">{{ getUserName(item.userId) }}</span>
    </div>
    <div class="raci-dept-preview" v-if="kr.departments.length > 0">
      <span class="raci-dept-label">Dept:</span>
      <span v-for="d in kr.departments" :key="d" class="dept-tag">{{ d }}</span>
    </div>
  </div>
</div>
```

#### C. Script helpers untuk RACI

```javascript
// Daftar departemen yang tersedia
const availableDepartments = [
  { value: "ENGINEERING", label: "Engineering" },
  { value: "PRODUCT", label: "Product" },
  { value: "MARKETING", label: "Marketing" },
  { value: "FINANCE", label: "Finance" },
  { value: "HR", label: "Human Resources" },
  { value: "OPERATIONS", label: "Operations" },
  { value: "SALES", label: "Sales" },
  { value: "CS", label: "Customer Success" },
];

// Check apakah user sudah di-assign dengan role tertentu
function isAssigned(kr, userId, raciRole) {
  return kr.raciAssignments.some(
    (a) => a.userId === userId && a.raciRole === raciRole,
  );
}

// Check apakah sudah ada Accountable
function hasAccountable(kr) {
  return kr.raciAssignments.some((a) => a.raciRole === "ACCOUNTABLE");
}

// Toggle checkbox untuk Responsible (bisa lebih dari satu)
function toggleRaciAssignment(kr, userId, raciRole, event) {
  if (event.target.checked) {
    // Tambah assignment
    kr.raciAssignments.push({ userId, raciRole });
  } else {
    // Hapus assignment
    const idx = kr.raciAssignments.findIndex(
      (a) => a.userId === userId && a.raciRole === raciRole,
    );
    if (idx > -1) kr.raciAssignments.splice(idx, 1);
  }
}

// Set Accountable (radio button — hanya 1)
function setAccountable(kr, userId) {
  // Hapus accountable lama jika ada
  const idx = kr.raciAssignments.findIndex((a) => a.raciRole === "ACCOUNTABLE");
  if (idx > -1) kr.raciAssignments.splice(idx, 1);
  // Set yang baru
  kr.raciAssignments.push({ userId, raciRole: "ACCOUNTABLE" });
}

// Ambil nama user berdasar ID
function getUserName(userId) {
  return userList.value.find((u) => u.id === userId)?.name || userId;
}
```

#### D. Update `submitObjective` untuk kirim RACI

```javascript
// Setelah setiap KR berhasil dibuat (dalam loop), ganti logika assignment lama dengan:
if (kr.raciAssignments && kr.raciAssignments.length > 0) {
  // Validasi client-side: harus ada 1 ACCOUNTABLE
  const accountables = kr.raciAssignments.filter(
    (a) => a.raciRole === "ACCOUNTABLE",
  );
  if (accountables.length !== 1) {
    alert(`KR "${kr.title}" harus memiliki tepat 1 Accountable!`);
    return;
  }

  await $fetch(`${config.public.apiBase}/key-results/${createdKr.id}/assign`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: {
      assignments: kr.raciAssignments,
      departments: kr.departments || [],
    },
  });
}
```

#### E. CSS Tambahan untuk RACI

```css
/* ======================== */
/* RACI Section Styles      */
/* ======================== */

.raci-section {
  border: 1px solid var(--border-default, #e2e8f0);
  border-radius: 10px;
  padding: 1rem;
  background: var(--surface-page, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.75rem;
}

.raci-section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.raci-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-heading, #2d3643);
}

.raci-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted, #8897ae);
}

.raci-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.raci-role-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-body, #5e718d);
}

.raci-role-desc {
  font-weight: 400;
  color: var(--color-text-muted, #8897ae);
}

/* RACI Role Badges */
.raci-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
}

.r-badge {
  background: #0e97d6;
} /* Responsible — biru */
.a-badge {
  background: #7c3aed;
} /* Accountable — ungu */
.dept-badge {
  background: #059669;
  font-size: 0.8rem;
} /* Department — hijau */

/* Department Multi-Select */
.dept-multi-select {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.5rem;
  background: var(--surface-white, #fff);
  border: 1px solid var(--border-default, #e2e8f0);
  border-radius: 8px;
}

.dept-checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  border: 1px solid var(--border-default, #e2e8f0);
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 150ms ease;
  background: var(--surface-page, #f8fafc);
}

.dept-checkbox-item:hover {
  border-color: #0e97d6;
  background: #eff6ff;
}

.dept-checkbox-item.selected {
  background: #eff6ff;
  border-color: #0e97d6;
  color: #0e97d6;
}

.dept-icon {
  font-size: 0.85rem;
}
.dept-name {
  font-weight: 500;
}

/* RACI Preview */
.raci-preview {
  background: var(--surface-white, #fff);
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.raci-preview-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted, #8897ae);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.2rem;
}

.raci-preview-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.raci-badge-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
}

.responsible-sm {
  background: #0e97d6;
}
.accountable-sm {
  background: #7c3aed;
}
.consulted-sm {
  background: #d97706;
}
.informed-sm {
  background: #64748b;
}

.raci-user-name {
  font-size: 0.8rem;
  color: var(--color-text-body, #5e718d);
}

.raci-dept-preview {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-wrap: wrap;
  margin-top: 0.3rem;
}

.raci-dept-label {
  font-size: 0.72rem;
  color: var(--color-text-muted, #8897ae);
  font-weight: 500;
}

.dept-tag {
  font-size: 0.68rem;
  padding: 0.1rem 0.4rem;
  background: #d1fae5;
  color: #059669;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
}

/* Assignee item selected state */
.assignee-checkbox-item.selected {
  background: var(--surface-white, #fff);
}

.assignee-checkbox-item.disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}
```

---

### 0.8 Display RACI di Dashboard & Update Progress

#### A. KR Card di `dashboard.vue` — Tampilkan RACI Chips

```html
<!-- Ganti blok kr-assignees-row yang ada dengan versi RACI-aware: -->
<div v-if="kr.assignments && kr.assignments.length > 0" class="kr-raci-row">
  <!-- Accountable -->
  <div class="raci-mini-group">
    <span class="raci-mini-badge a-mini">A</span>
    <span
      v-for="a in kr.assignments.filter(x => x.raciRole === 'ACCOUNTABLE')"
      :key="a.id"
      class="raci-chip accountable-chip"
    >
      {{ a.user.name }}
    </span>
  </div>
  <!-- Responsible -->
  <div
    class="raci-mini-group"
    v-if="kr.assignments.some(x => x.raciRole === 'RESPONSIBLE')"
  >
    <span class="raci-mini-badge r-mini">R</span>
    <span
      v-for="a in kr.assignments.filter(x => x.raciRole === 'RESPONSIBLE')"
      :key="a.id"
      class="raci-chip responsible-chip"
    >
      {{ a.user.name }}
      <span v-if="a.user.department" class="chip-dept"
        >· {{ a.user.department }}</span
      >
    </span>
  </div>
  <!-- Departemen Terlibat -->
  <div class="kr-dept-row" v-if="kr.departments && kr.departments.length > 0">
    <span class="dept-mini-label">Dept:</span>
    <span v-for="d in kr.departments" :key="d.id" class="dept-mini-tag"
      >{{ d.department }}</span
    >
  </div>
</div>
```

CSS tambahan di `dashboard.vue`:

```css
.kr-raci-row {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-top: 0.5rem;
}

.raci-mini-group {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.raci-mini-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.a-mini {
  background: #7c3aed;
}
.r-mini {
  background: #0e97d6;
}

.raci-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  font-size: 0.72rem;
  padding: 0.1rem 0.45rem;
  border-radius: 99px;
  font-weight: 500;
}

.accountable-chip {
  background: #f5f3ff;
  color: #7c3aed;
  border: 1px solid #ddd6fe;
}

.responsible-chip {
  background: #eff6ff;
  color: #0e97d6;
  border: 1px solid #bfdbfe;
}

.kr-dept-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.dept-mini-label {
  font-size: 0.68rem;
  color: var(--color-text-muted, #8897ae);
  font-weight: 500;
}

.dept-mini-tag {
  font-size: 0.65rem;
  padding: 0.08rem 0.35rem;
  background: #d1fae5;
  color: #059669;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
}
```

---

### 0.9 Seed Data BSC KR (Opsional — untuk Demo/Testing)

Jika ingin mengisi data awal BSC KR via seeder, buat file `backend/src/prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Buat Objective per perspektif BSC
  const objectives = await Promise.all([
    prisma.objective.create({
      data: {
        title: "Meningkatkan Profitabilitas Perusahaan",
        description: "Fokus pada peningkatan revenue dan efisiensi biaya",
        quarter: "Q3-2026",
      },
    }),
    prisma.objective.create({
      data: {
        title: "Meningkatkan Kepuasan & Loyalitas Pelanggan",
        description: "Dorong NPS, CSAT, dan retention rate",
        quarter: "Q3-2026",
      },
    }),
    prisma.objective.create({
      data: {
        title: "Meningkatkan Efisiensi Proses Internal",
        description: "CI/CD, bug rate, dan SLA uptime",
        quarter: "Q3-2026",
      },
    }),
    prisma.objective.create({
      data: {
        title: "Meningkatkan Kapabilitas SDM & Budaya Inovasi",
        description: "Engagement, training, dan turnover rate",
        quarter: "Q3-2026",
      },
    }),
  ]);

  // Buat KR untuk setiap Objective dengan BSC Perspective
  const krData = [
    // FINANCIAL
    {
      objectiveId: objectives[0].id,
      title: "Meningkatkan Revenue 15% YoY",
      targetValue: 15,
      unit: "%",
      bscPerspective: "FINANCIAL",
    },
    {
      objectiveId: objectives[0].id,
      title: "Menurunkan COGS 10%",
      targetValue: 10,
      unit: "%",
      bscPerspective: "FINANCIAL",
    },
    {
      objectiveId: objectives[0].id,
      title: "Meningkatkan Net Profit Margin 20%",
      targetValue: 20,
      unit: "%",
      bscPerspective: "FINANCIAL",
    },
    // CUSTOMER
    {
      objectiveId: objectives[1].id,
      title: "Meningkatkan NPS ke 70",
      targetValue: 70,
      unit: "skor",
      bscPerspective: "CUSTOMER",
    },
    {
      objectiveId: objectives[1].id,
      title: "Menurunkan Churn Rate 5%",
      targetValue: 5,
      unit: "%",
      bscPerspective: "CUSTOMER",
    },
    {
      objectiveId: objectives[1].id,
      title: "Meningkatkan CSAT ke 4.5",
      targetValue: 4.5,
      unit: "dari 5",
      bscPerspective: "CUSTOMER",
    },
    // INTERNAL PROCESS
    {
      objectiveId: objectives[2].id,
      title: "Menurunkan Bug Escape Rate ke 2%",
      targetValue: 2,
      unit: "%",
      bscPerspective: "INTERNAL_PROCESS",
    },
    {
      objectiveId: objectives[2].id,
      title: "Meningkatkan Deployment Frequency 10x/minggu",
      targetValue: 10,
      unit: "deploy/minggu",
      bscPerspective: "INTERNAL_PROCESS",
    },
    {
      objectiveId: objectives[2].id,
      title: "SLA Uptime 99.5%",
      targetValue: 99.5,
      unit: "%",
      bscPerspective: "INTERNAL_PROCESS",
    },
    // LEARNING & GROWTH
    {
      objectiveId: objectives[3].id,
      title: "Employee Engagement Score 80%",
      targetValue: 80,
      unit: "%",
      bscPerspective: "LEARNING_GROWTH",
    },
    {
      objectiveId: objectives[3].id,
      title: "40 Jam Pelatihan per Pegawai per Kuartal",
      targetValue: 40,
      unit: "jam/kuartal",
      bscPerspective: "LEARNING_GROWTH",
    },
    {
      objectiveId: objectives[3].id,
      title: "Menurunkan Turnover Rate ke 10%",
      targetValue: 10,
      unit: "%",
      bscPerspective: "LEARNING_GROWTH",
    },
  ];

  for (const kr of krData) {
    await prisma.keyResult.create({ data: kr });
  }

  console.log("✅ Seed BSC KR selesai!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Jalankan seeder:

```bash
cd backend
npx ts-node src/prisma/seed.ts
# atau tambahkan ke package.json: "seed": "ts-node src/prisma/seed.ts"
```

---

---

## ⚙️ FASE 1 — DATABASE MIGRATION

### 1.1 Cek Schema Terbaru

File `backend/src/prisma/schema.prisma` **sudah diupdate** dengan perubahan berikut. Pastikan isinya persis seperti ini:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String         @id @default(uuid())
  name          String
  email         String         @unique
  password      String
  role          String         @default("EMPLOYEE") // ADMIN, MANAGER, C_LEVEL, EMPLOYEE
  department    String?        // ENGINEERING, PRODUCT, MARKETING, FINANCE, HR, OPERATIONS
  teamId        String?
  team          Team?          @relation(fields: [teamId], references: [id])
  assignments   KrAssignment[]
  createdAt     DateTime       @default(now())
}

model Team {
  id        String  @id @default(uuid())
  name      String
  managerId String?
  users     User[]
}

model Objective {
  id          String      @id @default(uuid())
  title       String
  description String?
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
  updates        KrUpdate[]
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
  assignedBy  String    // user id yang melakukan assignment
  assignedAt  DateTime  @default(now())

  @@unique([keyResultId, userId])
  @@index([keyResultId])
  @@index([userId])
}

model KrUpdate {
  id          String    @id @default(uuid())
  keyResultId String
  keyResult   KeyResult @relation(fields: [keyResultId], references: [id])
  oldValue    Float
  newValue    Float
  note        String?
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
  note         String?
  createdBy    String
  createdAt    DateTime  @default(now())
}
```

### 1.2 Jalankan Migrasi

```bash
# Masuk ke folder backend
cd backend

# Jalankan migrasi (akan membuat file migrasi baru di prisma/migrations/)
npx prisma migrate dev --name add_department_and_kr_assignment

# Generate ulang Prisma Client
npx prisma generate
```

> ⚠️ **Jika error "P3006: Migration failed"**: Hapus file `src/prisma/dev.db` dan jalankan `npx prisma migrate dev` lagi (data akan hilang). Untuk production, gunakan `prisma migrate deploy`.

---

## ⚙️ FASE 2 — BACKEND

### 2.1 BUAT FILE BARU: `backend/src/controllers/user.controller.ts`

Buat file baru ini dari awal dengan isi berikut:

```typescript
import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

// GET /api/users
// Hanya Admin dan Manager yang bisa akses
// Mengembalikan semua user dengan info nama, email, role, department
export async function getAllUsers(req: AuthRequest, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        teamId: true,
      },
      orderBy: { name: "asc" },
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// PATCH /api/users/:id/department
// Hanya Admin yang bisa ubah department user
export async function updateUserDepartment(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { department } = req.body;

    const validDepartments = [
      "ENGINEERING",
      "PRODUCT",
      "MARKETING",
      "FINANCE",
      "HR",
      "OPERATIONS",
    ];
    if (department && !validDepartments.includes(department)) {
      return res.status(400).json({
        message: `department must be one of: ${validDepartments.join(", ")}`,
      });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { department: department || null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Update department error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
```

---

### 2.2 BUAT FILE BARU: `backend/src/routes/user.routes.ts`

```typescript
import { Router } from "express";
import {
  getAllUsers,
  updateUserDepartment,
} from "../controllers/user.controller";
import { authMiddleware, roleGuard } from "../middleware/auth.middleware";

const router = Router();

// GET /api/users — Admin dan Manager bisa lihat daftar user
router.get("/", authMiddleware, roleGuard(["ADMIN", "MANAGER"]), getAllUsers);

// PATCH /api/users/:id/department — Hanya Admin yang bisa update department
router.patch(
  "/:id/department",
  authMiddleware,
  roleGuard(["ADMIN"]),
  updateUserDepartment,
);

export default router;
```

---

### 2.3 MODIFIKASI: `backend/src/controllers/keyresult.controller.ts`

Tambahkan dua fungsi baru di **bagian paling bawah** file (setelah fungsi `updateKeyResult` yang sudah ada):

```typescript
// ==========================================
// TAMBAHKAN DI BAWAH FUNGSI updateKeyResult
// ==========================================

// POST /api/key-results/:id/assign
// Body: { userIds: string[] }  ← array of user IDs
// Hanya Admin dan Manager yang bisa assign
export async function assignUsersToKeyResult(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { userIds } = req.body;

    if (!Array.isArray(userIds)) {
      return res.status(400).json({ message: "userIds harus berupa array" });
    }

    // Cek KR ada
    const kr = await prisma.keyResult.findUnique({ where: { id } });
    if (!kr) {
      return res.status(404).json({ message: "Key Result not found" });
    }

    // Cek semua user ada
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true },
    });
    if (users.length !== userIds.length) {
      return res
        .status(400)
        .json({ message: "Satu atau lebih user tidak ditemukan" });
    }

    // Hapus assignments lama lalu buat yang baru (replace all)
    await prisma.$transaction([
      prisma.krAssignment.deleteMany({ where: { keyResultId: id } }),
      prisma.krAssignment.createMany({
        data: userIds.map((userId: string) => ({
          keyResultId: id,
          userId,
          assignedBy: req.user?.id || "system",
        })),
      }),
    ]);

    // Kembalikan KR dengan assignments terbaru
    const updated = await prisma.keyResult.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Assign users error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/key-results/:id/assignments
// Semua role yang sudah login bisa lihat
export async function getKeyResultAssignments(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const kr = await prisma.keyResult.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
                role: true,
              },
            },
          },
          orderBy: { assignedAt: "asc" },
        },
      },
    });

    if (!kr) {
      return res.status(404).json({ message: "Key Result not found" });
    }

    return res.status(200).json(kr.assignments);
  } catch (error) {
    console.error("Get assignments error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
```

Juga tambahkan kedua fungsi baru ke bagian **import di baris pertama file `keyresult.routes.ts`** (langkah 2.4).

---

### 2.4 MODIFIKASI: `backend/src/routes/keyresult.routes.ts`

Ganti seluruh isi file dengan versi baru berikut:

```typescript
import { Router } from "express";
import {
  createKeyResult,
  deleteKeyResult,
  updateKeyResultProgress,
  getKeyResultHistory,
  updateKeyResult,
  assignUsersToKeyResult, // ← BARU
  getKeyResultAssignments, // ← BARU
} from "../controllers/keyresult.controller";
import { authMiddleware, roleGuard } from "../middleware/auth.middleware";

const router = Router();

// Manajemen KR (hanya Admin)
router.post("/", authMiddleware, roleGuard(["ADMIN"]), createKeyResult);
router.put("/:id", authMiddleware, roleGuard(["ADMIN"]), updateKeyResult);
router.delete("/:id", authMiddleware, roleGuard(["ADMIN"]), deleteKeyResult);
router.patch(
  "/:id/progress",
  authMiddleware,
  roleGuard(["ADMIN"]),
  updateKeyResultProgress,
);

// History — Admin dan Manager bisa akses
router.get(
  "/:id/history",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "C_LEVEL", "EMPLOYEE"]),
  getKeyResultHistory,
);

// Assignment — Admin dan Manager bisa assign, semua bisa lihat
router.post(
  "/:id/assign",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER"]),
  assignUsersToKeyResult,
);
router.get("/:id/assignments", authMiddleware, getKeyResultAssignments);

export default router;
```

---

### 2.5 MODIFIKASI: `backend/src/index.ts`

Tambahkan import dan registrasi route user. Ganti isi file dengan:

```typescript
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import objectiveRoutes from "./routes/objective.routes";
import keyResultRoutes from "./routes/keyresult.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import bscRoutes from "./routes/bsc.routes";
import causalRoutes from "./routes/causal.routes";
import userRoutes from "./routes/user.routes"; // ← BARU

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://127.0.0.1:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes("*")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/objectives", objectiveRoutes);
app.use("/api/key-results", keyResultRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/bsc", bscRoutes);
app.use("/api", causalRoutes);
app.use("/api/users", userRoutes); // ← BARU

// Base route
app.get("/", (req, res) => {
  res.json({ message: "OKR & Balanced Scorecard API is running." });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
```

### 2.6 MODIFIKASI: `backend/src/controllers/dashboard.controller.ts`

Pada fungsi `getDashboardSummary`, query `objectives` sudah include `keyResults`. Perlu tambahkan `assignments` di dalam include keyResults agar data PIC muncul di dashboard.

Temukan baris ini (sekitar baris 57–65):

```typescript
// Fetch objectives and nested Key Results
const objectives = await prisma.objective.findMany({
  where: whereClause,
  include: {
    keyResults: true, // ← UBAH ini
  },
  orderBy: {
    createdAt: "desc",
  },
});
```

Ganti dengan:

```typescript
// Fetch objectives and nested Key Results (dengan assignments/PIC)
const objectives = await prisma.objective.findMany({
  where: whereClause,
  include: {
    keyResults: {
      include: {
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, department: true },
            },
          },
        },
      },
    },
  },
  orderBy: {
    createdAt: "desc",
  },
});
```

---

### 2.7 Verifikasi Backend

Setelah semua perubahan backend selesai, jalankan:

```bash
cd backend
npm run dev
```

Test dengan curl:

```bash
# Test get users (ganti <TOKEN> dengan JWT dari login)
curl http://localhost:3001/api/users \
  -H "Authorization: Bearer <TOKEN>"

# Test assign users ke KR
curl -X POST http://localhost:3001/api/key-results/<KR_ID>/assign \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"userIds": ["<USER_ID_1>", "<USER_ID_2>"]}'

# Test get assignments
curl http://localhost:3001/api/key-results/<KR_ID>/assignments \
  -H "Authorization: Bearer <TOKEN>"

# Test history (sudah ada sebelumnya, tidak berubah)
curl http://localhost:3001/api/key-results/<KR_ID>/history \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 🖥️ FASE 3 — FRONTEND

### 3.1 Install Dependency

```bash
cd frontend
npm install vue-chartjs chart.js
```

---

### 3.2 MODIFIKASI: `frontend/app/pages/admin/objectives.vue`

**Perubahan 1 — Tambah state untuk user list** di dalam `<script setup>` (setelah `const allObjectivesForDropdown = ref([])`):

```javascript
// ← TAMBAHKAN setelah allObjectivesForDropdown
const userList = ref([]);

async function fetchUserList() {
  try {
    const response = await $fetch(`${config.public.apiBase}/users`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    userList.value = response;
  } catch (err) {
    console.error("Error fetching users:", err);
  }
}
```

**Perubahan 2 — Tambah `assigneeIds` pada state KR** dalam `newObjective.value.keyResults`:

```javascript
// Sebelum (sekitar baris 350-356):
const newObjective = ref({
  title: "",
  description: "",
  quarter: "Q3-2026",
  keyResults: [
    {
      title: "",
      targetValue: null,
      unit: "%",
      bscPerspective: "",
    },
  ],
});

// Sesudah:
const newObjective = ref({
  title: "",
  description: "",
  quarter: "Q3-2026",
  keyResults: [
    {
      title: "",
      targetValue: null,
      unit: "%",
      bscPerspective: "",
      assigneeIds: [], // ← TAMBAHKAN
    },
  ],
});
```

Juga update fungsi `addKrRow`:

```javascript
function addKrRow() {
  newObjective.value.keyResults.push({
    title: "",
    targetValue: null,
    unit: "%",
    bscPerspective: "",
    assigneeIds: [], // ← TAMBAHKAN
  });
}
```

**Perubahan 3 — Panggil fetchUserList di onMounted**:

```javascript
// Cari baris onMounted (sekitar baris 405-420), tambahkan fetchUserList():
onMounted(() => {
  fetchObjectives();
  fetchAllObjectivesForDropdown();
  fetchUserList(); // ← TAMBAHKAN
});
```

**Perubahan 4 — Tambah UI multi-select assignee di form KR** (di dalam template, setelah blok form-row BSC Perspective, sebelum `</div>` penutup kr-row-card):

```html
<!-- Tambahkan SETELAH blok form-row (yang berisi kr-target, kr-unit, kr-bsc) -->
<!-- Sebelum baris: </div> (penutup kr-row-card) -->

<div class="form-group">
  <label :for="'kr-assignees-' + index">
    PIC / Pegawai yang Bertanggung Jawab
    <span class="form-hint">(Opsional, bisa lebih dari satu)</span>
  </label>
  <div class="assignee-multi-select" :id="'kr-assignees-' + index">
    <div v-if="userList.length === 0" class="assignee-empty-hint">
      Memuat daftar user...
    </div>
    <label
      v-for="user in userList"
      :key="user.id"
      class="assignee-checkbox-item"
    >
      <input type="checkbox" :value="user.id" v-model="kr.assigneeIds" />
      <span class="assignee-name">{{ user.name }}</span>
      <span class="assignee-dept-badge" v-if="user.department">
        {{ user.department }}
      </span>
      <span class="assignee-role-badge">{{ user.role }}</span>
    </label>
  </div>
</div>
```

**Perubahan 5 — Update fungsi `submitObjective`** untuk juga mengirim assignment setelah KR dibuat.

Cari fungsi `submitObjective` di script dan tambahkan logika assignment setelah KR berhasil dibuat. Cari bagian dimana KR dibuat (loop `for...of keyResultsPayload` atau serupa), tambahkan call ke assign endpoint:

```javascript
// Setelah setiap KR berhasil dibuat (dalam loop), tambahkan:
// Kirim assignment jika ada assigneeIds
if (kr.assigneeIds && kr.assigneeIds.length > 0) {
  await $fetch(`${config.public.apiBase}/key-results/${createdKr.id}/assign`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: { userIds: kr.assigneeIds },
  });
}
```

> ⚠️ **Catatan**: Lihat struktur fungsi `submitObjective` yang sudah ada secara lengkap untuk menemukan tempat yang tepat. Variabel `createdKr` adalah response dari API create KR.

**Perubahan 6 — Tambah CSS untuk assignee multi-select** di bagian `<style>` file yang sama:

```css
/* Tambahkan di bagian bawah <style> */
.form-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted, #8897ae);
  font-weight: 400;
  margin-left: 0.25rem;
}

.assignee-multi-select {
  border: 1px solid var(--border-default, #e2e8f0);
  border-radius: 8px;
  padding: 0.5rem;
  max-height: 180px;
  overflow-y: auto;
  background: var(--surface-page, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.assignee-checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 150ms ease;
  font-size: 0.875rem;
}

.assignee-checkbox-item:hover {
  background: var(--surface-white, #fff);
}

.assignee-name {
  flex: 1;
  font-weight: 500;
  color: var(--color-text-heading, #2d3643);
}

.assignee-dept-badge {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  background: #eff6ff;
  color: #0e97d6;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.assignee-role-badge {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  background: #f0fdf4;
  color: #00a925;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
}

.assignee-empty-hint {
  color: var(--color-text-muted, #8897ae);
  font-size: 0.875rem;
  text-align: center;
  padding: 0.5rem;
}
```

---

### 3.3 MODIFIKASI: `frontend/app/pages/dashboard.vue`

**Tujuan:** Tampilkan chip PIC/Assignee di setiap KR card.

Di dalam template, cari bagian KR card (sekitar baris 266–313), yaitu di dalam `<div v-for="kr in obj.keyResults" ... class="kr-item">`.

Tambahkan blok assignee **setelah** `<div class="kr-details-row">...</div>` (di akhir setiap kr-item, sebelum `</div>` penutup kr-item):

```html
<!-- Tambahkan SETELAH div.kr-details-row -->
<div
  v-if="kr.assignments && kr.assignments.length > 0"
  class="kr-assignees-row"
>
  <span class="assignees-label">PIC:</span>
  <div class="assignee-chips">
    <span
      v-for="assignment in kr.assignments"
      :key="assignment.id"
      class="assignee-chip"
    >
      {{ assignment.user.name }}
      <span v-if="assignment.user.department" class="chip-dept">
        · {{ assignment.user.department }}
      </span>
    </span>
  </div>
</div>

<!-- Tambahkan tombol lihat history -->
<div class="kr-history-link">
  <NuxtLink
    :to="`/kr-history?krId=${kr.id}&krTitle=${encodeURIComponent(kr.title)}`"
    class="history-btn"
  >
    📈 Lihat History
  </NuxtLink>
</div>
```

**Tambah CSS di `<style>`** bagian bawah `dashboard.vue`:

```css
/* KR Assignees */
.kr-assignees-row {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  margin-top: 0.4rem;
  flex-wrap: wrap;
}

.assignees-label {
  font-size: 0.75rem;
  color: var(--color-text-muted, #8897ae);
  font-weight: 500;
  white-space: nowrap;
  padding-top: 2px;
}

.assignee-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.assignee-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.72rem;
  padding: 0.15rem 0.5rem;
  background: #eff6ff;
  color: #0e97d6;
  border-radius: 99px;
  font-weight: 500;
  border: 1px solid #bfdbfe;
}

.chip-dept {
  opacity: 0.75;
}

.kr-history-link {
  margin-top: 0.4rem;
}

.history-btn {
  font-size: 0.75rem;
  color: #0e97d6;
  text-decoration: none;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  transition: background 150ms;
}

.history-btn:hover {
  background: #eff6ff;
}
```

---

### 3.4 BUAT FILE BARU: `frontend/app/pages/kr-history.vue`

Buat file baru dengan isi lengkap berikut:

```vue
<template>
  <div class="history-root">
    <div class="history-container">
      <!-- Header -->
      <section class="history-header card">
        <div class="header-left">
          <NuxtLink to="/dashboard" class="back-btn"
            >← Kembali ke Dashboard</NuxtLink
          >
          <h2>History Capaian KR</h2>
          <p class="kr-title-display" v-if="krTitle">{{ krTitle }}</p>
        </div>
        <div class="header-right">
          <!-- Filter periode -->
          <div class="date-filter">
            <label>Dari:</label>
            <input type="date" v-model="filterFrom" @change="fetchHistory" />
            <label>Sampai:</label>
            <input type="date" v-model="filterTo" @change="fetchHistory" />
            <button
              @click="clearFilter"
              class="clear-filter-btn"
              v-if="filterFrom || filterTo"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">Memuat riwayat...</div>

      <!-- Empty State -->
      <div v-else-if="history.length === 0" class="empty-state card">
        <p>Belum ada riwayat perubahan untuk Key Result ini.</p>
        <p class="empty-hint">
          Riwayat akan muncul setelah Admin melakukan update capaian.
        </p>
      </div>

      <template v-else>
        <!-- Chart Section -->
        <section class="chart-section card">
          <h3>Grafik Progres Capaian</h3>
          <p class="chart-subtitle">
            Nilai aktual KR dari waktu ke waktu vs target
            <strong>{{ krTarget }} {{ krUnit }}</strong>
          </p>
          <div class="chart-wrapper">
            <ClientOnly>
              <Line :data="chartData" :options="chartOptions" />
            </ClientOnly>
          </div>
        </section>

        <!-- Stats Row -->
        <section class="stats-row">
          <div class="stat-card card">
            <span class="stat-label">Total Update</span>
            <span class="stat-val">{{ history.length }}</span>
          </div>
          <div class="stat-card card">
            <span class="stat-label">Nilai Awal</span>
            <span class="stat-val"
              >{{ history[0]?.oldValue ?? "-" }} {{ krUnit }}</span
            >
          </div>
          <div class="stat-card card">
            <span class="stat-label">Nilai Terkini</span>
            <span class="stat-val highlight"
              >{{ history[history.length - 1]?.newValue ?? "-" }}
              {{ krUnit }}</span
            >
          </div>
          <div class="stat-card card">
            <span class="stat-label">Perubahan Total</span>
            <span
              class="stat-val"
              :class="totalDelta >= 0 ? 'positive' : 'negative'"
            >
              {{ totalDelta >= 0 ? "+" : "" }}{{ totalDelta }} {{ krUnit }}
            </span>
          </div>
        </section>

        <!-- Timeline List -->
        <section class="timeline-section card">
          <h3>Riwayat Perubahan</h3>
          <div class="timeline">
            <div
              v-for="(entry, index) in reversedHistory"
              :key="entry.id"
              class="timeline-item"
              :class="{ latest: index === 0 }"
            >
              <div class="timeline-dot" :class="getDeltaClass(entry)"></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-date">{{
                    formatDateTime(entry.updatedAt)
                  }}</span>
                  <span class="timeline-delta" :class="getDeltaClass(entry)">
                    {{ entry.newValue > entry.oldValue ? "+" : ""
                    }}{{ (entry.newValue - entry.oldValue).toFixed(2) }}
                    {{ krUnit }}
                  </span>
                </div>
                <div class="timeline-values">
                  <span class="old-val">{{ entry.oldValue }} {{ krUnit }}</span>
                  <span class="arrow">→</span>
                  <span class="new-val" :class="getDeltaClass(entry)"
                    >{{ entry.newValue }} {{ krUnit }}</span
                  >
                </div>
                <div class="timeline-progress">
                  <div class="progress-track">
                    <div
                      class="progress-fill"
                      :style="{
                        width:
                          Math.min(100, (entry.newValue / krTarget) * 100) +
                          '%',
                      }"
                    ></div>
                  </div>
                  <span class="progress-pct">
                    {{
                      krTarget > 0
                        ? Math.round((entry.newValue / krTarget) * 100)
                        : 0
                    }}%
                  </span>
                </div>
                <p v-if="entry.note" class="timeline-note">
                  "{{ entry.note }}"
                </p>
                <span class="timeline-updater"
                  >oleh: {{ entry.updatedBy }}</span
                >
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const route = useRoute();
const auth = useAuthStore();
const config = useRuntimeConfig();

// Query params dari URL
const krId = computed(() => route.query.krId);
const krTitle = computed(() =>
  route.query.krTitle ? decodeURIComponent(route.query.krTitle) : "",
);

// State
const history = ref([]);
const loading = ref(false);
const filterFrom = ref("");
const filterTo = ref("");

// KR info (ambil dari entry pertama history atau query params)
const krTarget = ref(0);
const krUnit = ref("");

// Computed
const reversedHistory = computed(() => [...history.value].reverse());

const totalDelta = computed(() => {
  if (history.value.length === 0) return 0;
  const first = history.value[0].oldValue;
  const last = history.value[history.value.length - 1].newValue;
  return parseFloat((last - first).toFixed(2));
});

// Chart Data
const chartData = computed(() => {
  const labels = history.value.map((e) => formatDate(e.updatedAt));
  const values = history.value.map((e) => e.newValue);

  return {
    labels,
    datasets: [
      {
        label: "Nilai Aktual",
        data: values,
        borderColor: "#0E97D6",
        backgroundColor: "rgba(14, 151, 214, 0.1)",
        fill: true,
        tension: 0.3,
        pointBackgroundColor: "#0E97D6",
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: `Target (${krTarget.value} ${krUnit.value})`,
        data: history.value.map(() => krTarget.value),
        borderColor: "#00A925",
        borderDash: [6, 4],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
      labels: {
        font: { family: "Rubik", size: 12 },
        color: "#5E718D",
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} ${krUnit.value}`,
      },
    },
  },
  scales: {
    x: {
      ticks: {
        font: { family: "Rubik", size: 11 },
        color: "#8897AE",
        maxRotation: 45,
      },
      grid: { color: "#F0F3F9" },
    },
    y: {
      ticks: {
        font: { family: "Rubik", size: 11 },
        color: "#8897AE",
      },
      grid: { color: "#F0F3F9" },
    },
  },
};

// Methods
async function fetchHistory() {
  if (!krId.value) return;

  loading.value = true;
  try {
    let url = `${config.public.apiBase}/key-results/${krId.value}/history`;
    const params = new URLSearchParams();
    if (filterFrom.value) params.append("from", filterFrom.value);
    if (filterTo.value) params.append("to", filterTo.value);
    if (params.toString()) url += `?${params.toString()}`;

    const data = await $fetch(url, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    // Sort ascending by date
    history.value = data.sort(
      (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
    );

    // Ambil info KR target dan unit dari API objectives jika belum ada
    // (bisa dari query param atau fetch terpisah)
    if (history.value.length > 0 && krTarget.value === 0) {
      await fetchKrInfo();
    }
  } catch (err) {
    console.error("Fetch history error:", err);
  } finally {
    loading.value = false;
  }
}

async function fetchKrInfo() {
  // Fetch info KR (target, unit) — perlu endpoint atau ambil dari objectives
  try {
    // Ambil dari query param jika tersedia
    if (route.query.krTarget) krTarget.value = parseFloat(route.query.krTarget);
    if (route.query.krUnit)
      krUnit.value = decodeURIComponent(route.query.krUnit);
  } catch (err) {
    console.error("Fetch KR info error:", err);
  }
}

function clearFilter() {
  filterFrom.value = "";
  filterTo.value = "";
  fetchHistory();
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDeltaClass(entry) {
  if (entry.newValue > entry.oldValue) return "positive";
  if (entry.newValue < entry.oldValue) return "negative";
  return "neutral";
}

onMounted(() => {
  fetchHistory();
});
</script>

<style scoped>
.history-root {
  padding: 2rem;
  background: var(--surface-page, #f8fafc);
  min-height: 100vh;
}

.history-container {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header */
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.5rem;
}

.back-btn {
  display: inline-block;
  color: #0e97d6;
  text-decoration: none;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.history-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-text-heading, #2d3643);
  font-family: "Rubik", sans-serif;
  font-weight: 600;
}

.kr-title-display {
  color: var(--color-text-muted, #8897ae);
  font-size: 0.9rem;
  margin: 0.25rem 0 0;
}

.date-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.date-filter label {
  font-size: 0.8rem;
  color: var(--color-text-muted, #8897ae);
}

.date-filter input {
  font-size: 0.85rem;
  border: 1px solid var(--border-default, #e2e8f0);
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  background: var(--surface-white, #fff);
  color: var(--color-text-heading, #2d3643);
  font-family: "Rubik", sans-serif;
}

.clear-filter-btn {
  font-size: 0.8rem;
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--border-default, #e2e8f0);
  border-radius: 6px;
  background: var(--surface-white, #fff);
  cursor: pointer;
  color: var(--color-text-body, #5e718d);
  transition: background 150ms;
}

.clear-filter-btn:hover {
  background: var(--surface-page, #f8fafc);
}

/* Card base */
.card {
  background: var(--surface-white, #fff);
  border-radius: 12px;
  border: 1px solid var(--border-default, #f0f3f9);
}

/* States */
.loading-state,
.empty-state {
  padding: 3rem;
  text-align: center;
  color: var(--color-text-muted, #8897ae);
  font-family: "Rubik", sans-serif;
}

.empty-hint {
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

/* Chart */
.chart-section {
  padding: 1.5rem;
}

.chart-section h3 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-heading, #2d3643);
  font-family: "Rubik", sans-serif;
}

.chart-subtitle {
  margin: 0 0 1rem;
  font-size: 0.85rem;
  color: var(--color-text-muted, #8897ae);
}

.chart-wrapper {
  height: 280px;
  position: relative;
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  text-align: center;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-muted, #8897ae);
  font-weight: 500;
  font-family: "Rubik", sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-val {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-heading, #2d3643);
  font-family: "Rubik", sans-serif;
}

.stat-val.highlight {
  color: #0e97d6;
}
.stat-val.positive {
  color: #00a925;
}
.stat-val.negative {
  color: #eb3123;
}

/* Timeline */
.timeline-section {
  padding: 1.5rem;
}

.timeline-section h3 {
  margin: 0 0 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-heading, #2d3643);
  font-family: "Rubik", sans-serif;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
}

.timeline::before {
  content: "";
  position: absolute;
  left: 11px;
  top: 12px;
  bottom: 12px;
  width: 2px;
  background: var(--border-default, #f0f3f9);
}

.timeline-item {
  display: flex;
  gap: 1rem;
  padding-bottom: 1.5rem;
  position: relative;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 3px solid;
  background: #fff;
  position: relative;
  z-index: 1;
  margin-top: 2px;
}

.timeline-dot.positive {
  border-color: #00a925;
}
.timeline-dot.negative {
  border-color: #eb3123;
}
.timeline-dot.neutral {
  border-color: #8897ae;
}

.timeline-item.latest .timeline-dot {
  background-color: #0e97d6;
  border-color: #0e97d6;
}

.timeline-content {
  flex: 1;
  background: var(--surface-page, #f8fafc);
  border: 1px solid var(--border-default, #f0f3f9);
  border-radius: 8px;
  padding: 1rem;
}

.timeline-item.latest .timeline-content {
  border-color: #bfdbfe;
  background: #f0f9ff;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.timeline-date {
  font-size: 0.8rem;
  color: var(--color-text-muted, #8897ae);
  font-family: "Rubik", sans-serif;
}

.timeline-delta {
  font-size: 0.85rem;
  font-weight: 600;
  font-family: "Rubik", sans-serif;
}

.timeline-delta.positive {
  color: #00a925;
}
.timeline-delta.negative {
  color: #eb3123;
}
.timeline-delta.neutral {
  color: #8897ae;
}

.timeline-values {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: "Rubik", sans-serif;
  margin-bottom: 0.5rem;
}

.old-val {
  font-size: 0.9rem;
  color: var(--color-text-muted, #8897ae);
  text-decoration: line-through;
}

.arrow {
  color: var(--color-text-muted, #8897ae);
  font-size: 0.8rem;
}

.new-val {
  font-size: 1rem;
  font-weight: 600;
}

.new-val.positive {
  color: #00a925;
}
.new-val.negative {
  color: #eb3123;
}
.new-val.neutral {
  color: var(--color-text-heading, #2d3643);
}

.timeline-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.progress-track {
  flex: 1;
  height: 6px;
  background: var(--border-default, #e2e8f0);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #0e97d6;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-pct {
  font-size: 0.75rem;
  color: var(--color-text-muted, #8897ae);
  font-family: "Rubik", sans-serif;
  min-width: 36px;
  text-align: right;
}

.timeline-note {
  font-size: 0.82rem;
  color: var(--color-text-body, #5e718d);
  font-style: italic;
  margin: 0.3rem 0 0.2rem;
  padding-left: 0.5rem;
  border-left: 2px solid #bfdbfe;
}

.timeline-updater {
  font-size: 0.75rem;
  color: var(--color-text-muted, #8897ae);
}
</style>
```

---

### 3.5 MODIFIKASI: `frontend/app/pages/admin/update-progress.vue`

**Tujuan:** Tampilkan info assignee di setiap KR card pada halaman update progress.

Cari bagian `<div class="kr-meta-row">` (sekitar baris 55–68) dan tambahkan di bawah status badge:

```html
<!-- Tambahkan SETELAH span.status-badge, masih dalam kr-meta-row atau sebagai sibling div -->
<div v-if="kr.assignments && kr.assignments.length > 0" class="kr-pic-row">
  <span class="pic-label">PIC:</span>
  <span v-for="a in kr.assignments" :key="a.id" class="pic-name">
    {{ a.user.name }}
    <span v-if="a.user.department" class="pic-dept"
      >({{ a.user.department }})</span
    >
  </span>
</div>
```

Dan tambahkan CSS:

```css
.kr-pic-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}

.pic-label {
  font-size: 0.75rem;
  color: #8897ae;
  font-weight: 500;
}

.pic-name {
  font-size: 0.75rem;
  color: #0e97d6;
  font-weight: 500;
}

.pic-dept {
  color: #8897ae;
  font-weight: 400;
}
```

Juga **update fetch KR** di script section untuk include `assignments`. Cari fungsi yang fetch key results dan pastikan response-nya sudah include assignments (backend sudah mengirimkan data ini setelah perubahan dashboard controller di langkah 2.6).

---

### 3.6 MODIFIKASI: `frontend/app/pages/dashboard.vue`

**Update link navigasi ke KR History** — saat ini `NuxtLink` yang ditambah di langkah 3.3 sudah pass `krId`, `krTitle`. Tambahkan juga `krTarget` dan `krUnit` agar halaman history bisa menampilkan target:

```html
<!-- Ganti NuxtLink di langkah 3.3 dengan versi ini yang include target dan unit: -->
<NuxtLink
  :to="`/kr-history?krId=${kr.id}&krTitle=${encodeURIComponent(kr.title)}&krTarget=${kr.targetValue}&krUnit=${encodeURIComponent(kr.unit)}`"
  class="history-btn"
>
  📈 Lihat History
</NuxtLink>
```

---

### 3.7 MODIFIKASI: `frontend/app/app.vue` atau `AppSidebar.vue`

Tambahkan route `/kr-history` ke dalam navigasi sidebar sebagai subroute dari Dashboard (opsional — bisa diakses via tombol di KR card saja).

---

## 🚀 FASE 4 — FITUR BULK UPLOAD PEGAWAI VIA CSV

### 4.1 Update Backend: `user.controller.ts` & `user.routes.ts`
- Tambahkan endpoint `POST /api/users/bulk-upload`.
- Logika validasi data per baris: nama dan email wajib ada, email harus valid, departemen harus sesuai `VALID_DEPARTMENTS`.
- Fitur *Upsert*: Jika email sudah ada di database, update nama, posisi, dan departemen (mode UPDATE). Jika belum ada, buat pegawai baru dengan role default `EMPLOYEE` dan password `SkollaEdu` (mode NEW).

### 4.2 Update Frontend: `employees.vue`
- Tambahkan fungsi Parse CSV murni client-side (Javascript).
- Tambahkan Modal Multi-Step (Upload -> Preview -> Hasil).
- Tampilkan indikator status baris di tabel preview: 🟢 NEW, 🟡 UPDATE, 🔴 ERROR.
- Tambahkan tombol Export Template CSV (`downloadTemplate()`).

---

## ✅ CHECKLIST VERIFIKASI

Setelah semua langkah selesai, verifikasi hal berikut:

### FASE 0 — BSC Framework & RACI

- [ ] BSC KR terdefinisi dengan jelas untuk 4 perspektif: Financial, Customer, Internal Process, Learning & Growth
- [ ] Setiap KR memiliki minimal 1 Responsible dan tepat 1 Accountable
- [ ] `npx prisma migrate dev --name add_raci_role_and_kr_departments` berhasil
- [ ] Model `KrDepartment` terbuat di database
- [ ] Field `raciRole` terdapat di tabel `KrAssignment`
- [ ] `POST /api/key-results/:id/assign` dengan body RACI baru (`{assignments, departments}`) berhasil
- [ ] Validasi backend: request tanpa Accountable ditolak dengan status 400
- [ ] Validasi backend: request dengan 2+ Accountable ditolak dengan status 400
- [ ] Backward compatibility: request lama `{ userIds: [...] }` masih berjalan (semua jadi RESPONSIBLE)
- [ ] Form RACI di frontend menampilkan radio button untuk Accountable (hanya 1 bisa dipilih)
- [ ] Form RACI di frontend menampilkan checkbox untuk Responsible (bisa banyak)
- [ ] Pilihan departemen tampil sebagai multi-select chips
- [ ] RACI Preview Summary tampil di bawah form setelah memilih assignee
- [ ] Dashboard KR card menampilkan chip Accountable (ungu) dan Responsible (biru) terpisah
- [ ] Dashboard KR card menampilkan dept tags (hijau) untuk departemen yang terlibat
- [ ] Seed data BSC KR berjalan tanpa error (opsional)

### Backend

- [ ] `npx prisma migrate dev` berhasil tanpa error
- [ ] `npx prisma generate` berhasil
- [ ] `GET /api/users` mengembalikan list user (dengan field `department`)
- [ ] `POST /api/key-results/:id/assign` dengan body RACI berhasil menyimpan dan mengembalikan KR dengan assignments & departments
- [ ] `GET /api/key-results/:id/assignments` mengembalikan list assignee dengan field `raciRole`
- [ ] `GET /api/key-results/:id/history` tetap berjalan normal
- [ ] `GET /api/dashboard/summary` mengembalikan KR dengan `assignments` (termasuk `raciRole`) dan `departments` embedded
- [ ] Role guard berjalan: Employee tidak bisa assign, Manager bisa, Admin bisa

### Frontend

- [ ] Halaman Admin Objectives menampilkan form RACI (Responsible checkbox + Accountable radio + Dept checkbox) untuk setiap KR baru
- [ ] Saat menyimpan OKR baru, RACI assignment dan departments juga tersimpan
- [ ] Validasi client-side: alert muncul jika KR tidak memiliki Accountable saat submit
- [ ] Dashboard KR card menampilkan chip RACI (A: ungu, R: biru) dan dept tags (hijau)
- [ ] Tombol "Lihat History" muncul di setiap KR card
- [ ] Halaman `/kr-history?krId=...` dapat diakses dan menampilkan data
- [ ] Line chart muncul dengan data aktual vs garis target
- [ ] Timeline list tampil dari terbaru ke terlama
- [ ] Filter tanggal bekerja (dari dan sampai)
- [ ] Stat cards (total update, nilai awal, nilai terkini, delta total) akurat

### Regression

- [ ] Login Admin masih berjalan
- [ ] BSC View tidak terpengaruh
- [ ] Strategy Map tidak terpengaruh
- [ ] Update progress tetap berjalan
- [ ] Existing assignments tanpa `raciRole` otomatis default ke `RESPONSIBLE` (backward compat)

### Fitur Bulk Upload CSV

- [ ] Tombol Download Template berfungsi dan file valid
- [ ] Tombol Import CSV membuka modal
- [ ] Upload file CSV melakukan parsing client-side dan menampilkan tabel preview
- [ ] Terdapat status indikator 🟢 NEW, 🟡 UPDATE, dan 🔴 ERROR pada tabel preview
- [ ] Submit berjalan lancar, dan pegawai duplikat menggunakan mode Update (timpa data lama)
- [ ] Muncul notifikasi ringkasan (Sukses, Updated, Error)

---

## 📦 Urutan Eksekusi yang Benar

```
[FASE 0 — BSC Framework & RACI]
1.  Review dokumen FASE 0 (BSC KR table per perspektif, RACI rules)
2.  Update schema.prisma: tambah raciRole ke KrAssignment + model KrDepartment
3.  backend/ → npx prisma migrate dev --name add_raci_role_and_kr_departments
4.  backend/ → npx prisma generate
5.  Modifikasi: backend/src/controllers/keyresult.controller.ts (update assignUsersToKeyResult)

[FASE 1-2 — Backend]
6.  Buat baru: backend/src/controllers/user.controller.ts
7.  Buat baru: backend/src/routes/user.routes.ts
8.  Modifikasi: backend/src/routes/keyresult.routes.ts
9.  Modifikasi: backend/src/index.ts
10. Modifikasi: backend/src/controllers/dashboard.controller.ts

[FASE 3 — Frontend]
11. cd frontend → npm install vue-chartjs chart.js
12. Modifikasi: frontend/app/pages/admin/objectives.vue
    (ganti assigneeIds → raciAssignments, tambah dept, RACI UI)
13. Buat baru: frontend/app/pages/kr-history.vue
14. Modifikasi: frontend/app/pages/dashboard.vue
    (ganti kr-assignees-row → kr-raci-row dengan RACI chips)
15. Modifikasi: frontend/app/pages/admin/update-progress.vue

[TESTING]
16. Test backend RACI validation (curl/Postman)
17. Test frontend RACI form dan display (browser)
18. (Opsional) Jalankan seed BSC KR: npx ts-node src/prisma/seed.ts
```

---

## 🔑 Catatan Penting untuk Developer

1. **Jangan mengubah** fungsi yang sudah ada kecuali yang disebutkan di dokumen ini
2. **Prisma Client** harus di-generate ulang setiap kali schema berubah (`npx prisma generate`)
3. **vue-chartjs** memerlukan `<ClientOnly>` wrapper di Nuxt karena Chart.js tidak support SSR
4. **`KrAssignment.@@unique([keyResultId, userId])`** mencegah duplikasi assignment. Strategi `deleteMany` + `createMany` (replace all) sudah meng-handle ini
5. **Filter history**: Backend `getKeyResultHistory` mengembalikan semua history. Filtering tanggal dilakukan di frontend. Jika dataset besar, tambahkan query params `from` dan `to` ke endpoint backend
6. **RACI Constraint — Revisi per 10 Agustus 2026**: Logika RACI telah dibalik dari desain awal. **Responsible = tepat 1 orang** (UI: radio button), **Accountable = minimal 1, bisa lebih** (UI: checkbox). Backend memvalidasi: `responsibles.length !== 1` → reject, `accountables.length < 1` → reject. Satu user tidak boleh memegang dua peran sekaligus dalam satu KR (dikenforce DB + UI)
7. **Backward Compatibility**: API `/assign` mendukung format lama `{ userIds: [...] }` — semua user akan otomatis diberi `raciRole: 'RESPONSIBLE'`. Tidak perlu ubah kode yang sudah menggunakan format lama
8. **`KrDepartment` vs `User.department`**: `KrDepartment` menyimpan departemen yang _terlibat dalam KR_ (bisa berbeda/lebih dari 1). `User.department` adalah departemen _tempat kerja_ user tersebut. Keduanya adalah data yang berbeda dan saling melengkapi
9. **BSC Perspective Values**: Gunakan nilai enum yang konsisten — `FINANCIAL`, `CUSTOMER`, `INTERNAL_PROCESS`, `LEARNING_GROWTH` — di schema, seeder, dan frontend dropdown BSC perspective

---

## 📝 Changelog

### v1.1 — 10 Agustus 2026: Revisi Logika RACI + Modal Edit KR

**Context:**
Setelah review UX, disepakati bahwa logika RACI perlu direvisi karena secara praktis, dalam satu KR hanya ada **satu pelaksana utama** (Responsible), namun **lebih dari satu orang bisa menjadi penanggung jawab** (Accountable), misalnya manager dan direktur.

**Perubahan yang Disepakati:**

| Aspek | Sebelum (v1.0) | Sesudah (v1.1) |
|---|---|---|  
| **Responsible** | Checkbox, bisa banyak (≥1) | **Radio button, tepat 1 orang** |
| **Accountable** | Radio button, tepat 1 | **Checkbox, bisa lebih dari 1 (≥1)** |
| **RACI di Modal Edit KR** | Tidak ada | **Ditambahkan** (sama persis dengan form buat baru) |
| **No-overlap R & A** | Tidak dikenforce di UI | **Di-disable di UI + dikenforce DB** |

**Constraint Baru (Confirmed):**
- Satu user **tidak bisa** memiliki dua role berbeda (R dan A) dalam satu KR
- Jika user sudah dipilih sebagai Responsible, user tersebut akan tampak **disabled** di daftar Accountable (dan sebaliknya)
- Constraint ini dikenforce di tiga lapisan: **UI (disabled state)**, **Frontend validation (sebelum submit)**, dan **Database (`@@unique([keyResultId, userId])`)**

**Files Terdampak:**

| File | Jenis Perubahan |
|---|---|
| `frontend/app/pages/admin/objectives.vue` | MODIFY: ubah R dari checkbox→radio, A dari radio→checkbox; TAMBAH: RACI section di modal-card; TAMBAH: state `editKrRaciAssignments`, fungsi `setResponsible`, `isEditAssigned`, `setEditResponsible`, `toggleEditRaciAssignment`; UPDATE: `startEditKr`, `submitEditKr`, validasi di `submitObjective`; TAMBAH CSS: `.assignee-checkbox-item.disabled`, `modal-card` scrollable |
| `backend/src/controllers/keyresult.controller.ts` | MODIFY: ubah validasi RACI — Responsible `!== 1` → reject, Accountable `< 1` → reject |

**Tidak Ada Perubahan Schema/Migrasi Database** — constraint `@@unique([keyResultId, userId])` sudah mencukupi.
