import { PrismaClient } from "@prisma/client";
import { logAudit } from "../utils/auditLogger";

const prisma = new PrismaClient();

const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export interface SprintGenerationResult {
  createdCount: number;
  existingCount: number;
  sprints: any[];
}

/**
 * Generate 13 sprints starting from Sprint September 2026 (21 Aug - 20 Sep 2026)
 * up to Sprint September 2027.
 * Sprint cycle: 21st of month (M-1) to 20th of month M.
 */
export async function generateYearlySprints(baseYear = 2026): Promise<SprintGenerationResult> {
  const sprintsToCreate = [
    { month: 9, year: 2026, startM: 8, startY: 2026, endM: 9, endY: 2026, status: "CLOSED", isLocked: true },
    { month: 10, year: 2026, startM: 9, startY: 2026, endM: 10, endY: 2026, status: "ACTIVE", isLocked: false },
    { month: 11, year: 2026, startM: 10, startY: 2026, endM: 11, endY: 2026, status: "UPCOMING", isLocked: false },
    { month: 12, year: 2026, startM: 11, startY: 2026, endM: 12, endY: 2026, status: "UPCOMING", isLocked: false },
    { month: 1, year: 2027, startM: 12, startY: 2026, endM: 1, endY: 2027, status: "UPCOMING", isLocked: false },
    { month: 2, year: 2027, startM: 1, startY: 2027, endM: 2, endY: 2027, status: "UPCOMING", isLocked: false },
    { month: 3, year: 2027, startM: 2, startY: 2027, endM: 3, endY: 2027, status: "UPCOMING", isLocked: false },
    { month: 4, year: 2027, startM: 3, startY: 2027, endM: 4, endY: 2027, status: "UPCOMING", isLocked: false },
    { month: 5, year: 2027, startM: 4, startY: 2027, endM: 5, endY: 2027, status: "UPCOMING", isLocked: false },
    { month: 6, year: 2027, startM: 5, startY: 2027, endM: 6, endY: 2027, status: "UPCOMING", isLocked: false },
    { month: 7, year: 2027, startM: 6, startY: 2027, endM: 7, endY: 2027, status: "UPCOMING", isLocked: false },
    { month: 8, year: 2027, startM: 7, startY: 2027, endM: 8, endY: 2027, status: "UPCOMING", isLocked: false },
    { month: 9, year: 2027, startM: 8, startY: 2027, endM: 9, endY: 2027, status: "UPCOMING", isLocked: false },
  ];

  let createdCount = 0;
  let existingCount = 0;
  const resultSprints = [];

  for (let i = 0; i < sprintsToCreate.length; i++) {
    const item = sprintsToCreate[i];
    const name = `Sprint ${MONTH_NAMES_ID[item.month - 1]} ${item.year}`;
    const startDate = new Date(Date.UTC(item.startY, item.startM - 1, 21, 0, 0, 0));
    const endDate = new Date(Date.UTC(item.endY, item.endM - 1, 20, 23, 59, 59, 999));

    const existing = await prisma.sprint.findFirst({
      where: { name },
    });

    if (existing) {
      existingCount++;
      resultSprints.push(existing);
    } else {
      const created = await prisma.sprint.create({
        data: {
          name,
          startDate,
          endDate,
          status: item.status,
          isLocked: item.isLocked,
          year: String(item.year),
          orderIndex: i + 1,
        },
      });
      createdCount++;
      resultSprints.push(created);
    }
  }

  return { createdCount, existingCount, sprints: resultSprints };
}

export async function getAllSprints() {
  return prisma.sprint.findMany({
    orderBy: { startDate: "asc" },
    include: {
      _count: {
        select: {
          tasks: true,
          initiatives: true,
          memberScores: true,
        },
      },
    },
  });
}

