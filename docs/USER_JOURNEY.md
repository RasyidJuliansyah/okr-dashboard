# User Journey per Role - OKR Dashboard

## Daftar Role
1. **ADMIN** - Administrator sistem
2. **C_LEVEL** - Executive (CEO, CTO, CFO, dll)
3. **MANAGER** - Kepala departemen
4. **LEADER** - Team lead / PIC
5. **TEAM** - Anggota tim

---

## 1. ADMIN

### Menu Akses
- **Menu Utama**: Dashboard, Strategic Mapping, Causal Map
- **Menu Admin**: OKR Builder, Inisiatif (Kanban), Update Progress, Data Pegawai, Master KPI, Struktur Departemen, Audit Logs, Siklus Sprint
- **Menu Pekerjaan**: Pekerjaan Saya, Approvals

### User Journey

#### A. Setup Awal Sistem
```
1. Login → Dashboard
2. Kelola Struktur Departemen → Buat hierarchy departemen
3. Data Pegawai → Input data karyawan & assign role
4. Master KPI → Definisi KPI template per departemen
5. Siklus Sprint → Generate sprint tahunan (21-20 setiap bulan)
```

#### B. Manajemen OKR
```
1. OKR Builder → Buat Objective baru
2. Tambah Key Results → Assign ke Leader/Manager
3. Set target & satuan → Kaitkan ke BSC perspective
4. Inisiatif (Kanban) → Review semua inisiatif
5. Update Progress → Input progress manual (jika diperlukan)
```

#### C. Operasional Harian
```
1. Dashboard → Lihat ringkasan eksekutif
2. Pekerjaan Saya → Task yang perlu dikerjakan
3. Approvals → Review & approve permintaan
4. Audit Logs → Monitor aktivitas sistem
```

#### D. Manajemen Sprint
```
1. Siklus Sprint → Lihat sprint aktif
2. Tutup sprint → Lock & arsip pencapaian
3. Rollover → Terbitkan sprint baru
```

---

## 2. C_LEVEL

### Menu Akses
- **Menu Utama**: Dashboard, Strategic Mapping, Causal Map
- **Menu C-Level**: Executive Dashboard
- **Menu Pekerjaan**: Pekerjaan Saya, Approvals

### User Journey

#### A. Review Strategis
```
1. Login → Dashboard eksekutif
2. Strategic Mapping → Lihat BSC scorecard
3. Causal Map → Analisis hubungan kausal antar objective
4. Executive Dashboard → Deep-dive metrics per perspektif BSC
```

#### B. Monitoring Kinerja
```
1. Dashboard → Overview progress organisasi
2. Filter per departemen → Lihat detail
3. Approvals → Review permintaan cross-department
```

#### C. Pengambilan Keputusan
```
1. Strategic Mapping → Identifikasi area yang perlu intervensi
2. Lihat trend progress → Analisis pola
3. Approvals → Setujui/tolak inisiatif lintas departemen
```

---

## 3. MANAGER

### Menu Akses
- **Menu Utama**: Dashboard
- **Menu Manager**: OKR Overview, KR Saya
- **Menu Pekerjaan**: Pekerjaan Saya, Approvals

### User Journey

#### A. Manajemen Departemen
```
1. Login → Dashboard
2. OKR Overview → Lihat semua OKR di bawahnya
3. Filter per Leader → Review progress masing-masing
4. KR Saya → Kelola KR yang di-assign
```

#### B. Pengelolaan KR
```
1. KR Saya → Lihat daftar KR yang menjadi tanggung jawab
2. Buat Inisiatif → Breakdown ke dalam aksi konkret
3. Assign Task ke Team → Delegasi pekerjaan
4. Update progress → Input pencapaian
```

#### C. Approval & Koordinasi
```
1. Approvals → Review permintaan dari team
2. Pekerjaan Saya → Task yang perlu diselesaikan
3. Koordinasi cross-dept → Diskusi via comment
```

---

## 4. LEADER

