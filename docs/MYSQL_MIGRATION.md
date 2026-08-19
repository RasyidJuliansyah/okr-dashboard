# Migrasi Database: SQLite -> MySQL

Checklist eksekusi migrasi database dari SQLite (dev) ke MySQL (prod). Schema Prisma
(`backend/src/prisma/schema.prisma`) sudah diupdate ke provider `mysql`, dan script
migrasi data sudah disiapkan di `backend/scripts/`.

> **Catatan penting:** dev server lokal saat ini masih jalan di atas SQLite. Menjalankan
> `prisma generate` / `prisma migrate` terhadap schema yang sekarang (provider mysql)
> akan mengganti Prisma Client aktif dan membuat dev lokal berhenti berfungsi sampai
> `DATABASE_URL` diarahkan ke MySQL. Lakukan migrasi ini di environment yang memang
> sudah siap pindah ke MySQL (atau branch/copy terpisah), bukan langsung di tengah sesi
> dev yang sedang berjalan.

## 1. Siapkan MySQL prod

- [ ] Dapatkan connection string dari provider MySQL: `mysql://USER:PASSWORD@HOST:3306/DATABASE_NAME`
- [ ] Pastikan database kosong sudah dibuat (schema akan dibuat otomatis oleh Prisma)

## 2. Export data lama dari SQLite

```bash
cd backend
npm run migrate:export
```

- [ ] Cek output — file JSON per tabel muncul di `backend/scripts/migration-data/`
- [ ] Cek jumlah rows tiap tabel di output terminal masuk akal (sesuai data yang kamu tahu ada)

## 3. Set koneksi ke MySQL

- [ ] Backup `backend/.env` yang lama (isi SQLite-nya) ke tempat aman, untuk jaga-jaga rollback ke dev lokal
- [ ] Update `backend/.env`:
  ```
  DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE_NAME"
  ```

## 4. Buat schema di MySQL

```bash
npx prisma generate
npx prisma migrate deploy
```

- [ ] Pastikan tidak ada error, semua tabel berhasil dibuat di MySQL

## 5. Import data lama ke MySQL

```bash
npm run migrate:import
```

- [ ] Cek ringkasan jumlah rows di akhir output — harus sama dengan hasil export di step 2

## 6. Verifikasi

- [ ] Cek beberapa tabel penting langsung dari MySQL client (jumlah User, Team, Initiative, dst)
- [ ] Jalankan backend (`npm run dev`) dengan `DATABASE_URL` MySQL
- [ ] Login, buka halaman `/initiatives` dan `/member-achievement`, pastikan data & relasi (owner, team, KPI) tampil benar

## 7. Update deployment (docker-compose)

- [ ] Buat file `.env` di root project (sejajar `docker-compose.yml`), isi sesuai `.env.example`:
  ```
  DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE_NAME
  ```
- [ ] Jangan commit file `.env` ini (sudah masuk `.gitignore`)
- [ ] Restart/redeploy container backend

## 8. Rotasi secret (rekomendasi, terpisah dari migrasi DB)

- [ ] `backend/.env` saat ini ter-track di git dengan `JWT_SECRET` asli — ganti ke value baru yang random
- [ ] Pertimbangkan `git rm --cached backend/.env` supaya tidak ter-commit lagi ke depannya

## 9. Setelah MySQL prod jalan normal

- [ ] Putuskan apakah dev lokal ikut pindah ke MySQL juga (disarankan, supaya schema tidak drift), atau tetap SQLite terpisah dengan schema file sendiri

## Referensi File

| File                               | Fungsi                                                                       |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| `backend/src/prisma/schema.prisma` | Schema Prisma, provider sudah `mysql`                                        |
| `backend/scripts/export-sqlite.sh` | Export semua tabel SQLite ke JSON                                            |
| `backend/scripts/import-mysql.ts`  | Import JSON ke MySQL, urutan sesuai dependency FK                            |
| `.env.example`                     | Contoh `DATABASE_URL` untuk `docker-compose.yml`                             |
| `backend/.env.example`             | Contoh `DATABASE_URL` untuk backend (sqlite dev vs mysql prod)               |
| `docker-compose.yml`               | Backend service sekarang baca `DATABASE_URL` dari env, bukan hardcode sqlite |
