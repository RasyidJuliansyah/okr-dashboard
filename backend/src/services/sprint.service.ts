import { PrismaClient } from "@prisma/client";
import { logAudit } from "../utils/auditLogger";

import { calculateProgressPercent, calculateAutoStatus } from "../utils/progress";

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
  req?: any,
  options?: { rolloverUnfinishedTasks?: boolean }
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
        targetType: true,
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
        targetType: true,
        status: true,
        kanbanStatus: true,
        isCrossDept: true,
      },
    });

    let iniWeightedSum = 0;
    let iniTotalWeight = 0;
    userInitiatives.forEach((init) => {
      const val = init.achievedValue ?? init.currentValue ?? 0;
      let pct = calculateProgressPercent(val, init.targetValue, init.targetType);
      if (init.kanbanStatus === "DONE" && pct < 100) pct = 100;
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
        t.kanbanStatus === "CLOSED"
      ) {
        pct = 100;
      } else {
        pct = calculateProgressPercent(t.currentValue, target, t.targetType, baseline);
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

      if (options?.rolloverUnfinishedTasks) {
        // Rollover incomplete tasks to next sprint, reset baseline to current value
        const unfinishedTasks = await tx.task.findMany({
          where: {
            sprintId,
            isActive: true,
            kanbanStatus: { notIn: ["DONE", "CLOSED", "DROP"] },
            status: { not: "DONE" },
          },
        });

        for (const t of unfinishedTasks) {
          await tx.task.update({
            where: { id: t.id },
            data: {
              sprintId: nextSprint.id,
              sprintMonth: nextSprint.name,
              baselineValue: t.currentValue || 0,
            },
          });
        }

        // Rollover incomplete initiatives to next sprint
        const unfinishedInis = await tx.initiative.findMany({
          where: {
            sprintId,
            isActive: true,
            kanbanStatus: { notIn: ["DONE", "DROP"] },
          },
        });

        for (const ini of unfinishedInis) {
          await tx.initiative.update({
            where: { id: ini.id },
            data: {
              sprintId: nextSprint.id,
              sprintMonth: nextSprint.name,
            },
          });
        }
      }
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



function normalizeDept(deptStr: string | null | undefined): string {
  if (!deptStr) return "";
  return deptStr.trim().toUpperCase().replace(/&/g, "AND").replace(/[^A-Z0-9]/g, "");
}

function matchesDepartment(candidate: string | null | undefined, targetDept: string): boolean {
  if (!candidate || !targetDept) return false;
  const cNorm = normalizeDept(candidate);
  const tNorm = normalizeDept(targetDept);
  if (cNorm === tNorm) return true;

  const groups: Record<string, string[]> = {
    TECHOPS: ["TECHOPS", "OPERATION"],
    SSC: ["SSC", "SHAREDSERVICECENTER", "FINANCE", "HR"],
    SERVICEACCOUNT: ["SERVICEACCOUNT", "SERVICESACCOUNT"],
    B2BCORPORATE: ["B2BCORPORATE", "B2B", "B2BEXPANSION", "B2BCORPORATION"],
    PRODUCT: ["PRODUCT", "PRODUCTDATA", "PRODUCTANDDATA"],
    TECHDEV: ["TECHDEV", "TECHDEVELOPMENT"],
    TECHAUDITOR: ["TECHAUDITOR"],
    EDUCATION: ["EDUCATION", "EDUCATIONACADEMIC"],
    B2C: ["B2C", "B2CCONSUMER"],
    B2S: ["B2S", "BUSINESSTOSCHOOL"],
    STRATEGIC: ["STRATEGIC", "STRATEGICPLANNING"],
  };

  for (const [key, aliases] of Object.entries(groups)) {
    const isTargetInGroup = key === tNorm || aliases.some((a) => normalizeDept(a) === tNorm);
    const isCandidateInGroup = key === cNorm || aliases.some((a) => normalizeDept(a) === cNorm);
    if (isTargetInGroup && isCandidateInGroup) return true;
  }

  return false;
}

export async function getSprintReportData(sprintId: string, department?: string) {
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
  });
  if (!sprint) throw new Error("Sprint not found");

  const allDepts = await prisma.department.findMany({
    where: { isActive: true },
  });
  const targetDept = department
    ? allDepts.find(
        (d) =>
          d.id === department ||
          d.value.toUpperCase() === department.toUpperCase() ||
          d.name.toLowerCase() === department.toLowerCase()
      )
    : undefined;
  const targetDeptId = targetDept?.id;
  const targetDeptValue = targetDept?.value || department;

  // 1. Fetch Initiatives in this sprint
  const initiativesRaw = await prisma.initiative.findMany({
    where: {
      sprintId,
      isActive: true,
    },
    include: {
      keyResult: {
        select: {
          id: true,
          title: true,
          bscPerspective: true,
          unit: true,
          targetType: true,
          targetValue: true,
          currentValue: true,
          status: true,
          objective: { select: { id: true, title: true } },
        },
      },
      team: {
        select: {
          id: true,
          name: true,
          department: true,
          departmentId: true,
          departmentRel: { select: { id: true, name: true, value: true } },
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          department: true,
          departmentId: true,
          departmentRel: { select: { id: true, name: true, value: true } },
        },
      },
      assignedLeader: {
        select: {
          id: true,
          name: true,
          department: true,
          departmentId: true,
          departmentRel: { select: { id: true, name: true, value: true } },
        },
      },
      tasks: {
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          targetValue: true,
          currentValue: true,
          baselineValue: true,
          kanbanStatus: true,
          status: true,
          targetType: true,
        },
      },
      kpis: {
        include: { kpi: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const initiatives = targetDeptValue
    ? initiativesRaw.filter((ini) => {
        return (
          ini.team?.departmentId === targetDeptId ||
          matchesDepartment(ini.team?.department, targetDeptValue) ||
          matchesDepartment(ini.team?.departmentRel?.value, targetDeptValue) ||
          ini.owner?.departmentId === targetDeptId ||
          matchesDepartment(ini.owner?.department, targetDeptValue) ||
          matchesDepartment(ini.owner?.departmentRel?.value, targetDeptValue) ||
          ini.assignedLeader?.departmentId === targetDeptId ||
          matchesDepartment(ini.assignedLeader?.department, targetDeptValue) ||
          matchesDepartment(ini.assignedLeader?.departmentRel?.value, targetDeptValue)
        );
      })
    : initiativesRaw;

  // 2. Fetch Tasks in this sprint
  const tasksRaw = await prisma.task.findMany({
    where: {
      sprintId,
      isActive: true,
    },
    include: {
      initiative: {
        select: {
          id: true,
          title: true,
          keyResultId: true,
          team: {
            select: {
              id: true,
              name: true,
              department: true,
              departmentId: true,
              departmentRel: { select: { id: true, name: true, value: true } },
            },
          },
          keyResult: {
            select: {
              id: true,
              title: true,
              bscPerspective: true,
              unit: true,
              targetType: true,
              targetValue: true,
              currentValue: true,
              objective: { select: { id: true, title: true } },
            },
          },
        },
      },
      assignedTeamMember: {
        select: {
          id: true,
          name: true,
          department: true,
          departmentId: true,
          departmentRel: { select: { id: true, name: true, value: true } },
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          department: true,
          departmentId: true,
          departmentRel: { select: { id: true, name: true, value: true } },
        },
      },
      kpis: {
        include: { kpi: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const tasks = targetDeptValue
    ? tasksRaw.filter((t) => {
        return (
          t.assignedTeamMember?.departmentId === targetDeptId ||
          matchesDepartment(t.assignedTeamMember?.department, targetDeptValue) ||
          matchesDepartment(t.assignedTeamMember?.departmentRel?.value, targetDeptValue) ||
          matchesDepartment(t.targetDept, targetDeptValue) ||
          matchesDepartment(t.creatorDept, targetDeptValue) ||
          t.initiative?.team?.departmentId === targetDeptId ||
          matchesDepartment(t.initiative?.team?.department, targetDeptValue) ||
          matchesDepartment(t.initiative?.team?.departmentRel?.value, targetDeptValue)
        );
      })
    : tasksRaw;

  // Process Task Report Items
  const taskReportItems = tasks.map((t) => {
    const tgt = t.targetValue || 0;
    const base = t.baselineValue || 0;
    const curr = t.currentValue || 0;
    let sprintAchievementPct = 0;

    if (t.status === "DONE" || t.kanbanStatus === "DONE" || t.kanbanStatus === "CLOSED") {
      sprintAchievementPct = 100;
    } else if (tgt > base) {
      sprintAchievementPct = calculateProgressPercent(curr, tgt, t.targetType, base);
    } else if (tgt > 0) {
      sprintAchievementPct = calculateProgressPercent(curr, tgt, t.targetType, 0);
    } else {
      sprintAchievementPct = curr > 0 ? 100 : 0;
    }

    sprintAchievementPct = Math.min(100, Math.max(0, Math.round(sprintAchievementPct * 10) / 10));

    return {
      id: t.id,
      title: t.title,
      initiativeId: t.initiativeId,
      initiativeTitle: t.initiative?.title || "(Standalone / Cross-Dept)",
      assigneeName: t.assignedTeamMember?.name || "Unassigned",
      department: t.assignedTeamMember?.department || t.targetDept || t.creatorDept || "-",
      baselineValue: base,
      targetValue: tgt,
      currentValue: curr,
      unit: t.unit || "",
      sprintAchievementPct,
      status: t.status,
      kanbanStatus: t.kanbanStatus || "TODO",
      isCrossDept: t.isCrossDept,
    };
  });

  // Process Initiative Report Items
  const initiativeReportItems = initiatives.map((ini) => {
    let sprintAchievementPct = 0;
    const activeTasks = ini.tasks || [];
    const val = ini.achievedValue !== null && ini.achievedValue !== undefined ? ini.achievedValue : ini.currentValue || 0;

    if (ini.kanbanStatus === "DONE") {
      sprintAchievementPct = 100;
    } else if (activeTasks.length > 0) {
      const sumTaskPct = activeTasks.reduce((s, t) => {
        const tTgt = t.targetValue || 0;
        const tBase = t.baselineValue || 0;
        const tCurr = t.currentValue || 0;
        let pct = 0;
        if (t.status === "DONE" || t.kanbanStatus === "DONE" || t.kanbanStatus === "CLOSED") {
          pct = 100;
        } else if (tTgt > tBase) {
          pct = calculateProgressPercent(tCurr, tTgt, t.targetType, tBase);
        } else if (tTgt > 0) {
          pct = calculateProgressPercent(tCurr, tTgt, t.targetType, 0);
        }
        return s + Math.min(100, Math.max(0, pct));
      }, 0);
      sprintAchievementPct = sumTaskPct / activeTasks.length;
    } else if (ini.targetValue > 0) {
      sprintAchievementPct = calculateProgressPercent(val, ini.targetValue, ini.targetType);
    }

    sprintAchievementPct = Math.min(100, Math.max(0, Math.round(sprintAchievementPct * 10) / 10));

    const completedTaskCount = activeTasks.filter(
      (t) => t.status === "DONE" || t.kanbanStatus === "DONE" || t.kanbanStatus === "CLOSED"
    ).length;

    return {
      id: ini.id,
      title: ini.title,
      keyResultId: ini.keyResultId,
      keyResultTitle: ini.keyResult?.title || "-",
      teamName: ini.team?.name || "-",
      ownerName: ini.assignedLeader?.name || ini.owner?.name || "-",
      department: ini.team?.department || ini.owner?.department || ini.assignedLeader?.department || "-",
      sprintMonth: ini.sprintMonth,
      targetValue: ini.targetValue,
      currentValue: ini.currentValue,
      achievedValue: ini.achievedValue,
      sprintAchievementPct,
      kanbanStatus: ini.kanbanStatus,
      taskCount: activeTasks.length,
      completedTaskCount,
    };
  });

  // 3. Process Key Results
  const allKrs = await prisma.keyResult.findMany({
    where: {
      isActive: true,
      objective: {
        isActive: true,
        year: sprint.year || "2026",
      },
    },
    include: {
      objective: { select: { id: true, title: true, year: true } },
      departments: true,
      sprintTargets: { where: { sprintId } },
    },
  });

  // ponytail: Decouple KRs from sprint cycles. All active KRs remain visible across sprints unless department filter is applied.
  const keyResults = targetDeptValue
    ? allKrs.filter(
        (kr) =>
          kr.departments.some((d) => matchesDepartment(d.department, targetDeptValue)) ||
          initiatives.some((i) => i.keyResultId === kr.id) ||
          tasks.some((t) => t.initiative?.keyResultId === kr.id)
      )
    : allKrs;

  const krReportItems = keyResults.map((kr) => {
    const st = kr.sprintTargets?.[0];
    const relatedInis = initiativeReportItems.filter((i) => i.keyResultId === kr.id);

    // Capaian Sprint (Periode Ini):
    let sprintBaseline = 0;
    let sprintTarget = 0;
    let sprintCurrent = 0;
    let sprintAchievementPct = 0;

    if (st && st.targetValue > 0) {
      sprintBaseline = st.baselineValue || 0;
      sprintTarget = st.targetValue;
      sprintCurrent = st.currentValue || 0;
      sprintAchievementPct = calculateProgressPercent(
        sprintCurrent,
        sprintTarget,
        kr.targetType,
        sprintBaseline
      );
    } else if (relatedInis.length > 0) {
      sprintBaseline = 0;
      sprintTarget = 100;
      const avgIni =
        relatedInis.reduce((s, item) => s + item.sprintAchievementPct, 0) /
        relatedInis.length;
      sprintCurrent = Math.round(avgIni * 10) / 10;
      sprintAchievementPct = sprintCurrent;
    }

    sprintAchievementPct = Math.min(100, Math.max(0, Math.round(sprintAchievementPct * 10) / 10));

    // Capaian Kumulatif KR Berjalan:
    const annualTarget = kr.targetValue;
    const cumulativeCurrent = kr.currentValue || 0;
    const cumulativeAchievementPct =
      annualTarget > 0
        ? calculateProgressPercent(cumulativeCurrent, annualTarget, kr.targetType)
        : 0;

    const deptNames = kr.departments?.map((d: any) => d.department).join(", ") || "-";

    return {
      keyResultId: kr.id,
      title: kr.title,
      objectiveTitle: kr.objective?.title || "-",
      bscPerspective: kr.bscPerspective,
      unit: kr.unit || "%",
      targetType: kr.targetType,
      department: deptNames,
      sprintBaseline,
      sprintTarget,
      sprintCurrent,
      sprintAchievementPct,
      annualTarget,
      cumulativeCurrent,
      cumulativeAchievementPct: Math.round(cumulativeAchievementPct * 10) / 10,
      status: calculateAutoStatus(cumulativeAchievementPct),
    };
  });


  // 4. Process KPIs (Master KPI)
  const kpiMap = new Map<
    string,
    {
      kpiId: string;
      name: string;
      unit: string;
      bscPerspective: string;
      department: string | null;
      sprintTarget: number;
      sprintCurrent: number;
      linkedTasksCount: number;
      linkedInitiativesCount: number;
    }
  >();

  const relevantInitiatives = targetDeptValue ? initiatives : initiativesRaw;
  const relevantTasks = targetDeptValue ? tasks : tasksRaw;

  relevantInitiatives.forEach((ini) => {
    (ini.kpis || []).forEach((ik: any) => {
      if (!ik.kpi) return;
      const kId = ik.kpiId;
      const existing = kpiMap.get(kId) || {
        kpiId: kId,
        name: ik.kpi.name,
        unit: ik.kpi.unit,
        bscPerspective: ik.kpi.bscPerspective,
        department: ik.kpi.department || null,
        sprintTarget: 0,
        sprintCurrent: 0,
        linkedTasksCount: 0,
        linkedInitiativesCount: 0,
      };
      existing.sprintTarget += ik.targetValue || 0;
      existing.sprintCurrent += ik.currentValue || 0;
      existing.linkedInitiativesCount += 1;
      kpiMap.set(kId, existing);
    });
  });

  relevantTasks.forEach((t) => {
    (t.kpis || []).forEach((tk: any) => {
      if (!tk.kpi) return;
      const kId = tk.kpiId;
      const existing = kpiMap.get(kId) || {
        kpiId: kId,
        name: tk.kpi.name,
        unit: tk.kpi.unit,
        bscPerspective: tk.kpi.bscPerspective,
        department: tk.kpi.department || null,
        sprintTarget: 0,
        sprintCurrent: 0,
        linkedTasksCount: 0,
        linkedInitiativesCount: 0,
      };
      existing.sprintTarget += tk.targetValue || 0;
      existing.sprintCurrent += tk.currentValue || 0;
      existing.linkedTasksCount += 1;
      kpiMap.set(kId, existing);
    });
  });

  if (targetDeptValue) {
    const deptKpis = await prisma.kpi.findMany({
      where: { isActive: true },
    });
    deptKpis
      .filter((k) => matchesDepartment(k.department, targetDeptValue))
      .forEach((k) => {
        if (!kpiMap.has(k.id)) {
          kpiMap.set(k.id, {
            kpiId: k.id,
            name: k.name,
            unit: k.unit,
            bscPerspective: k.bscPerspective,
            department: k.department || null,
            sprintTarget: k.defaultTarget || 0,
            sprintCurrent: 0,
            linkedTasksCount: 0,
            linkedInitiativesCount: 0,
          });
        }
      });
  }

  const kpiReportItems = Array.from(kpiMap.values()).map((k) => {
    const tgt = k.sprintTarget;
    const curr = k.sprintCurrent;
    let sprintAchievementPct = 0;
    if (tgt > 0) {
      sprintAchievementPct = Math.min(100, Math.round(((curr / tgt) * 100) * 10) / 10);
    } else {
      sprintAchievementPct = curr > 0 ? 100 : 0;
    }
    return {
      ...k,
      sprintTarget: Math.round(tgt * 100) / 100,
      sprintCurrent: Math.round(curr * 100) / 100,
      sprintAchievementPct,
    };
  });

  // 5. Overall Summaries
  const totalInitiatives = initiativeReportItems.length;
  const completedInitiatives = initiativeReportItems.filter(
    (i) => i.kanbanStatus === "DONE"
  ).length;

  const totalTasks = taskReportItems.length;
  const completedTasks = taskReportItems.filter(
    (t) => t.status === "DONE" || t.kanbanStatus === "DONE" || t.kanbanStatus === "CLOSED"
  ).length;

  const allSprintPcts = [
    ...initiativeReportItems.map((i) => i.sprintAchievementPct),
    ...taskReportItems.map((t) => t.sprintAchievementPct),
  ];
  const avgSprintAchievementPct =
    allSprintPcts.length > 0
      ? Math.round((allSprintPcts.reduce((s, p) => s + p, 0) / allSprintPcts.length) * 10) / 10
      : 0;

  const avgCumulativeKrAchievementPct =
    krReportItems.length > 0
      ? Math.round(
          (krReportItems.reduce((s, kr) => s + kr.cumulativeAchievementPct, 0) /
            krReportItems.length) *
            10
        ) / 10
      : 0;

  return {
    sprintId: sprint.id,
    sprintName: sprint.name,
    startDate: sprint.startDate,
    endDate: sprint.endDate,
    status: sprint.status,
    isLocked: sprint.isLocked,
    avgSprintAchievementPct,
    avgCumulativeKrAchievementPct,
    totalInitiatives,
    completedInitiatives,
    totalTasks,
    completedTasks,
    totalKpis: kpiReportItems.length,
    krs: krReportItems,
    initiatives: initiativeReportItems,
    tasks: taskReportItems,
    kpis: kpiReportItems,
  };
}

