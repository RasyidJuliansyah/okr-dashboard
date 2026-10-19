# Template Dokumen Konteks

Dipakai di Fase 2 untuk membuat `CLAUDE.md` (Claude Code) atau file konteks sejenis di tool lain. Dokumen ini dibaca AI di awal setiap sesi, jadi isinya harus singkat, konkret, dan selalu terbaru. Prioritaskan instruksi yang bisa langsung dijalankan daripada penjelasan panjang.

Kapan memperbaruinya:
- User mengulang instruksi yang sama lebih dari sekali.
- Sebuah sesi menghasilkan pelajaran baru (bug yang tidak terduga, library yang bermasalah, pola yang ternyata lebih baik).
- Ada keputusan arsitektur atau perubahan stack.

```markdown
# [Nama Proyek]

Ringkasan satu paragraf: aplikasi ini apa dan untuk siapa. Rencana lengkap ada di docs/PLAN.md.

## Stack
- Bahasa dan framework (beserta versi utama)
- Database
- Library penting

## Perintah
- Install: `...`
- Jalankan dev: `...`
- Tes: `...`
- Lint/format: `...`

## Struktur folder
- `src/...`: penjelasan singkat
- `tests/...`: penjelasan singkat

## Gaya kode
- Konvensi penamaan
- Cara menangani error
- Preferensi lain (misalnya: functional component, tanpa default export)
- Jaga file tetap kecil dan modular; pecah file yang mulai mengurus banyak hal

## Alur kerja
- Kerjakan satu tugas per langkah
- Setiap fitur baru disertai tes; bug diperbaiki dengan menulis tes yang gagal dulu
- Commit setelah setiap tugas yang berhasil, dengan pesan yang menjelaskan apa dan kenapa
- Secret selalu lewat environment variable, tidak pernah ditulis di kode

## Jangan lakukan
Daftar kesalahan yang pernah terjadi di sesi sebelumnya, beserta alasannya.
- Jangan ... karena ...

## Catatan dan pelajaran
Hal yang ditemukan selama pengembangan, diberi tanggal.
- [YYYY-MM-DD] ...
```
