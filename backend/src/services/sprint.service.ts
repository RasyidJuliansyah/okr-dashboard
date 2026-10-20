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
  options?: {
    rolloverUnfinishedTasks?: boolean;
    carryOverInitiativeIds?: string[];
    carryOverTaskIds?: string[];
  }
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

      const carryOverInis = options?.carryOverInitiativeIds || [];
      const carryOverTasks = options?.carryOverTaskIds || [];

      // 1. Explicitly selected initiatives to carry over
      if (carryOverInis.length > 0) {
        await tx.initiative.updateMany({
          where: { id: { in: carryOverInis }, sprintId },
          data: {
            sprintId: nextSprint.id,
            sprintMonth: nextSprint.name,
          },
        });

        // Also carry over tasks under these initiatives that were in the closing sprint
        await tx.task.updateMany({
          where: { initiativeId: { in: carryOverInis }, sprintId },
          data: {
            sprintId: nextSprint.id,
            sprintMonth: nextSprint.name,
          },
        });
      }

      // 2. Explicitly selected tasks to carry over
      if (carryOverTasks.length > 0) {
        const tasksToCarry = await tx.task.findMany({
          where: { id: { in: carryOverTasks }, sprintId },
          select: { id: true, currentValue: true },
        });
        for (const t of tasksToCarry) {
          await tx.task.update({
            where: { id: t.id },
            data: {
              sprintId: nextSprint.id,
              sprintMonth: nextSprint.name,
              baselineValue: t.currentValue || 0,
            },
          });
        }
      }

      // 3. Fallback: legacy rolloverUnfinishedTasks flag without explicit selection
      if (options?.rolloverUnfinishedTasks && carryOverInis.length === 0 && carryOverTasks.length === 0) {
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

    // Auto-DONE all remaining unfinished initiatives in sprintId (preserve actual values)
    await tx.initiative.updateMany({
      where: {
        sprintId,
        isActive: true,
        kanbanStatus: { notIn: ["DONE", "DROP"] },
      },
      data: {
        kanbanStatus: "DONE",
        status: "DONE",
      },
    });

    // Auto-DONE all remaining unfinished tasks in sprintId (preserve actual values)
    await tx.task.updateMany({
      where: {
        sprintId,
        isActive: true,
        kanbanStatus: { notIn: ["DONE", "CLOSED", "DROP"] },
        status: { not: "DONE" },
      },
      data: {
        kanbanStatus: "DONE",
        status: "DONE",
      },
    });
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

export async function getSprintReportData(
  sprintId: string,
  department?: string,
  user?: { id: string; role: string; originalRole?: string | null }
) {
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
  });
  if (!sprint) throw new Error("Sprint not found");

  const role = user?.role;
  const userId = user?.id;
  const isLeader = role === "LEADER";
  const isManager = role === "MANAGER";

  let dbUser: { id: string; department: string | null; teamId: string | null } | null = null;
  const managedDeptValues = new Set<string>();
  let leaderTeamIds: string[] = [];

  if (userId && (isLeader || isManager)) {
    dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, department: true, teamId: true },
    });
  }

  if (userId && isManager) {
    const managed = await prisma.department.findMany({
      where: { managerId: userId, isActive: true },
      select: { value: true },
    });
    managed.forEach((d) => managedDeptValues.add(d.value.toUpperCase()));
    if (dbUser?.department && dbUser.department.toUpperCase() !== "STRATEGIC") {
      managedDeptValues.add(dbUser.department.toUpperCase());
    }
  } else if (userId && isLeader) {
    const leadingTeams = await prisma.team.findMany({
      where: {
        OR: [
          { leaderId: userId },
          ...(dbUser?.teamId ? [{ id: dbUser.teamId }] : []),
        ],
      },
      select: { id: true },
    });
    leaderTeamIds = leadingTeams.map((t) => t.id);
  }

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

  // 1. Fetch Key Results for the sprint year
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
      assignments: {
        select: { userId: true, raciRole: true },
      },
      sprintTargets: { where: { sprintId } },
    },
  });

  // ponytail: Scope Key Results by role & department. Leader: Accountable; Manager: Responsible or managed dept.
  let keyResults = allKrs;
  if (isLeader) {
    keyResults = allKrs.filter((kr) => {
      const isAccountable = kr.assignments?.some(
        (a) => a.userId === userId && a.raciRole === "ACCOUNTABLE"
      );
      if (!isAccountable) return false;
      if (targetDeptValue) {
        return (
          kr.departments.some((d) => matchesDepartment(d.department, targetDeptValue)) ||
          matchesDepartment(dbUser?.department, targetDeptValue)
        );
      }
      return true;
    });
  } else if (isManager) {
    keyResults = allKrs.filter((kr) => {
      const isResponsible = kr.assignments?.some(
        (a) => a.userId === userId && a.raciRole === "RESPONSIBLE"
      );
      const isDeptUnderManager = kr.departments.some((d) =>
        Array.from(managedDeptValues).some((mv) => matchesDepartment(d.department, mv))
      );
      if (!isResponsible && !isDeptUnderManager) return false;
      if (targetDeptValue) {
        return kr.departments.some((d) => matchesDepartment(d.department, targetDeptValue));
      }
      return true;
    });
  } else if (targetDeptValue) {
    keyResults = allKrs.filter((kr) =>
      kr.departments.some((d) => matchesDepartment(d.department, targetDeptValue))
    );
  }

  const scopedKrIds = new Set(keyResults.map((kr) => kr.id));

  // 2. Fetch Initiatives in this sprint
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

  const initiatives = initiativesRaw.filter((ini) => {
    if (isLeader) {
      const isLinkedToScopedKr = ini.keyResultId ? scopedKrIds.has(ini.keyResultId) : false;
      const isLeaderOfTeam = ini.teamId ? leaderTeamIds.includes(ini.teamId) : false;
      const isDirectUser = ini.ownerId === userId || ini.assignedLeaderId === userId;
      const isLeaderDept =
        dbUser?.department &&
        (matchesDepartment(ini.team?.department, dbUser.department) ||
          matchesDepartment(ini.owner?.department, dbUser.department) ||
          matchesDepartment(ini.assignedLeader?.department, dbUser.department));

      if (!isLinkedToScopedKr && !isLeaderOfTeam && !isDirectUser && !isLeaderDept) return false;
      if (targetDeptValue) {
        return (
          ini.team?.departmentId === targetDeptId ||
          matchesDepartment(ini.team?.department, targetDeptValue) ||
          matchesDepartment(ini.team?.departmentRel?.value, targetDeptValue) ||
          matchesDepartment(ini.owner?.department, targetDeptValue) ||
          matchesDepartment(ini.owner?.departmentRel?.value, targetDeptValue) ||
          matchesDepartment(ini.assignedLeader?.department, targetDeptValue) ||
          matchesDepartment(ini.assignedLeader?.departmentRel?.value, targetDeptValue) ||
          isLinkedToScopedKr
        );
      }
      return true;
    }

    if (isManager) {
      const isLinkedToScopedKr = ini.keyResultId ? scopedKrIds.has(ini.keyResultId) : false;
      const isManagedDept = Array.from(managedDeptValues).some((mv) =>
        matchesDepartment(ini.team?.department, mv) ||
        matchesDepartment(ini.team?.departmentRel?.value, mv) ||
        matchesDepartment(ini.owner?.department, mv) ||
        matchesDepartment(ini.owner?.departmentRel?.value, mv) ||
        matchesDepartment(ini.assignedLeader?.department, mv) ||
        matchesDepartment(ini.assignedLeader?.departmentRel?.value, mv)
      );

      if (!isLinkedToScopedKr && !isManagedDept) return false;
      if (targetDeptValue) {
        return (
          ini.team?.departmentId === targetDeptId ||
          matchesDepartment(ini.team?.department, targetDeptValue) ||
          matchesDepartment(ini.team?.departmentRel?.value, targetDeptValue) ||
          matchesDepartment(ini.owner?.department, targetDeptValue) ||
          matchesDepartment(ini.owner?.departmentRel?.value, targetDeptValue) ||
          matchesDepartment(ini.assignedLeader?.department, targetDeptValue) ||
          matchesDepartment(ini.assignedLeader?.departmentRel?.value, targetDeptValue) ||
          isLinkedToScopedKr
        );
      }
      return true;
    }

    if (targetDeptValue) {
      return (
        ini.team?.departmentId === targetDeptId ||
        matchesDepartment(ini.team?.department, targetDeptValue) ||
        matchesDepartment(ini.team?.departmentRel?.value, targetDeptValue) ||
        ini.owner?.departmentId === targetDeptId ||
        matchesDepartment(ini.owner?.department, targetDeptValue) ||
        matchesDepartment(ini.owner?.departmentRel?.value, targetDeptValue) ||
        ini.assignedLeader?.departmentId === targetDeptId ||
        matchesDepartment(ini.assignedLeader?.department, targetDeptValue) ||
        matchesDepartment(ini.assignedLeader?.departmentRel?.value, targetDeptValue) ||
        (ini.keyResultId ? scopedKrIds.has(ini.keyResultId) : false)
      );
    }

    return true;
  });

  const scopedInitiativeIds = new Set(initiatives.map((i) => i.id));

  // 3. Fetch Tasks in this sprint
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
          teamId: true,
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

  const tasks = tasksRaw.filter((t) => {
    if (isLeader) {
      const isLinkedToScopedIni = t.initiativeId ? scopedInitiativeIds.has(t.initiativeId) : false;
      const isLinkedToScopedKr = t.initiative?.keyResultId ? scopedKrIds.has(t.initiative.keyResultId) : false;
      const isAssignee = t.assignedTeamMemberId === userId;
      const isLeaderOfTeam = t.initiative?.teamId ? leaderTeamIds.includes(t.initiative.teamId) : false;
      const isLeaderDept =
        dbUser?.department &&
        (matchesDepartment(t.assignedTeamMember?.department, dbUser.department) ||
          matchesDepartment(t.targetDept, dbUser.department) ||
          matchesDepartment(t.creatorDept, dbUser.department) ||
          matchesDepartment(t.initiative?.team?.department, dbUser.department));

      if (!isLinkedToScopedIni && !isLinkedToScopedKr && !isAssignee && !isLeaderOfTeam && !isLeaderDept) {
        return false;
      }
      if (targetDeptValue) {
        return (
          t.assignedTeamMember?.departmentId === targetDeptId ||
          matchesDepartment(t.assignedTeamMember?.department, targetDeptValue) ||
          matchesDepartment(t.assignedTeamMember?.departmentRel?.value, targetDeptValue) ||
          matchesDepartment(t.targetDept, targetDeptValue) ||
          matchesDepartment(t.creatorDept, targetDeptValue) ||
          t.initiative?.team?.departmentId === targetDeptId ||
          matchesDepartment(t.initiative?.team?.department, targetDeptValue) ||
          matchesDepartment(t.initiative?.team?.departmentRel?.value, targetDeptValue) ||
          isLinkedToScopedIni ||
          isLinkedToScopedKr
        );
      }
      return true;
    }

    if (isManager) {
      const isLinkedToScopedIni = t.initiativeId ? scopedInitiativeIds.has(t.initiativeId) : false;
      const isLinkedToScopedKr = t.initiative?.keyResultId ? scopedKrIds.has(t.initiative.keyResultId) : false;
      const isManagedDept = Array.from(managedDeptValues).some((mv) =>
        matchesDepartment(t.assignedTeamMember?.department, mv) ||
        matchesDepartment(t.assignedTeamMember?.departmentRel?.value, mv) ||
        matchesDepartment(t.targetDept, mv) ||
        matchesDepartment(t.creatorDept, mv) ||
        matchesDepartment(t.initiative?.team?.department, mv) ||
        matchesDepartment(t.initiative?.team?.departmentRel?.value, mv)
      );

      if (!isLinkedToScopedIni && !isLinkedToScopedKr && !isManagedDept) {
        return false;
      }
      if (targetDeptValue) {
        return (
          t.assignedTeamMember?.departmentId === targetDeptId ||
          matchesDepartment(t.assignedTeamMember?.department, targetDeptValue) ||
          matchesDepartment(t.assignedTeamMember?.departmentRel?.value, targetDeptValue) ||
          matchesDepartment(t.targetDept, targetDeptValue) ||
          matchesDepartment(t.creatorDept, targetDeptValue) ||
          t.initiative?.team?.departmentId === targetDeptId ||
          matchesDepartment(t.initiative?.team?.department, targetDeptValue) ||
          matchesDepartment(t.initiative?.team?.departmentRel?.value, targetDeptValue) ||
          isLinkedToScopedIni ||
          isLinkedToScopedKr
        );
      }
      return true;
    }

    if (targetDeptValue) {
      return (
        t.assignedTeamMember?.departmentId === targetDeptId ||
        matchesDepartment(t.assignedTeamMember?.department, targetDeptValue) ||
        matchesDepartment(t.assignedTeamMember?.departmentRel?.value, targetDeptValue) ||
        matchesDepartment(t.targetDept, targetDeptValue) ||
        matchesDepartment(t.creatorDept, targetDeptValue) ||
        t.initiative?.team?.departmentId === targetDeptId ||
        matchesDepartment(t.initiative?.team?.department, targetDeptValue) ||
        matchesDepartment(t.initiative?.team?.departmentRel?.value, targetDeptValue) ||
        (t.initiativeId ? scopedInitiativeIds.has(t.initiativeId) : false) ||
        (t.initiative?.keyResultId ? scopedKrIds.has(t.initiative.keyResultId) : false)
      );
    }

    return true;
  });

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

  // 4. Process Key Results
  if (!isLeader && !isManager && targetDeptValue) {
    keyResults = allKrs.filter(
      (kr) =>
        kr.departments.some((d) => matchesDepartment(d.department, targetDeptValue)) ||
        initiatives.some((i) => i.keyResultId === kr.id) ||
        tasks.some((t) => t.initiative?.keyResultId === kr.id)
    );
  }

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


  // 5. Process KPIs (Master KPI)
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

  initiatives.forEach((ini) => {
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

  tasks.forEach((t) => {
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

  // ponytail: avgSprintAchievementPct is computed from scoped Key Results sprint achievement per department/role.
  const avgSprintAchievementPct =
    krReportItems.length > 0
      ? Math.round(
          (krReportItems.reduce((s, kr) => s + kr.sprintAchievementPct, 0) /
            krReportItems.length) *
            10
        ) / 10
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

export async function getPendingSprintItemsService(sprintId: string) {
  const currentSprint = await prisma.sprint.findUnique({ where: { id: sprintId } });
  if (!currentSprint) throw new Error("Sprint tidak ditemukan");

  const nextSprint = await prisma.sprint.findFirst({
    where: { startDate: { gt: currentSprint.startDate } },
    orderBy: { startDate: "asc" },
  });

  const initiatives = await prisma.initiative.findMany({
    where: {
      sprintId,
      isActive: true,
      kanbanStatus: { notIn: ["DONE", "DROP"] },
    },
    select: {
      id: true,
      title: true,
      kanbanStatus: true,
      currentValue: true,
      targetValue: true,
      unit: true,
      owner: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
    },
  });

  const tasks = await prisma.task.findMany({
    where: {
      sprintId,
      isActive: true,
      kanbanStatus: { notIn: ["DONE", "DROP", "CLOSED"] },
      status: { not: "DONE" },
    },
    select: {
      id: true,
      title: true,
      kanbanStatus: true,
      currentValue: true,
      targetValue: true,
      unit: true,
      assignedTeamMember: { select: { id: true, name: true } },
      initiative: { select: { id: true, title: true } },
    },
  });

  return {
    sprint: currentSprint,
    nextSprint,
    initiatives,
    tasks,
  };
}

export async function carryOverInitiativeService(
  initiativeId: string,
  userId?: string,
  req?: any
) {
  const ini = await prisma.initiative.findUnique({
    where: { id: initiativeId },
    include: { sprint: true },
  });
  if (!ini) throw new Error("Inisiatif tidak ditemukan");

  let refDate: Date = new Date();
  if (ini.sprint?.startDate) {
    refDate = ini.sprint.startDate;
  } else if (ini.startDate) {
    refDate = new Date(ini.startDate);
  } else {
    const active = await prisma.sprint.findFirst({ where: { status: "ACTIVE" } });
    if (active?.startDate) refDate = active.startDate;
  }

  const nextSprint = await prisma.sprint.findFirst({
    where: { startDate: { gt: refDate } },
    orderBy: { startDate: "asc" },
  });

  if (!nextSprint) {
    throw new Error("Sprint selanjutnya belum dibuat di sistem. Silakan hubungi Admin untuk generate/buat sprint berikutnya.");
  }

  const updated = await prisma.initiative.update({
    where: { id: initiativeId },
    data: {
      sprintId: nextSprint.id,
      sprintMonth: nextSprint.name,
    },
    include: {
      sprint: true,
    },
  });

  await prisma.task.updateMany({
    where: {
      initiativeId,
      ...(ini.sprintId ? { sprintId: ini.sprintId } : {}),
    },
    data: {
      sprintId: nextSprint.id,
      sprintMonth: nextSprint.name,
    },
  });

  await logAudit(prisma, {
    userId,
    action: "CARRY_OVER_INITIATIVE",
    entityType: "INITIATIVE",
    entityId: initiativeId,
    oldValues: { sprintId: ini.sprintId, sprintMonth: ini.sprintMonth },
    newValues: { sprintId: nextSprint.id, sprintMonth: nextSprint.name },
    req,
  });

  return { initiative: updated, nextSprint };
}

export async function carryOverTaskService(
  taskId: string,
  userId?: string,
  req?: any
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { sprint: true, initiative: { include: { sprint: true } } },
  });
  if (!task) throw new Error("Task tidak ditemukan");

  let refDate: Date = new Date();
  if (task.sprint?.startDate) {
    refDate = task.sprint.startDate;
  } else if (task.initiative?.sprint?.startDate) {
    refDate = task.initiative.sprint.startDate;
  } else if (task.startDate) {
    refDate = new Date(task.startDate);
  } else {
    const active = await prisma.sprint.findFirst({ where: { status: "ACTIVE" } });
    if (active?.startDate) refDate = active.startDate;
  }

  const nextSprint = await prisma.sprint.findFirst({
    where: { startDate: { gt: refDate } },
    orderBy: { startDate: "asc" },
  });

  if (!nextSprint) {
    throw new Error("Sprint selanjutnya belum dibuat di sistem. Silakan hubungi Admin untuk generate/buat sprint berikutnya.");
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      sprintId: nextSprint.id,
      sprintMonth: nextSprint.name,
      baselineValue: task.currentValue || 0,
    },
    include: { sprint: true },
  });

  await logAudit(prisma, {
    userId,
    action: "CARRY_OVER_TASK",
    entityType: "TASK",
    entityId: taskId,
    oldValues: { sprintId: task.sprintId, sprintMonth: task.sprintMonth },
    newValues: { sprintId: nextSprint.id, sprintMonth: nextSprint.name, baselineValue: task.currentValue || 0 },
    req,
  });

  return { task: updated, nextSprint };
}


