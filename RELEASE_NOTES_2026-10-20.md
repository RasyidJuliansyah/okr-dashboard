# Release Notes — Skolla BSC & OKR Suite
**Versi:** Release 1.6  
**Tanggal:** 20 Oktober 2026  
**Fokus:** Tata Kelola Metrik BAU (Business as Usual), Perbaikan Auto-Cascade KR, dan Sprint Dropdown DB-Backed

---

## 1. Panduan Tata Kelola: Metrik BAU vs Task Penjagaan

### A. Memahami Perbedaan Output vs Outcome pada BAU
Dalam manajemen kinerja berbasis OKR & Balanced Scorecard, metrik **Business as Usual (BAU)** sering kali membingungkan tim karena sifatnya bukan membangun proyek dari 0% ke 100%, melainkan **menjaga standar performa yang sudah ada**.

| Dimensi | Metrik BAU (Outcome) | Task Penjagaan BAU (Output) |
| :--- | :--- | :--- |
| **Definisi** | Nilai riil kesehatan layanan / operasional yang wajib dipertahankan | Tindakan teknis / aktivitas preventif rutin untuk menjaga kestabilan |
| **Contoh Target** | SLA tiket respon $\ge 90\%$, Uptime server $\ge 99.9\%$, Adopsi $\ge 90\%$ | Checklist monitoring server harian, audit keamanan mingguan, review tiket P0 |
| **Tipe Pengukuran** | Hasil riil (Outcome) | Pengerjaan selesai (Output: TODO / DONE) |
| **Karakteristik Capaian** | Diukur berkala (mingguan/bulanan) via query data riil / tools monitoring | Capaian task (100%) berarti tim telah bekerja, bukan pengganti metrik SLA riil |

> **Prinsip Penting:**  
> Selesainya tugas teknis (misal perbaikan dashboard 100%) adalah sarana pendorong adopsi, bukan berarti otomatis 90% pegawai sudah mengadopsi dashboard. Metrik adopsi wajib diperbarui berdasarkan data riil user aktif.

---

### B. Karakteristik Logika Tipe Target di Sistem

1. **Target Tipe Minimal (`AT_LEAST` / `≥`)**:
   * Digunakan untuk metrik di mana **makin tinggi capaian makin baik** (contoh: SLA $\ge 90\%$, CSAT $\ge 82\%$, Revenue $\ge Rp100jt$).
   * **Formula**:
     $$\text{Progress \%} = \min\left(100, \max\left(0, \frac{\text{Current} - \text{Baseline}}{\text{Target} - \text{Baseline}} \times 100\right)\right)$$
   * Jika tidak ada data atau baseline 0 dan current 0, progress akan bernilai 0% (OFF_TRACK).

2. **Target Tipe Maksimal (`AT_MOST` / `≤`)**:
   * Digunakan untuk metrik toleransi batas atas di mana **makin rendah makin baik** (contoh: Downtime server $\le 30$ menit, Bug P0 $\le 2$ kasus, Churn rate $\le 5\%$).
   * **Formula**:
     * Jika $\text{Current} \le \text{Target} \rightarrow \text{Progress} = 100\%$ (ON_TRACK).
     * Jika $\text{Current} > \text{Target}$, dikenakan penalti deviasi linear.

3. **Target Tipe Tepat (`EXACT` / `=`)**:
   * Digunakan untuk metrik presisi (contoh: Kepatuhan audit $= 100\%$, headcount $= 12$).
   * **Formula**: Mengukur deviasi absolut terhadap target.

---

## 2. Pembaruan Teknis & Perbaikan Sistem

### A. Pembukaan Kuncian Auto-Cascade (`isManualOverride`)
* **Masalah:**  
  Sebelumnya, jika sebuah KR pernah diperbarui manual oleh Leader/Admin, sistem menetapkan `isManualOverride = true`. Akibatnya, ketika anggota tim mengerjakan inisiatif atau task hingga 70%-100%, sistem menghentikan sinkronisasi (*silent exit*), menyebabkan progress KR tetap bernilai 0.
* **Perbaikan Kode:**
  * Di `backend/src/controllers/initiative.controller.ts`: Fungsi `cascadeInitiativeToMonthlyKr` kini mendeteksi keberadaan inisiatif aktif. Jika ada inisiatif yang aktif berprogres, status `isManualOverride` otomatis di-reset menjadi `false` dan progress dihitung secara otomatis dari rata-rata inisiatif.
  * Di `backend/src/controllers/keyresult.controller.ts`: Mendukung update parameter `isManualOverride` dan auto-cascade saat override dimatikan.
  * **Endpoint Baru Rekalkulasi On-Demand:**  
    `POST /api/key-results/:id/recalculate` (Akses: ADMIN, LEADER, MANAGER) untuk memicu kalkulasi ulang instan dari seluruh inisiatif & task anak ke KR dan Annual BSC.

### B. Normalisasi Bobot Inisiatif (`Initiative.weight`)
* Dijalankan script database untuk menormalkan 24 inisiatif yang memiliki `weight: 0` menjadi nilai standar `1.0`.
* Hal ini memastikan seluruh inisiatif aktif memberikan kontribusi proporsional terhadap capaian KR induknya.

### C. Pembaruan Dropdown Sprint Berbasis Database
* Halaman *Pekerjaan Saya* (`frontend/app/pages/team/my-work.vue`) telah dialihkan dari filter bulan kalender statis ke filter Sprint dinamis yang bersumber dari tabel database `Sprint`.
* Pengiriman data pada pembuatan dan pengeditan task kini membawa `sprintId` dan `sprintMonth` yang konsisten.
