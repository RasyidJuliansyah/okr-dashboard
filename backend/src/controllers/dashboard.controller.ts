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

    // --- TEAM: hanya lihat Initiative & Task milik tim sendiri ---
    if (role === "TEAM") {
      if (!dbUser?.teamId) {
        return res
          .status(200)
          .json({ role, scope: "team", initiatives: [], tasks: [] });
      }

      const initiatives = await prisma.initiative.findMany({
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
      });

      // Hanya Task yang di-assign ke user ini
      const myTasks = await prisma.task.findMany({
        where: { assignments: { some: { userId } } },
        include: {
          initiative: { select: { id: true, title: true, teamId: true } },
          updates: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      return res
        .status(200)
        .json({ role, scope: "team", initiatives, myTasks });
    }

    // --- LEADER: KR (read-only, konteks) + Initiative dari semua Tim yang dipimpin ---
    if (role === "LEADER") {
      const leadingTeams = await prisma.team.findMany({
        where: { leaderId: userId },
        select: { id: true, name: true },
      });
      const leadingTeamIds = leadingTeams.map((t) => t.id);

      const initiatives = await prisma.initiative.findMany({
        where: { teamId: { in: leadingTeamIds } },
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

      return res
        .status(200)
        .json({ role, scope: "leader", leadingTeams, initiatives });
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

      // Approval queue: InitiativeUpdate PENDING dari team di dept ini
      const pendingApprovals = await prisma.initiativeUpdate.findMany({
        where: {
          status: "PENDING_APPROVAL",
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
      });

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
