# Rencana setup skill global untuk PM dan vibe coding

Status: sudah dieksekusi untuk 6 skill dari zip dan 68 skill dari pm-skills. Disimpan sebagai acuan sebelum menambah skill lain.

## Tujuan

Punya satu set skill global di `~/.claude/skills/` yang bisa dipakai di semua project, untuk dua kebutuhan: kerja sebagai PM dan vibe coding.

## Pembagian peran

- Kerja sebagai growth product manager: pakai skill PM dari folder ini (PRD, user story, OKR, riset, prioritisasi, roadmap, eksperimen).
- Kerja vibe coding, project baru atau berjalan: ikuti `plan_vibe_coding.md` dan skill `vibe-coding`.
- Aturan ini juga dicatat di `~/.claude/CLAUDE.md` supaya Claude membacanya di setiap sesi dan project.

## Kondisi saat ini

Skill PM sudah terpasang dari `/Users/rasyidjuliansyah/Development/pm_skills/`:

- discovery-process
- jobs-to-be-done
- prioritization-advisor
- product-strategy-session
- roadmap-planning
- user-story

Selain itu ada 68 skill dari `product-on-purpose/pm-skills` (awalan define-, deliver-, develop-, discover-, foundation-, iterate-, measure-, tool-, utility-).

Skill vibe coding yang sudah ada sebelumnya (kebanyakan symlink ke `~/.agents/skills/`): impeccable, ponytail, webapp-testing, frontend-design, grill-me, caveman, find-skills, dan beberapa skill desain UI lain.

## Langkah pemasangan (dipakai ulang untuk skill baru)

1. Taruh zip atau folder skill baru di `pm_skills/`.
2. Lihat isi zip dulu (`unzip -l`). Ekstrak ke folder staging terpisah, jangan langsung ke folder skill.
3. Baca skrip apa pun yang ikut di dalamnya dan cari perintah yang mencurigakan (curl, wget, rm, eval, subprocess).
4. Pastikan file utamanya bernama `SKILL.md` (huruf besar semua). Paket PM tadi memakai `Skill.md`, jadi perlu diganti nama.
5. Salin ke `~/.claude/skills/<nama-skill>/`. Lewati kalau namanya sudah dipakai, lalu tanyakan dulu sebelum menimpa.
6. Mulai sesi baru atau restart VSCode supaya skill terbaca.

## Pemasangan lewat npx skills

Repo `product-on-purpose/pm-skills` berisi 68 skill dan sudah terpasang semuanya (Oktober 2026).

Perintah yang dipakai:

```
npx skills add product-on-purpose/pm-skills --list
npx skills add product-on-purpose/pm-skills -g -a claude-code -y --copy -s '*'
```

- `--list` menampilkan isi repo tanpa memasang apa pun. Jalankan ini dulu.
- `-g` memasang ke `~/.claude/skills/` (global). `--copy` menyalin file, tidak membuat symlink.
- `-s` memilih skill tertentu, misalnya `-s deliver-prd define-hypothesis`. `'*'` berarti semua.
- Pembaruan: `npx skills update -g`.
- Setelah pasang, cari pola berisiko di folder skill (curl, wget, rm -rf, eval, os.system). Pemasang sendiri memperingatkan bahwa skill berjalan dengan izin agent penuh.

Kalau daftar skill terasa terlalu panjang di tiap sesi, hapus yang jarang dipakai dengan `npx skills remove`. Skill `utility-pm-release-conductor`, `utility-pm-changelog-curator`, `utility-pm-skill-auditor` dan `utility-pm-workflow-*` untuk memelihara repo pm-skills itu sendiri, jadi kandidat pertama untuk dibuang.

## Hal yang perlu diputuskan sebelum menambah skill

- Nama kembar: beberapa skill PM juga ada versi plugin `anthropic-skills:` di sesi ini. Versi global dipanggil tanpa prefix. Kalau mau satu sumber saja, pilih salah satu.
- Referensi putus: beberapa skill menyebut skill lain yang tidak ada di paket, misalnya `skills/user-story-splitting/SKILL.md`. Cek apakah skill pendampingnya perlu ikut dipasang.
- Salin atau symlink: saat ini skill PM disalin langsung. Skill lama memakai symlink ke `~/.agents/skills/`. Samakan polanya kalau ingin satu tempat untuk mengelola semua.

## Daftar skill yang akan ditambah

Belum ditentukan. Isi di sini saat sudah siap:

- [ ] ...
- [ ] ...
