---
name: vibe-coding
description: Alur kerja vibe coding yang terstruktur untuk membangun aplikasi bersama AI, mulai dari perencanaan bertahap, dokumen konteks (CLAUDE.md dan sejenisnya), prompting, manajemen konteks, debugging, Git, testing, sampai keamanan. Gunakan skill ini setiap kali user ingin membangun aplikasi, MVP, prototipe, atau fitur baru dengan bantuan AI, menyebut "vibe coding", Claude Code, Cursor, Windsurf, Lovable, v0, atau Replit, minta dibuatkan CLAUDE.md atau rules file, mengeluh hasil coding AI makin berantakan atau error terus, atau minta tips prompting untuk coding. Pakai juga ketika user langsung minta "bikinin aplikasi X dari nol", walaupun kata "vibe coding" tidak disebut.
---

# Vibe Coding

Skill ini merangkum alur vibe coding dari roadmap.sh menjadi langkah kerja yang bisa langsung dijalankan.

Ada dua cara memakainya:

1. **Kamu sedang membangun bersama user.** Jalankan alur di bawah sebagai kebiasaan kerjamu sendiri: rencanakan dulu, kerjakan satu tugas per langkah, tulis tes, commit, dan jaga dokumen konteks.
2. **User minta saran atau coaching.** Jelaskan fase yang relevan dengan situasinya. Jangan menuangkan seluruh isi skill sekaligus. Kalau user sedang macet debugging, cukup bahas bagian debugging.

Satu prinsip yang mendasari semuanya: AI cenderung mengambil jalan paling gampang. Kode ditempel di ujung file, file terus membengkak, pembersihan dilewati. Kebiasaan buruk yang lolos di awal akan ditiru di setiap iterasi berikutnya, jadi kerusakannya menumpuk cepat. Hampir semua aturan di sini ada untuk melawan kecenderungan itu.

## Fase 1: Rencanakan sebelum coding

Untuk proyek baru atau fitur besar, jangan langsung menulis kode.

- Bantu user memperjelas idenya. Tanyakan masalah apa yang mau diselesaikan, siapa penggunanya, dan apa yang benar-benar wajib ada di versi pertama.
- Pecah jadi MVP lalu fase-fase berikutnya. Membangun semuanya sekaligus hampir selalu menghasilkan kode yang sulit diperbaiki.
- Minta contoh konkret kalau ada: mockup, screenshot, sketsa, atau potongan kode referensi. Contoh visual jauh lebih jelas daripada deskripsi panjang.
- Tulis hasilnya ke dokumen rencana (misalnya `docs/PLAN.md`) memakai template di `references/plan-template.md`, lalu minta user mengonfirmasi sebelum mulai membangun. Dokumen ini jadi pegangan di sesi-sesi berikutnya.

Tugas kecil seperti memperbaiki satu bug atau mengganti teks tombol tidak perlu fase ini.

## Fase 2: Tech stack dan standar sejak awal

- **Sarankan stack yang populer**, bukan yang baru atau niche. Alasannya: model AI lebih banyak melihat contoh stack populer, sehingga lebih jarang mengarang API yang tidak ada, dan komunitasnya lebih besar kalau user butuh bantuan. Kalau user tetap memilih stack niche, hormati pilihannya tapi sampaikan risikonya.
- **Buat dokumen konteks** dari template `references/context-doc-template.md`. Nama filenya tergantung tool: `CLAUDE.md` untuk Claude Code, sedangkan tool lain punya konvensi sendiri (cek dokumentasi tool tersebut karena nama file dan fiturnya cukup sering berubah). Isi dengan stack, struktur folder, preferensi gaya kode, perintah untuk menjalankan dan mengetes, serta daftar hal yang tidak boleh dilakukan.
- **Jaga kode tetap modular.** Pilih modul dan file kecil dengan tanggung jawab yang jelas. Patokan kasarnya: kalau satu file sudah ratusan baris atau mengurus beberapa hal sekaligus, itu tanda perlu dipecah.
- **Minta user meninjau output awal.** Setelah fitur pertama jadi, tunjukkan pola yang kamu pilih (struktur folder, penamaan, cara menangani error, arsitektur data) dan tanyakan apakah sudah sesuai. Koreksi di tahap ini murah. Koreksi setelah sepuluh fitur mahal.

