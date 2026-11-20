# Release Notes — Skolla BSC & OKR Suite
**Versi:** Release 1.7
**Tanggal:** 17 November 2026
**Fokus:** Sprint Retrospective Board (fitur baru), konfirmasi dialog custom, penyembuyian sementara menu Roadmap Produk

---

## 1. Fitur Baru: Sprint Retrospective Board (`/retro`)

Retrospektif sprint sebelumnya dikerjakan di luar aplikasi (dokumen/chat terpisah), sehingga masukan tim tidak tersimpan bersama data sprint. Sekarang tersedia satu board retro per Sprint per Departemen langsung di dashboard.

**Kemampuan utama:**
- Tiga kolom kartu: **Stop** (merah), **Start** (kuning), **Continue** (hijau), plus panel **Mood** tim.
- Update hampir real-time lewat polling 3 detik (polling berhenti otomatis saat tab browser tersembunyi, untuk hemat beban server).
- Reaksi emoji di kartu (whitelist: 👍 🔥 🎉 💪 ❤️ 😂), toggle — klik emoji yang sama dua kali untuk membatalkan reaksi.
- Mood per user per board (16 pilihan emoji, bisa diganti).
- Board bisa dibuka, ditutup, dan dibuka ulang oleh MANAGER/LEADER departemen terkait (atau ADMIN via impersonasi). ADMIN dan C_LEVEL hanya bisa membaca (read-only), lintas semua departemen.
- Semua anggota departemen (TEAM, LEADER, MANAGER) boleh menambah kartu, memilih mood, dan memberi reaksi selama board berstatus OPEN. Operasi tulis pada board CLOSED ditolak (HTTP 409).
- Kartu bisa dihapus oleh penulisnya sendiri atau oleh MANAGER/LEADER departemen tersebut.
- Riwayat buka/tutup/buka-ulang board tercatat di Audit Log (`entityType = RETRO_BOARD`, action `RETRO_OPEN` / `RETRO_REOPEN` / `RETRO_CLOSE`) — bisa dilihat dari panel Riwayat di board atau filter baru di halaman **Audit Logs** (opsi "Sprint Retro").

**Di luar lingkup rilis ini:** action items, GIF/AI, voting, timer, edit kartu, drag-drop, ekspor.

**Detail teknis:** `backend/src/controllers/retro.controller.ts`, `backend/src/routes/retro.routes.ts` (endpoint `/api/retros`), `frontend/app/pages/retro.vue`. PRD lengkap: `docs/PRD_Sprint_Retrospective.md`.

### Perubahan Database (WAJIB dijalankan sebelum deploy backend)
4 tabel baru ditambahkan via `deploy_retro_tables.sql` (idempotent, aman dijalankan berulang):
- `retro_board` — 1 board per sprint per departemen (`UNIQUE(sprint_id, department_id)`).
- `retro_card` — kartu Stop/Start/Continue.
- `retro_mood` — mood per user per board.
- `retro_reaction` — reaksi emoji per kartu.

Tidak ada kolom tabel lama yang diubah/dihapus — hanya relasi baru ditambahkan ke model `User`, `Department`, `Sprint` di `schema.prisma`. Jalankan `deploy_retro_tables.sql` di DB prod (`skolla_okr`) **sebelum** backend baru di-deploy, supaya endpoint `/api/retros` tidak gagal saat start.

---

## 2. Perbaikan UX: Konfirmasi Dialog Custom

Dialog native browser (`window.confirm`) di halaman Retro (`closeBoard`, `deleteCard`) diganti dengan modal konfirmasi custom (`useConfirm` + `ConfirmModal.vue`) yang sudah dipakai di halaman lain (Sprints, Employees, Initiatives, dll). Konsisten secara visual dengan branding Skolla, tidak lagi menampilkan dialog bawaan browser ("localhost:3000 says").

---

## 3. Penyesuaian Menu: Roadmap Produk Disembunyikan Sementara

Menu **Roadmap Produk** di sidebar disembunyikan dari semua role untuk sementara (di-comment, bukan dihapus — mudah diaktifkan kembali). Halaman `/product-roadmap` dan komponennya masih ada di kodebase, hanya tidak muncul di navigasi.

> Catatan: route `/product-roadmap` belum diblok via middleware, jadi masih bisa diakses jika user mengetik URL langsung. Perlu keputusan lanjutan apakah ini perlu diblok total atau cukup disembunyikan dari menu saja.

---

## Checklist Deploy
- [ ] Jalankan `deploy_retro_tables.sql` di DB prod sebelum deploy backend baru.
- [ ] Deploy backend (`backend/src/index.ts` menambahkan route `/api/retros`).
- [ ] Deploy frontend (halaman `/retro`, sidebar, audit-logs, confirm modal).
- [ ] Verifikasi: buka `/retro` sebagai MANAGER/LEADER, buat kartu, buka/tutup board, cek Audit Logs filter "Sprint Retro".
- [ ] Verifikasi: menu Roadmap Produk tidak muncul di sidebar untuk semua role.
