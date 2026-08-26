Ringkasan Masalah & Solusi Deployment
Root cause: Kode backend (initiative.controller.ts) sudah pakai field documentationLink/link, tapi schema.prisma belum mendefinisikannya → Prisma generate gagal cocok tipe → tsc error saat npm run build di Docker. Ditambah lagi, database production ternyata masih pakai skema lama (tabel Kpi/KpiAssignment/KpiUpdate, bukan Task).

✅ Sudah selesai (di kode)
Update schema.prisma — tambah field documentationLink (Task, Initiative) dan link (TaskUpdate, InitiativeUpdate). ✔ committed & pushed ke branch assign-task-teams-.
Verifikasi build — npx prisma generate + npx tsc --noEmit lokal sudah lolos tanpa error. ✔
File migration SQL dibuat & di-commit: backend/src/prisma/migrations/20260826011725_add_documentation_links/migration.sql.
⏳ Belum selesai (di database production) — urutan kerjakan
Backup dulu tabel lama:

mysqldump -h <host> -P <port> -u <user> -p <db> Kpi KpiAssignment KpiUpdate > backup_kpi_tables.sql
Cek nama index existing (untuk sesuaikan step rename index):

SHOW INDEX FROM KpiAssignment;
SHOW INDEX FROM KpiUpdate;
Jalankan rename_kpi_to_task.sql ke production:
Rename Kpi→Task, KpiAssignment→TaskAssignment, KpiUpdate→TaskUpdate (data tetap aman)
Rename kolom kpiId→taskId
Tambah kolom Task.weight, Task.documentationLink, TaskUpdate.link
Cek apakah Initiative/InitiativeUpdate sudah punya kolom documentationLink/link:

DESCRIBE Initiative;
DESCRIBE InitiativeUpdate;
Kalau belum ada, jalankan add_documentation_links.sql (skip baris yang tabelnya sudah punya kolom itu dari step 6).
🚀 Deploy
Pastikan branch/commit yang di-deploy sudah termasuk perubahan schema.prisma (sudah ✔ ter-push).
Trigger deploy ulang di server — proses npx prisma generate + npm run build di Docker seharusnya sukses sekarang.
Setelah container jalan, smoke test: submit update di Task dan Initiative dari UI, pastikan tidak ada error Unknown column.
Belum di-cross out: file add_task_tables.sql (skenario "tabel belum ada sama sekali") sudah tidak relevan lagi karena ternyata tabelnya ada tapi dengan nama lama — mau saya hapus?