export async function getActiveSprint() {
  const active = await prisma.sprint.findFirst({
    where: { status: "ACTIVE" },
  });
  if (active) return active;

  const now = new Date();
  const byDate = await prisma.sprint.findFirst({
    where: {
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { startDate: "desc" },
  });
  return byDate || null;
}

/**
 * Non-strict sprint resolver for Initiatives and Tasks.
 * Finds matching Sprint by id, date range, or sprintMonth string, falling back to ACTIVE sprint if enabled.
 * Never throws error if not matched.
 */
export async function resolveSprint(options: {
  sprintId?: string | null;
  date?: Date | string | null;
  sprintMonth?: string | null;
  fallbackToActive?: boolean;
}): Promise<any | null> {
  const { sprintId, date, sprintMonth, fallbackToActive = true } = options;

  // 1. Direct sprintId match
  if (sprintId) {
    const sp = await prisma.sprint.findUnique({ where: { id: sprintId } });
    if (sp) return sp;
  }

  // 2. Resolve by date range
  if (date) {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      const sp = await prisma.sprint.findFirst({
        where: {
          startDate: { lte: d },
          endDate: { gte: d },
        },
        orderBy: { startDate: "desc" },
      });
      if (sp) return sp;
    }
  }

  // 3. Resolve by sprintMonth string (e.g. "2026-10", "Sprint Oktober 2026")
  if (sprintMonth) {
    const trimmed = sprintMonth.trim();
    let sp = await prisma.sprint.findFirst({
      where: { name: trimmed },
    });
    if (sp) return sp;

    const matchYm = trimmed.match(/^(\d{4})-(\d{1,2})$/);
    if (matchYm) {
      const year = matchYm[1];
      const mIdx = parseInt(matchYm[2], 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        sp = await prisma.sprint.findFirst({
          where: {
            name: { contains: MONTH_NAMES_ID[mIdx] },
            year,
          },
        });
        if (sp) return sp;
      }
    }

    sp = await prisma.sprint.findFirst({
      where: { name: { contains: trimmed } },
    });
    if (sp) return sp;
  }

  // 4. Fallback to active sprint
  if (fallbackToActive) {
    return getActiveSprint();
  }

  return null;
}

/**
 * Backfill existing initiatives and tasks that have null sprintId
 */
export async function backfillSprintRelations(): Promise<{ updatedInitiatives: number; updatedTasks: number }> {
  const initiatives = await prisma.initiative.findMany({
    where: { sprintId: null },
    select: { id: true, sprintMonth: true, startDate: true, dueDate: true },
  });

  let updatedInitiatives = 0;
  for (const ini of initiatives) {
    const sp = await resolveSprint({
      date: ini.startDate || ini.dueDate,
      sprintMonth: ini.sprintMonth,
      fallbackToActive: true,
    });
    if (sp) {
      await prisma.initiative.update({
        where: { id: ini.id },
        data: { sprintId: sp.id },
      });
      updatedInitiatives++;
    }
  }

  const tasks = await prisma.task.findMany({
    where: { sprintId: null },
    select: {
      id: true,
      sprintMonth: true,
      startDate: true,
      finishDate: true,
      initiative: { select: { sprintId: true, sprintMonth: true, startDate: true, dueDate: true } },
    },
  });

  let updatedTasks = 0;
  for (const t of tasks) {
    let sp = null;
    if (t.initiative?.sprintId) {
      sp = await prisma.sprint.findUnique({ where: { id: t.initiative.sprintId } });
    }
    if (!sp) {
      sp = await resolveSprint({
        date: t.startDate || t.finishDate || t.initiative?.startDate || t.initiative?.dueDate,
        sprintMonth: t.sprintMonth || t.initiative?.sprintMonth,
        fallbackToActive: true,
      });
    }
    if (sp) {
      await prisma.task.update({
        where: { id: t.id },
        data: { sprintId: sp.id },
      });
      updatedTasks++;
    }
  }

  return { updatedInitiatives, updatedTasks };
}


