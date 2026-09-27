import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";
import { getDepartmentLeaderInfo } from "./initiative.controller";
import { calculateProgressPercent } from "../utils/progress";

const prisma = new PrismaClient();

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
                select: { id: true, title: true, bscPerspective: true },
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
          initiative: { select: { id: true, title: true, teamId: true } },
          updates: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      let totalCount = 0,
        sumProgress = 0,
        onTrackCount = 0,
        atRiskCount = 0,
        offTrackCount = 0;

      [...initiatives, ...myTasks].forEach((item: any) => {
        const val = item.achievedValue !== null && item.achievedValue !== undefined ? item.achievedValue : item.currentValue;
        const pct = calculateProgressPercent(val, item.targetValue, item.targetType, item.baselineValue || 0);
        sumProgress += pct;
        totalCount++;
        if (item.status === "ON_TRACK") onTrackCount++;
        else if (item.status === "AT_RISK") atRiskCount++;
        else if (item.status === "OFF_TRACK") offTrackCount++;
      });

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
              status: true,
            },
          },
          team: { select: { id: true, name: true } },
          tasks: { where: { isActive: true } },
        },
      });

      let totalCount = 0,
        sumProgress = 0,
        onTrackCount = 0,
        atRiskCount = 0,
        offTrackCount = 0;

      initiatives.forEach((ini: any) => {
        const val = ini.achievedValue !== null && ini.achievedValue !== undefined ? ini.achievedValue : ini.currentValue;
        const pct = calculateProgressPercent(val, ini.targetValue, ini.targetType);
        sumProgress += pct;
        totalCount++;
        if (ini.status === "ON_TRACK") onTrackCount++;
        else if (ini.status === "AT_RISK") atRiskCount++;
        else if (ini.status === "OFF_TRACK") offTrackCount++;
      });

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

      const mappedPendingInitiativeApprovals = pendingInitiativeApprovals.map(
        (u: any) => ({
          ...u,
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
        createdAt: t.createdAt,
        type: "TASK",
      }));

      const pendingApprovals = [
        ...mappedPendingInitiativeApprovals,
        ...mappedPendingTaskApprovals,
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Hitung metrics
      let totalKRs = 0,
        sumProgress = 0,
        onTrackCount = 0,
        atRiskCount = 0,
        offTrackCount = 0;
      const detailedObjectives = objectives.map((obj) => {
        const keyResultsWithProgress = obj.keyResults.map((kr: any) => {
          totalKRs++;
          const progressPercent =
            kr.targetValue > 0
              ? calculateProgressPercent(kr.currentValue, kr.targetValue, kr.targetType)
              : 0;
          sumProgress += progressPercent;
          if (kr.status === "ON_TRACK") onTrackCount++;
          else if (kr.status === "AT_RISK") atRiskCount++;
          else if (kr.status === "OFF_TRACK") offTrackCount++;
          return { ...kr, progress: progressPercent };
        });
        const avgObjProgress =
          keyResultsWithProgress.length > 0
            ? keyResultsWithProgress.reduce(
                (a: number, k: any) => a + k.progress,
                0,
              ) / keyResultsWithProgress.length
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
      const keyResultsWithProgress = obj.keyResults.map((kr) => {
        totalKRs++;
        const progressPercent =
          kr.targetValue > 0
            ? calculateProgressPercent(kr.currentValue, kr.targetValue, kr.targetType)
            : 0;
        sumProgress += progressPercent;
        if (kr.status === "ON_TRACK") onTrackCount++;
        else if (kr.status === "AT_RISK") atRiskCount++;
        else if (kr.status === "OFF_TRACK") offTrackCount++;
        return { ...kr, progress: progressPercent };
      });
      const avgObjProgress =
        keyResultsWithProgress.length > 0
          ? keyResultsWithProgress.reduce((a, k) => a + k.progress, 0) /
            keyResultsWithProgress.length
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
