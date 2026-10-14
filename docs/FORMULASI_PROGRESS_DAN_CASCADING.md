# Formulasi Progress dan Cascading OKR Dashboard

Dokumen ini menjelaskan spesifikasi logika perhitungan progress (*cascading formula*) dari level teknis operasional (Task) hingga level strategis (Key Result & Objective), beserta panduan interpretasi angka pada tampilan Dashboard.

---

## 1. Hierarki Data

Sistem OKR mengalir secara hierarkis 4 tingkat:

```text
[Objective / Annual Key Result]  (Level Strategis Tahunan / C-Level & Board)
        ▲
[Key Result (Bulanan / Q)]       (Level Taktis / Manager & Leader)
        ▲
[Initiative]                     (Level Proyek / Program Kerja Tim)
        ▲
[Task]                           (Level Eksekusi Personal / Team Member)
```

---

## 2. Formulasi Perhitungan Tiap Level

### Level 1: Task (Eksekusi Operasional)
Setiap task memiliki tipe target (`targetType`) dengan formula capaian:

- **INCREASE**: `((Current - Baseline) / (Target - Baseline)) * 100%`
- **DECREASE**: `((Baseline - Current) / (Baseline - Target)) * 100%`
- **EXACTLY**: Capaian bernilai `100%` jika nilai sama, selain itu proporsional selisih.
- **AT_LEAST**: Capaian `100%` jika nilai `>= Target`.

> Batas progress task: nilai dibatasi antara `0%` sampai `100%` (atau *capped* sesuai aturan bisnis).

---

### Level 2: Initiative (Proyek / Program Kerja)
Progress Initiative dihitung dari tugas-tugas aktif di bawahnya:

1. **Memiliki Task Aktif**:
   $$\text{Progress Initiative} = \frac{\sum \text{Progress Task}}{N_{\text{Task}}}$$
   *(Rata-rata sederhana dari seluruh task aktif di bawah inisiatif tersebut)*

2. **Tanpa Task Mandiri (Standalone Initiative)**:
   Menggunakan capaian target inisiatif langsung:
   $$\text{Progress Initiative} = \frac{\text{Current Value}}{\text{Target Value}} \times 100\%$$

---

### Level 3: Key Result (Capaian Hasil Kunci)
Progress Key Result dihitung dari inisiatif aktif di bawahnya:

1. **Memiliki Inisiatif Aktif**:
   $$\text{Progress Key Result} = \frac{\sum \text{Progress Initiative}}{N_{\text{Initiative}}}$$
   *(Rata-rata sederhana dari seluruh inisiatif di bawah KR tersebut)*

2. **Tanpa Inisiatif / Manual Override**:
   - Jika `isManualOverride = true`: menggunakan status & progress yang diisi manual oleh PIC.
   - Jika tanpa inisiatif: dihitung langsung dari `Current Value / Target Value` Key Result.

---

## 3. Formulasi Card Summary Dashboard

Pada dashboard terdapat dua area ringkasan yang menampilkan agregasi progress:

### A. Section "Progress Capaian Initiative" (`GET /api/initiatives/progress`)
Section ini ditujukan untuk memantau performa tingkat inisiatif:

- **Indikator**: `Rata-rata Progress` (Class: `.summary-val`)
- **Formula**:
  $$\text{Summary Avg Progress} = \frac{\sum_{i=1}^{M} \text{Progress Initiative}_i}{M}$$
  *Di mana $M$ adalah total seluruh inisiatif aktif yang tampil pada lingkup pengguna.*

#### Studi Kasus (Penjelasan Angka 28.3% vs 30%):
Ditemukan tampilan ringkasan **28.3%**, sementara nilai KR adalah **25%** dan **35%**:

- **Kondisi Riil Data**:
  - **KR 1** (Net Revenue): memiliki **2 Inisiatif**:
    - Inisiatif 1A: Progress **50%** (rata-rata Task: 80% dan 20%)
    - Inisiatif 1B: Progress **0%** (0 Task)
    - $\rightarrow$ **Capaian KR 1** = $\frac{50\% + 0\%}{2} = \mathbf{25\%}$
  - **KR 2** (Organic Leads): memiliki **1 Inisiatif**:
    - Inisiatif 2A: Progress **35%** (rata-rata Task: 50% dan 20%)
    - $\rightarrow$ **Capaian KR 2** = $\frac{35\%}{1} = \mathbf{35\%}$

- **Kalkulasi Card Summary (Level Inisiatif)**:
  $$\frac{50\% + 0\% + 35\%}{3 \text{ Inisiatif}} = \frac{85\%}{3} = \mathbf{28.3\%}$$

- **Jika Dirata-ratakan dari Level KR**:
  $$\frac{25\% + 35\%}{2 \text{ KR}} = \mathbf{30.0\%}$$

> **Kesimpulan Produk**:
> Angka 28.3% adalah **akurat secara matematis** untuk agregasi entitas *Initiative*. Perbedaan terjadi karena KR 1 memiliki 2 inisiatif sedangkan KR 2 hanya memiliki 1 inisiatif (efek bobot per entitas inisiatif).

---

### B. Hero Card Dashboard Utama (`GET /api/dashboard/summary` & `dashboard.vue`)
Agregasi progress pada kartu hero utama "Rata-Rata Progres" (`.task-value` pada `dashboard.vue`) dihitung berbasis agregat rata-rata **Key Result (KR)** yang diampu oleh employee / scope tersebut:

| Role User | Dasar Agregasi Hero Card (`.task-value`) | Keterangan |
| :--- | :--- | :--- |
| **TEAM** | Rata-rata progress Key Result yang diampu / terkait (fallback ke Task mandiri / Inisiatif tim) | Fokus pada KR yang diampu atau tugas aktif |
| **LEADER** | Rata-rata progress Key Result yang diampu / terkait tim (fallback ke Inisiatif tim) | Fokus pada ketercapaian KR yang diampu oleh timnya |
| **MANAGER** | Rata-rata progress seluruh Key Result dalam departemen yang dikelola | Dihitung dari seluruh KR aktif di bawah departemen Manager |
| **C_LEVEL / ADMIN** | Rata-rata progress seluruh Key Result aktif di perusahaan | Dihitung dari rata-rata seluruh KR aktif perusahaan |

> **Keputusan Produk (Confirmed)**:
> Nilai agregat hero card `.task-value` di dashboard dihitung berdasarkan **rata-rata per Key Result (KR) yang diampu oleh employee/lingkup tersebut**, bukan agregat dari inisiatif. Agregat inisiatif ditampilkan khusus pada section *Progress Capaian Initiative* (`.summary-val`).

---

## 4. Ambang Batas Status (Health Status)

Status kesehatan dihitung otomatis berdasarkan persentase progress:

| Status | Range Progress | Warna Indikator |
| :--- | :--- | :--- |
| **ON TRACK** | $\ge 70\%$ | Hijau (`#10b981`) |
| **AT RISK** | $40\% - 69.9\%$ | Oranye / Kuning (`#f59e0b`) |
| **OFF TRACK** | $< 40\%$ | Merah (`#ef4444`) |

*Catatan: Jika Key Result memiliki `isManualOverride = true`, status manual yang ditentukan oleh PIC diprioritaskan di atas kalkulasi otomatis.*

---

## 5. Rekomendasi Evolusi Produk

1. **Konsistensi Label & Card Separation**:
   - Card `.task-value` menampilkan agregat rata-rata Key Result yang diampu (`Agregat progres seluruh Key Results yang diampu.`).
   - Card `.summary-val` pada section *Progress Capaian Initiative* menampilkan agregasi rata-rata inisiatif secara terpisah.
2. **Pembobotan (Weighted Average)**:
   - Saat ini sistem menggunakan *unweighted simple average*. Di masa mendatang, inisiatif dan task dapat diberi bobot (*weight*) jika ada inisiatif dengan dampak strategis lebih besar.