export async function updateSprint(
  id: string,
  data: { startDate?: string | Date; endDate?: string | Date; name?: string },
  adminId?: string,
  req?: any
) {
  const oldSprint = await prisma.sprint.findUnique({ where: { id } });
  if (!oldSprint) throw new Error("Sprint not found");

  const updated = await prisma.sprint.update({
    where: { id },
    data: {
      ...(data.name ? { name: data.name } : {}),
      ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
      ...(data.endDate ? { endDate: new Date(data.endDate) } : {}),
    },
  });

  await logAudit(prisma, {
    userId: adminId,
    action: "UPDATE_SPRINT_DATES",
    entityType: "SPRINT",
    entityId: id,
    oldValues: oldSprint,
    newValues: updated,
    req,
  });

  return updated;
}

export async function toggleSprintLock(
  id: string,
  isLocked: boolean,
  adminId?: string,
  req?: any
) {
  const oldSprint = await prisma.sprint.findUnique({ where: { id } });
  if (!oldSprint) throw new Error("Sprint not found");

  const updated = await prisma.sprint.update({
    where: { id },
    data: { isLocked },
  });

  await logAudit(prisma, {
    userId: adminId,
    action: isLocked ? "LOCK_SPRINT" : "UNLOCK_SPRINT",
    entityType: "SPRINT",
    entityId: id,
    oldValues: { isLocked: oldSprint.isLocked },
    newValues: { isLocked },
    req,
  });

  return updated;
}