## Fase 3: Bangun satu langkah per langkah

- **Satu tugas per giliran.** Kalau user memberi lima permintaan sekaligus, usulkan urutannya lalu kerjakan satu per satu. Lima perubahan sekaligus susah dites dan susah di-revert.
- **Pikirkan dulu untuk masalah rumit.** Sebelum menulis kode untuk masalah yang kompleks, paparkan dua atau tiga pendekatan beserta trade-off-nya, lalu pilih bersama user.
- **Tes secara default.** Setiap fitur baru datang bersama tes dasarnya. Untuk alur penting (login, checkout, simpan data), pertimbangkan tes E2E. Kalau user tertarik, tawarkan TDD: tulis tes dulu, baru implementasinya.
- **Bug ditangani dengan tes yang gagal dulu.** Saat menemukan bug, tulis tes yang mereproduksi bug itu, pastikan tesnya gagal, baru perbaiki sampai tesnya lolos. Dengan begitu bug yang sama tidak diam-diam kembali.
- **Commit setelah setiap tugas yang berhasil.** Mulai fitur baru dari working tree Git yang bersih. Setelah fitur atau perbaikan berjalan dan tesnya lolos, buat commit dengan pesan yang menjelaskan apa yang berubah dan kenapa. Kalau perlu mundur, pakai Git (`git revert`, `git reset`, atau kembali ke commit tertentu), jangan mengandalkan fitur undo bawaan tool AI. Kamu boleh menjalankan perintah `git` dan GitHub CLI (`gh`) untuk user kalau tool-nya tersedia, tapi minta konfirmasi untuk perintah yang menghapus riwayat atau push ke remote.

Format pesan commit yang disarankan:

```
feat(auth): tambah login dengan email dan password

Validasi input di sisi server dan simpan sesi di cookie httpOnly.
```

## Fase 4: Debugging

- **Jelaskan dulu, baru perbaiki.** Saat ada error, baca pesan error lengkapnya dan kode yang terkait, lalu jelaskan penyebabnya dengan bahasa sederhana sebelum menerapkan perbaikan. Tujuannya supaya user paham apa yang rusak, bukan sekadar menerima patch. Kalau user terlihat bingung, ulangi penjelasannya dengan lebih sederhana.
- **Tambahkan log untuk mempersempit masalah**, lalu hapus log sementara itu setelah masalahnya ketemu.
- **Kalau error tidak hilang**, buat daftar kemungkinan penyebab yang diurutkan dari yang paling mungkin, lalu periksa satu per satu.
- **Pakai tool yang ada.** Kalau tersedia MCP seperti Playwright untuk browser, gunakan untuk melihat langsung apa yang terjadi di halaman alih-alih menebak.
- **Aturan tiga kali gagal.** Kalau tiga percobaan perbaikan untuk masalah yang sama tidak berhasil, berhenti. Tulis ringkasan singkat: gejala, apa saja yang sudah dicoba, dan apa yang sudah diketahui. Lalu sarankan user membuka sesi baru dengan ringkasan itu, atau mencoba pendekatan yang benar-benar berbeda. Konteks yang penuh percobaan gagal cenderung menyeret ke kesalahan yang sama.

## Fase 5: Rawat codebase dan konteks

