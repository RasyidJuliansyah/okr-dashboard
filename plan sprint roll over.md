# Plan: Sprint Rollover 100% Trigger by Admin

## 1. Tujuan
Menonaktifkan background job otomatis (`setInterval` 1 jam di backend) agar penutupan sprint dan pembuatan snapshot capaian sepenuhnya dikendalikan manual oleh Admin melalui tombol UI di `sprints.vue`.

---

## 2. Berkas yang Diubah

### A. `backend/src/index.ts`
* Hapus import `checkAndAutoRollover`:
  ```typescript
  // HAPUS:
  import { checkAndAutoRollover } from "./services/sprint.service";
  ```
* Hapus pemanggilan otomatis di `app.listen()`:
  ```typescript
  // HAPUS blok ini:
  checkAndAutoRollover().catch((err) => console.error("Auto rollover check failed:", err));
  setInterval(() => {
    checkAndAutoRollover().catch((err) => console.error("Auto rollover check failed:", err));
  }, 60 * 60 * 1000);
  ```

### B. `backend/src/services/sprint.service.ts`
* Tandai `checkAndAutoRollover` sebagai deprecated/no-op (`ponytail: auto-rollover disabled, manual by admin only`).
* Fungsi `closeAndRolloverSprint()` tetap aktif melayani endpoint manual `POST /api/sprints/:id/close`.

### C. `frontend/app/pages/admin/sprints.vue`
* Ubah teks deskripsi halaman: hapus rujukan rollover otomatis, perjelas bahwa penutupan sprint dikendalikan manual oleh Admin.
* Tambahkan visual status pada kartu Sprint Aktif jika tanggal telah melewati `endDate`:
  - Badge peringatan: `Sprint telah berakhir — Menunggu penutupan manual oleh Admin`.
  - Tombol aksi `Tutup & Rollover Sprint` tetap menjadi eksekutor utama.

---

## 3. Alur Eksekusi Malam Ini
1. Tulis perubahan di `backend/src/index.ts` (hapus background timer).
2. Tulis perubahan di `backend/src/services/sprint.service.ts` (deprecate cron function).
3. Tulis perubahan di `frontend/app/pages/admin/sprints.vue` (update teks & badge reminder).
4. Jalankan verifikasi:
   - `cd okr-dashboard2_dev/backend && npm run build`
   - `cd okr-dashboard2_dev/frontend && npm run build`
5. Buat ulang arsip `deploy-package.tar.gz`.
