import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";

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
            where: { teamId: dbUser.teamId },
            include: {
              keyResult: {
                select: { id: true, title: true, bscPerspective: true },
              },
              tasks: {
                include: {
                  assignments: { where: { userId }, select: { userId: true } },
                },
              },
            },
          })
        : [];

      const myTasks = await prisma.task.findMany({
        where: {
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
        const pct =
          item.targetValue > 0
            ? Math.min(
                100,
                Math.max(0, (item.currentValue / item.targetValue) * 100),
              )
            : item.currentValue > 0
              ? 100
              : 0;
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
          tasks: true,
        },
      });

      let totalCount = 0,
        sumProgress = 0,
        onTrackCount = 0,
        atRiskCount = 0,
        offTrackCount = 0;

      initiatives.forEach((ini: any) => {
        const pct =
          ini.targetValue > 0
            ? Math.min(
                100,
                Math.max(0, (ini.currentValue / ini.targetValue) * 100),
              )
            : ini.currentValue > 0
              ? 100
              : 0;
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
            keyResults: {
              some: {
                departments: { some: { department: { in: deptValues } } },
              },
            },
          },
          include: {
            keyResults: {
              where: {
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

      const leadersInDept = await prisma.user.findMany({
        where: {
          department: { in: deptValues },
          role: "LEADER",
        },
        select: { id: true },
      });
      const leaderUserIds = leadersInDept.map((u) => u.id);

      // Approval queue: InitiativeUpdate PENDING dari team di dept ini
      const pendingInitiativeApprovals = await prisma.initiativeUpdate.findMany(
        {
          where: {
            status: "PENDING_APPROVAL",
            submittedBy: { in: leaderUserIds },
            initiative: {
              team: { department: { in: deptValues } },
            },
          },
          include: {
            initiative: {
              include: { team: { select: { id: true, name: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      );

      // TaskUpdate PENDING dari team di dept ini
      const pendingTaskApprovals = await prisma.taskUpdate.findMany({
        where: {
          status: "PENDING_APPROVAL",
          submittedBy: { in: leaderUserIds },
          task: {
            initiative: {
              team: { department: { in: deptValues } },
            },
          },
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
      });

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
              ? Math.min(
                  100,
                  Math.max(0, (kr.currentValue / kr.targetValue) * 100),
                )
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
      include: {
        keyResults: {
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
            ? Math.min(
                100,
                Math.max(0, (kr.currentValue / kr.targetValue) * 100),
              )
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
