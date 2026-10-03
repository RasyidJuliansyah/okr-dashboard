import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { cascadeInitiativeToMonthlyKr } from "../src/controllers/initiative.controller";

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log("=== SEEDING CASCADE TEST DATA ===");

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const manager = await prisma.user.findFirst({ where: { role: "MANAGER" } });
  const leader = await prisma.user.findFirst({ where: { role: "LEADER" } });
  const team = (await prisma.team.findFirst({ where: { department: "TECHDEV" } })) || (await prisma.team.findFirst());
  const member = (await prisma.user.findFirst({ where: { email: "ulil@skolla.education" } })) || admin;

  if (!admin || !team || !member) throw new Error("Seed dependencies missing");

  // 1. Cleanup
  const oldTasks = await prisma.task.findMany({ where: { title: { contains: "[Cascade Test]" } }, select: { id: true } });
  const oldTaskIds = oldTasks.map((t) => t.id);
  if (oldTaskIds.length > 0) {
    await prisma.taskAssignment.deleteMany({ where: { taskId: { in: oldTaskIds } } });
    await prisma.taskKpi.deleteMany({ where: { taskId: { in: oldTaskIds } } });
    await prisma.task.deleteMany({ where: { id: { in: oldTaskIds } } });
  }

  const oldInits = await prisma.initiative.findMany({ where: { title: { contains: "[Cascade Test]" } }, select: { id: true } });
  const oldInitIds = oldInits.map((i) => i.id);
  if (oldInitIds.length > 0) {
    await prisma.initiativeKpi.deleteMany({ where: { initiativeId: { in: oldInitIds } } });
    await prisma.initiative.deleteMany({ where: { id: { in: oldInitIds } } });
  }

  const oldKrs = await prisma.keyResult.findMany({ where: { title: { contains: "[Cascade Test]" } }, select: { id: true } });
  const oldKrIds = oldKrs.map((k) => k.id);
  if (oldKrIds.length > 0) {
    await prisma.krDepartment.deleteMany({ where: { keyResultId: { in: oldKrIds } } });
    await prisma.krAssignment.deleteMany({ where: { keyResultId: { in: oldKrIds } } });
    await prisma.keyResult.deleteMany({ where: { id: { in: oldKrIds } } });
  }

  await prisma.objective.deleteMany({ where: { title: { contains: "[Cascade Test]" } } });
  await prisma.kpi.deleteMany({ where: { name: { contains: "[Cascade Test]" } } });

  // 2. Master KPIs
  const kpiDone = await prisma.kpi.create({
    data: { name: "[Cascade Test] KPI Uptime Platform (Done)", department: "TECHDEV", bscPerspective: "INTERNAL_PROCESS", unit: "%", defaultTarget: 100 },
  });
  const kpiProg = await prisma.kpi.create({
    data: { name: "[Cascade Test] KPI Query Speed (In Progress)", department: "TECHDEV", bscPerspective: "INTERNAL_PROCESS", unit: "%", defaultTarget: 100 },
  });
  const kpiOff = await prisma.kpi.create({
    data: { name: "[Cascade Test] KPI Tech Debt Removals (Off Track)", department: "TECHDEV", bscPerspective: "INTERNAL_PROCESS", unit: "%", defaultTarget: 100 },
  });

  // 3. Objective & KRs
  const obj = await prisma.objective.create({
    data: { title: "[Cascade Test] Objective Keandalan Sistem 2026", year: "2026", quarter: "Q4-2026", ownerId: admin.id },
  });

  const krDone = await prisma.keyResult.create({
    data: {
      objectiveId: obj.id,
      title: "[Cascade Test] KR 1: Uptime Platform ≥ 99.9% (Target: 100%)",
      targetValue: 100, currentValue: 0, unit: "%", targetType: "AT_LEAST", bscPerspective: "INTERNAL_PROCESS", month: "2026-10", status: "OFF_TRACK",
      departments: { create: [{ department: "TECHDEV" }] },
      assignments: { create: [{ userId: leader?.id || admin.id, assignedBy: admin.id, raciRole: "RESPONSIBLE" }] },
    },
  });

  const krProg = await prisma.keyResult.create({
    data: {
      objectiveId: obj.id,
      title: "[Cascade Test] KR 2: Latensi Query Dashboard < 200ms (Target: 100%)",
      targetValue: 100, currentValue: 0, unit: "%", targetType: "AT_LEAST", bscPerspective: "INTERNAL_PROCESS", month: "2026-10", status: "OFF_TRACK",
      departments: { create: [{ department: "TECHDEV" }] },
      assignments: { create: [{ userId: leader?.id || admin.id, assignedBy: admin.id, raciRole: "RESPONSIBLE" }] },
    },
  });

  const krOff = await prisma.keyResult.create({
    data: {
      objectiveId: obj.id,
      title: "[Cascade Test] KR 3: Debt Remediation & Code Coverage (Target: 100%)",
      targetValue: 100, currentValue: 0, unit: "%", targetType: "AT_LEAST", bscPerspective: "INTERNAL_PROCESS", month: "2026-10", status: "OFF_TRACK",
      departments: { create: [{ department: "TECHDEV" }] },
      assignments: { create: [{ userId: leader?.id || admin.id, assignedBy: admin.id, raciRole: "RESPONSIBLE" }] },
    },
  });
  // 4. Initiatives
  const initDone = await prisma.initiative.create({
    data: {
      keyResultId: krDone.id, teamId: team.id, ownerId: manager?.id || admin.id, assignedLeaderId: leader?.id || admin.id, assignedBy: admin.id,
      title: "[Cascade Test] Inisiatif 1: HA & Disaster Recovery (DONE)", targetValue: 100, currentValue: 100, unit: "%", status: "ON_TRACK", kanbanStatus: "DONE", weight: 1.0, sprintMonth: "2026-10",
    },
  });

  const initProg = await prisma.initiative.create({
    data: {
      keyResultId: krProg.id, teamId: team.id, ownerId: manager?.id || admin.id, assignedLeaderId: leader?.id || admin.id, assignedBy: admin.id,
      title: "[Cascade Test] Inisiatif 2: Redis Caching Engine (IN_PROGRESS)", targetValue: 100, currentValue: 60, unit: "%", status: "AT_RISK", kanbanStatus: "IN_PROGRESS", weight: 1.0, sprintMonth: "2026-10",
    },
  });

  const initOff = await prisma.initiative.create({
    data: {
      keyResultId: krOff.id, teamId: team.id, ownerId: manager?.id || admin.id, assignedLeaderId: leader?.id || admin.id, assignedBy: admin.id,
      title: "[Cascade Test] Inisiatif 3: Legacy Cleanup (OFF_TRACK)", targetValue: 100, currentValue: 15, unit: "%", status: "OFF_TRACK", kanbanStatus: "IN_PROGRESS", weight: 1.0, sprintMonth: "2026-10",
    },
  });

  await prisma.initiativeKpi.createMany({
    data: [
      { initiativeId: initDone.id, kpiId: kpiDone.id, targetValue: 100, currentValue: 100 },
      { initiativeId: initProg.id, kpiId: kpiProg.id, targetValue: 100, currentValue: 60 },
      { initiativeId: initOff.id, kpiId: kpiOff.id, targetValue: 100, currentValue: 15 },
    ],
  });

  // 5. Tasks
  const tD1 = await prisma.task.create({
    data: { initiativeId: initDone.id, assignedTeamMemberId: member.id, assignedBy: admin.id, sprintMonth: "2026-10", title: "[Cascade Test] Task 1A: Setup Multi-AZ Replicas", targetValue: 100, currentValue: 100, unit: "%", status: "ON_TRACK", kanbanStatus: "DONE" },
  });
  const tD2 = await prisma.task.create({
    data: { initiativeId: initDone.id, assignedTeamMemberId: member.id, assignedBy: admin.id, sprintMonth: "2026-10", title: "[Cascade Test] Task 1B: Failover Drill Verification", targetValue: 10, currentValue: 10, unit: "Skenario", status: "ON_TRACK", kanbanStatus: "DONE" },
  });

  const tP1 = await prisma.task.create({
    data: { initiativeId: initProg.id, assignedTeamMemberId: member.id, assignedBy: admin.id, sprintMonth: "2026-10", title: "[Cascade Test] Task 2A: Query Profiling (100%)", targetValue: 100, currentValue: 100, unit: "%", status: "ON_TRACK", kanbanStatus: "DONE" },
  });
  const tP2 = await prisma.task.create({
    data: { initiativeId: initProg.id, assignedTeamMemberId: member.id, assignedBy: admin.id, sprintMonth: "2026-10", title: "[Cascade Test] Task 2B: Redis Caching Integration (50%)", targetValue: 100, currentValue: 50, unit: "%", status: "AT_RISK", kanbanStatus: "IN_PROGRESS" },
  });
  const tP3 = await prisma.task.create({
    data: { initiativeId: initProg.id, assignedTeamMemberId: member.id, assignedBy: admin.id, sprintMonth: "2026-10", title: "[Cascade Test] Task 2C: Load Testing API (30%)", targetValue: 100, currentValue: 30, unit: "%", status: "OFF_TRACK", kanbanStatus: "IN_PROGRESS" },
  });

  const tO1 = await prisma.task.create({
    data: { initiativeId: initOff.id, assignedTeamMemberId: member.id, assignedBy: admin.id, sprintMonth: "2026-10", title: "[Cascade Test] Task 3A: Dependency Security Audit (30%)", targetValue: 100, currentValue: 30, unit: "%", status: "OFF_TRACK", kanbanStatus: "IN_PROGRESS" },
  });
  const tO2 = await prisma.task.create({
    data: { initiativeId: initOff.id, assignedTeamMemberId: member.id, assignedBy: admin.id, sprintMonth: "2026-10", title: "[Cascade Test] Task 3B: Deprecated Code Purge (0%)", targetValue: 100, currentValue: 0, unit: "%", status: "OFF_TRACK", kanbanStatus: "TODO" },
  });

  await prisma.taskKpi.createMany({
    data: [
      { taskId: tD1.id, kpiId: kpiDone.id, targetValue: 100, currentValue: 100 },
      { taskId: tD2.id, kpiId: kpiDone.id, targetValue: 10, currentValue: 10 },
      { taskId: tP1.id, kpiId: kpiProg.id, targetValue: 100, currentValue: 100 },
      { taskId: tP2.id, kpiId: kpiProg.id, targetValue: 100, currentValue: 50 },
      { taskId: tP3.id, kpiId: kpiProg.id, targetValue: 100, currentValue: 30 },
      { taskId: tO1.id, kpiId: kpiOff.id, targetValue: 100, currentValue: 30 },
      { taskId: tO2.id, kpiId: kpiOff.id, targetValue: 100, currentValue: 0 },
    ],
  });

  await prisma.taskAssignment.createMany({
    data: [
      { taskId: tD1.id, userId: member.id },
      { taskId: tD2.id, userId: member.id },
      { taskId: tP1.id, userId: member.id },
      { taskId: tP2.id, userId: member.id },
      { taskId: tP3.id, userId: member.id },
      { taskId: tO1.id, userId: member.id },
      { taskId: tO2.id, userId: member.id },
    ],
    skipDuplicates: true,
  });

  // 6. Cascade Rollup calculation
  await cascadeInitiativeToMonthlyKr(krDone.id);
  await cascadeInitiativeToMonthlyKr(krProg.id);
  await cascadeInitiativeToMonthlyKr(krOff.id);

  const resDone = await prisma.keyResult.findUnique({ where: { id: krDone.id } });
  const resProg = await prisma.keyResult.findUnique({ where: { id: krProg.id } });
  const resOff = await prisma.keyResult.findUnique({ where: { id: krOff.id } });

  console.log("=== CASCADE RESULT ===");
  console.log("1. KR Done       :", { current: resDone?.currentValue, target: resDone?.targetValue, status: resDone?.status });
  console.log("2. KR In Progress:", { current: resProg?.currentValue, target: resProg?.targetValue, status: resProg?.status });
  console.log("3. KR Off Track  :", { current: resOff?.currentValue, target: resOff?.targetValue, status: resOff?.status });
}

main().catch(console.error).finally(() => prisma.$disconnect());
