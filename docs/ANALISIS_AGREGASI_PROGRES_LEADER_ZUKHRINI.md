# Analisis Agregasi Progres Dashboard Leader (Studi Kasus: Akun Zukhrini)

Dokumen ini mencatat investigasi selisih nilai agregat **Rata-rata Progres** pada Hero Card (33.5%) vs perkiraan manual dari tampilan inisiatif tim (57.35%) pada akun Leader Zukhrini Khalish Nasution.

---

## 1. Ringkasan Kasus

- **Tampilan Hero Card (`/api/dashboard/summary`)**:
  - Rata-rata Progres: **33.5%**
  - Status KR: **0 On Track, 1 At Risk, 8 Off Track** (Total: **9 KR**)
- **Tampilan Section "Progress Capaian Initiative" (`/api/initiatives/progress`)**:
  - Menampilkan 2 Key Result dengan 4 Inisiatif tim *Education & Academic*:
    - KR `Tingkat Kesuksesan Layanan 80%`: **54.2%**
    - KR `Tingkat Adopsi User 60%`: **60.5%**
  - Perkiraan manual user jika hanya merata-rata 2 KR tersebut:
    $$\frac{54.2\% + 60.5\%}{2} = 57.35\%$$

---

## 2. Akar Masalah

Ada dua faktor utama penyebab nilai hero card menjadi **33.5%**:

### A. Jumlah Penugasan Key Result di Database (9 KR vs 2 KR)
Akun Zukhrini memiliki **9 record penugasan** di tabel `KrAssignment` (peran: `ACCOUNTABLE`):
1. Section bawah hanya memfilter inisiatif yang dimiliki oleh tim yang dipimpin Zukhrini (`Education & Academic`). Karena tim ini baru membuat inisiatif untuk 2 KR, hanya 2 KR yang muncul di daftar visual bawah.
2. Endpoint ringkasan dashboard hero card mengumpulkan seluruh KR yang di-assign ke user (`leaderKrAssignments`) ditambah KR dari inisiatif tim. Seluruh 9 KR tersebut dihitung dalam agregat hero card.

### B. Perbedaan Cakupan (Scope) Perhitungan Progres KR
Untuk KR `Tingkat Kesuksesan Layanan 80%`:
- **Section bawah (54.2%)**:
  - Dihitung khusus dari inisiatif milik tim Zukhrini (*Education & Academic*, 3 inisiatif):
    - *Menjaga tingkat kepuasan layanan Skolla >82%*: 59.9%
    - *100% akurasi produk dengan kebutuhan user*: 41.2%
    - *100% pencapaian target produksi*: 61.4%
    - Rata-rata: $(59.9 + 41.2 + 61.4) / 3 = 54.17\% \approx 54.2\%$
- **Hero card (30.4%)**:
  - Dihitung dari seluruh 7 inisiatif aktif di bawah KR tersebut lintas tim (termasuk 4 inisiatif tim *Operation* yang bernilai 50%, 0%, 0%, 0%):
    $$\frac{59.9 + 41.2 + 61.4 + 50.0 + 0 + 0 + 0}{7} = \frac{212.5}{7} = 30.36\% \approx 30.4\%$$

---

## 3. Rincian 9 Key Result pada Hero Card

Perhitungan agregat rata-rata pada backend `getDashboardSummary` (role: `LEADER`):

| No | Key Result ID | Judul Key Result | Progres | Status | Jumlah Inisiatif | Sumber Nilai |
|---|---|---|---|---|---|---|
| 1 | `9e484e4b...` | Tingkat Adopsi User 60% | 60.5% | AT_RISK | 1 | 1 inisiatif tim Education |
| 2 | `f9d74595...` | Tingkat Kesuksesan Layanan 80% | 30.4% | OFF_TRACK | 7 | 7 inisiatif (3 Education + 4 Operation) |
| 3 | `b4742437...` | Akurasi Layanan 100% | 73.1% | OFF_TRACK | 1 | Inisiatif tim lain |
| 4 | `a6793196...` | Tingkat Kepuasaan >82% | 70.9% | OFF_TRACK | 5 | Inisiatif tim lain |
| 5 | `405b4e98...` | Penyelesaian Problem <24 jam | 66.7% | OFF_TRACK | 3 | Inisiatif tim lain |
| 6 | `b6ca80dc...` | Penyelesaian Bug <24 jam | 0.0% | OFF_TRACK | 0 | Belum ada progres / task |
| 7 | `80f2a953...` | Tingkat Keterselesaian Ujian 90% | 0.0% | OFF_TRACK | 0 | Belum ada progres / task |
| 8 | `f8cbf509...` | Kelengkapan Materi Belajar 100% | 0.0% | OFF_TRACK | 0 | Belum ada progres / task |
| 9 | `b817f395...` | Tingkat Keaktifan User 80% | 0.0% | OFF_TRACK | 0 | Belum ada progres / task |

$$\text{Total Progres} = 60.5 + 30.4 + 73.1 + 70.9 + 66.7 + 0 + 0 + 0 + 0 = 301.6\%$$

$$\text{Rata-rata Hero Card} = \frac{301.6\%}{9} = 33.51\% \approx \mathbf{33.5\%}$$

---

## 4. Opsi Penyelarasan

Jika diinginkan agar hero card mencerminkan 57.35% (hanya inisiatif tim yang dipimpin):

1. **Opsi Data (Reassign/Unassign)**:
   - Lepaskan penugasan Zukhrini dari 7 KR yang bukan tanggung jawab langsung tim Education & Academic melalui menu penugasan KR/RACI.
2. **Opsi Logika Query Backend**:
   - Untuk role `LEADER`, batasi KR yang dihitung pada hero card hanya KR yang memiliki inisiatif di tim yang dipimpinnya (`leaderTeamIds`), atau hitung progres KR hanya dari inisiatif milik tim bersangkutan (scoped KR progress).
