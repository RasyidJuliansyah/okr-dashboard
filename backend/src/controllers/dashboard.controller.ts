import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";
import { getDepartmentLeaderInfo, getLeaderTeamIds } from "./initiative.controller";
import { calculateProgressPercent, calculateAutoStatus } from "../utils/progress";
import * as sprintService from "../services/sprint.service";

const prisma = new PrismaClient();

/**
 * Helper: Hitung progress satu inisiatif berdasarkan active task atau currentValue / targetValue.
 */
function computeSingleInitiativeProgress(init: {
  currentValue?: number | null;
  achievedValue?: number | null;
  targetValue: number;
  targetType?: string | null;
  tasks?: Array<{
    currentValue: number;
    targetValue: number;
    targetType?: string | null;
    baselineValue?: number | null;
  }>;
}): number {
  const activeTasks = init.tasks || [];
  if (activeTasks.length > 0) {
    const sumTask = activeTasks.reduce((sum, t) => {
      const tVal = t.targetValue || 0;
      return (
        sum +
        (tVal > 0
          ? calculateProgressPercent(
              t.currentValue,
              tVal,
              t.targetType || undefined,
              t.baselineValue || 0,
            )
          : 0)
      );
    }, 0);
    return Math.round((sumTask / activeTasks.length) * 10) / 10;
  }
  const val =
    init.achievedValue !== null && init.achievedValue !== undefined
      ? init.achievedValue
      : init.currentValue || 0;
  return init.targetValue > 0
    ? calculateProgressPercent(val, init.targetValue, init.targetType || undefined)
    : 0;
}

// ponytail: read kr.currentValue directly from DB; cascade maintains truth
function computeKrProgress(kr: {
  currentValue: number;
  targetValue: number;
  targetType?: string | null;
  initiatives?: Array<{
    currentValue?: number | null;
    achievedValue?: number | null;
    targetValue: number;
    targetType?: string | null;
    tasks?: Array<{
      currentValue: number;
      targetValue: number;
      targetType?: string | null;
      baselineValue?: number | null;
    }>;
  }>;
}): number {
  return kr.targetValue > 0
    ? calculateProgressPercent(kr.currentValue, kr.targetValue, kr.targetType || undefined)
    : 0;
}

function computeKrProgressAndStatus(kr: any, sprintId?: string | null) {
  const st = kr.sprintTargets?.[0];
  let pct = 0;
  let currentVal = kr.currentValue;
  let targetVal = kr.targetValue;
  let status = kr.status;

  if (st && st.targetValue > 0) {
    currentVal = st.currentValue;
    targetVal = st.targetValue;
    pct = calculateProgressPercent(
      st.currentValue,
      st.targetValue,
      kr.targetType || undefined,
      st.baselineValue || 0,
    );
    status = kr.isManualOverride ? kr.status : calculateAutoStatus(pct);
  } else if (sprintId) {
    const sprintInis = kr.initiatives || [];
    if (sprintInis.length > 0) {
      const sumProg = sprintInis.reduce((s: number, ini: any) => {
        return s + computeSingleInitiativeProgress(ini);
      }, 0);
      const avgPercent = (sumProg / sprintInis.length) / 100;
      if (kr.targetType === "AT_MOST") {
        currentVal = Math.round((1 - avgPercent) * kr.targetValue * 100) / 100;
      } else {
        currentVal = Math.round(avgPercent * kr.targetValue * 100) / 100;
      }
      targetVal = kr.targetValue;
      pct = kr.targetValue > 0 ? calculateProgressPercent(currentVal, targetVal, kr.targetType || undefined) : 0;
      status = kr.isManualOverride ? kr.status : (pct === 0 ? "NOT_STARTED" : calculateAutoStatus(pct));
    } else {
      pct = 0;
      currentVal = 0;
      targetVal = kr.targetValue;
      status = "NOT_STARTED";
    }
  } else {
    pct = computeKrProgress(kr);
    status = kr.isManualOverride ? kr.status : calculateAutoStatus(pct);
  }

  return {
    progress: pct,
    status,
    currentValue: currentVal,
    targetValue: targetVal,
    annualCurrentValue: kr.currentValue,
    annualTargetValue: kr.targetValue,
    sprintTarget: st || null,
  };
}

