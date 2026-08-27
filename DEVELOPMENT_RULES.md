# DEVELOPMENT & DB MIGRATION RULES

# (ATURAN PENGEMBANGAN & UPDATE DATABASE)

> [!IMPORTANT]
> **ATURAN UTAMA UPDATE DATABASE PRODUCTION:**
> Mulai sesi setelah tanggal 2026-08-27, untuk setiap perubahan/improvement database (DB):
>
> 1. **TIDAK MENGGUNAKAN PRISMA MIGRATE DI PRODUCTION**
>    - Jangan menjalankan `npx prisma migrate dev` atau `npx prisma db push` langsung menargetkan database MySQL Production.
>    - Jangan mengandalkan auto-deploy migration Prisma di server production.
> 2. **LOCAL & PRODUCTION WAJIB MENGGUNAKAN MYSQL (STOP SQLITE & DEV.DB)**
>    - **Dilarang keras** menggunakan SQLite (`dev.db`, `prod.db`) baik di lokal maupun server production.
>    - Environment lokal menggunakan MySQL dengan **Host: `127.0.0.1`** dan **Port: `3307`**.
> 3. **UPDATE DATABASE LANGSUNG VIA SQL SCRIPT**
>    - Setiap ada perubahan schema di `schema.prisma` lokal, buat script SQL alterasi manual (seperti `ALTER TABLE`, `CREATE TABLE` standar).
>    - **Sebelum deploy, buat dokumen PLAN resmi dan ingatkan user untuk melakukan update database manual via DBeaver menggunakan SQL script yang telah disediakan.**
>    - Eksekusi perubahan database tersebut **langsung ke MySQL Production** menggunakan DBeaver atau client database sejenis.
>    - Baru setelah database production ter-update secara manual, deploy kode backend terbaru.
> 4. **PROSES DEPLOY & SYNC MANUAL**
>    - Upload source code hasil update ke server menggunakan **FileZilla**.
>    - Lakukan rebuild container backend menggunakan **Termius** via `docker compose up --build -d`.

---

## Riwayat Perubahan Terakhir (2026-08-27)

1. Penambahan tabel `AnnualKeyResult`.
2. Penambahan kolom `annualKeyResultId`, `month`, `monthWeight`, `isManualOverride` di tabel `KeyResult`.
3. Penambahan kolom `status`, `reviewedBy`, `reviewedAt` di tabel `InitiativeUpdate`.
4. Penambahan kolom `managerId` di tabel `Department`.
5. Semua migrasi di atas telah sukses di-deploy ke MySQL Production dan berstatus sync.
