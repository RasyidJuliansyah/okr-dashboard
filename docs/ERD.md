# ERD — OKR Dashboard

Sumber kebenaran: [backend/src/prisma/schema.prisma](../backend/src/prisma/schema.prisma) (SQLite via Prisma).
13 model, 4 lapisan: Identitas & Organisasi → Inti OKR → Eksekusi → Penugasan & Riwayat.

## Alur cascade

```mermaid
flowchart LR
    O[Objective<br/>per kuartal] --> KR[Key Result<br/>+ BSC perspective]
    KR --> I[Initiative<br/>milik Team]
    I --> K[KPI<br/>metrik eksekusi]
    K -. KpiUpdate<br/>PENDING_APPROVAL .-> K
    KR -. KrUpdate .-> KR
    KR -- CausalLink --> KR
```

Progres mengalir ke atas: nilai KPI → `Initiative.currentValue` (berbobot `weight`) → `KeyResult.currentValue` → status Objective.

## Diagram relasi lengkap

```mermaid
erDiagram
    User {
        string id PK
        string name
        string email UK
        string password
        string role "ADMIN, MANAGER, C_LEVEL, LEADER, TEAM"
        string department "nullable, soft ref Department.value"
        string position "nullable"
        string teamId FK "nullable"
        datetime createdAt
    }
    Team {
        string id PK
        string name
        string managerId "nullable, soft ref User.id"
        string leaderId FK "nullable"
        string department "nullable, soft ref Department.value"
    }
    Department {
        string id PK
        string name
        string value UK
        string managerId FK "nullable"
        datetime createdAt
    }
    Objective {
        string id PK
        string title
        string description "nullable"
        string quarter
        string ownerId "nullable, soft ref User.id"
        datetime createdAt
    }
    KeyResult {
        string id PK
        string objectiveId FK
        string title
        float targetValue
        float currentValue "default 0"
        string unit
        string bscPerspective
        string status "default ON_TRACK"
        datetime createdAt
        datetime updatedAt
    }
    CausalLink {
        string id PK
        string sourceKrId FK
        string targetKrId FK
        string relationship
        string note "nullable"
        string createdBy "nama, bukan FK"
        datetime createdAt
    }
    Initiative {
        string id PK
        string keyResultId FK
        string teamId FK
        string ownerId FK "nullable"
        string title
        string description "nullable"
        float targetValue "default 0"
        float currentValue "default 0"
        string unit "nullable"
        string status "default ON_TRACK"
        string kanbanStatus "TODO, IN_PROGRESS, DONE"
        float weight "default 1.0"
        datetime createdAt
        datetime updatedAt
    }
    Kpi {
        string id PK
        string initiativeId FK
        string title
        float targetValue
        float currentValue "default 0"
        string unit "nullable"
        string status "default ON_TRACK"
        datetime createdAt
        datetime updatedAt
    }
    KrAssignment {
        string id PK
        string keyResultId FK
        string userId FK
        string assignedBy "id atau nama, tidak konsisten"
        string raciRole "default RESPONSIBLE"
        datetime assignedAt
    }
    KrDepartment {
        string id PK
        string keyResultId FK
        string department "soft ref Department.value"
        datetime createdAt
    }
    KpiAssignment {
        string id PK
        string kpiId FK
        string userId FK
        datetime assignedAt
    }
    KrUpdate {
        string id PK
        string keyResultId FK
        float oldValue
        float newValue
        string note "nullable"
        string updatedBy "nama, bukan FK"
        datetime updatedAt
    }
    KpiUpdate {
        string id PK
        string kpiId FK
        float oldValue
        float newValue
        string note "nullable"
        string submittedBy "userId, bukan FK"
        string status "default PENDING_APPROVAL"
        string reviewedBy "nullable"
        string reviewNote "nullable"
        datetime reviewedAt "nullable"
        datetime createdAt
    }

    Objective  ||--o{ KeyResult     : "diturunkan jadi"
    KeyResult  ||--o{ Initiative    : "dieksekusi lewat"
    Initiative ||--o{ Kpi           : "diukur oleh"
    KeyResult  ||--o{ CausalLink    : "sebagai sumber"
    KeyResult  ||--o{ CausalLink    : "sebagai target"
    KeyResult  ||--o{ KrUpdate      : "riwayat nilai"
    Kpi        ||--o{ KpiUpdate     : "riwayat + approval"
    KeyResult  ||--o{ KrAssignment  : "ditugaskan lewat"
    User       ||--o{ KrAssignment  : "bertanggung jawab"
    Kpi        ||--o{ KpiAssignment : "ditugaskan lewat"
    User       ||--o{ KpiAssignment : "bertanggung jawab"
    KeyResult  ||--o{ KrDepartment  : "dibagi ke divisi"
    Team       ||--o{ User          : "beranggotakan"
    User       ||--o{ Team          : "memimpin (leaderId)"
    Team       ||--o{ Initiative    : "menjalankan"
    User       ||--o{ Initiative    : "memiliki (ownerId)"
    User       ||--o{ Department    : "memanajeri"
    User       ||..o{ Objective     : "ownerId tanpa FK"
    User       ||..o{ Team          : "managerId tanpa FK"
    Department ||..o{ User          : "value tanpa FK"
    Department ||..o{ Team          : "value tanpa FK"
    Department ||..o{ KrDepartment  : "value tanpa FK"
```

Garis putus-putus = relasi logis yang **tidak** punya foreign key di database.

## Junction table

| Tabel | Menghubungkan | Unique constraint | Kolom tambahan |
|---|---|---|---|
| `KrAssignment` | KeyResult ↔ User | `[keyResultId, userId]` | `raciRole`, `assignedBy` |
| `KpiAssignment` | Kpi ↔ User | `[kpiId, userId]` | — |
| `KrDepartment` | KeyResult ↔ Department (by string) | `[keyResultId, department]` | — |

## Catatan integritas data

1. **`Objective.ownerId` tanpa relasi Prisma.** Field-nya ada tapi tidak dideklarasikan sebagai relasi, jadi objective bisa menunjuk user yang sudah dihapus. Sama untuk `Team.managerId`.
2. **Divisi disimpan sebagai string di 3 tempat** (`User.department`, `Team.department`, `KrDepartment.department`) yang menunjuk `Department.value` tanpa FK. Rename satu divisi berarti update manual di semua tabel itu.
3. **`KrAssignment.assignedBy` tidak konsisten:** [keyresult.controller.ts:326](../backend/src/controllers/keyresult.controller.ts#L326) mengisi `req.user?.id`, sementara [bulkUpload.controller.ts:204](../backend/src/controllers/bulkUpload.controller.ts#L204) mengisi nama user. Kolom yang sama menyimpan dua jenis nilai.
4. **Kolom audit lain menyimpan nama, bukan id:** `KrUpdate.updatedBy`, `CausalLink.createdBy` menggunakan `name || email`. `KpiUpdate.submittedBy` menggunakan id.
5. **Tidak ada cascade delete di schema.** Penghapusan KR menghapus anak-anaknya lewat kode controller, bukan constraint database.
