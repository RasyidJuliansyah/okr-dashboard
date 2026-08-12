# OKR Dashboard — Role-Based Visibility & Initiative/KPI Cascade PRD

| | |
|---|---|
| **Author** | [Nama Product Owner] |
| **Status** | Draft |
| **Date** | 11 Agustus 2026 |
| **Stakeholders** | Product Owner, Engineering (Backend & Frontend), perwakilan C-Level, Manager, Leader |

## Overview

Improvement lanjutan atas OKR Dashboard yang sudah berjalan (BSC Perspective, Objective → Key Result, RACI Matrix, Strategy Map/CausalLink). Saat ini seluruh role melihat dashboard yang sama persis — bedanya hanya tombol edit yang muncul/tidak. Improvement ini menambahkan dua hal: (1) **role-based visibility** sehingga tiap role (Admin, C-Level, Manager, Leader, Team) hanya melihat data yang relevan dengan tanggung jawabnya, dan (2) **dua level baru di bawah Key Result** — Initiative dan KPI — supaya akuntabilitas turun sampai ke level tim dan individu, bukan berhenti di KR.

## Problem Statement

Endpoint `getDashboardSummary` saat ini query seluruh `Objective` tanpa filter berdasarkan role atau departemen — semua user, dari Admin sampai Employee, melihat data OKR seluruh perusahaan. Ini menyebabkan:

- **Information overload** untuk role di bawah C-Level, yang sebenarnya hanya perlu melihat scope departemen/tim mereka.
- **Tidak ada jenjang akuntabilitas individu** — struktur data berhenti di Key Result + RACI (siapa Responsible/Accountable), tapi tidak ada unit kerja konkret ("apa yang harus saya kerjakan minggu ini") di level tim atau individu.
- **Causality antar metric BSC belum tersaji sebagai satu gambaran utuh** untuk C-Level — `CausalLink` sudah ada di schema, tapi belum ada halaman yang menyusunnya sebagai satu Strategy Map lintas 4 perspektif.

## Goals

1. Setiap role (Admin, C-Level, Manager, Leader, Team) melihat scope data OKR yang relevan dengan tanggung jawabnya, bukan seluruh data perusahaan.
2. C-Level dapat melihat seluruh metric BSC dan hubungan sebab-akibat (causality) antar metric dalam satu halaman, tersusun mengikuti urutan klasik BSC.
3. Ada jenjang akuntabilitas sampai level tim (Initiative) dan individu (KPI), turunan langsung dari Key Result.
4. Team member dapat berkontribusi mengisi progress KPI miliknya sendiri, dengan kontrol kualitas lewat approval Manager.
5. Tidak ada regresi terhadap fitur yang sudah berjalan: RACI, BSC View, Strategy Map, Update Progress KR.

### Non-Goals

- Tidak membangun kemampuan create/edit Initiative atau KPI oleh role selain Admin — tetap tersentralisasi di fase ini.
- Tidak mengubah mekanisme RACI assignment KR yang sudah ada.
- Tidak membangun sistem notifikasi multi-channel (email/Slack) — cukup in-app dulu.
- Tidak mengubah struktur 4 perspektif BSC yang sudah fixed (Financial, Customer, Internal Process, Learning & Growth).
- Tidak membangun auto-suggest causal link otomatis — link antar KR tetap dibuat manual oleh Admin seperti sekarang.

## Success Metrics

1. QA per role membuktikan tidak ada role yang bisa melihat data di luar scope-nya (verifikasi manual + automated test per endpoint) — sebelum rilis.
2. Zero regresi pada fitur existing (RACI, BSC View, Strategy Map, Update Progress KR) — diverifikasi lewat checklist regresi yang sudah dipakai di dokumen teknis sebelumnya.
3. Adopsi update KPI oleh Team member: [target TBD — perlu baseline setelah rilis] % Team member mengisi update KPI dalam periode pelaporan.
4. Rata-rata waktu approval Manager terhadap KPI update: [target TBD].
5. C-Level menggunakan halaman Strategy Map sebagai bagian dari review mingguan/bulanan: [target TBD, ukur lewat usage log].

## User Stories / Use Cases

