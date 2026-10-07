import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";
import { getDepartmentLeaderInfo } from "./initiative.controller";
import { calculateProgressPercent, calculateAutoStatus } from "../utils/progress";

const prisma = new PrismaClient();

/**
 * Helper: Hitung progress riil Key Result berdasarkan inisiatif & task aktif di dalamnya.
 * Jika tidak ada inisiatif, fallback ke currentValue / targetValue milik KR itu sendiri.
 */
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
  if (kr.initiatives && kr.initiatives.length > 0) {
    const initProgressList = kr.initiatives.map((init) => {
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
    });
    const avg =
      initProgressList.reduce((s, p) => s + p, 0) / initProgressList.length;
    return Math.round(avg * 10) / 10;
  }

  return kr.targetValue > 0
    ? calculateProgressPercent(kr.currentValue, kr.targetValue, kr.targetType || undefined)
    : 0;
}

export async function getDashboardSummary(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id: userId, role } = req.user;

    // --- Ambil data user dari DB ---
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true, department: true },
    });

    // --- TEAM: hanya lihat Initiative & Task milik tim/pribadi ---
    if (role === "TEAM") {
      const initiatives = dbUser?.teamId
        ? await prisma.initiative.findMany({
            where: { teamId: dbUser.teamId, isActive: true },
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
                where: { isActive: true },
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
      const scopedKrs = Array.from(scopedKrMap.values());

      let totalCount = 0,
        sumProgress = 0,
        onTrackCount = 0,
        atRiskCount = 0,
        offTrackCount = 0;

      // Metrik TEAM dihitung dari rata-rata kartu Task Saya yang aktif
      if (myTasks.length > 0) {
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
          if (status === "ON_TRACK") onTrackCount++;
          else if (status === "AT_RISK") atRiskCount++;
          else if (status === "OFF_TRACK") offTrackCount++;
        });
      } else if (initiatives.length > 0) {
        totalCount = initiatives.length;
        initiatives.forEach((ini: any) => {
          const val =
            ini.achievedValue !== null && ini.achievedValue !== undefined
              ? ini.achievedValue
              : ini.currentValue || 0;
          const pct =
            ini.targetValue > 0
              ? calculateProgressPercent(val, ini.targetValue, ini.targetType || undefined)
              : 0;
          sumProgress += pct;
          const status = calculateAutoStatus(pct);
          if (status === "ON_TRACK") onTrackCount++;
          else if (status === "AT_RISK") atRiskCount++;
          else if (status === "OFF_TRACK") offTrackCount++;
        });
      }

      return res.status(200).json({
        role,
        scope: "team",
        metrics: {
          totalObjectives: initiatives.length,
          totalKeyResults: totalCount,
          averageProgress:
            Math.round((totalCount > 0 ? sumProgress / totalCount : 0) * 10) /
            10,
          onTrackCount,
          atRiskCount,
          offTrackCount,
        },
        initiatives,
        myTasks,
        keyResults: scopedKrs,
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
          tasks: { where: { isActive: true } },
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
      const leaderKrs = Array.from(leaderKrMap.values());

      let totalCount = 0,
        sumProgress = 0,
        onTrackCount = 0,
        atRiskCount = 0,
        offTrackCount = 0;

      // Metrik LEADER dihitung dari rata-rata kartu Inisiatif tim
      if (initiatives.length > 0) {
        totalCount = initiatives.length;
        initiatives.forEach((ini: any) => {
          let initProgress = 0;
          const activeTasks = ini.tasks || [];
          if (activeTasks.length > 0) {
            const sumTask = activeTasks.reduce((s: number, t: any) => {
              const tVal = t.targetValue || 0;
              return (
                s +
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
            initProgress = Math.round((sumTask / activeTasks.length) * 10) / 10;
          } else {
            const val =
              ini.achievedValue !== null && ini.achievedValue !== undefined
                ? ini.achievedValue
                : ini.currentValue || 0;
            initProgress =
              ini.targetValue > 0
                ? calculateProgressPercent(val, ini.targetValue, ini.targetType || undefined)
                : 0;
          }

          sumProgress += initProgress;
          const status = calculateAutoStatus(initProgress);
          if (status === "ON_TRACK") onTrackCount++;
          else if (status === "AT_RISK") atRiskCount++;
          else if (status === "OFF_TRACK") offTrackCount++;
        });
      }

      return res.status(200).json({
        role,
        scope: "leader",
        metrics: {
          totalObjectives: initiatives.length,
          totalKeyResults: totalCount,
          averageProgress:
            Math.round((totalCount > 0 ? sumProgress / totalCount : 0) * 10) /
            10,
          onTrackCount,
          atRiskCount,
          offTrackCount,
        },
        leadingTeams,
        initiatives,
        keyResults: leaderKrs,
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
                  where: { isActive: true },
                  include: {
                    tasks: { where: { isActive: true } },
                  },
                },
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
            OR: [
              { initiative: { team: { department: { in: deptsWithoutLeaderArr } } } },
              { targetDept: { in: deptsWithoutLeaderArr } },
              { creatorDept: { in: deptsWithoutLeaderArr } },
            ],
          },
        });
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
            : `[TASK] ${t.task.title}`,
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
      }));

      const pendingApprovals = [
        ...mappedPendingInitiativeApprovals,
        ...mappedPendingTaskApprovals,
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Hitung metrics berdasarkan rata-rata progress KR yang diampu Manager
      let totalKRs = 0,
        sumProgress = 0,
        onTrackCount = 0,
        atRiskCount = 0,
        offTrackCount = 0;
      const detailedObjectives = objectives.map((obj) => {
        const keyResultsWithProgress = obj.keyResults.map((kr: any) => {
          totalKRs++;
          const progressPercent = computeKrProgress(kr);
          sumProgress += progressPercent;
          const status = kr.isManualOverride
            ? kr.status
            : calculateAutoStatus(progressPercent);
          if (status === "ON_TRACK") onTrackCount++;
          else if (status === "AT_RISK") atRiskCount++;
          else if (status === "OFF_TRACK") offTrackCount++;
          return { ...kr, progress: progressPercent, status };
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

      return res.status(200).json({
        role,
        scope: "department",
        department: managerDept,
        metrics: {
          totalObjectives: objectives.length,
          totalKeyResults: totalKRs,
          averageProgress:
            Math.round((totalKRs > 0 ? sumProgress / totalKRs : 0) * 10) / 10,
          onTrackCount,
          atRiskCount,
          offTrackCount,
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
              where: { isActive: true },
              include: {
                tasks: { where: { isActive: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let totalKRs = 0,
      sumProgress = 0,
      onTrackCount = 0,
      atRiskCount = 0,
      offTrackCount = 0;
    const detailedObjectives = objectives.map((obj) => {
      const keyResultsWithProgress = obj.keyResults.map((kr: any) => {
        totalKRs++;
        const progressPercent = computeKrProgress(kr);
        sumProgress += progressPercent;
        const status = kr.isManualOverride
          ? kr.status
          : calculateAutoStatus(progressPercent);
        if (status === "ON_TRACK") onTrackCount++;
        else if (status === "AT_RISK") atRiskCount++;
        else if (status === "OFF_TRACK") offTrackCount++;
        return { ...kr, progress: progressPercent, status };
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

    return res.status(200).json({
      role,
      scope: "company",
      metrics: {
        totalObjectives: objectives.length,
        totalKeyResults: totalKRs,
        averageProgress:
          Math.round((totalKRs > 0 ? sumProgress / totalKRs : 0) * 10) / 10,
        onTrackCount,
        atRiskCount,
        offTrackCount,
      },
      objectives: detailedObjectives,
    });
  } catch (error) {
    console.error("Get dashboard summary error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