- **Sesi refactor rutin.** Setelah beberapa fitur, atau saat file mulai membengkak, usulkan sesi refactor: pecah modul besar, hapus kode mati, perbaiki bagian yang lambat. Pastikan semua tes lolos sebelum dan sesudah refactor. Refactor tanpa tes itu berjudi.
- **Perbarui dokumen konteks.** Dua pemicu utamanya: user mengulang instruksi yang sama lebih dari sekali, atau sebuah sesi menghasilkan pelajaran yang berguna (misalnya library tertentu ternyata bermasalah). Tawarkan untuk mencatatnya di dokumen konteks, termasuk daftar "jangan lakukan" dari kesalahan sebelumnya.
- **Jaga kebersihan konteks.** Untuk tugas yang tidak berhubungan dengan pekerjaan sebelumnya, sarankan sesi baru. Konteks yang bersih memberi hasil lebih baik dan menghemat token. Context window yang panjang berguna untuk tugas yang memang butuh banyak file sekaligus, tapi jangan dijadikan tempat menimbun riwayat yang tidak relevan.
- **Pakai subagent kalau tersedia** untuk pekerjaan yang bisa dipisah, seperti menelusuri codebase atau riset dokumentasi, supaya konteks utama tidak penuh.

## Keamanan (berlaku di semua fase)

- **Jangan pernah menulis secret langsung di kode.** Password, API key, token, dan connection string masuk ke environment variable. Buat `.env.example` berisi nama variabel tanpa nilai, dan pastikan `.env` ada di `.gitignore`.
- **Kalau menemukan secret yang sudah tertulis di kode**, beri tahu user, pindahkan ke environment variable, dan ingatkan bahwa secret yang sudah pernah di-commit harus dianggap bocor dan perlu diganti (rotate), karena tetap tersimpan di riwayat Git.
- **Tawarkan audit keamanan** sebelum aplikasi dipakai orang lain atau di-deploy. Minimal periksa: secret di kode dan riwayat Git, validasi input di sisi server, autentikasi dan otorisasi di setiap endpoint, pesan error yang membocorkan detail internal, dependency yang punya celah yang diketahui (misalnya lewat `npm audit` atau `pip-audit`), serta pengaturan CORS dan rate limiting.

## Saat melatih user menulis prompt

Kalau user minta tips prompting, atau prompt-nya terlalu kabur untuk dikerjakan dengan baik, bagikan prinsip ini secukupnya:

- Spesifik lebih baik daripada umum. Sebutkan file, perilaku yang diharapkan, dan batasannya.
- Satu tugas per prompt.
- Sertakan bahan pendukung: mockup, file referensi, contoh output.
- Sebutkan apa yang tidak boleh dilakukan, berdasarkan kesalahan di sesi sebelumnya.
- Framing "bertindaklah sebagai..." bisa membantu untuk tugas tertentu, misalnya "bertindaklah sebagai UX researcher dan tinjau alur onboarding ini".
- Minta AI berpikir atau brainstorming dulu sebelum masalah yang rumit.
- Manfaatkan skill buatan orang lain kalau ada yang cocok.

Contoh perbaikan prompt:

> Kurang baik: "Benerin halaman login dong, jelek."
>
> Lebih baik: "Di `src/pages/Login.tsx`, tombol submit masih aktif saat form kosong. Nonaktifkan tombol sampai email dan password terisi, tampilkan pesan error di bawah field yang salah, dan jangan ubah styling yang sudah ada."

## Tentang pilihan tool

Roadmap sumber membagi tool menjadi dua kelompok: agen AI untuk coding umum (Claude Code, Gemini, ChatGPT, Windsurf, Cursor) dan tool yang fokus ke frontend (v0, Lovable, Replit). Kalau user bertanya tool mana yang cocok, sesuaikan dengan kebutuhannya, dan ingatkan bahwa fitur serta harga tool-tool ini cepat berubah sehingga perlu dicek ke situs resminya.

## File pendukung

- `references/plan-template.md`: template dokumen rencana untuk Fase 1.
- `references/context-doc-template.md`: template CLAUDE.md atau dokumen konteks sejenis untuk Fase 2 dan 5.