- Sebagai **Admin**, saya ingin membuat Initiative di bawah sebuah KR dan meng-assign-nya ke satu Team, supaya ada rencana aksi konkret yang bisa dieksekusi.
- Sebagai **Admin**, saya ingin membuat KPI di bawah Initiative dan meng-assign-nya ke satu atau lebih Member, supaya ada akuntabilitas individu yang terukur.
- Sebagai **C-Level**, saya ingin melihat semua Objective & KR lintas departemen dalam satu dashboard, supaya saya punya gambaran utuh performa perusahaan.
- Sebagai **C-Level**, saya ingin melihat Strategy Map satu halaman yang menyusun seluruh metric BSC dan causal link-nya berurutan dari Learning & Growth sampai Financial, supaya saya paham metric mana yang jadi akar penyebab metric lain bergerak.
- Sebagai **Manager**, saya ingin melihat BSC, Objective, dan KR yang hanya relevan dengan departemen saya, supaya saya tidak perlu menyaring data departemen lain.
- Sebagai **Manager**, saya ingin approve atau reject update KPI yang diajukan Team member di departemen saya, supaya angka yang tampil di dashboard sudah tervalidasi sebelum jadi acuan resmi.
- Sebagai **Leader**, saya ingin melihat KR (sebagai konteks) dan Initiative dari semua Team yang saya pimpin, supaya saya bisa memantau eksekusi tanpa harus login sebagai Admin.
- Sebagai **Team member**, saya ingin melihat Initiative dan KPI yang di-assign ke saya, supaya saya tahu apa yang harus saya kerjakan dan capai.
- Sebagai **Team member**, saya ingin submit update progress KPI saya sendiri, supaya datanya real-time tanpa harus minta Admin update-kan manual.

## Requirements

### Functional Requirements

Prioritas memakai MoSCoW: **Must** = wajib ada di rilis ini, **Should** = penting tapi rilis tetap bisa jalan tanpanya kalau kepepet, **Could** = nice-to-have, dikerjakan kalau kapasitas tersisa. Tidak ada item **Won't** untuk fase ini — yang memang sengaja tidak dikerjakan sudah masuk ke bagian Non-Goals/Out of Scope.

**A. Role & Struktur Organisasi**

1. **[Must]** Rename role `EMPLOYEE` → `TEAM` di seluruh sistem (schema, backend, frontend), dengan migrasi data existing tanpa breaking change.
2. **[Must]** Tambah role baru `LEADER` ke field `role` pada `User`.
3. **[Must]** Tambah `Team.leaderId` dan relasi Team ↔ Department (field/model baru), supaya tiap Team punya satu Leader dan terhubung ke satu Department.
4. **[Must]** Satu Leader dapat memimpin lebih dari satu Team (relasi one-to-many Leader → Team), sesuai konfirmasi.
5. **[Should]** Halaman Admin untuk assign Leader ke Team dan Department ke Team (extend halaman admin yang sudah ada, mis. `employees.vue`/`objectives.vue`).

**B. Initiative & KPI (entity baru)**

6. **[Must]** Model baru `Initiative`: terhubung ke 1 Key Result, di-assign ke 1 Team. Create/edit/delete hanya oleh Admin.
7. **[Must]** Model baru `KPI`: terhubung ke 1 Initiative, di-assign ke satu atau lebih Member (role `TEAM`). Create/edit/delete hanya oleh Admin.
8. **[Must]** Team member dapat submit progress update untuk KPI yang di-assign ke dirinya (nilai baru + catatan). Status awal: `PENDING_APPROVAL`.
9. **[Must]** Manager (dari departemen yang sama dengan Team pemilik KPI) dapat approve/reject update tersebut. Approve → `currentValue` KPI ter-update + histori tersimpan. Reject → nilai tidak berubah, wajib disertai catatan alasan untuk Team member.
10. **[Should]** Riwayat update KPI (approved & rejected) dapat dilihat per KPI, mengikuti pola `KrUpdate`/`kr-history` yang sudah ada untuk KR.

**C. Visibility per Role (dashboard scoping)**

11. **[Must]** Endpoint dashboard summary difilter berdasarkan role user yang login:
    - `ADMIN` → seluruh data, seluruh level (Objective, KR, Initiative, KPI).
    - `C_LEVEL` → seluruh Objective & KR lintas departemen (read-only) + akses Strategy Map satu halaman.
    - `MANAGER` → Objective & KR yang `KrDepartment`-nya cocok dengan departemen Manager (read-only) + queue approval KPI dari Team-Team di departemennya.
    - `LEADER` → KR (read-only, sebagai konteks) + Initiative dari seluruh Team yang dipimpinnya.
    - `TEAM` → Initiative + KPI yang di-assign langsung ke dirinya, plus kemampuan submit update KPI.