export async function getDashboardSummary(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id: userId, role } = req.user;

    const monthParam = (
      (req.query.sprintId as string | undefined) ||
      (req.query.month as string | undefined)
    )?.trim();
    const yearParam = (req.query.year as string | undefined)?.trim();

    let resolvedSprint: any = null;
    if (monthParam) {
      resolvedSprint = await sprintService.resolveSprint({
        sprintId: monthParam,
        sprintMonth: monthParam,
        fallbackToActive: false,
      });
      if (!resolvedSprint) {
        resolvedSprint = await prisma.sprint.findFirst({
          where: {
            OR: [
              { id: monthParam },
              { name: monthParam },
              { name: { contains: monthParam } },
            ],
          },
        });
      }
    }

    if (!resolvedSprint) {
      const currentYear = yearParam || new Date().getFullYear();
      resolvedSprint = await sprintService.getActiveSprint(currentYear);
      if (!resolvedSprint) {
        resolvedSprint = await sprintService.getActiveSprint();
      }
    }

    const resolvedSprintId = resolvedSprint?.id || null;
    const resolvedMonth = resolvedSprint?.name || monthParam || null;
    const sprintMeta = resolvedSprint
      ? {
          id: resolvedSprint.id,
          name: resolvedSprint.name,
          startDate: resolvedSprint.startDate,
          endDate: resolvedSprint.endDate,
          status: resolvedSprint.status,
          year: resolvedSprint.year,
        }
      : null;

    const sprintFilter = resolvedSprintId
      ? {
          OR: [
            { sprintId: resolvedSprintId },
            { sprintMonth: resolvedSprintId },
            ...(resolvedMonth ? [{ sprintMonth: resolvedMonth }] : []),
            {
              tasks: {
                some: {
                  isActive: true,
                  OR: [
                    { sprintId: resolvedSprintId },
                    { sprintMonth: resolvedSprintId },
                    ...(resolvedMonth ? [{ sprintMonth: resolvedMonth }] : []),
                  ],
                },
              },
            },
          ],
        }
      : null;

    const taskSprintFilter = resolvedSprintId
      ? {
          OR: [
            { sprintId: resolvedSprintId },
            { sprintMonth: resolvedSprintId },
            ...(resolvedMonth ? [{ sprintMonth: resolvedMonth }] : []),
            ...(resolvedSprint?.startDate && resolvedSprint?.endDate
              ? [
                  {
                    finishDate: {
                      gte: new Date(resolvedSprint.startDate),
                      lte: new Date(resolvedSprint.endDate),
                    },
                  },
                ]
              : []),
          ],
        }
      : null;

    // --- Ambil data user dari DB ---
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true, department: true },
    });

    // --- TEAM: hanya lihat Initiative & Task milik tim/pribadi ---
    if (role === "TEAM") {
      const initiatives = dbUser?.teamId
        ? await prisma.initiative.findMany({
            where: {
              teamId: dbUser.teamId,
              isActive: true,
              ...(sprintFilter ? { AND: [sprintFilter] } : {}),
            },
            include: {
              keyResult: {
                select: {
                  id: true,
                  title: true,
                  bscPerspective: true,
                  currentValue: true,
                  targetValue: true,
                  targetType: true,
                  unit: true,
                  status: true,
                },
              },
              tasks: {
                where: {
                  isActive: true,
                  ...(taskSprintFilter ? { AND: [taskSprintFilter] } : {}),
                },
                include: {
                  assignments: { where: { userId }, select: { userId: true } },
                },
              },
            },
          })
        : [];

      const myTasks = await prisma.task.findMany({
        where: {
          isActive: true,
          OR: [
            { assignedTeamMemberId: userId },
            { assignments: { some: { userId } } },
          ],
          ...(taskSprintFilter ? { AND: [taskSprintFilter] } : {}),
        },
        include: {
          initiative: {
            select: {
              id: true,
              title: true,
              teamId: true,
              keyResultId: true,
              keyResult: {
                select: {
                  id: true,
                  title: true,
                  bscPerspective: true,
                  currentValue: true,
                  targetValue: true,
                  targetType: true,
                  unit: true,
                  status: true,
                },
              },
            },
          },
          updates: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      // Kumpulkan Key Result terkait scope Team (inisiatif tim, task user, atau penugasan RACI)
      const scopedKrMap = new Map<string, any>();
      initiatives.forEach((ini: any) => {
        if (ini.keyResult) scopedKrMap.set(ini.keyResult.id, ini.keyResult);
      });
      myTasks.forEach((task: any) => {
        if (task.initiative?.keyResult) {
          scopedKrMap.set(task.initiative.keyResult.id, task.initiative.keyResult);
        }
      });
      const myKrAssignments = await prisma.krAssignment.findMany({
        where: { userId },
        include: {
          keyResult: {
            select: {
              id: true,
              title: true,
              bscPerspective: true,
              currentValue: true,
              targetValue: true,
              targetType: true,
              unit: true,
              status: true,
            },
          },
        },
      });
      myKrAssignments.forEach((assign: any) => {
        if (assign.keyResult) {
          scopedKrMap.set(assign.keyResult.id, assign.keyResult);
        }
      });
      const scopedKrIds = Array.from(scopedKrMap.keys());
      const scopedKrDetails =
        scopedKrIds.length > 0
          ? await prisma.keyResult.findMany({
              where: { id: { in: scopedKrIds }, isActive: true },
              include: {
                initiatives: {
                  where: {
                    isActive: true,
                    ...(sprintFilter ? { AND: [sprintFilter] } : {}),
                  },
                  include: {
                    tasks: {
                      where: {
                        isActive: true,
                        ...(taskSprintFilter ? { AND: [taskSprintFilter] } : {}),
                      },
                    },
                  },
                },
                ...(resolvedSprintId
                  ? { sprintTargets: { where: { sprintId: resolvedSprintId } } }
                  : {}),
              },
            })
          : [];

      let totalCount = 0,
        sumProgress = 0,
        onTrackCount = 0,
        atRiskCount = 0,
        offTrackCount = 0,
        behindCount = 0,
        notStartedCount = 0;

      // Metrik TEAM dihitung dari agregat KR yang diampu jika ada, fallback ke Task / Initiative
      let mappedScopedKrs: any[] = [];
      if (scopedKrDetails.length > 0) {
        totalCount = scopedKrDetails.length;
        mappedScopedKrs = scopedKrDetails.map((kr: any) => {
          const computed = computeKrProgressAndStatus(kr, resolvedSprintId);
          sumProgress += computed.progress;
          const s = String(computed.status || "").toUpperCase();
          if (s === "ON_TRACK") onTrackCount++;
          else if (s === "AT_RISK") atRiskCount++;
          else if (s === "OFF_TRACK" || s === "BEHIND") {
            offTrackCount++;
            behindCount++;
          }
          if (computed.progress === 0 || s === "NOT_STARTED") {
            notStartedCount++;
          }
          return { ...kr, ...computed };
        });
      } else if (myTasks.length > 0) {
        totalCount = myTasks.length;
        myTasks.forEach((task: any) => {
          const tVal = task.targetValue || 0;
          const pct =
            tVal > 0
              ? calculateProgressPercent(
                  task.currentValue,
                  tVal,
                  task.targetType || undefined,
                  task.baselineValue || 0,
                )
              : 0;
          sumProgress += pct;
          const status = calculateAutoStatus(pct);
          const s = String(status || "").toUpperCase();
          if (s === "ON_TRACK") onTrackCount++;
          else if (s === "AT_RISK") atRiskCount++;
          else if (s === "OFF_TRACK" || s === "BEHIND") {
            offTrackCount++;
            behindCount++;
          }
          if (pct === 0 || s === "NOT_STARTED") {
            notStartedCount++;
          }
        });
      } else if (initiatives.length > 0) {
        totalCount = initiatives.length;
        initiatives.forEach((ini: any) => {
          const initProgress = computeSingleInitiativeProgress(ini);
          sumProgress += initProgress;
          const status = calculateAutoStatus(initProgress);
          const s = String(status || "").toUpperCase();
          if (s === "ON_TRACK") onTrackCount++;
          else if (s === "AT_RISK") atRiskCount++;
          else if (s === "OFF_TRACK" || s === "BEHIND") {
            offTrackCount++;
            behindCount++;
          }
          if (initProgress === 0 || s === "NOT_STARTED") {
            notStartedCount++;
          }
        });
      }

      return res.status(200).json({
        role,
        scope: "team",
        month: resolvedMonth,
        sprint: sprintMeta,
        resolvedSprint: sprintMeta,
        metrics: {
          totalObjectives: initiatives.length,
          totalKeyResults: totalCount,
          averageProgress:
            Math.round((totalCount > 0 ? sumProgress / totalCount : 0) * 10) /
            10,
          onTrackCount,
          atRiskCount,
          offTrackCount,
          behindCount,
          notStartedCount,
        },
        initiatives,
        myTasks,
        keyResults: mappedScopedKrs.length > 0 ? mappedScopedKrs : Array.from(scopedKrMap.values()),
      });
    }

    // --- LEADER: KR (read-only, konteks) + Initiative dari semua Tim yang dipimpin/dimiliki ---
    if (role === "LEADER") {
      const leadingTeams = await prisma.team.findMany({
        where: {
          OR: [
            { leaderId: userId },
            ...(dbUser?.teamId ? [{ id: dbUser.teamId }] : []),
          ],
        },
        select: { id: true, name: true },
      });
      const leaderTeamIds = leadingTeams.map((t) => t.id);

      const initiatives = await prisma.initiative.findMany({
        where: {
          isActive: true,
          OR: [
            { teamId: { in: leaderTeamIds } },
            { ownerId: userId },
            { assignedLeaderId: userId },
          ],
          ...(sprintFilter ? { AND: [sprintFilter] } : {}),
        },
        include: {
          keyResult: {
            select: {
              id: true,
              title: true,
              bscPerspective: true,
              currentValue: true,
              targetValue: true,
              targetType: true,
              unit: true,
              status: true,
            },
          },
          team: { select: { id: true, name: true } },
          tasks: {
            where: {
              isActive: true,
              ...(taskSprintFilter ? { AND: [taskSprintFilter] } : {}),
            },
          },
        },
      });

      // Kumpulkan Key Result terkait scope Leader (inisiatif tim/lead, atau penugasan RACI)
      const leaderKrMap = new Map<string, any>();
      initiatives.forEach((ini: any) => {
        if (ini.keyResult) leaderKrMap.set(ini.keyResult.id, ini.keyResult);
      });
      const leaderKrAssignments = await prisma.krAssignment.findMany({
        where: { userId },
        include: {
          keyResult: {
            select: {
              id: true,
              title: true,
              bscPerspective: true,
              currentValue: true,
              targetValue: true,
              targetType: true,
              unit: true,
              status: true,
            },
          },
        },
      });
      leaderKrAssignments.forEach((assign: any) => {
        if (assign.keyResult) {
          leaderKrMap.set(assign.keyResult.id, assign.keyResult);
        }
      });
      const leaderKrIds = Array.from(leaderKrMap.keys());
      const leaderKrDetails =
        leaderKrIds.length > 0
          ? await prisma.keyResult.findMany({
              where: { id: { in: leaderKrIds }, isActive: true },
              include: {
                initiatives: {
                  where: {
                    isActive: true,
                    ...(sprintFilter ? { AND: [sprintFilter] } : {}),
                  },
                  include: {
                    tasks: {
                      where: {
                        isActive: true,
                        ...(taskSprintFilter ? { AND: [taskSprintFilter] } : {}),
                      },
                    },
                  },
                },
                ...(resolvedSprintId
                  ? { sprintTargets: { where: { sprintId: resolvedSprintId } } }
                  : {}),
              },
            })
          : [];

      let totalCount = 0,
        sumProgress = 0,
        onTrackCount = 0,
        atRiskCount = 0,
        offTrackCount = 0,
        behindCount = 0,
        notStartedCount = 0;

      // Metrik LEADER dihitung dari agregat KR yang diampu jika ada, fallback ke Inisiatif tim
      let mappedLeaderKrs: any[] = [];
      if (leaderKrDetails.length > 0) {
        totalCount = leaderKrDetails.length;
        mappedLeaderKrs = leaderKrDetails.map((kr: any) => {
          const computed = computeKrProgressAndStatus(kr, resolvedSprintId);
          sumProgress += computed.progress;
          const s = String(computed.status || "").toUpperCase();
          if (s === "ON_TRACK") onTrackCount++;
          else if (s === "AT_RISK") atRiskCount++;
          else if (s === "OFF_TRACK" || s === "BEHIND") {
            offTrackCount++;
            behindCount++;
          }
          if (computed.progress === 0 || s === "NOT_STARTED") {
            notStartedCount++;
          }
          return { ...kr, ...computed };
        });
      } else if (initiatives.length > 0) {
        totalCount = initiatives.length;
        initiatives.forEach((ini: any) => {
          const initProgress = computeSingleInitiativeProgress(ini);
          sumProgress += initProgress;
          const status = calculateAutoStatus(initProgress);
          const s = String(status || "").toUpperCase();
          if (s === "ON_TRACK") onTrackCount++;
          else if (s === "AT_RISK") atRiskCount++;
          else if (s === "OFF_TRACK" || s === "BEHIND") {
            offTrackCount++;
            behindCount++;
          }
          if (initProgress === 0 || s === "NOT_STARTED") {
            notStartedCount++;
          }
        });
      }

      const leaderTeamIdsForApproval = await getLeaderTeamIds(userId);
      if (dbUser?.teamId && !leaderTeamIdsForApproval.includes(dbUser.teamId)) {
        leaderTeamIdsForApproval.push(dbUser.teamId);
      }
      const teamMembers = await prisma.user.findMany({
        where: {
          teamId: { in: leaderTeamIdsForApproval },
          role: "TEAM",
        },
        select: { id: true },
      });
      const teamMemberIds = teamMembers.map((u) => u.id);

      const pendingInitiativeApprovals =
        leaderTeamIdsForApproval.length > 0 && teamMemberIds.length > 0
          ? await prisma.initiativeUpdate.findMany({
              where: {
                status: "PENDING_APPROVAL",
                initiative: { teamId: { in: leaderTeamIdsForApproval } },
                submittedBy: { in: teamMemberIds },
              },
              include: {
                initiative: {
                  include: { team: { select: { id: true, name: true } } },
                },
              },
              orderBy: { createdAt: "desc" },
            })
          : [];

      const leaderTaskOrConditions: any[] = [];
      if (leaderTeamIdsForApproval.length > 0 && teamMemberIds.length > 0) {
        leaderTaskOrConditions.push({
          task: {
            NOT: { isCrossDept: true },
            initiative: { teamId: { in: leaderTeamIdsForApproval } },
          },
          submittedBy: { in: teamMemberIds },
        });
      }
      const leaderCrossDeptOr: any[] = [];
      if (dbUser?.department) {
        leaderCrossDeptOr.push({ targetDept: dbUser.department });
        leaderCrossDeptOr.push({ creatorDept: dbUser.department });
        leaderCrossDeptOr.push({ initiative: { team: { department: dbUser.department } } });
      }
      if (leaderTeamIdsForApproval.length > 0) {
        leaderCrossDeptOr.push({ initiative: { teamId: { in: leaderTeamIdsForApproval } } });
        leaderCrossDeptOr.push({ assignedTeamMember: { teamId: { in: leaderTeamIdsForApproval } } });
      }
      if (leaderCrossDeptOr.length > 0) {
        leaderTaskOrConditions.push({
          task: {
            isCrossDept: true,
            kanbanStatus: "CLOSED",
            OR: leaderCrossDeptOr,
          },
        });
      }
      if (teamMemberIds.length > 0) {
        leaderTaskOrConditions.push({
          task: {
            isCrossDept: true,
            kanbanStatus: "CLOSED",
          },
          submittedBy: { in: teamMemberIds },
        });
      }

      const pendingTaskApprovals =
        leaderTaskOrConditions.length > 0
          ? await prisma.taskUpdate.findMany({
              where: {
                status: "PENDING_APPROVAL",
                OR: leaderTaskOrConditions,
              },
              include: {
                task: {
                  include: {
                    initiative: {
                      include: { team: { select: { id: true, name: true } } },
                    },
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            })
          : [];

      const pendingSubmitterIds = new Set<string>();
      pendingInitiativeApprovals.forEach((u) => {
        if (u.submittedBy) pendingSubmitterIds.add(u.submittedBy);
      });
      pendingTaskApprovals.forEach((t) => {
        if (t.submittedBy) pendingSubmitterIds.add(t.submittedBy);
      });

      const submitterUsers =
        pendingSubmitterIds.size > 0
          ? await prisma.user.findMany({
              where: { id: { in: Array.from(pendingSubmitterIds) } },
              select: {
                id: true,
                name: true,
                email: true,
                position: true,
                role: true,
              },
            })
          : [];
      const submitterMap = new Map(submitterUsers.map((u) => [u.id, u]));

      const mappedPendingInitiativeApprovals = pendingInitiativeApprovals.map(
        (u: any) => ({
          ...u,
          submitter: submitterMap.get(u.submittedBy) || null,
          type: "INITIATIVE",
        }),
      );

      const mappedPendingTaskApprovals = pendingTaskApprovals.map((t: any) => ({
        id: t.id,
        initiativeId: t.task.initiativeId,
        initiative: {
          id: t.task.initiativeId,
          title: t.task.initiative
            ? `[TASK] ${t.task.title} (Inisiatif: ${t.task.initiative.title})`
            : (t.task.isCrossDept
                ? `[TASK] ${t.task.title} (Lintas Dept: ${t.task.creatorDept || "?"} → ${t.task.targetDept || "?"})`
                : `[TASK] ${t.task.title}`),
          team: t.task.initiative?.team || null,
        },
        oldValue: t.oldValue,
        newValue: t.newValue,
        note: t.note,
        link: t.link,
        status: t.status,
        submittedBy: t.submittedBy,
        submitter: submitterMap.get(t.submittedBy) || null,
        createdAt: t.createdAt,
        type: "TASK",
        isCrossDept: Boolean(t.task.isCrossDept),
        creatorDept: t.task.creatorDept || null,
        targetDept: t.task.targetDept || null,
      }));

      const pendingApprovals = [
        ...mappedPendingInitiativeApprovals,
        ...mappedPendingTaskApprovals,
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return res.status(200).json({
        role,
        scope: "leader",
        month: resolvedMonth,
        sprint: sprintMeta,
        resolvedSprint: sprintMeta,
        metrics: {
          totalObjectives: initiatives.length,
          totalKeyResults: totalCount,
          averageProgress:
            Math.round((totalCount > 0 ? sumProgress / totalCount : 0) * 10) /
            10,
          onTrackCount,
          atRiskCount,
          offTrackCount,
          behindCount,
          notStartedCount,
        },
        leadingTeams,
        initiatives,
        keyResults: mappedLeaderKrs.length > 0 ? mappedLeaderKrs : Array.from(leaderKrMap.values()),
        pendingApprovals,
      });
    }

    // --- MANAGER: Objective & KR yang KrDepartment-nya cocok dengan dept Manager ---
    if (role === "MANAGER") {
      const managedDepts = await prisma.department.findMany({
        where: { managerId: userId },
        select: { value: true },
      });
      const deptValues = managedDepts.map((d) => d.value);
      if (
        dbUser?.department &&
        dbUser.department.toUpperCase() !== "STRATEGIC" &&
        !deptValues.includes(dbUser.department)
      ) {
        deptValues.push(dbUser.department);
      }
      const managerDept = deptValues.join(", ") || dbUser?.department || "";

      let objectives: any[] = [];
      if (deptValues.length > 0) {
        objectives = await prisma.objective.findMany({
          where: {
            isActive: true,
            keyResults: {
              some: {
                isActive: true,
                departments: { some: { department: { in: deptValues } } },
              },
            },
          },
          include: {
            keyResults: {
              where: {
                isActive: true,
                departments: { some: { department: { in: deptValues } } },
              },
              include: {
                assignments: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        department: true,
                        role: true,
                      },
                    },
                  },
                },
                departments: true,
                initiatives: {
                  where: {
                    isActive: true,
                    ...(sprintFilter ? { AND: [sprintFilter] } : {}),
                  },
                  include: {
                    tasks: {
                      where: {
                        isActive: true,
                        ...(taskSprintFilter ? { AND: [taskSprintFilter] } : {}),
                      },
                    },
                  },
                },
                ...(resolvedSprintId
                  ? { sprintTargets: { where: { sprintId: resolvedSprintId } } }
                  : {}),
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });
      }

      const leaderInfo = await getDepartmentLeaderInfo(deptValues);
      const deptsWithLeaderArr = Array.from(leaderInfo.deptsWithLeader);
      const deptsWithoutLeaderArr = Array.from(leaderInfo.deptsWithoutLeader);

      const initiativeOrConditions: any[] = [];
      const taskOrConditions: any[] = [];

      if (deptsWithLeaderArr.length > 0 && leaderInfo.leaderUserIds.length > 0) {
        initiativeOrConditions.push({
          initiative: {
            team: { department: { in: deptsWithLeaderArr } },
          },
          submittedBy: { in: leaderInfo.leaderUserIds },
        });

        taskOrConditions.push({
          task: {
            NOT: { isCrossDept: true },
            OR: [
              { initiative: { team: { department: { in: deptsWithLeaderArr } } } },
              { targetDept: { in: deptsWithLeaderArr } },
              { creatorDept: { in: deptsWithLeaderArr } },
            ],
          },
          submittedBy: { in: leaderInfo.leaderUserIds },
        });
      }

      if (deptsWithoutLeaderArr.length > 0) {
        initiativeOrConditions.push({
          initiative: {
            team: { department: { in: deptsWithoutLeaderArr } },
          },
        });

        taskOrConditions.push({
          task: {
            NOT: { isCrossDept: true },
            OR: [
              { initiative: { team: { department: { in: deptsWithoutLeaderArr } } } },
              { targetDept: { in: deptsWithoutLeaderArr } },
              { creatorDept: { in: deptsWithoutLeaderArr } },
            ],
          },
        });
      }

      // Cross-department tasks: closed card, matching manager's departments
      if (deptValues.length > 0) {
        const deptUsers = await prisma.user.findMany({
          where: { department: { in: deptValues } },
          select: { id: true },
        });
        const deptUserIds = deptUsers.map((u) => u.id);

        const crossDeptTaskOr: any[] = [
          { initiative: { team: { department: { in: deptValues } } } },
          { targetDept: { in: deptValues } },
          { creatorDept: { in: deptValues } },
        ];

        taskOrConditions.push({
          task: {
            isCrossDept: true,
            kanbanStatus: "CLOSED",
            OR: crossDeptTaskOr,
          },
        });

        if (deptUserIds.length > 0) {
          taskOrConditions.push({
            task: {
              isCrossDept: true,
              kanbanStatus: "CLOSED",
            },
            submittedBy: { in: deptUserIds },
          });
        }
      }

      // Approval queue: InitiativeUpdate PENDING dari team di dept ini
      const pendingInitiativeApprovals = initiativeOrConditions.length > 0
        ? await prisma.initiativeUpdate.findMany({
            where: {
              status: "PENDING_APPROVAL",
              OR: initiativeOrConditions,
            },
            include: {
              initiative: {
                include: { team: { select: { id: true, name: true } } },
              },
            },
            orderBy: { createdAt: "desc" },
          })
        : [];

      // TaskUpdate PENDING dari team di dept ini
      const pendingTaskApprovals = taskOrConditions.length > 0
        ? await prisma.taskUpdate.findMany({
            where: {
              status: "PENDING_APPROVAL",
              OR: taskOrConditions,
            },
            include: {
              task: {
                include: {
                  initiative: {
                    include: { team: { select: { id: true, name: true } } },
                  },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          })
        : [];

      const pendingSubmitterIds = new Set<string>();
      pendingInitiativeApprovals.forEach((u) => {
        if (u.submittedBy) pendingSubmitterIds.add(u.submittedBy);
      });
      pendingTaskApprovals.forEach((t) => {
        if (t.submittedBy) pendingSubmitterIds.add(t.submittedBy);
      });

      const submitterUsers =
        pendingSubmitterIds.size > 0
          ? await prisma.user.findMany({
              where: { id: { in: Array.from(pendingSubmitterIds) } },
              select: {
                id: true,
                name: true,
                email: true,
                position: true,
                role: true,
              },
            })
          : [];
      const submitterMap = new Map(submitterUsers.map((u) => [u.id, u]));

      const mappedPendingInitiativeApprovals = pendingInitiativeApprovals.map(
        (u: any) => ({
          ...u,
          submitter: submitterMap.get(u.submittedBy) || null,
          type: "INITIATIVE",
        }),
      );

      const mappedPendingTaskApprovals = pendingTaskApprovals.map((t: any) => ({
        id: t.id,
        initiativeId: t.task.initiativeId,
        initiative: {
          id: t.task.initiativeId,
          title: t.task.initiative
            ? `[TASK] ${t.task.title} (Inisiatif: ${t.task.initiative.title})`
            : (t.task.isCrossDept
                ? `[TASK] ${t.task.title} (Lintas Dept: ${t.task.creatorDept || "?"} → ${t.task.targetDept || "?"})`
                : `[TASK] ${t.task.title}`),
          team: t.task.initiative?.team || null,
        },
        oldValue: t.oldValue,
        newValue: t.newValue,
        note: t.note,
        link: t.link,
        status: t.status,
        submittedBy: t.submittedBy,
        submitter: submitterMap.get(t.submittedBy) || null,
        createdAt: t.createdAt,
        type: "TASK",
        isCrossDept: Boolean(t.task.isCrossDept),
        creatorDept: t.task.creatorDept || null,
        targetDept: t.task.targetDept || null,
      }));

      const pendingApprovals = [
        ...mappedPendingInitiativeApprovals,
        ...mappedPendingTaskApprovals,
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Hitung metrics KR & kumpulkan inisiatif untuk agregat progress inisiatif
      let totalKRs = 0,
        sumProgress = 0,
        onTrackCount = 0,
        atRiskCount = 0,
        offTrackCount = 0,
        behindCount = 0,
        notStartedCount = 0;
      const allInitiatives: any[] = [];
      const detailedObjectives = objectives.map((obj) => {
        const keyResultsWithProgress = obj.keyResults.map((kr: any) => {
          totalKRs++;
          if (kr.initiatives && kr.initiatives.length > 0) {
            allInitiatives.push(...kr.initiatives);
          }
          const computed = computeKrProgressAndStatus(kr, resolvedSprintId);
          sumProgress += computed.progress;
          const s = String(computed.status || "").toUpperCase();
          if (s === "ON_TRACK") onTrackCount++;
          else if (s === "AT_RISK") atRiskCount++;
          else if (s === "OFF_TRACK" || s === "BEHIND") {
            offTrackCount++;
            behindCount++;
          }
          if (computed.progress === 0 || s === "NOT_STARTED") {
            notStartedCount++;
          }
          return { ...kr, ...computed };
        });
        const avgObjProgress =
          keyResultsWithProgress.length > 0
            ? Math.round(
                (keyResultsWithProgress.reduce(
                  (a: number, k: any) => a + k.progress,
                  0,
                ) /
                  keyResultsWithProgress.length) *
                  10,
              ) / 10
            : 0;
        return {
          ...obj,
          keyResults: keyResultsWithProgress,
          progress: avgObjProgress,
        };
      });

      // Agregat averageProgress: berdasarkan rata-rata progress KR yang diampu Manager
      const avgProgress =
        Math.round((totalKRs > 0 ? sumProgress / totalKRs : 0) * 10) / 10;

      return res.status(200).json({
        role,
        scope: "department",
        department: managerDept,
        month: resolvedMonth,
        sprint: sprintMeta,
        resolvedSprint: sprintMeta,
        metrics: {
          totalObjectives: objectives.length,
          totalKeyResults: totalKRs,
          totalInitiatives: allInitiatives.length,
          averageProgress: avgProgress,
          onTrackCount,
          atRiskCount,
          offTrackCount,
          behindCount,
          notStartedCount,
        },
        objectives: detailedObjectives,
        pendingApprovals,
      });
    }

    // --- C_LEVEL & ADMIN: Semua data ---
    const objectives = await prisma.objective.findMany({
      where: { isActive: true },
      include: {
        keyResults: {
          where: { isActive: true },
          include: {
            assignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    department: true,
                    role: true,
                  },
                },
              },
              orderBy: { raciRole: "asc" },
            },
            departments: true,
            initiatives: {
              where: {
                isActive: true,
                ...(sprintFilter ? { AND: [sprintFilter] } : {}),
              },
              include: {
                tasks: {
                  where: {
                    isActive: true,
                    ...(taskSprintFilter ? { AND: [taskSprintFilter] } : {}),
                  },
                },
              },
            },
            ...(resolvedSprintId
              ? { sprintTargets: { where: { sprintId: resolvedSprintId } } }
              : {}),
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Hitung metrics KR & kumpulkan inisiatif untuk agregat progress inisiatif
    let totalKRs = 0,
      sumProgress = 0,
      onTrackCount = 0,
      atRiskCount = 0,
      offTrackCount = 0,
      behindCount = 0,
      notStartedCount = 0;
    const allInitiatives: any[] = [];
    const detailedObjectives = objectives.map((obj) => {
      const keyResultsWithProgress = obj.keyResults.map((kr: any) => {
        totalKRs++;
        if (kr.initiatives && kr.initiatives.length > 0) {
          allInitiatives.push(...kr.initiatives);
        }
        const computed = computeKrProgressAndStatus(kr, resolvedSprintId);
        sumProgress += computed.progress;
        const s = String(computed.status || "").toUpperCase();
        if (s === "ON_TRACK") onTrackCount++;
        else if (s === "AT_RISK") atRiskCount++;
        else if (s === "OFF_TRACK" || s === "BEHIND") {
          offTrackCount++;
          behindCount++;
        }
        if (computed.progress === 0 || s === "NOT_STARTED") {
          notStartedCount++;
        }
        return { ...kr, ...computed };
      });
      const avgObjProgress =
        keyResultsWithProgress.length > 0
          ? Math.round(
              (keyResultsWithProgress.reduce((a: number, k: any) => a + k.progress, 0) /
                keyResultsWithProgress.length) *
                10,
            ) / 10
          : 0;
      return {
        ...obj,
        keyResults: keyResultsWithProgress,
        progress: avgObjProgress,
      };
    });

    // Agregat averageProgress: berdasarkan rata-rata progress seluruh KR perusahaan
    const avgProgress =
      Math.round((totalKRs > 0 ? sumProgress / totalKRs : 0) * 10) / 10;

    return res.status(200).json({
      role,
      scope: "company",
      month: resolvedMonth,
      sprint: sprintMeta,
      resolvedSprint: sprintMeta,
      metrics: {
        totalObjectives: objectives.length,
        totalKeyResults: totalKRs,
        totalInitiatives: allInitiatives.length,
        averageProgress: avgProgress,
        onTrackCount,
        atRiskCount,
        offTrackCount,
        behindCount,
        notStartedCount,
      },
      objectives: detailedObjectives,
    });
  } catch (error) {
    console.error("Get dashboard summary error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
