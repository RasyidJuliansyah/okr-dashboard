# PRD: Sprint Retrospective (Stop / Start / Continue)

Status: Diimplementasikan (menunggu uji manual dan deploy)
Halaman: `/retro`
API: `/api/retros`

## Masalah

Selama ini retrospektif sprint dikerjakan di luar aplikasi OKR, jadi masukan tim tidak tersimpan bersama data sprint. Fitur ini menyediakan satu board retro untuk setiap Sprint per Departemen di dalam dashboard. Isi board diperbarui hampir real-time.

## Lingkup

- Satu board per Sprint per Departemen, dijaga `@@unique([sprintId, departmentId])`.
- Tiga kolom: **Stop** (merah), **Start** (kuning), **Continue** (hijau). Tambahan satu panel **Mood**.
- Update live lewat polling 3 detik. Polling dilewati saat tab tersembunyi.
- Reaksi kartu memakai whitelist: 👍 🔥 🎉 💪 ❤️ 😂
- Mood memakai whitelist 16 emoji. Satu mood per user per board, dan bisa diganti.

### Di luar lingkup

Action items, GIF/AI, voting, timer, edit kartu, drag-drop, dan ekspor.

## Requirement Fungsional

| ID | Requirement |
|---|---|
| FR-1 | Semua user login boleh membaca board departemennya sendiri. ADMIN dan C_LEVEL boleh membaca board semua departemen. |
| FR-2 | Anggota departemen (TEAM, LEADER, MANAGER) boleh menambah kartu, memilih mood, dan memberi reaksi selama board berstatus OPEN. |
| FR-3 | ADMIN dan C_LEVEL hanya bisa membaca. C_LEVEL yang switch-context menjadi MANAGER tetap hanya bisa membaca. ADMIN yang impersonasi bertindak sesuai role hasil impersonasi. |
| FR-4 | Board hanya bisa dibuka atau ditutup oleh MANAGER atau LEADER dari departemen yang sama (atau ADMIN lewat impersonasi). |
| FR-5 | Isi kartu wajib diisi dan maksimal 500 karakter. Kolom yang valid hanya `STOP`, `START`, `CONTINUE`. |
| FR-6 | Nama dan inisial penulis ditampilkan di setiap kartu. Isi kartu dirender sebagai teks biasa, tidak lewat `v-html`. |
| FR-7 | Kartu bisa dihapus oleh penulisnya atau oleh MANAGER/LEADER departemen tersebut. |
| FR-8 | Setiap operasi tulis pada board berstatus CLOSED ditolak dengan HTTP 409. |
| FR-9 | Departemen user dibaca dari DB setiap request, bukan dari JWT. |
| FR-10 | Menekan emoji reaksi yang sama untuk kedua kalinya akan menghapus reaksi tersebut (toggle). |
| FR-11 | Board yang sudah CLOSED bisa dibuka ulang. |
| FR-12 | Setiap aksi buka, buka ulang, dan tutup dicatat di `audit_log` dengan `entityType = RETRO_BOARD` dan action `RETRO_OPEN`, `RETRO_REOPEN`, atau `RETRO_CLOSE`. Riwayat ini bisa dilihat dari panel Riwayat di board dan dari filter di Audit Logs. |

## Data

Ada 4 tabel baru (`deploy_retro_tables.sql`): `retro_board`, `retro_card`, `retro_mood`, dan `retro_reaction`. Semua memakai utf8mb4. Kolom emoji memakai `utf8mb4_bin` supaya unique key membandingkan emoji secara byte.

## Asumsi terbuka

- Untuk LEADER, departemen ditentukan dari `user.departmentId`, dengan fallback ke `team.departmentId`. Belum dipastikan apakah satu LEADER bisa memegang lebih dari satu departemen. Kalau ternyata bisa, aturan ini perlu ditinjau ulang.
- Polling 3 detik dipilih karena aplikasi belum punya websocket. Kalau beban server mulai jadi masalah, pertimbangkan pindah ke SSE.