### Menu Akses
- **Menu Utama**: Dashboard
- **Menu Leader**: KR Saya
- **Menu Pekerjaan**: Pekerjaan Saya, Approvals

### User Journey

#### A. Eksekusi KR
```
1. Login → Dashboard
2. KR Saya → Lihat KR yang di-assign
3. Buat Inisiatif → Rencana aksi untuk mencapai KR
4. Breakdown ke Task → Detail pekerjaan
```

#### B. Manajemen Task
```
1. Pekerjaan Saya → Lihat semua task
2. Filter per sprint → Fokus periode tertentu
3. Update status → Drag-drop di kanban
4. Log progress → Catat pencapaian
```

#### C. Koordinasi Tim
```
1. Assign task ke anggota tim
2. Monitor progress tim → Lihat status
3. Approvals → Review task selesai
4. Cross-dept comment → Koordinasi lintas departemen
```

---

## 5. TEAM

### Menu Akses
- **Menu Utama**: Dashboard
- **Menu Pekerjaan**: Pekerjaan Saya

### User Journey

#### A. Pekerjaan Harian
```
1. Login → Dashboard
2. Pekerjaan Saya → Lihat task list
3. Filter per sprint → Fokus periode aktif
4. Update status → Ubah status task
```

#### B. Eksekusi Task
```
1. Lihat detail task → Deskripsi & target
2. Kerjakan task → Update progress
3. Tambah evidence → Lampiran/bukti
4. Submit → Tandai selesai
```

#### C. Pelaporan
```
1. Update progress harian/mingguan
2. Tambah komentar → Catatan kendala
3. Request approval → Ajukan review
```

---

## Matrix Akses Menu

| Menu | ADMIN | C_LEVEL | MANAGER | LEADER | TEAM |
|------|-------|---------|---------|--------|------|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Strategic Mapping | ✓ | ✓ | - | - | - |
| Causal Map | ✓ | ✓ | - | - | - |
| Executive Dashboard | - | ✓ | - | - | - |
| OKR Builder | ✓ | - | - | - | - |
| Inisiatif (Kanban) | ✓ | - | - | - | - |
| Update Progress | ✓ | - | - | - | - |
| Data Pegawai | ✓ | - | - | - | - |
| Master KPI | ✓ | - | - | - | - |
| Struktur Departemen | ✓ | - | - | - | - |
| Audit Logs | ✓ | - | - | - | - |
| Siklus Sprint | ✓ | - | - | - | - |
| OKR Overview | - | - | ✓ | - | - |
| KR Saya | ✓ | - | ✓ | ✓ | - |
| Pekerjaan Saya | ✓ | ✓ | ✓ | ✓ | ✓ |
| Approvals | ✓ | ✓ | ✓ | ✓ | - |

---

## Alur Approval

```
TEAM → Submit task selesai
  ↓
LEADER → Review & approve task
  ↓
MANAGER → Approve inisiatif
  ↓
C_LEVEL/ADMIN → Approve cross-department request
```

---

## Alur Pelaporan

```
Sprint Aktif (21-20)
  ↓
Team update progress harian
  ↓
Leader review mingguan
  ↓
Manager approve bulanan
  ↓
Sprint di-lock → Arsip skor
  ↓
Rollover ke sprint berikutnya
```

---

## Fitur Khusus per Role

### ADMIN
- Full CRUD semua data
- Generate laporan audit
- Kelola sprint & cadence
- Assign role & permission

### C_LEVEL
- BSC scorecard view
- Causal analysis
- Cross-dept approval
- Strategic dashboard

### MANAGER
- Department overview
- KR assignment
- Team monitoring
- Sprint planning

### LEADER
- Initiative management
- Task delegation
- Progress tracking
- Team coordination

### TEAM
- Task execution
- Progress update
- Evidence upload
- Self-monitoring

---

Dokumen ini menggambarkan user journey untuk setiap role dalam sistem OKR Dashboard. Setiap role memiliki menu dan fungsi yang berbeda sesuai dengan tingkat wewenang dan tanggung jawabnya.
