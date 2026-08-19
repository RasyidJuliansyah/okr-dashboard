// Import khusus untuk User, Team, Department dari SQLite ke MySQL.
// Menangani circular reference: User.teamId <-> Team.leaderId,
// dan Department.managerId -> User.id.
//
// Prasyarat:
//   1. DATABASE_URL di .env sudah mengarah ke MySQL (target).
//   2. Tabel sudah dibuat di MySQL (lewat prisma migrate dev, sudah kamu lakukan).
//   3. File JSON sudah diexport ke scripts/migration-data/{User,Team,Department}.json
//      (pakai perintah sqlite3 -json yang sudah dijalankan sebelumnya).
//
// Cara jalanin (dari folder backend):
//   npx ts-node scripts/import-user-team-dept.ts

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DATA_DIR = path.join(__dirname, 'migration-data');

function load<T = any>(table: string): T[] {
  const file = path.join(DATA_DIR, `${table}.json`);
  if (!fs.existsSync(file)) {
    console.warn(`File tidak ditemukan: ${file} — dilewati (dianggap kosong).`);
    return [];
  }
  const raw = fs.readFileSync(file, 'utf8').trim();
  return raw ? JSON.parse(raw) : [];
}

// SQLite bisa nyimpen DateTime sebagai epoch-ms (angka) ATAU string ISO,
// tergantung cara data itu awalnya ditulis. Fungsi ini handle dua-duanya.
function toDate(value: unknown): Date {
  if (value === null || value === undefined) return new Date();
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    // Kalau string berupa angka murni (epoch disimpan sebagai string), convert dulu
    if (/^\d+$/.test(value)) return new Date(Number(value));
    return new Date(value);
  }
  return new Date();
}

async function main() {
  const users = load('User');
  const teams = load('Team');
  const departments = load('Department');

  console.log(`Ditemukan: ${users.length} User, ${teams.length} Team, ${departments.length} Department`);

  // 1) Import User dulu, TANPA teamId (biar tidak bentrok sama Team yang belum ada)
  console.log('\n[1/4] Import User (tanpa teamId)...');
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role ?? 'TEAM',
        department: u.department ?? null,
        position: u.position ?? null,
        teamId: null,
        createdAt: toDate(u.createdAt),
      },
    });
  }
  console.log(`  -> ${users.length} user diimport.`);

  // 2) Import Team (leaderId sudah bisa nunjuk ke User yang barusan diimport)
  console.log('\n[2/4] Import Team...');
  for (const t of teams) {
    await prisma.team.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        name: t.name,
        managerId: t.managerId ?? null,
        leaderId: t.leaderId ?? null,
        department: t.department ?? null,
      },
    });
  }
  console.log(`  -> ${teams.length} team diimport.`);

  // 3) Sekarang Team sudah ada, baru update User.teamId
  console.log('\n[3/4] Update User.teamId...');
  let updatedCount = 0;
  for (const u of users) {
    if (u.teamId) {
      await prisma.user.update({ where: { id: u.id }, data: { teamId: u.teamId } });
      updatedCount++;
    }
  }
  console.log(`  -> ${updatedCount} user di-update teamId-nya.`);

  // 4) Import Department (managerId nunjuk ke User yang sudah ada)
  console.log('\n[4/4] Import Department...');
  for (const d of departments) {
    await prisma.department.upsert({
      where: { id: d.id },
      update: {},
      create: {
        id: d.id,
        name: d.name,
        value: d.value,
        managerId: d.managerId ?? null,
        createdAt: toDate(d.createdAt),
      },
    });
  }
  console.log(`  -> ${departments.length} department diimport.`);

  console.log('\n✅ Import selesai:');
  console.log({ users: users.length, teams: teams.length, departments: departments.length });
}

main()
  .catch((err) => {
    console.error('\n❌ Import gagal:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