12. **[Must]** Filtering dilakukan di level query backend (bukan disembunyikan di frontend saja) untuk setiap endpoint baru maupun yang sudah ada.
13. **[Should]** Satu dashboard yang sama merender konten berbeda per role (bukan halaman terpisah per role), konsisten dengan pola UI yang sudah ada.

**D. Strategy Map / Causality (khusus C-Level)**

14. **[Must]** Halaman Strategy Map menampilkan seluruh KR dari 4 perspektif BSC dalam satu halaman, tersusun berurutan: Learning & Growth → Internal Process → Customer → Financial, dengan `CausalLink` yang sudah ada digambarkan sebagai penghubung antar KR/perspektif.
15. **[Could]** Klik satu KR untuk highlight seluruh causal chain yang terhubung ke/darinya — nice-to-have, prioritas menyusul.

### Non-Functional Requirements

- **Security/Authorization**: seluruh filtering role-based wajib di-enforce di backend (query-level), bukan hanya disembunyikan di UI, agar tidak bisa diakses lewat panggilan API langsung.
- **Backward compatibility**: migrasi role `EMPLOYEE` → `TEAM` tidak boleh merusak data `KrAssignment`, RACI, atau relasi lain yang sudah ada.
- **Data integrity**: nilai KPI hanya boleh berubah lewat alur submit-approve, tidak ada direct write, agar audit trail-nya konsisten dengan pola `KrUpdate`.
- **Performance**: dashboard C-Level yang menampilkan data lintas departemen tetap perlu responsif — pertimbangkan pagination/lazy-load jika volume Initiative/KPI besar [TBD, tergantung skala data aktual].

## Scope

### In Scope

- Role baru `LEADER`; rename `EMPLOYEE` → `TEAM`
- Model & CRUD (Admin-only) untuk Initiative & KPI
- Alur submit + approval update KPI (Team → Manager)
- Role-based read scoping di dashboard untuk kelima role
- Strategy Map satu halaman untuk C-Level, tersusun sesuai urutan perspektif BSC

### Out of Scope

- Create/edit Initiative & KPI oleh role selain Admin
- Perubahan mekanisme RACI KR yang sudah ada
- Notifikasi multi-channel (email/push)
- Auto-suggest causal link otomatis

## Design & UX Considerations

- Perlu wireframe untuk: (a) Strategy Map satu halaman, (b) tampilan dashboard Team (kartu Initiative + KPI), (c) form approval KPI di sisi Manager. Belum tersedia — bisa disiapkan terpisah.
- Pertahankan pola visual yang sudah ada (chip RACI, badge status `ON_TRACK`, dsb.) supaya Initiative/KPI terasa menyatu dengan tampilan KR yang sudah ada, bukan seperti fitur terpisah.

## Timeline & Milestones

[TBD — bisa disusun per fase seperti dokumen teknis sebelumnya (FASE 0–4), tergantung kapasitas developer yang mengeksekusi]

## Risks & Open Questions

- **Risk**: Manager bisa jadi bottleneck approval kalau membawahi banyak Team/Leader sekaligus dengan volume update KPI tinggi — pantau setelah rilis, siapkan opsi bulk-approve kalau perlu.
- **Risk**: Kesalahan implementasi row-level filtering adalah risiko keamanan data (role rendah melihat data role lebih tinggi) — wajib test khusus per role sebelum rilis, bukan sekadar QA visual.
- **Open question**: Siapa yang mengoperasikan assignment Leader→Team dan Team→Department — lewat halaman Admin yang sudah ada atau perlu UI baru?
- **Open question**: Apakah Leader perlu notifikasi saat Initiative tim-nya diubah Admin, atau cukup pull (buka dashboard sendiri) di fase ini?
- **Open question**: Target angka di Success Metrics (poin 3–5) masih TBD, perlu baseline setelah beberapa minggu pemakaian nyata.

## Appendix

- Referensi teknis: `okr_development_plan.md` — BSC Metrics Framework, RACI Matrix, dokumen update 10 Agustus 2026.
- Model existing yang jadi basis: `User`, `Team`, `Objective`, `KeyResult`, `KrAssignment`, `KrUpdate`, `CausalLink`, `KrDepartment`.