export async function closeAndRolloverSprint(
  sprintId: string,
  adminId?: string,
  req?: any
) {
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
  });
  if (!sprint) throw new Error("Sprint not found");

  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true, department: true },
  });

  const memberSnapshots: any[] = [];
  for (const user of users) {
    const userInitiatives = await prisma.initiative.findMany({
      where: {
        sprintId,
        OR: [{ ownerId: user.id }, { assignedLeaderId: user.id }],
        kanbanStatus: { not: "DROP" },
      },
      select: {
        id: true,
        title: true,
        targetValue: true,
        currentValue: true,
        achievedValue: true,
        kanbanStatus: true,
      },
    });

    const userTasks = await prisma.task.findMany({
      where: {
        sprintId,
        kanbanStatus: { not: "DROP" },
        AND: [
          {
            OR: [
              { assignedTeamMemberId: user.id },
              { assignments: { some: { userId: user.id } } },
            ],
          },
          {
            OR: [
              { initiativeId: null },
              { initiative: { kanbanStatus: { not: "DROP" } } },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        targetValue: true,
        currentValue: true,
        baselineValue: true,
        status: true,
        kanbanStatus: true,
        isCrossDept: true,
      },
    });

    let iniWeightedSum = 0;
    let iniTotalWeight = 0;
    userInitiatives.forEach((init) => {
      const val = init.achievedValue ?? init.currentValue ?? 0;
      let pct = init.targetValue > 0 ? (val / init.targetValue) * 100 : init.kanbanStatus === "DONE" ? 100 : 0;
      pct = Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
      iniWeightedSum += pct * 2;
      iniTotalWeight += 2;
    });

    let taskWeightedSum = 0;
    let taskTotalWeight = 0;
    userTasks.forEach((t) => {
      const target = t.targetValue || 0;
      const baseline = t.baselineValue || 0;
      let pct = 0;
      if (
        t.status === "DONE" ||
        t.kanbanStatus === "DONE" ||
        t.kanbanStatus === "CLOSED" ||
        (t.status === "ON_TRACK" && target > 0 && t.currentValue >= target)
      ) {
        pct = 100;
      } else if (target > baseline) {
        pct = ((t.currentValue - baseline) / (target - baseline)) * 100;
      } else if (target > 0) {
        pct = (t.currentValue / target) * 100;
      } else {
        pct = t.currentValue > 0 ? 100 : 0;
      }
      pct = Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
      taskWeightedSum += pct * 1;
      taskTotalWeight += 1;
    });

    const totalWeight = iniTotalWeight + taskTotalWeight;
    const totalScore = totalWeight > 0 ? Math.round(((iniWeightedSum + taskWeightedSum) / totalWeight) * 10) / 10 : 0;
    const completedTasks = userTasks.filter(
      (t) =>
        t.status === "DONE" ||
        t.kanbanStatus === "DONE" ||
        t.kanbanStatus === "CLOSED" ||
        (t.status === "ON_TRACK" && t.currentValue >= (t.targetValue || 1)),
    ).length;

    const detailsJson = {
      initiativeCount: userInitiatives.length,
      initiatives: userInitiatives.map((i) => ({ id: i.id, title: i.title, status: i.kanbanStatus })),
      tasks: userTasks.map((t) => ({ id: t.id, title: t.title, target: t.targetValue, current: t.currentValue, baseline: t.baselineValue })),
    };

    memberSnapshots.push({
      sprintId,
      userId: user.id,
      totalScore,
      taskCount: userTasks.length,
      completedCount: completedTasks,
      detailsJson,
    });
  }

  // Rollup KR Sprint Targets
  const krTargets = await prisma.krSprintTarget.findMany({
    where: { sprintId },
  });

  for (const target of krTargets) {
    const allTargetsForKr = await prisma.krSprintTarget.findMany({
      where: { keyResultId: target.keyResultId },
    });

    let aggregatedValue = 0;
    if (target.aggregationType === "SUM") {
      aggregatedValue = allTargetsForKr.reduce((sum, item) => sum + (item.currentValue || 0), 0);
    } else if (target.aggregationType === "AVERAGE") {
      const valid = allTargetsForKr.filter((item) => item.currentValue > 0);
      aggregatedValue = valid.length > 0 ? valid.reduce((sum, item) => sum + item.currentValue, 0) / valid.length : 0;
    } else if (target.aggregationType === "LAST_VALUE") {
      aggregatedValue = target.currentValue;
    }

    await prisma.keyResult.update({
      where: { id: target.keyResultId },
      data: { currentValue: Math.round(aggregatedValue * 100) / 100 },
    });
  }

  // Save snapshots & close sprint in transaction
  await prisma.$transaction(async (tx) => {
    for (const snap of memberSnapshots) {
      await tx.memberSprintProgress.upsert({
        where: {
          sprintId_userId: { sprintId: snap.sprintId, userId: snap.userId },
        },
        create: snap,
        update: {
          totalScore: snap.totalScore,
          taskCount: snap.taskCount,
          completedCount: snap.completedCount,
          detailsJson: snap.detailsJson,
        },
      });
    }

    await tx.sprint.update({
      where: { id: sprintId },
      data: { status: "CLOSED", isLocked: true },
    });

    const nextSprint = await tx.sprint.findFirst({
      where: { startDate: { gt: sprint.startDate } },
      orderBy: { startDate: "asc" },
    });

    if (nextSprint) {
      await tx.sprint.update({
        where: { id: nextSprint.id },
        data: { status: "ACTIVE", isLocked: false },
      });
    }
  });

  await logAudit(prisma, {
    userId: adminId,
    action: "CLOSE_AND_ROLLOVER_SPRINT",
    entityType: "SPRINT",
    entityId: sprintId,
    oldValues: { status: sprint.status, isLocked: sprint.isLocked },
    newValues: { status: "CLOSED", isLocked: true },
    req,
  });

  return { success: true, closedSprintId: sprintId };
}

export async function checkAndAutoRollover() {
  const now = new Date();
  const expiredActiveSprint = await prisma.sprint.findFirst({
    where: {
      status: "ACTIVE",
      endDate: { lt: now },
    },
  });

  if (expiredActiveSprint) {
    console.log(`[AutoRollover] Closing expired sprint ${expiredActiveSprint.name} (${expiredActiveSprint.id})`);
    await closeAndRolloverSprint(expiredActiveSprint.id, "SYSTEM_CRON");
  }
}

