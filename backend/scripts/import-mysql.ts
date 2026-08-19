// Imports the JSON files produced by export-sqlite.sh into the MySQL
// database pointed to by DATABASE_URL, preserving original ids and the
// User <-> Team circular reference.
//
// Usage:
//   1. Point DATABASE_URL (backend/.env) at the target MySQL database.
//   2. npx prisma migrate deploy   (creates empty schema on MySQL)
//   3. npx ts-node scripts/import-mysql.ts

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DATA_DIR = path.join(__dirname, 'migration-data');

function load<T = any>(table: string): T[] {
  const file = path.join(DATA_DIR, `${table}.json`);
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, 'utf8').trim();
  return raw ? JSON.parse(raw) : [];
}

// SQLite stores DateTime as epoch-ms integers; MySQL/Prisma wants JS Date.
function toDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  return new Date(Number(value));
}

async function main() {
  const users = load('User');
  const teams = load('Team');
  const departments = load('Department');
  const objectives = load('Objective');
  const keyResults = load('KeyResult');
  const krAssignments = load('KrAssignment');
  const krDepartments = load('KrDepartment');
  const krUpdates = load('KrUpdate');
  const causalLinks = load('CausalLink');
  const initiatives = load('Initiative');
  const kpis = load('Kpi');
  const kpiAssignments = load('KpiAssignment');
  const kpiUpdates = load('KpiUpdate');

  console.log('Importing Users (without teamId, resolved after Teams exist)...');
  if (users.length) {
    await prisma.user.createMany({
      data: users.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role,
        department: u.department,
        position: u.position,
        teamId: null, // set after teams are inserted, avoids circular FK
        createdAt: toDate(u.createdAt)!,
      })),
      skipDuplicates: true,
    });
  }

  console.log('Importing Teams...');
  if (teams.length) {
    await prisma.team.createMany({
      data: teams.map((t: any) => ({
        id: t.id,
        name: t.name,
        managerId: t.managerId,
        leaderId: t.leaderId,
        department: t.department,
      })),
      skipDuplicates: true,
    });
  }

  console.log('Restoring User.teamId...');
  for (const u of users) {
    if (u.teamId) {
      await prisma.user.update({ where: { id: u.id }, data: { teamId: u.teamId } });
    }
  }

  console.log('Importing Departments...');
  if (departments.length) {
    await prisma.department.createMany({
      data: departments.map((d: any) => ({
        id: d.id,
        name: d.name,
        value: d.value,
        managerId: d.managerId,
        createdAt: toDate(d.createdAt)!,
      })),
      skipDuplicates: true,
    });
  }

  console.log('Importing Objectives...');
  if (objectives.length) {
    await prisma.objective.createMany({
      data: objectives.map((o: any) => ({
        id: o.id,
        title: o.title,
        description: o.description,
        quarter: o.quarter,
        ownerId: o.ownerId,
        createdAt: toDate(o.createdAt)!,
      })),
      skipDuplicates: true,
    });
  }

  console.log('Importing KeyResults...');
  if (keyResults.length) {
    await prisma.keyResult.createMany({
      data: keyResults.map((k: any) => ({
        id: k.id,
        objectiveId: k.objectiveId,
        title: k.title,
        targetValue: k.targetValue,
        currentValue: k.currentValue,
        unit: k.unit,
        bscPerspective: k.bscPerspective,
        status: k.status,
        createdAt: toDate(k.createdAt)!,
        updatedAt: toDate(k.updatedAt)!,
      })),
      skipDuplicates: true,
    });
  }

  console.log('Importing KrAssignments...');
  if (krAssignments.length) {
    await prisma.krAssignment.createMany({
      data: krAssignments.map((a: any) => ({
        id: a.id,
        keyResultId: a.keyResultId,
        userId: a.userId,
        assignedBy: a.assignedBy,
        assignedAt: toDate(a.assignedAt)!,
        raciRole: a.raciRole,
      })),
      skipDuplicates: true,
    });
  }

  console.log('Importing KrDepartments...');
  if (krDepartments.length) {
    await prisma.krDepartment.createMany({
      data: krDepartments.map((d: any) => ({
        id: d.id,
        keyResultId: d.keyResultId,
        department: d.department,
        createdAt: toDate(d.createdAt)!,
      })),
      skipDuplicates: true,
    });
  }

  console.log('Importing KrUpdates...');
  if (krUpdates.length) {
    await prisma.krUpdate.createMany({
      data: krUpdates.map((u: any) => ({
        id: u.id,
        keyResultId: u.keyResultId,
        oldValue: u.oldValue,
        newValue: u.newValue,
        note: u.note,
        updatedBy: u.updatedBy,
        updatedAt: toDate(u.updatedAt)!,
      })),
      skipDuplicates: true,
    });
  }

  console.log('Importing CausalLinks...');
  if (causalLinks.length) {
    await prisma.causalLink.createMany({
      data: causalLinks.map((c: any) => ({
        id: c.id,
        sourceKrId: c.sourceKrId,
        targetKrId: c.targetKrId,
        relationship: c.relationship,
        note: c.note,
        createdBy: c.createdBy,
        createdAt: toDate(c.createdAt)!,
      })),
      skipDuplicates: true,
    });
  }

  console.log('Importing Initiatives...');
  if (initiatives.length) {
    await prisma.initiative.createMany({
      data: initiatives.map((i: any) => ({
        id: i.id,
        keyResultId: i.keyResultId,
        teamId: i.teamId,
        ownerId: i.ownerId,
        title: i.title,
        description: i.description,
        targetValue: i.targetValue,
        currentValue: i.currentValue,
        achievedValue: i.achievedValue,
        unit: i.unit,
        status: i.status,
        kanbanStatus: i.kanbanStatus,
        weight: i.weight,
        startDate: i.startDate ? toDate(i.startDate) : null,
        dueDate: i.dueDate ? toDate(i.dueDate) : null,
        sprintMonth: i.sprintMonth,
        createdAt: toDate(i.createdAt)!,
        updatedAt: toDate(i.updatedAt)!,
      })),
      skipDuplicates: true,
    });
  }

  console.log('Importing Kpis...');
  if (kpis.length) {
    await prisma.kpi.createMany({
      data: kpis.map((k: any) => ({
        id: k.id,
        initiativeId: k.initiativeId,
        title: k.title,
        targetValue: k.targetValue,
        currentValue: k.currentValue,
        unit: k.unit,
        status: k.status,
        createdAt: toDate(k.createdAt)!,
        updatedAt: toDate(k.updatedAt)!,
      })),
      skipDuplicates: true,
    });
  }

  console.log('Importing KpiAssignments...');
  if (kpiAssignments.length) {
    await prisma.kpiAssignment.createMany({
      data: kpiAssignments.map((a: any) => ({
        id: a.id,
        kpiId: a.kpiId,
        userId: a.userId,
        assignedAt: toDate(a.assignedAt)!,
      })),
      skipDuplicates: true,
    });
  }

  console.log('Importing KpiUpdates...');
  if (kpiUpdates.length) {
    await prisma.kpiUpdate.createMany({
      data: kpiUpdates.map((u: any) => ({
        id: u.id,
        kpiId: u.kpiId,
        oldValue: u.oldValue,
        newValue: u.newValue,
        note: u.note,
        submittedBy: u.submittedBy,
        status: u.status,
        reviewedBy: u.reviewedBy,
        reviewNote: u.reviewNote,
        reviewedAt: u.reviewedAt ? toDate(u.reviewedAt) : null,
        createdAt: toDate(u.createdAt)!,
      })),
      skipDuplicates: true,
    });
  }

  console.log('\nImport complete:');
  console.log({
    users: users.length,
    teams: teams.length,
    departments: departments.length,
    objectives: objectives.length,
    keyResults: keyResults.length,
    krAssignments: krAssignments.length,
    krDepartments: krDepartments.length,
    krUpdates: krUpdates.length,
    causalLinks: causalLinks.length,
    initiatives: initiatives.length,
    kpis: kpis.length,
    kpiAssignments: kpiAssignments.length,
    kpiUpdates: kpiUpdates.length,
  });
}

main()
  .catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
