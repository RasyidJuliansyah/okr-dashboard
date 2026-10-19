# Plan vibe coding

Salin file ini ke project (misalnya `docs/PLAN.md`) setiap kali mulai sesi vibe coding. Isi bagian yang relevan, hapus sisanya. Kalau sesuatu belum diputuskan, tulis "belum diputuskan" dan jangan menebak.

Berdasarkan skill `vibe-coding` yang terpasang di `~/.claude/skills/vibe-coding/`.

## 0. Pilih jalur

- [ ] Project baru: kerjakan bagian A, lalu B sampai F.
- [ ] Project berjalan: kerjakan bagian A (versi ringkas), lalu B sampai F.
- [ ] Tugas kecil (satu bug, ganti teks): lewati A dan B, langsung ke D.

## A. Persiapan

### Project baru

Nama project:
Tanggal mulai:

Masalah yang diselesaikan (satu atau dua kalimat):

Pengguna dan apa yang mereka coba lakukan:

MVP, hanya yang wajib ada supaya berguna:
- [ ] Fitur 1, selesai kalau:
- [ ] Fitur 2, selesai kalau:

Sengaja ditunda (di luar MVP):

Fase 2 dan 3:

Tech stack (pilih yang populer, karena AI lebih akurat di stack yang banyak contohnya):
- Frontend:
- Backend:
- Database:
- Hosting:
- Alasan memilih:

Referensi: mockup, screenshot, atau contoh aplikasi yang jadi acuan.

Checklist awal:
- [ ] `git init` dan commit pertama
- [ ] `CLAUDE.md` dibuat dari `~/.claude/skills/vibe-coding/references/context-doc-template.md`
- [ ] `.env` masuk `.gitignore`, `.env.example` dibuat tanpa nilai
- [ ] Rencana ini sudah Anda baca dan setujui sebelum AI mulai menulis kode

### Project berjalan

Project dan branch:

Status git saat mulai (`git status`), harus bersih sebelum mulai fitur baru:

Konteks singkat yang perlu AI tahu (modul terkait, keputusan lama, jebakan yang pernah terjadi):

Checklist awal:
- [ ] `CLAUDE.md` masih sesuai kondisi sekarang (perintah, struktur folder, daftar "jangan lakukan")
- [ ] Tes yang ada lolos sebelum saya mulai (catat kalau ada yang sudah gagal dari awal)
- [ ] Sesi ini tidak berhubungan dengan pekerjaan sebelumnya? Kalau ya, buka sesi baru

## B. Tujuan sesi ini

Satu tujuan saja. Kalau ada lima permintaan, urutkan dan kerjakan satu per satu.

Tujuan:
Selesai kalau:
File atau modul yang kemungkinan tersentuh:
Yang tidak boleh diubah:

Kalau masalahnya rumit, minta AI paparkan dua atau tiga pendekatan beserta trade-off-nya, lalu pilih sebelum ada kode.

## C. Daftar tugas

Satu tugas per giliran. Centang setelah tes lolos dan sudah di-commit.

- [ ] Tugas 1:
- [ ] Tugas 2:
- [ ] Tugas 3:

## D. Siklus tiap tugas

1. Tulis prompt yang spesifik: sebut file, perilaku yang diharapkan, batasan, dan lampirkan mockup atau contoh kalau ada.
2. AI mengerjakan satu tugas.
3. Tinjau hasilnya. Untuk fitur pertama, periksa juga pola yang dipilih (struktur folder, penamaan, penanganan error), karena koreksi di sini murah.
4. Jalankan tes. Fitur baru datang dengan tes dasarnya.
5. Bug: tulis tes yang gagal dulu, baru perbaiki sampai lolos.
6. Commit dengan pesan yang menjelaskan apa dan kenapa, misalnya `feat(auth): tambah login email dan password`.

Template prompt:

```
Di [file], [masalah atau perilaku sekarang].
Ubah supaya [perilaku yang diinginkan].
Jangan ubah [hal yang harus tetap].
Lampiran: [mockup, contoh, atau file referensi].
```

## E. Kalau macet

- Error: minta AI menjelaskan penyebabnya dengan bahasa sederhana sebelum memperbaiki.
- Masalah belum jelas: tambah log untuk mempersempit, lalu hapus log itu setelah ketemu.
- Gagal tiga kali untuk masalah yang sama: berhenti. Tulis ringkasan (gejala, yang sudah dicoba, yang sudah diketahui), lalu buka sesi baru dengan ringkasan itu atau ganti pendekatan.

Catatan macet:

## F. Penutup sesi

- [ ] Semua tes lolos
- [ ] Semua perubahan sudah di-commit, working tree bersih
- [ ] Tidak ada secret di kode atau di riwayat git. Kalau sempat ter-commit, anggap bocor dan ganti (rotate)
- [ ] `CLAUDE.md` diperbarui kalau ada instruksi yang Anda ulang lebih dari sekali atau ada pelajaran baru
- [ ] Bagian "Jangan lakukan" ditambah kalau AI melakukan kesalahan yang sama berulang
- [ ] File yang membengkak atau mengurus banyak hal dicatat untuk sesi refactor (refactor hanya setelah tes lolos)

Sebelum dipakai orang lain atau di-deploy, minta audit keamanan: secret, validasi input di server, autentikasi dan otorisasi di tiap endpoint, pesan error yang membocorkan detail internal, dependency yang punya celah (`npm audit` atau `pip-audit`), CORS dan rate limiting.

Catatan dan pelajaran sesi ini (beri tanggal):
- [YYYY-MM-DD]

Mulai dari mana di sesi berikutnya:
