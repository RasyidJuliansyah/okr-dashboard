import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  resolveSprint,
  getActiveSprint,
  carryOverInitiativeService,
  carryOverTaskService,
} from "../services/sprint.service";
import { cascadeMonthlyKrToAnnual } from "./keyresult.controller";
import { logAudit } from "../utils/auditLogger";
import { calculateProgressPercent, calculateAutoStatus } from "../utils/progress";
import { isCeoUser, isCLevelUser } from "./auth.controller";

const prisma = new PrismaClient();

async function createNotification(params: {
  recipientId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}) {
  try {
    await prisma.notification.create({ data: params });
  } catch (err) {
    console.error("Create notification error:", err);
  }
}

async function validateCascadeKR(
  initiativeId?: string | null,
  keyResultId?: string,
): Promise<void> {
  if (!keyResultId || !initiativeId) return;
  const initiative = await prisma.initiative.findUnique({
    where: { id: initiativeId },
  });
  if (initiative && initiative.keyResultId !== keyResultId) {
    throw new Error(
      "Cascade KR violation: keyResultId Task tidak sesuai dengan Initiative induknya",
    );
  }
}

// ─── INITIATIVE ────────────────────────────────────────────────────────────

// Bobot setiap initiative card adalah persentase (0-100). Total bobot seluruh
// card milik satu pegawai (ownerId) pada satu sprint (sprintMonth) tidak boleh
// melebihi 100%, agar beban kerja per-sprint pegawai selalu proporsional.
const WEIGHT_BUDGET_MAX = 100;
const WEIGHT_EPSILON = 0.01;

async function getUsedWeight(
  ownerId: string,
  sprintMonth: string,
  excludeId?: string,
): Promise<number> {
  const initiatives = await prisma.initiative.findMany({
    where: {
      ownerId,
      sprintMonth,
      kanbanStatus: { not: "DROP" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { weight: true },
  });
  return initiatives.reduce((sum, i) => sum + (i.weight || 0), 0);
}

// GET /api/initiatives/weight-budget — Cek sisa bobot (%) pegawai pada sprint tertentu
export async function getInitiativeWeightBudget(
  req: AuthRequest,
  res: Response,
) {
  try {
    const { ownerId, sprintMonth, excludeId } = req.query as {
      ownerId?: string;
      sprintMonth?: string;
      excludeId?: string;
    };
    if (!ownerId || !sprintMonth) {
      return res
        .status(400)
        .json({ message: "ownerId dan sprintMonth wajib diisi" });
    }
    const used = await getUsedWeight(ownerId, sprintMonth, excludeId);
    return res
      .status(200)
      .json({ used, remaining: Math.max(0, WEIGHT_BUDGET_MAX - used) });
  } catch (error) {
    console.error("Get initiative weight budget error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getLeaderTeamIds(userId: string): Promise<string[]> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { teamId: true, department: true },
  });
  const leaderTeams = await prisma.team.findMany({
    where: { leaderId: userId },
    select: { id: true },
  });
  const teamIdSet = new Set<string>(leaderTeams.map((t) => t.id));
  if (dbUser?.teamId) teamIdSet.add(dbUser.teamId);
  if (dbUser?.department) {
    const deptTeams = await prisma.team.findMany({
      where: { department: dbUser.department },
      select: { id: true },
    });
    deptTeams.forEach((t) => teamIdSet.add(t.id));
  }
  return Array.from(teamIdSet);
}

export interface DepartmentLeaderInfo {
  leaderUserIds: string[];
  deptsWithLeader: Set<string>;
  deptsWithoutLeader: Set<string>;
  leaderUserIdsByDept: Map<string, string[]>;
}

export async function getDepartmentLeaderInfo(
  deptValues: string[],
): Promise<DepartmentLeaderInfo> {
  const cleanDepts = deptValues.filter(Boolean);
  if (cleanDepts.length === 0) {
    return {
      leaderUserIds: [],
      deptsWithLeader: new Set<string>(),
      deptsWithoutLeader: new Set<string>(),
      leaderUserIdsByDept: new Map<string, string[]>(),
    };
  }

  const [leadersInDept, teamsInDept] = await Promise.all([
    prisma.user.findMany({
      where: {
        department: { in: cleanDepts },
        role: "LEADER",
      },
      select: { id: true, department: true },
    }),
    prisma.team.findMany({
      where: {
        department: { in: cleanDepts },
        leaderId: { not: null },
      },
      select: { department: true, leaderId: true },
    }),
  ]);

  const allLeaderIds = new Set<string>();
  const deptsWithLeader = new Set<string>();
  const leaderUserIdsByDept = new Map<string, string[]>();

  for (const dept of cleanDepts) {
    leaderUserIdsByDept.set(dept, []);
  }

  leadersInDept.forEach((u) => {
    allLeaderIds.add(u.id);
    if (u.department && leaderUserIdsByDept.has(u.department)) {
      deptsWithLeader.add(u.department);
      const list = leaderUserIdsByDept.get(u.department)!;
      if (!list.includes(u.id)) list.push(u.id);
    }
  });

  teamsInDept.forEach((t) => {
    if (t.leaderId) {
      allLeaderIds.add(t.leaderId);
      if (t.department && leaderUserIdsByDept.has(t.department)) {
        deptsWithLeader.add(t.department);
        const list = leaderUserIdsByDept.get(t.department)!;
        if (!list.includes(t.leaderId)) list.push(t.leaderId);
      }
    }
  });

  const deptsWithoutLeader = new Set<string>(
    cleanDepts.filter((dept) => !deptsWithLeader.has(dept)),
  );

  return {
    leaderUserIds: Array.from(allLeaderIds),
    deptsWithLeader,
    deptsWithoutLeader,
    leaderUserIdsByDept,
  };
}

export async function getTaskApprovalRecipientId(
  task: any,
  submitterId: string,
): Promise<string | null> {
  const submitter = await prisma.user.findUnique({
    where: { id: submitterId },
    select: { teamId: true, department: true },
  });

  // Jika submitter punya tim dengan Leader aktif, arahkan ke Leader tim tersebut
  if (submitter?.teamId) {
    const team = await prisma.team.findUnique({
      where: { id: submitter.teamId },
      select: { leaderId: true },
    });
    if (team?.leaderId && team.leaderId !== submitterId) {
      return team.leaderId;
    }
  }

  const taskDept =
    (task.isCrossDept ? task.targetDept || submitter?.department : null) ||
    task.initiative?.team?.department ||
    task.targetDept ||
    task.creatorDept;

  if (taskDept) {
    const leaderInfo = await getDepartmentLeaderInfo([taskDept]);
    const hasLeader = leaderInfo.deptsWithLeader.has(taskDept);

    if (hasLeader) {
      const leaderCandidate =
        task.initiative?.team?.leaderId ||
        task.initiative?.assignedLeaderId;
      if (leaderCandidate && leaderCandidate !== submitterId) {
        return leaderCandidate;
      }
      const deptLeaders = leaderInfo.leaderUserIdsByDept.get(taskDept) || [];
      const validLeader = deptLeaders.find((id) => id !== submitterId);
      if (validLeader) return validLeader;
    } else {
      // Fallback ke MANAGER jika departemen tanpa Leader
      const dept = await prisma.department.findUnique({
        where: { value: taskDept },
        select: { managerId: true },
      });
      const managerId =
        dept?.managerId ||
        task.initiative?.team?.managerId;
      if (managerId && managerId !== submitterId) {
        return managerId;
      }
    }
  }

  const defaultRecipient =
    task.assignedBy ||
    task.initiative?.assignedLeaderId ||
    task.initiative?.ownerId ||
    task.creatorId;
  return defaultRecipient && defaultRecipient !== submitterId
    ? defaultRecipient
    : null;
}

// GET /api/initiatives/member-progress — Capaian 100% per member dengan strict role-based visibility
export async function getMemberProgress(req: AuthRequest, res: Response) {
  try {
    const { role, id: userId } = req.user!;
    const { sprintMonth, sprintId } = req.query as { sprintMonth?: string; sprintId?: string };
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { department: true, teamId: true },
    });

    // 1. Tentukan user mana saja yang boleh dilihat oleh req.user berdasarkan Role
    let visibleUserIds: string[] = [];

    if (role === "TEAM") {
      // TEAM HANYA boleh melihat dirinya sendiri (jika masih aktif)!
      const selfUser = await prisma.user.findFirst({
        where: { id: userId, isActive: true },
        select: { id: true },
      });
      visibleUserIds = selfUser ? [selfUser.id] : [];
    } else if (role === "LEADER") {
      // LEADER melihat dirinya + anggota tim yang dipimpin/dimilikinya/departemennya (hanya yang aktif)
      const leaderTeamIds = await getLeaderTeamIds(userId);
      const teamMembers = await prisma.user.findMany({
        where: {
          isActive: true,
          OR: [
            { id: userId },
            { teamId: { in: leaderTeamIds } },
            ...(dbUser?.department
              ? [{ department: dbUser.department, role: "TEAM" }]
              : []),
          ],
        },
        select: { id: true },
      });
      visibleUserIds = teamMembers.map((u) => u.id);
    } else if (role === "MANAGER") {
      // MANAGER melihat dirinya + Leader & Team di seluruh departemen yang dikelolanya (hanya yang aktif)
      const managedDepts = await prisma.department.findMany({
        where: { managerId: userId, isActive: true },
        select: { value: true },
      });
      const deptList = managedDepts.map((d) => d.value);
      if (
        dbUser?.department &&
        dbUser.department.toUpperCase() !== "STRATEGIC" &&
        !deptList.includes(dbUser.department)
      ) {
        deptList.push(dbUser.department);
      }

      const deptUsers = await prisma.user.findMany({
        where: {
          isActive: true,
          OR: [{ id: userId }, { department: { in: deptList } }],
        },
        select: { id: true },
      });
      visibleUserIds = deptUsers.map((u) => u.id);
    } else {
      // ADMIN & C_LEVEL melihat semua user aktif
      const allUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      visibleUserIds = allUsers.map((u) => u.id);
    }

    let targetSprint = null;
    if (sprintId) {
      targetSprint = await prisma.sprint.findUnique({ where: { id: sprintId } });
    } else if (sprintMonth) {
      targetSprint = await prisma.sprint.findFirst({ where: { name: sprintMonth } });
    }

    // 1b. If sprint is CLOSED and snapshots exist in member_sprint_progress, return frozen snapshots
    if (targetSprint && targetSprint.status === "CLOSED") {
      const snapshots = await prisma.memberSprintProgress.findMany({
        where: {
          sprintId: targetSprint.id,
          userId: { in: visibleUserIds },
          user: { isActive: true },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              position: true,
              department: true,
              isActive: true,
              team: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { totalScore: "desc" },
      });

      if (snapshots.length > 0) {
        const allSprints = await prisma.sprint.findMany({
          orderBy: { startDate: "desc" },
          select: { id: true, name: true, status: true, isLocked: true, startDate: true, endDate: true },
        });

        const members = snapshots
          .filter((s) => s.user && s.user.isActive !== false)
          .map((s) => ({
            userId: s.user.id,
            userName: s.user.name,
            role: s.user.role,
            position: s.user.position || s.user.role,
            department: s.user.department || "",
            teamName: s.user.team?.name || "",
            isActive: s.user.isActive,
            achievementPct: s.totalScore,
            initiativeAchievementPct: s.totalScore,
            taskAchievementPct: s.totalScore,
            totalAssignedTasks: s.taskCount,
            totalInitiativesCount: (s.detailsJson as any)?.initiativeCount || 0,
            totalTasksCount: s.taskCount,
            initiatives: ((s.detailsJson as any)?.initiatives || []).concat((s.detailsJson as any)?.tasks || []),
            isSnapshot: true,
          }));

        return res.status(200).json({
          role,
          userCount: members.length,
          sprintMonth: targetSprint.name,
          sprintId: targetSprint.id,
          availableSprintMonths: allSprints.map((sp) => sp.name),
          availableSprints: allSprints,
          members,
        });
      }
    }

    // 2. Fetch users and their associated Initiatives (weight 2) and Tasks (weight 1)
    const users = await prisma.user.findMany({
      where: {
        id: { in: visibleUserIds },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        role: true,
        position: true,
        department: true,
        isActive: true,
        team: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });

    const allSprintMonths = new Set<string>();

    const memberProgressList = await Promise.all(
      users.map(async (user) => {
        // Initiatives (Milik sendiri atau di-assign oleh leader) - Bobot = 2
        const ownedInitiatives = await prisma.initiative.findMany({
          where: {
            isActive: true,
            OR: [{ ownerId: user.id }, { assignedLeaderId: user.id }],
            kanbanStatus: { not: "DROP" },
          },
          select: {
            id: true,
            title: true,
            weight: true,
            kanbanStatus: true,
            targetValue: true,
            targetType: true,
            currentValue: true,
            achievedValue: true,
            sprintMonth: true,
            sprintId: true,
            keyResult: { select: { title: true } },
            tasks: {
              where: { isActive: true },
              select: { targetValue: true, currentValue: true },
            },
          },
        });

        // Tasks (Di-assign ke user ini oleh leader / role atas atau Cross-Dept) - Bobot = 1
        const assignedTasks = await prisma.task.findMany({
          where: {
            isActive: true,
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
                  {
                    initiative: {
                      isActive: true,
                      kanbanStatus: { not: "DROP" },
                    },
                  },
                ],
              },
            ],
          },
          select: {
            id: true,
            title: true,
            targetValue: true,
            targetType: true,
            currentValue: true,
            baselineValue: true,
            status: true,
            kanbanStatus: true,
            sprintMonth: true,
            sprintId: true,
            finishDate: true,
            createdAt: true,
            isCrossDept: true,
            creatorDept: true,
            targetDept: true,
            initiative: {
              select: {
                title: true,
                sprintMonth: true,
                sprintId: true,
                keyResult: { select: { title: true } },
              },
            },
          },
        });

        // Kumpulkan semua sprint months untuk dropdown filter
        ownedInitiatives.forEach((i) => {
          if (i.sprintMonth) allSprintMonths.add(i.sprintMonth);
        });
        assignedTasks.forEach((t) => {
          if (t.sprintMonth) allSprintMonths.add(t.sprintMonth);
          else if (t.initiative?.sprintMonth)
            allSprintMonths.add(t.initiative.sprintMonth);
        });

        // Filter per sprintId atau sprintMonth jika ada
        const filteredInitiatives = ownedInitiatives.filter((init) => {
          if (sprintId && sprintMonth) {
            return (
              init.sprintId === sprintId ||
              init.sprintMonth === sprintMonth ||
              (targetSprint && init.sprintMonth === targetSprint.name)
            );
          }
          if (sprintId) {
            return init.sprintId === sprintId || (targetSprint && init.sprintMonth === targetSprint.name);
          }
          return sprintMonth ? init.sprintMonth === sprintMonth : true;
        });

        const filteredTasks = assignedTasks.filter((t) => {
          const taskSprint = t.sprintMonth || t.initiative?.sprintMonth;
          const taskSprintId = t.sprintId || t.initiative?.sprintId;
          if (sprintId && sprintMonth) {
            return (
              taskSprintId === sprintId ||
              taskSprint === sprintMonth ||
              (targetSprint && (
                taskSprint === targetSprint.name ||
                (t.finishDate && targetSprint.startDate && targetSprint.endDate &&
                  new Date(t.finishDate) >= new Date(targetSprint.startDate) &&
                  new Date(t.finishDate) <= new Date(targetSprint.endDate))
              ))
            );
          }
          if (sprintId) {
            return (
              taskSprintId === sprintId ||
              (targetSprint && (
                taskSprint === targetSprint.name ||
                (t.finishDate && targetSprint.startDate && targetSprint.endDate &&
                  new Date(t.finishDate) >= new Date(targetSprint.startDate) &&
                  new Date(t.finishDate) <= new Date(targetSprint.endDate))
              ))
            );
          }
          return sprintMonth ? taskSprint === sprintMonth : true;
        });

        // Process Initiatives (Bobot = 2)
        let iniWeightedSum = 0;
        let iniTotalWeight = 0;

        const processedInitiatives = filteredInitiatives.map((init) => {
          let progressPct: number;
          const val =
            init.achievedValue !== null && init.achievedValue !== undefined
              ? init.achievedValue
              : init.currentValue || 0;
          if (init.kanbanStatus === "DONE") {
            progressPct = 100;
          } else if (init.targetValue > 0) {
            progressPct = calculateProgressPercent(val, init.targetValue, init.targetType);
          } else {
            progressPct = 0;
          }

          progressPct = Math.min(100, Math.max(0, progressPct));
          const roundedPct = Math.round(progressPct * 10) / 10;
          const weightFactor = 2; // Inisiatif bobot = 2

          iniWeightedSum += roundedPct * weightFactor;
          iniTotalWeight += weightFactor;

          return {
            id: init.id,
            title: init.title,
            type: "INITIATIVE",
            weightFactor,
            sprintMonth: init.sprintMonth,
            kanbanStatus: init.kanbanStatus,
            progressPct: roundedPct,
            krTitle: init.keyResult?.title || "",
          };
        });

        // Process Tasks (Bobot = 1)
        let taskWeightedSum = 0;
        let taskTotalWeight = 0;

        const processedTasks = filteredTasks.map((t) => {
          let progressPct: number;
          const targetVal = t.targetValue || 0;
          const baselineVal = t.baselineValue || 0;

          if (
            t.status === "DONE" ||
            t.kanbanStatus === "DONE" ||
            t.kanbanStatus === "CLOSED"
          ) {
            progressPct = 100;
          } else if (targetVal > 0) {
            progressPct = calculateProgressPercent(t.currentValue, targetVal, t.targetType, baselineVal);
          } else {
            progressPct = t.currentValue > 0 ? 100 : 0;
          }

          progressPct = Math.min(100, Math.max(0, progressPct));
          const roundedPct = Math.round(progressPct * 10) / 10;
          const weightFactor = 1; // Task bobot = 1

          taskWeightedSum += roundedPct * weightFactor;
          taskTotalWeight += weightFactor;

          return {
            id: t.id,
            title: t.title,
            type: "TASK",
            weightFactor,
            sprintMonth: t.sprintMonth || t.initiative?.sprintMonth,
            sprintId: t.sprintId,
            baselineValue: t.baselineValue,
            targetValue: t.targetValue,
            currentValue: t.currentValue,
            kanbanStatus: t.kanbanStatus || t.status,
            progressPct: roundedPct,
            parentTitle:
              t.initiative?.title ||
              (t.isCrossDept
                ? `Lintas Dept (${t.creatorDept || "?"} → ${t.targetDept || "?"})`
                : ""),
            krTitle:
              t.initiative?.keyResult?.title ||
              (t.isCrossDept ? "Tugas Lintas Departemen" : ""),
            isCrossDept: t.isCrossDept || false,
          };
        });

        const allItems = [...processedInitiatives, ...processedTasks];

        const totalWeightFactor = iniTotalWeight + taskTotalWeight;
        const totalWeightedSum = iniWeightedSum + taskWeightedSum;

        const achievementPct =
          totalWeightFactor > 0
            ? Math.round((totalWeightedSum / totalWeightFactor) * 10) / 10
            : 0;

        const iniAvg =
          iniTotalWeight > 0
            ? Math.round((iniWeightedSum / iniTotalWeight) * 10) / 10
            : 0;

        const taskAvg =
          taskTotalWeight > 0
            ? Math.round((taskWeightedSum / taskTotalWeight) * 10) / 10
            : 0;

        return {
          userId: user.id,
          userName: user.name,
          role: user.role,
          position: user.position || user.role,
          department: user.department || "",
          teamName: user.team?.name || "",
          isActive: user.isActive,
          achievementPct,
          initiativeAchievementPct: iniAvg,
          taskAchievementPct: taskAvg,
          totalAssignedTasks: allItems.length,
          totalInitiativesCount: processedInitiatives.length,
          totalTasksCount: processedTasks.length,
          initiatives: allItems,
        };
      }),
    );

    const allSprints = await prisma.sprint.findMany({
      orderBy: { startDate: "desc" },
      select: { id: true, name: true, status: true, isLocked: true, startDate: true, endDate: true },
    });

    return res.status(200).json({
      role,
      userCount: memberProgressList.length,
      sprintMonth: sprintMonth || targetSprint?.name || null,
      sprintId: sprintId || targetSprint?.id || null,
      availableSprintMonths: Array.from(new Set([...Array.from(allSprintMonths), ...allSprints.map((s) => s.name)])).sort().reverse(),
      availableSprints: allSprints,
      members: memberProgressList,
    });
  } catch (error) {
    console.error("Get member progress error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/initiatives/progress — Initiative progress per role
export async function getInitiativeProgress(req: AuthRequest, res: Response) {
  try {
    const { role, id: userId } = req.user!;
    let where: any = { isActive: true };

    // LEADER: hanya tim yang dipimpin
    if (role === "LEADER") {
      const leaderTeamIds = await getLeaderTeamIds(userId);
      where.teamId = { in: leaderTeamIds };
    }
    // MANAGER: semua tim di departemennya
    else if (role === "MANAGER") {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { department: true },
      });
      if (dbUser?.department) {
        const deptTeams = await prisma.team.findMany({
          where: { department: dbUser.department, isActive: true },
          select: { id: true },
        });
        where.teamId = { in: deptTeams.map((t) => t.id) };
      }
    }
    // ADMIN & C_LEVEL: semua (no filter)

    const initiatives = await prisma.initiative.findMany({
      where,
      include: {
        keyResult: {
          select: {
            id: true,
            title: true,
            bscPerspective: true,
            targetValue: true,
            currentValue: true,
            status: true,
            objective: { select: { id: true, title: true, year: true } },
            assignments: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, department: true },
                },
              },
            },
          },
        },
        team: { select: { id: true, name: true, department: true } },
        owner: { select: { id: true, name: true, position: true } },
        sprint: { select: { id: true, name: true, status: true } },
        tasks: {
          where: { isActive: true },
          include: {
            sprint: { select: { id: true, name: true, status: true } },
            assignments: {
              include: { user: { select: { id: true, name: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Kalkulasi progress per Initiative dari Task
    const enriched = initiatives.map((init) => {
      const taskProgress = init.tasks.map((task) => {
        const tVal = task.targetValue || 0;
        const pct =
          tVal > 0
            ? calculateProgressPercent(task.currentValue, tVal, task.targetType, task.baselineValue || 0)
            : 0;
        return { ...task, progressPercent: Math.round(pct * 10) / 10 };
      });

      // Simple average across all tasks under initiative; fallback to own target/actual when no tasks
      let avgProgress = 0;
      if (taskProgress.length > 0) {
        const sumTaskPct = taskProgress.reduce((sum, t) => sum + (t.progressPercent || 0), 0);
        avgProgress = Math.round((sumTaskPct / taskProgress.length) * 10) / 10;
      } else {
        const val =
          init.achievedValue !== null && init.achievedValue !== undefined
            ? init.achievedValue
            : init.currentValue || 0;
        avgProgress =
          init.targetValue > 0
            ? calculateProgressPercent(val, init.targetValue, init.targetType)
            : 0;
      }

      const completedTasks = taskProgress.filter(
        (k) => k.progressPercent >= 100,
      ).length;

      return {
        ...init,
        tasks: taskProgress,
        calculatedProgress: Math.round(avgProgress * 10) / 10,
        completedTasks,
        totalTasks: taskProgress.length,
      };
    });

    // Group by KR untuk tampilan hierarkis
    const byKeyResult: Record<string, any> = {};
    for (const init of enriched) {
      const krId = init.keyResultId || "unassigned";
      if (!byKeyResult[krId]) {
        const rawKr = init.keyResult;
        let responsible: any = null;
        let accountables: any[] = [];
        let assignments: any[] = [];

        if (rawKr) {
          assignments = rawKr.assignments || [];
          const respAssign = assignments.find((a: any) => a.raciRole === "RESPONSIBLE");
          responsible = respAssign ? respAssign.user : null;
          accountables = assignments
            .filter((a: any) => a.raciRole === "ACCOUNTABLE")
            .map((a: any) => a.user)
            .filter(Boolean);
        }

        byKeyResult[krId] = {
          keyResult: rawKr
            ? {
                id: rawKr.id,
                title: rawKr.title,
                bscPerspective: rawKr.bscPerspective,
                targetValue: rawKr.targetValue,
                currentValue: rawKr.currentValue,
                status: rawKr.status,
                objective: rawKr.objective,
                responsible,
                accountables,
                assignments,
              }
            : {
                id: "unassigned",
                title: "Inisiatif Mandiri (Tanpa Key Result)",
                bscPerspective: null,
                responsible: null,
                accountables: [],
                assignments: [],
              },
          initiatives: [],
          krProgress: 0,
        };
      }
      byKeyResult[krId].initiatives.push(init);
    }

    // Hitung progress KR dari Initiative (unweighted simple average)
    for (const kr of Object.values(byKeyResult)) {
      const count = kr.initiatives.length;
      kr.krProgress =
        count > 0
          ? Math.round(
              (kr.initiatives.reduce(
                (s: number, i: any) => s + i.calculatedProgress,
                0,
              ) /
                count) *
                10,
            ) / 10
          : 0;
    }

    return res.status(200).json({
      role,
      initiatives: enriched,
      byKeyResult: Object.values(byKeyResult),
      summary: {
        totalInitiatives: enriched.length,
        totalTasks: enriched.reduce((s, i) => s + i.totalTasks, 0),
        completedTasks: enriched.reduce((s, i) => s + i.completedTasks, 0),
        avgProgress:
          enriched.length > 0
            ? Math.round(
                (enriched.reduce((s, i) => s + i.calculatedProgress, 0) /
                  enriched.length) *
                  10,
              ) / 10
            : 0,
        byKanbanStatus: {
          TODO: enriched.filter((i) => i.kanbanStatus === "TODO").length,
          IN_PROGRESS: enriched.filter((i) => i.kanbanStatus === "IN_PROGRESS")
            .length,
          DONE: enriched.filter((i) => i.kanbanStatus === "DONE").length,
          DROP: enriched.filter((i) => i.kanbanStatus === "DROP").length,
        },
      },
    });
  } catch (error) {
    console.error("Get initiative progress error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/initiatives?krId=xxx&kanbanStatus=xxx&teamId=xxx&ownerId=xxx&sprintMonth=xxx — list initiatives
export async function getInitiatives(req: AuthRequest, res: Response) {
  try {
    const { krId, kanbanStatus, teamId, ownerId, sprintMonth, sprintId, managerId } =
      req.query;
    const { role, id: userId } = req.user!;

    const andConditions: any[] = [{ isActive: true }];
    if (krId) andConditions.push({ keyResultId: krId as string });
    if (kanbanStatus) andConditions.push({ kanbanStatus: kanbanStatus as string });
    if (sprintId && sprintMonth) {
      andConditions.push({
        OR: [
          { sprintId: sprintId as string },
          { sprintMonth: sprintMonth as string },
          { sprint: { name: sprintMonth as string } },
          { sprint: { id: sprintId as string } },
        ],
      });
    } else if (sprintId) {
      andConditions.push({
        OR: [
          { sprintId: sprintId as string },
          { sprint: { id: sprintId as string } },
        ],
      });
    } else if (sprintMonth) {
      andConditions.push({
        OR: [
          { sprintMonth: sprintMonth as string },
          { sprint: { name: sprintMonth as string } },
        ],
      });
    }

    // 1. TEAM (T): hanya melihat inisiatif milik sendiri + inisiatif yang di-assign khusus padanya (bukan inisiatif induk Leader)
    if (role === "TEAM") {
      andConditions.push({
        OR: [{ ownerId: userId }, { assignedLeaderId: userId }],
      });
      if (teamId) andConditions.push({ teamId: teamId as string });
    }

    // 2. LEADER (P): melihat card miliknya sendiri + semua card anggota tim di bawahnya
    else if (role === "LEADER") {
      const leaderTeamIds = await getLeaderTeamIds(userId);
      const teamIds = leaderTeamIds;

      if (ownerId) {
        andConditions.push({ ownerId: ownerId as string });
      }
      andConditions.push({
        OR: [{ teamId: { in: teamIds } }, { ownerId: userId }],
      });

      if (teamId && teamIds.includes(teamId as string)) {
        andConditions.push({ teamId: teamId as string });
      }
    }

    // 3. MANAGER (M): melihat semua card P (Leader) dan T (Team) di departemen yang dikelola
    else if (role === "MANAGER") {
      const managedDepts = await prisma.department.findMany({
        where: { managerId: userId },
        select: { value: true },
      });
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { department: true, teamId: true },
      });

      const deptValues = new Set<string>(managedDepts.map((d) => d.value));
      if (dbUser?.department && dbUser.department.toUpperCase() !== "STRATEGIC")
        deptValues.add(dbUser.department);

      const deptTeams = await prisma.team.findMany({
        where: {
          OR: [
            { department: { in: Array.from(deptValues) } },
            { managerId: userId },
          ],
        },
        select: { id: true },
      });

      const teamIdSet = new Set<string>(deptTeams.map((t) => t.id));
      if (dbUser?.teamId) teamIdSet.add(dbUser.teamId);
      const teamIds = Array.from(teamIdSet);

      andConditions.push({ teamId: { in: teamIds } });

      if (ownerId) {
        andConditions.push({ ownerId: ownerId as string });
      }

      if (teamId && teamIds.includes(teamId as string)) {
        andConditions.push({ teamId: teamId as string });
      }
    }

    // 4. ADMIN & C_LEVEL: Seluruh departemen (Company-wide)
    else {
      if (managerId) {
        const managedDepts = await prisma.department.findMany({
          where: { managerId: managerId as string },
          select: { value: true },
        });
        const mgrUser = await prisma.user.findUnique({
          where: { id: managerId as string },
          select: { department: true, teamId: true },
        });
        const deptValues = new Set<string>(managedDepts.map((d) => d.value));
        if (
          mgrUser?.department &&
          mgrUser.department.toUpperCase() !== "STRATEGIC"
        ) {
          deptValues.add(mgrUser.department);
        }

        const deptTeams = await prisma.team.findMany({
          where: {
            OR: [
              { department: { in: Array.from(deptValues) } },
              { managerId: managerId as string },
            ],
          },
          select: { id: true },
        });

        const teamIdSet = new Set<string>(deptTeams.map((t) => t.id));
        if (mgrUser?.teamId) teamIdSet.add(mgrUser.teamId);
        const teamIds = Array.from(teamIdSet);

        andConditions.push({
          OR: [
            { teamId: { in: teamIds } },
            { ownerId: managerId as string },
            { owner: { department: { in: Array.from(deptValues) } } },
          ],
        });
      }
      if (teamId) andConditions.push({ teamId: teamId as string });
      if (ownerId) andConditions.push({ ownerId: ownerId as string });
    }

    const where = { AND: andConditions };

    let initiatives = await prisma.initiative.findMany({
      where,
      include: {
        keyResult: {
          select: {
            id: true,
            title: true,
            bscPerspective: true,
            departments: { select: { department: true } },
          },
        },
        team: { select: { id: true, name: true, department: true } },
        owner: {
          select: { id: true, name: true, email: true, position: true },
        },
        assignedLeader: {
          select: { id: true, name: true, position: true },
        },
        sprint: {
          select: { id: true, name: true, startDate: true, endDate: true, status: true },
        },
        tasks: {
          where: { isActive: true },
          include: {
            assignedTeamMember: {
              select: { id: true, name: true },
            },
            sprint: {
              select: { id: true, name: true },
            },
            assignments: {
              include: { user: { select: { id: true, name: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Query Task cards for Kanban (Task Individual)
    let taskWhere: any = {
      isActive: true,
      OR: [
        { initiativeId: null },
        { initiative: { isActive: true } },
      ],
      AND: [],
    };
    if (sprintId && sprintMonth) {
      taskWhere.AND.push({
        OR: [
          { sprintId: sprintId as string },
          { initiative: { sprintId: sprintId as string } },
          { sprintMonth: sprintMonth as string },
          { initiative: { sprintMonth: sprintMonth as string } },
          { sprint: { name: sprintMonth as string } },
          { initiative: { sprint: { name: sprintMonth as string } } },
          { sprint: { id: sprintId as string } },
          { initiative: { sprint: { id: sprintId as string } } },
        ],
      });
    } else if (sprintId) {
      taskWhere.AND.push({
        OR: [
          { sprintId: sprintId as string },
          { initiative: { sprintId: sprintId as string } },
          { sprint: { id: sprintId as string } },
          { initiative: { sprint: { id: sprintId as string } } },
        ],
      });
    } else if (sprintMonth) {
      taskWhere.AND.push({
        OR: [
          { sprintMonth: sprintMonth as string },
          { initiative: { sprintMonth: sprintMonth as string } },
          { sprint: { name: sprintMonth as string } },
          { initiative: { sprint: { name: sprintMonth as string } } },
        ],
      });
    }
    if (krId) {
      taskWhere.AND.push({
        initiative: {
          keyResultId: krId as string,
          isActive: true,
        },
      });
    }
    if (teamId) {
      taskWhere.AND = [
        ...(taskWhere.AND || []),
        {
          OR: [
            { initiative: { teamId: teamId as string } },
            { isCrossDept: true, assignedTeamMember: { teamId: teamId as string } },
          ],
        },
      ];
    }

    if (ownerId) {
      taskWhere.AND = [
        ...(taskWhere.AND || []),
        {
          OR: [
            { assignedTeamMemberId: ownerId as string },
            { assignments: { some: { userId: ownerId as string } } },
          ],
        },
      ];
    } else if (role === "TEAM") {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { department: true },
      });
      taskWhere.AND = [
        ...(taskWhere.AND || []),
        {
          OR: [
            { assignedTeamMemberId: userId },
            { assignments: { some: { userId } } },
            { creatorId: userId },
            ...(dbUser?.department
              ? [{ isCrossDept: true, targetDept: dbUser.department }]
              : []),
          ],
        },
      ];
    } else if (role === "LEADER") {
      const leaderTeams = await prisma.team.findMany({
        where: { leaderId: userId },
        select: { id: true },
      });
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { teamId: true, department: true },
      });
      const teamIdSet = new Set<string>(leaderTeams.map((t) => t.id));
      if (dbUser?.teamId) teamIdSet.add(dbUser.teamId);
      const teamIds = Array.from(teamIdSet);

      taskWhere.AND = [
        ...(taskWhere.AND || []),
        {
          OR: [
            { assignedTeamMemberId: userId },
            { assignments: { some: { userId } } },
            { initiative: { teamId: { in: teamIds } } },
            { assignedTeamMember: { teamId: { in: teamIds } } },
            { creatorId: userId },
            ...(dbUser?.department
              ? [
                  { isCrossDept: true, targetDept: dbUser.department },
                  { isCrossDept: true, creatorDept: dbUser.department },
                ]
              : []),
          ],
        },
      ];
    } else if (role === "MANAGER") {
      const managedDepts = await prisma.department.findMany({
        where: { managerId: userId },
        select: { value: true },
      });
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { department: true, teamId: true },
      });

      const deptValues = new Set<string>(managedDepts.map((d) => d.value));
      if (dbUser?.department && dbUser.department.toUpperCase() !== "STRATEGIC")
        deptValues.add(dbUser.department);

      const deptTeams = await prisma.team.findMany({
        where: {
          OR: [
            { department: { in: Array.from(deptValues) } },
            { managerId: userId },
          ],
        },
        select: { id: true },
      });

      const teamIdSet = new Set<string>(deptTeams.map((t) => t.id));
      if (dbUser?.teamId) teamIdSet.add(dbUser.teamId);
      const teamIds = Array.from(teamIdSet);

      taskWhere.AND = [
        ...(taskWhere.AND || []),
        {
          OR: [
            { assignedTeamMemberId: userId },
            { assignments: { some: { userId } } },
            { initiative: { teamId: { in: teamIds } } },
            { creatorId: userId },
            { isCrossDept: true, targetDept: { in: Array.from(deptValues) } },
            { isCrossDept: true, creatorDept: { in: Array.from(deptValues) } },
          ],
        },
      ];
    }

    const tasksList = await prisma.task.findMany({
      where: taskWhere,
      include: {
        initiative: {
          include: {
            keyResult: {
              select: { id: true, title: true, bscPerspective: true },
            },
            team: { select: { id: true, name: true, department: true } },
            owner: {
              select: { id: true, name: true, email: true, position: true },
            },
          },
        },
        assignedTeamMember: {
          select: { id: true, name: true, department: true, role: true },
        },
        sprint: {
          select: { id: true, name: true },
        },
        assignments: {
          include: { user: { select: { id: true, name: true } } },
        },
        creator: {
          select: { id: true, name: true, department: true, role: true },
        },
        comments: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const taskCards = tasksList.map((t: any) => {
      const taskKanbanStatus = getTaskKanbanStatus(t);

      const assignedOwnerId =
        t.assignedTeamMemberId || t.assignments?.[0]?.userId || userId;
      const assignedOwner = t.assignedTeamMember ||
        t.assignments?.[0]?.user || {
          id: userId,
          name: req.user!.name || "Saya",
        };

      return {
        id: `task-${t.id}`,
        taskId: t.id,
        isTaskCard: true,
        isCrossDept: t.isCrossDept || false,
        creatorDept: t.creatorDept || null,
        targetDept: t.targetDept || null,
        creator: t.creator || null,
        link: t.link || null,
        comments: t.comments || [],
        commentsCount: t.comments?.length || 0,
        title: t.title,
        description:
          t.description ||
          (t.initiative?.title
            ? `Task dari Inisiatif: ${t.initiative.title}`
            : t.isCrossDept
              ? `Task Lintas Departemen`
              : "Task Individual"),
        targetValue: t.targetValue,
        currentValue: t.currentValue,
        unit: t.unit || "",
        weight: t.weight || 1.0,
        status: t.status,
        kanbanStatus: taskKanbanStatus,
        sprintId: t.sprintId || t.initiative?.sprintId || null,
        sprint: t.sprint || t.initiative?.sprint || null,
        sprintMonth: t.sprintMonth || t.initiative?.sprintMonth || null,
        startDate: t.startDate || t.initiative?.startDate || null,
        dueDate: t.finishDate || t.initiative?.dueDate || null,
        finishDate: t.finishDate || t.initiative?.finishDate || null,
        keyResultId: t.initiative?.keyResultId,
        keyResult: t.initiative?.keyResult || null,
        teamId: t.initiative?.teamId || null,
        team: t.initiative?.team || null,
        ownerId: assignedOwnerId,
        owner: assignedOwner,
        assignedLeader: t.initiative?.owner || null,
        parentInitiativeTitle: t.initiative?.title,
        parentInitiativeId: t.initiativeId,
        tasks: [],
      };
    });

    let filteredTaskCards = taskCards;
    if (kanbanStatus) {
      filteredTaskCards = taskCards.filter(
        (c) => c.kanbanStatus === kanbanStatus,
      );
    }

    return res.status(200).json([...initiatives, ...filteredTaskCards]);
  } catch (error) {
    console.error("Get initiatives error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createInitiative(req: AuthRequest, res: Response) {
  try {
    let {
      keyResultId,
      teamId,
      ownerId,
      ownerIds,
      assignedLeaderId,
      title,
      description,
      targetValue,
      achievedValue,
      unit,
      kanbanStatus,
      weight,
      startDate,
      dueDate,
      finishDate,
      sprintMonth,
      kpis,
    } = req.body;
    const { role, id: userId } = req.user!;

    if (!title) {
      return res
        .status(400)
        .json({ message: "title wajib diisi" });
    }

    let finalSprintId = req.body.sprintId || null;
    let finalSprintName: string | null = sprintMonth || null;
    if (!finalSprintId) {
      const matchedSprint = await resolveSprint({
        date: startDate || dueDate || null,
        sprintMonth,
        fallbackToActive: true,
      });
      if (matchedSprint) {
        finalSprintId = matchedSprint.id;
        finalSprintName = matchedSprint.name;
        if (!sprintMonth) {
          sprintMonth = matchedSprint.name;
        }
      }
    } else {
      const sp = await prisma.sprint.findUnique({ where: { id: finalSprintId } });
      if (sp) {
        finalSprintName = sp.name;
      }
    }

    if (req.body.sprintId && role !== "ADMIN") {
      const sp = await prisma.sprint.findUnique({ where: { id: req.body.sprintId } });
      if (sp?.isLocked) {
        return res.status(403).json({ message: "Sprint sudah ditutup dan terkunci. Hanya Admin yang dapat menambah inisiatif." });
      }
    }

    const dbUser = await prisma.user.findUnique({ where: { id: userId } });

    if (role === "MANAGER" && assignedLeaderId) {
      const leaderUser = await prisma.user.findUnique({
        where: { id: assignedLeaderId },
        select: { role: true, department: true },
      });
      if (!leaderUser || leaderUser.role !== "LEADER") {
        return res.status(400).json({
          message: "assignedLeaderId harus merupakan user dengan role LEADER",
        });
      }
      if (
        dbUser?.department &&
        leaderUser.department &&
        dbUser.department !== leaderUser.department
      ) {
        return res.status(403).json({
          message: "Leader yang dipilih harus berada di departemen yang sama",
        });
      }
    }

    // Resolve targetOwnerIds for multi-PIC assignment (1 card per owner)
    // ponytail: duplicate records per owner; upgrade path: shared initiative_owners junction table when multi-owner synchronization is explicitly required.
    const rawOwnerIds = Array.isArray(ownerIds) && ownerIds.length > 0
      ? ownerIds.map((id: any) => String(id).trim()).filter(Boolean)
      : (ownerId && String(ownerId).trim() ? [String(ownerId).trim()] : []);

    // TEAM (T): Membuat inisiatif untuk dirinya sendiri jika tidak di-assign spesifik
    if (role === "TEAM") {
      if (!teamId && dbUser?.teamId) {
        teamId = dbUser.teamId;
      }
    }

    let targetOwnerIds: (string | null)[] = rawOwnerIds;
    if (role === "TEAM" && targetOwnerIds.length === 0) {
      targetOwnerIds = [userId];
    } else if (targetOwnerIds.length === 0) {
      targetOwnerIds = [null];
    }

    // LEADER (P): Jika teamId belum ditentukan, pakai tim yang dipimpin
    if (role === "LEADER" && !teamId) {
      const leaderTeamIds = await getLeaderTeamIds(userId);
      teamId = leaderTeamIds[0] || dbUser?.teamId;
    }

    // LEADER: Validasi bahwa teamId yang dipilih adalah tim yang dipimpin/dipunyai Leader
    if (role === "LEADER" && teamId) {
      const leaderTeamIds = await getLeaderTeamIds(userId);
      if (!leaderTeamIds.includes(teamId)) {
        return res.status(403).json({
          message:
            "Anda hanya bisa membuat inisiatif untuk tim yang Anda pimpin",
        });
      }
    }

    if (!teamId) {
      // Cari tim pertama yang tersedia
      const firstTeam = await prisma.team.findFirst();
      if (!firstTeam)
        return res
          .status(400)
          .json({ message: "Belum ada tim terdaftar di sistem" });
      teamId = firstTeam.id;
    }

    // KR lookup & validasi integritas hierarki BSC (opsional jika keyResultId diisi)
    if (keyResultId && String(keyResultId).trim()) {
      const kr = await prisma.keyResult.findUnique({
        where: { id: String(keyResultId).trim() },
        include: { objective: true },
      });
      if (!kr)
        return res.status(404).json({ message: "KeyResult tidak ditemukan" });

      if (!kr.objectiveId || !kr.objective) {
        return res.status(400).json({
          message: "Key Result harus memiliki relasi dengan Corporate Objective yang valid",
        });
      }

      if (!kr.bscPerspective) {
        return res.status(400).json({
          message: "Key Result harus memiliki relasi dengan 4 aspek BSC",
        });
      }

      // Auto-heal kr.month if it is null/empty to allow initiative creation
      if (!kr.month) {
        const activeSprint = await getActiveSprint();
        const krMonth = finalSprintId || activeSprint?.id || sprintMonth || null;
        await prisma.keyResult.update({
          where: { id: keyResultId },
          data: { month: krMonth },
        });
      }
    }

    const finalAssignedLeaderId =
      (assignedLeaderId && String(assignedLeaderId).trim()) || null;
    const finalKeyResultId =
      (keyResultId && String(keyResultId).trim()) || null;
    const parsedWeight =
      weight !== undefined && weight !== null && !isNaN(parseFloat(weight))
        ? parseFloat(weight)
        : 1.0;

    const createdInitiatives: any[] = [];

    for (const curOwnerId of targetOwnerIds) {
      const initiative = await (prisma.initiative as any).create({
        data: {
          ...(finalKeyResultId ? { keyResultId: finalKeyResultId } : {}),
          teamId,
          ownerId: curOwnerId,
          assignedLeaderId: finalAssignedLeaderId,
          assignedBy: userId,
          ...(finalSprintId ? { sprintId: finalSprintId } : {}),
          title,
          description: description || null,
          targetValue: targetValue ? parseFloat(targetValue) : 0,
          achievedValue:
            achievedValue !== undefined &&
            achievedValue !== null &&
            achievedValue !== ""
              ? parseFloat(achievedValue)
              : null,
          unit: unit || null,
          status: calculateAutoStatus(
            calculateProgressPercent(
              achievedValue !== undefined && achievedValue !== null && achievedValue !== ""
                ? parseFloat(achievedValue)
                : 0,
              targetValue ? parseFloat(targetValue) : 0,
              req.body.targetType || "AT_LEAST"
            )
          ),
          targetType: req.body.targetType || "AT_LEAST",
          kanbanStatus: kanbanStatus || "TODO",
          weight: parsedWeight,
          startDate: startDate ? new Date(startDate) : null,
          dueDate: dueDate ? new Date(dueDate) : null,
          finishDate: finishDate ? new Date(finishDate) : null,
          sprintMonth: finalSprintName || sprintMonth || null,
          ...(Array.isArray(kpis) &&
            kpis.length > 0 && {
              kpis: {
                create: kpis.map((k: any) => ({
                  kpiId: k.kpiId,
                  targetValue: parseFloat(k.targetValue) || 0,
                  currentValue: parseFloat(k.currentValue) || 0,
                })),
              },
            }),
        },
        include: {
          team: true,
          owner: {
            select: { id: true, name: true, email: true, position: true },
          },
          assignedLeader: {
            select: { id: true, name: true, position: true },
          },
          kpis: {
            include: {
              kpi: true,
            },
          },
        },
      });

      if (curOwnerId && curOwnerId !== userId) {
        await createNotification({
          recipientId: curOwnerId,
          type: "INITIATIVE_ASSIGNED",
          title: "Inisiatif Baru Ditugaskan",
          body: `Anda ditugaskan sebagai PIC Inisiatif: "${title}"`,
          link: "/team/my-work",
        });
      }

      await logAudit(prisma, {
        userId: req.user?.id,
        action: "CREATE",
        entityType: "INITIATIVE",
        entityId: initiative.id,
        newValues: {
          title: initiative.title,
          targetValue: initiative.targetValue,
          teamId: initiative.teamId,
          keyResultId: initiative.keyResultId,
          ownerId: curOwnerId,
        },
        req,
      });

      createdInitiatives.push(initiative);
    }

    if (assignedLeaderId) {
      await createNotification({
        recipientId: assignedLeaderId,
        type: "INITIATIVE_ASSIGNED",
        title: "Inisiatif Baru Ditugaskan",
        body: `Anda mendapat assignment Initiative: "${title}" dari Manager`,
        link: "/initiatives",
      });
    }

    if (createdInitiatives.length === 1) {
      return res.status(201).json(createdInitiatives[0]);
    }
    return res.status(201).json({
      ...createdInitiatives[0],
      initiatives: createdInitiatives,
      count: createdInitiatives.length,
    });
  } catch (error) {
    console.error("Create initiative error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// PUT /api/initiatives/:id — Update initiative
export async function updateInitiative(req: AuthRequest, res: Response): Promise<any> {
  try {
    const { id } = req.params;
    const cleanId = id && id.startsWith("task-") ? id.replace(/^task-/, "") : id;

    if (id && id.startsWith("task-")) {
      req.params.id = cleanId;
      return updateTask(req, res);
    }

    const {
      keyResultId,
      title,
      description,
      ownerId,
      assignedLeaderId,
      targetValue,
      achievedValue,
      unit,
      status,
      kanbanStatus,
      weight,
      startDate,
      dueDate,
      finishDate,
      sprintMonth,
      kpis,
    } = req.body;
    const role = req.user?.originalRole === "ADMIN" || req.user?.role === "ADMIN" ? "ADMIN" : req.user!.role;
    const userId = req.user!.id;

    const existing = await prisma.initiative.findUnique({
      where: { id: cleanId },
      include: { team: true },
    });
    if (!existing) {
      const existingTask = await prisma.task.findUnique({ where: { id: cleanId } });
      if (existingTask) {
        req.params.id = cleanId;
        return updateTask(req, res);
      }
      return res.status(404).json({ message: "Initiative tidak ditemukan" });
    }

    // Guard locked sprint
    if (existing.sprintId && role !== "ADMIN") {
      const sp = await prisma.sprint.findUnique({ where: { id: existing.sprintId } });
      if (sp?.isLocked) {
        return res.status(403).json({ message: "Sprint sudah ditutup dan terkunci. Hanya Admin yang dapat mengubah inisiatif." });
      }
    }

    // Role scope checks
    if (role === "MANAGER") {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { department: true },
      });
      const managedDepts = await prisma.department.findMany({
        where: { managerId: userId },
        select: { value: true },
      });
      const deptList = managedDepts.map((d) => d.value);
      if (dbUser?.department) deptList.push(dbUser.department);

      if (
        !existing.team?.department ||
        !deptList.includes(existing.team.department)
      ) {
        return res.status(403).json({
          message:
            "Forbidden: Manager hanya dapat mengubah inisiatif di departemennya",
        });
      }
    } else if (role === "LEADER") {
      const leaderTeamIds = await getLeaderTeamIds(userId);
      const isLeaderOfTeam = existing.teamId && leaderTeamIds.includes(existing.teamId);
      if (
        existing.assignedLeaderId !== userId &&
        existing.ownerId !== userId &&
        existing.assignedBy !== userId &&
        !isLeaderOfTeam
      ) {
        return res.status(403).json({
          message:
            "Forbidden: Anda tidak memiliki akses untuk mengubah inisiatif ini",
        });
      }
    } else if (role === "TEAM") {
      if (existing.ownerId !== userId && existing.assignedBy !== userId) {
        return res.status(403).json({
          message:
            "Forbidden: Anda hanya dapat mengubah inisiatif milik Anda sendiri",
        });
      }
    } else if (role !== "ADMIN" && role !== "C_LEVEL") {
      return res
        .status(403)
        .json({ message: "Forbidden: Role tidak diizinkan" });
    }

    // Non-restricted initiative editing
    const effectiveKeyResultId =
      keyResultId !== undefined
        ? (keyResultId && String(keyResultId).trim() ? String(keyResultId).trim() : null)
        : undefined;

    if (effectiveKeyResultId) {
      const kr = await prisma.keyResult.findUnique({
        where: { id: effectiveKeyResultId },
      });
      if (!kr) {
        return res.status(404).json({ message: "KeyResult tidak ditemukan" });
      }
    }

    const effectiveOwnerId =
      ownerId !== undefined
        ? (ownerId && String(ownerId).trim()) || null
        : existing.ownerId;
    const effectiveAssignedLeaderId =
      assignedLeaderId !== undefined
        ? (assignedLeaderId && String(assignedLeaderId).trim()) || null
        : existing.assignedLeaderId;
    const effectiveSprintMonth =
      sprintMonth !== undefined ? (sprintMonth && String(sprintMonth).trim()) || null : existing.sprintMonth;
    const effectiveWeight =
      weight !== undefined ? parseFloat(weight) : existing.weight;

    let targetSprintId = req.body.sprintId !== undefined ? (req.body.sprintId || null) : existing.sprintId;
    let targetSprintName: string | null = effectiveSprintMonth;
    if (targetSprintId) {
      const sp = await prisma.sprint.findUnique({ where: { id: targetSprintId } });
      if (sp) targetSprintName = sp.name;
    } else if (effectiveSprintMonth || startDate || dueDate || existing.startDate || existing.dueDate) {
      const sp = await resolveSprint({
        date: startDate || dueDate || existing.startDate || existing.dueDate,
        sprintMonth: effectiveSprintMonth,
        fallbackToActive: false,
      });
      if (sp) {
        targetSprintId = sp.id;
        targetSprintName = sp.name;
      }
    }

    const targetTypeVal = req.body.targetType !== undefined ? req.body.targetType : existing.targetType;
    const finalTgt = targetValue !== undefined ? parseFloat(targetValue) : existing.targetValue;
    const finalAchieved = achievedValue !== undefined ? (achievedValue !== null && achievedValue !== "" ? parseFloat(achievedValue) : null) : existing.achievedValue;
    const valForStatus = finalAchieved !== null && finalAchieved !== undefined ? finalAchieved : existing.currentValue;
    const autoStatus = calculateAutoStatus(calculateProgressPercent(valForStatus, finalTgt, targetTypeVal));

    const updated = await prisma.initiative.update({
      where: { id },
      data: {
        ...(effectiveKeyResultId !== undefined && {
          keyResultId: effectiveKeyResultId,
        }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(ownerId !== undefined &&
          role !== "TEAM" && { ownerId: effectiveOwnerId }),
        ...(assignedLeaderId !== undefined &&
          role !== "TEAM" && { assignedLeaderId: effectiveAssignedLeaderId }),
        ...(targetValue !== undefined && {
          targetValue: parseFloat(targetValue),
        }),
        ...(achievedValue !== undefined && {
          achievedValue:
            achievedValue !== null && achievedValue !== ""
              ? parseFloat(achievedValue)
              : null,
        }),
        ...(unit !== undefined && { unit }),
        ...(req.body.targetType !== undefined && { targetType: req.body.targetType }),
        ...(status !== undefined ? { status } : { status: autoStatus }),
        ...(kanbanStatus !== undefined && { kanbanStatus }),
        ...(weight !== undefined && { weight: parseFloat(weight) }),
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
        ...(finishDate !== undefined && {
          finishDate: finishDate ? new Date(finishDate) : null,
        }),
        ...(targetSprintName !== undefined && { sprintMonth: targetSprintName || null }),
        ...(targetSprintId !== undefined && { sprintId: targetSprintId }),
      },
      include: {
        team: true,
        owner: {
          select: { id: true, name: true, email: true, position: true },
        },
        assignedLeader: {
          select: { id: true, name: true, position: true },
        },
        kpis: {
          include: {
            kpi: true,
          },
        },
      },
    });

    if (Array.isArray(kpis)) {
      await prisma.initiativeKpi.deleteMany({ where: { initiativeId: id } });
      if (kpis.length > 0) {
        await prisma.initiativeKpi.createMany({
          data: kpis.map((k: any) => ({
            initiativeId: id,
            kpiId: k.kpiId,
            targetValue: parseFloat(k.targetValue) || 0,
            currentValue: parseFloat(k.currentValue) || 0,
          })),
        });
      }
    }

    if (assignedLeaderId && assignedLeaderId !== existing.assignedLeaderId) {
      await createNotification({
        recipientId: assignedLeaderId,
        type: "INITIATIVE_ASSIGNED",
        title: "Inisiatif Ditugaskan ke Anda",
        body: `Initiative "${updated.title}" telah di-assign ke Anda`,
        link: "/initiatives",
      });
    }

    await logAudit(prisma, {
      userId: req.user?.id,
      action: "UPDATE",
      entityType: "INITIATIVE",
      entityId: id,
      oldValues: {
        title: existing.title,
        status: existing.status,
        targetValue: existing.targetValue,
        kanbanStatus: existing.kanbanStatus,
      },
      newValues: {
        title: updated.title,
        status: updated.status,
        targetValue: updated.targetValue,
        kanbanStatus: updated.kanbanStatus,
      },
      req,
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Update initiative error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// PATCH /api/initiatives/:id/reassign — Reassign Initiative ke Leader lain (hanya oleh Leader assignee saat ini)
export async function reassignInitiative(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { newLeaderId } = req.body;
    const { role, id: userId } = req.user!;

    if (!newLeaderId) {
      return res.status(400).json({ message: "newLeaderId wajib diisi" });
    }

    const initiative = await prisma.initiative.findUnique({ where: { id } });
    if (!initiative) {
      return res.status(404).json({ message: "Initiative tidak ditemukan" });
    }

    if (
      role === "LEADER" &&
      initiative.assignedLeaderId !== userId &&
      initiative.assignedBy !== userId
    ) {
      return res.status(403).json({
        message:
          "Forbidden: Hanya Leader yang memegang assignment ini yang dapat melakukan reassignment",
      });
    }

    const targetLeader = await prisma.user.findUnique({
      where: { id: newLeaderId },
      select: { id: true, name: true, role: true, department: true },
    });

    if (!targetLeader || targetLeader.role !== "LEADER") {
      return res
        .status(400)
        .json({ message: "Target user harus memiliki role LEADER" });
    }

    const updated = await prisma.initiative.update({
      where: { id },
      data: {
        assignedLeaderId: newLeaderId,
        assignedBy: userId,
      },
      include: {
        assignedLeader: { select: { id: true, name: true, position: true } },
      },
    });

    await createNotification({
      recipientId: newLeaderId,
      type: "INITIATIVE_ASSIGNED",
      title: "Inisiatif Dipindahkan ke Anda",
      body: `Initiative "${initiative.title}" telah direassign ke Anda`,
      link: "/initiatives",
    });

    return res
      .status(200)
      .json({ message: "Reassignment berhasil", initiative: updated });
  } catch (error) {
    console.error("Reassign initiative error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// PATCH /api/initiatives/:id/kanban-status — Update Kanban column (Bebas digeser oleh role mana saja yang mengelola)
export async function updateInitiativeKanbanStatus(
  req: AuthRequest,
  res: Response,
) {
  try {
    const { id } = req.params;
    const { kanbanStatus, achievedValue } = req.body;
    const userId = req.user!.id;

    if (
      !kanbanStatus ||
      !["TODO", "IN_PROGRESS", "DONE", "DROP"].includes(kanbanStatus)
    ) {
      return res.status(400).json({
        message:
          "kanbanStatus harus 'TODO', 'IN_PROGRESS', 'DONE', atau 'DROP'",
      });
    }

    if (id.startsWith("task-")) {
      const taskId = id.replace("task-", "");
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { initiative: { include: { team: true } } },
      });
      if (!task)
        return res.status(404).json({ message: "Task tidak ditemukan" });

      let newStatus = task.status;

      if (kanbanStatus === "DONE") {
        newStatus = "DONE";
      } else if (kanbanStatus === "DROP") {
        newStatus = "DROP";
      } else {
        newStatus = "ON_TRACK";
      }

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          kanbanStatus:
            task.isCrossDept && kanbanStatus === "DONE" ? "CLOSED" : kanbanStatus,
          status: newStatus,
        },
      });

      // Auto-cascade Task → Initiative → KR
      await cascadeTaskValueUpdate(taskId, task.initiativeId);

      // Send notification to leader (or fallback to manager if dept has no leader) if moved by team member
      const recipientLeaderId = await getTaskApprovalRecipientId(task, userId);
      if (recipientLeaderId) {
        await createNotification({
          recipientId: recipientLeaderId,
          type: "TASK_UPDATE_PENDING",
          title: `Update Stage Task: ${kanbanStatus}`,
          body: `Task "${task.title}" dipindahkan ke stage ${kanbanStatus} oleh anggota tim`,
          link: "/approvals",
        });
      }

      return res.status(200).json({
        id: `task-${task.id}`,
        taskId: task.id,
        isTaskCard: true,
        title: task.title,
        currentValue: updatedTask.currentValue,
        targetValue: updatedTask.targetValue,
        kanbanStatus,
        status: updatedTask.status,
      });
    }

    const existing = await prisma.initiative.findUnique({
      where: { id },
      include: { team: true },
    });
    if (!existing)
      return res.status(404).json({ message: "Initiative tidak ditemukan" });

    const updated = await prisma.initiative.update({
      where: { id },
      data: {
        kanbanStatus,
        ...(achievedValue !== undefined && {
          achievedValue:
            achievedValue !== null && achievedValue !== ""
              ? parseFloat(achievedValue)
              : null,
        }),
      },
      include: {
        keyResult: { select: { id: true, title: true, bscPerspective: true } },
        team: { select: { id: true, name: true, department: true } },
        owner: {
          select: { id: true, name: true, email: true, position: true },
        },
      },
    });

    // AUTO-CASCADE: recalculate KR.currentValue
    if (existing.keyResultId) await cascadeInitiativeToMonthlyKr(existing.keyResultId);

    // Send notification to leader (or fallback to manager if dept has no leader) if moved by team member
    let recipientLeaderId =
      existing.assignedLeaderId || existing.assignedBy || existing.ownerId;
    if (existing.team?.department) {
      const leaderInfo = await getDepartmentLeaderInfo([existing.team.department]);
      if (!leaderInfo.deptsWithLeader.has(existing.team.department)) {
        const dept = await prisma.department.findUnique({
          where: { value: existing.team.department },
          select: { managerId: true },
        });
        if (dept?.managerId) {
          recipientLeaderId = dept.managerId;
        }
      }
    }
    if (recipientLeaderId && recipientLeaderId !== userId) {
      await createNotification({
        recipientId: recipientLeaderId,
        type: "TASK_UPDATE_PENDING",
        title: `Update Stage Inisiatif: ${kanbanStatus}`,
        body: `Inisiatif "${existing.title}" dipindahkan ke stage ${kanbanStatus} oleh anggota tim`,
        link: "/approvals",
      });
    }

    // Log history
    await prisma.initiativeUpdate.create({
      data: {
        initiativeId: id,
        oldValue: existing.currentValue,
        newValue: existing.achievedValue ?? existing.currentValue,
        note: `Status Kanban diubah ke ${kanbanStatus}`,
        kanbanStatus,
        submittedBy: userId,
        status: "APPROVED",
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Update initiative kanban status error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// DELETE /api/initiatives/:id — Admin / Manager / Leader / Team delete initiative (cascade hapus Task & InitiativeUpdate)
export async function deleteInitiative(req: AuthRequest, res: Response): Promise<any> {
  try {
    const { id } = req.params;
    const cleanId = id && id.startsWith("task-") ? id.replace(/^task-/, "") : id;
    const role = req.user?.originalRole === "ADMIN" || req.user?.role === "ADMIN" ? "ADMIN" : req.user!.role;
    const userId = req.user!.id;

    // Forward task- cards from kanban to deleteTask
    if (id && id.startsWith("task-")) {
      req.params.id = cleanId;
      return deleteTask(req, res);
    }

    const existing = await prisma.initiative.findUnique({
      where: { id: cleanId },
      include: { team: true },
    });
    if (!existing) {
      const existingTask = await prisma.task.findUnique({ where: { id: cleanId } });
      if (existingTask) {
        req.params.id = cleanId;
        return deleteTask(req, res);
      }
      return res.status(404).json({ message: "Initiative tidak ditemukan" });
    }

    // Guard locked sprint
    if (existing.sprintId && role !== "ADMIN") {
      const sp = await prisma.sprint.findUnique({ where: { id: existing.sprintId } });
      if (sp?.isLocked) {
        return res.status(403).json({ message: "Sprint sudah ditutup dan terkunci. Hanya Admin yang dapat menghapus inisiatif." });
      }
    }

    // Authorization checks based on role
    if (role === "MANAGER") {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { department: true },
      });
      const managedDepts = await prisma.department.findMany({
        where: { managerId: userId },
        select: { value: true },
      });
      const deptList = managedDepts.map((d) => d.value);
      if (dbUser?.department) deptList.push(dbUser.department);

      if (
        !existing.team?.department ||
        !deptList.includes(existing.team.department)
      ) {
        return res.status(403).json({
          message:
            "Forbidden: Manager hanya dapat menghapus inisiatif di departemennya",
        });
      }
    } else if (role === "LEADER") {
      const leaderTeamIds = await getLeaderTeamIds(userId);
      const isLeaderOfTeam = existing.teamId && leaderTeamIds.includes(existing.teamId);
      if (
        existing.assignedLeaderId !== userId &&
        existing.ownerId !== userId &&
        existing.assignedBy !== userId &&
        !isLeaderOfTeam
      ) {
        return res.status(403).json({
          message:
            "Forbidden: Anda tidak memiliki akses untuk menghapus inisiatif ini",
        });
      }
    } else if (role === "TEAM") {
      if (existing.ownerId !== userId && existing.assignedBy !== userId) {
        return res.status(403).json({
          message:
            "Forbidden: Anda hanya dapat menghapus inisiatif milik Anda sendiri",
        });
      }
    } else if (role !== "ADMIN" && role !== "C_LEVEL") {
      return res
        .status(403)
        .json({ message: "Forbidden: Role tidak diizinkan" });
    }

    // ponytail: soft-delete keeps FK historical integrity (tasks, updates, KPI links, comments) intact; add hard purge when data retention policy drafted
    await prisma.$transaction([
      prisma.initiative.update({
        where: { id: existing.id },
        data: { isActive: false },
      }),
      prisma.task.updateMany({
        where: { initiativeId: existing.id },
        data: { isActive: false },
      }),
    ]);

    await logAudit(prisma, {
      userId: req.user?.id,
      action: "STATUS_CHANGE",
      entityType: "INITIATIVE",
      entityId: existing.id,
      oldValues: {
        title: existing.title,
        isActive: existing.isActive,
      },
      newValues: {
        isActive: false,
      },
      req,
    });

    // Recalculate parent KeyResult progress jika ada
    if (existing.keyResultId) {
      await cascadeInitiativeToMonthlyKr(existing.keyResultId);
    }

    return res.status(200).json({ message: "Initiative berhasil dihapus" });
  } catch (error) {
    console.error("Delete initiative error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

function getTaskKanbanStatus(t: any): string {
  if (!t) return "TODO";
  if (t.kanbanStatus) return t.kanbanStatus;
  if (t.status === "DROP") {
    return "DROP";
  }
  if (
    t.status === "DONE" ||
    (t.targetValue > 0 && t.currentValue >= t.targetValue)
  ) {
    return "DONE";
  }
  if (t.currentValue > 0) {
    return "IN_PROGRESS";
  }
  return "TODO";
}

function formatTaskForResponse(t: any): any {
  if (!t) return t;
  return {
    ...t,
    kanbanStatus: getTaskKanbanStatus(t),
  };
}

function formatTaskAssignmentForResponse(a: any): any {
  if (!a) return a;
  return {
    ...a,
    task: formatTaskForResponse(a.task),
  };
}

function formatInitiativeForResponse(ini: any): any {
  if (!ini) return ini;
  return {
    ...ini,
    tasks: Array.isArray(ini.tasks) ? ini.tasks.map(formatTaskForResponse) : [],
  };
}

// GET /api/initiatives/my-work — Semua Task yang di-assign ke user
export async function getMyWork(req: AuthRequest, res: Response) {
  try {
    const { id: userId, role } = req.user!;
    const { userId: queryUserId } = req.query;

    const targetUserId =
      (["ADMIN", "C_LEVEL"].includes(role) && queryUserId)
        ? String(queryUserId)
        : userId;

    // TEAM & LEADER lihat full history; MANAGER & C_LEVEL hanya 1 terakhir
    const historyLimit = ["MANAGER", "C_LEVEL"].includes(role) ? 1 : undefined;

    const dbUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { teamId: true, department: true },
    });

    const taskIncludeCommon = {
      initiative: {
        include: {
          keyResult: { include: { objective: true, departments: true } },
          team: true,
          owner: { select: { id: true, name: true } },
          sprint: { select: { id: true, name: true, status: true, startDate: true, endDate: true } },
        },
      },
      sprint: { select: { id: true, name: true, status: true, startDate: true, endDate: true } },
      creator: {
        select: { id: true, name: true, department: true, role: true },
      },
      assignedTeamMember: {
        select: { id: true, name: true, department: true, role: true },
      },
      assignments: {
        include: { user: { select: { id: true, name: true } } },
      },
      kpis: {
        include: {
          kpi: true,
        },
      },
      comments: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" as const },
      },
      updates: {
        orderBy: { createdAt: "desc" as const },
        ...(historyLimit !== undefined ? { take: historyLimit } : {}),
      },
    };

    const taskAssignments = await prisma.taskAssignment.findMany({
      where: {
        userId: targetUserId,
        task: {
          isActive: true,
          OR: [{ initiativeId: null }, { initiative: { isActive: true } }],
        },
      },
      include: {
        task: {
          include: taskIncludeCommon,
        },
      },
    });

    // Ambil juga task yang assignedTeamMemberId = targetUserId tetapi belum ada di taskAssignment
    const existingTaskIds = taskAssignments.map((a) => a.taskId);
    const directTasks = await prisma.task.findMany({
      where: {
        assignedTeamMemberId: targetUserId,
        isActive: true,
        OR: [{ initiativeId: null }, { initiative: { isActive: true } }],
        ...(existingTaskIds.length > 0
          ? { id: { notIn: existingTaskIds } }
          : {}),
      },
      include: taskIncludeCommon,
    });

    const directTaskAssignments = directTasks.map((t) => ({
      id: `virtual-direct-${t.id}`,
      taskId: t.id,
      userId: targetUserId,
      task: t,
      createdAt: t.createdAt,
    }));

    // Ambil task tanpa assignment di DB, tapi inisiatif induknya dimiliki user ini (fallback ke PIC Inisiatif)
    const allFetchedTaskIds = [
      ...existingTaskIds,
      ...directTasks.map((t) => t.id),
    ];
    const unassignedTasks = await prisma.task.findMany({
      where: {
        isActive: true,
        initiative: {
          ownerId: targetUserId,
          isActive: true,
        },
        ...(allFetchedTaskIds.length > 0
          ? { id: { notIn: allFetchedTaskIds } }
          : {}),
      },
      include: taskIncludeCommon,
    });

    const unassignedTaskAssignments = unassignedTasks.map((t) => ({
      id: `virtual-${t.id}`,
      taskId: t.id,
      userId: targetUserId,
      task: t,
      createdAt: t.createdAt,
    }));

    // Ambil juga task lintas departemen yang relevan (outgoing/incoming)
    const allKnownIds = [
      ...allFetchedTaskIds,
      ...unassignedTasks.map((t) => t.id),
    ];
    const crossDeptTasks = await prisma.task.findMany({
      where: {
        isCrossDept: true,
        isActive: true,
        OR: [{ initiativeId: null }, { initiative: { isActive: true } }],
        AND: [
          {
            OR: [
              { creatorId: targetUserId },
              { assignedTeamMemberId: targetUserId },
              { assignments: { some: { userId: targetUserId } } },
              ...(dbUser?.department ? [{ targetDept: dbUser.department }] : []),
              ...(dbUser?.department && ["MANAGER", "LEADER"].includes(role)
                ? [{ creatorDept: dbUser.department }]
                : []),
            ],
          },
        ],
        ...(allKnownIds.length > 0 ? { id: { notIn: allKnownIds } } : {}),
      },
      include: taskIncludeCommon,
    });

    const crossDeptAssignments = crossDeptTasks.map((t) => ({
      id: `virtual-cross-${t.id}`,
      taskId: t.id,
      userId: targetUserId,
      task: t,
      createdAt: t.createdAt,
    }));

    const combinedTaskAssignments = [
      ...taskAssignments,
      ...directTaskAssignments,
      ...unassignedTaskAssignments,
      ...crossDeptAssignments,
    ];
    let myInitiatives: any[] = [];
    myInitiatives = await prisma.initiative.findMany({
      where: {
        isActive: true,
        OR: [
          { ownerId: targetUserId },
          { assignedLeaderId: targetUserId },
          {
            tasks: {
              some: {
                isActive: true,
                OR: [
                  { assignedTeamMemberId: targetUserId },
                  { assignments: { some: { userId: targetUserId } } },
                ],
              },
            },
          },
          ...(dbUser?.teamId ? [{ teamId: dbUser.teamId }] : []),
        ],
      },
      include: {
        keyResult: { include: { objective: true, departments: true } },
        team: true,
        owner: { select: { id: true, name: true } },
        sprint: { select: { id: true, name: true, status: true, startDate: true, endDate: true } },
        kpis: {
          include: {
            kpi: true,
          },
        },
        tasks: {
          where: { isActive: true },
          include: {
            sprint: { select: { id: true, name: true, status: true, startDate: true, endDate: true } },
            assignments: {
              include: { user: { select: { id: true, name: true } } },
            },
            kpis: {
              include: {
                kpi: true,
              },
            },
          },
        },
        progressUpdates: {
          orderBy: { createdAt: "desc" },
          ...(historyLimit !== undefined ? { take: historyLimit } : {}),
        },
      },
    });

    // Ambil data update/tugas dari anggota tim lainnya (selain dirinya)
    let teamMembersWork: any = { taskAssignments: [], initiatives: [] };
    let teamIds: string[] = [];
    if (dbUser?.teamId) {
      teamIds.push(dbUser.teamId);
    }
    if (role === "LEADER") {
      const leadingTeams = await prisma.team.findMany({
        where: { leaderId: userId },
        select: { id: true },
      });
      teamIds.push(...leadingTeams.map((t) => t.id));
    }
    if (role === "ADMIN" || role === "C_LEVEL") {
      // Admin & C-Level: lihat semua tim di seluruh departemen
      const allTeams = await prisma.team.findMany({
        select: { id: true },
      });
      teamIds.push(...allTeams.map((t) => t.id));
    } else if (role === "MANAGER") {
      const managedDepts = await prisma.department.findMany({
        where: { managerId: userId },
        select: { value: true },
      });
      const deptValues = managedDepts.map((d) => d.value);
      if (dbUser?.department && !deptValues.includes(dbUser.department)) {
        deptValues.push(dbUser.department);
      }
      const managerTeams = await prisma.team.findMany({
        where: { department: { in: deptValues } },
        select: { id: true },
      });
      teamIds.push(...managerTeams.map((t) => t.id));
    }
    const uniqueTeamIds = Array.from(new Set(teamIds));

    if (uniqueTeamIds.length > 0) {
      // Task yang diassign ke anggota tim lain
      const memberTaskAssignments = await prisma.taskAssignment.findMany({
        where: {
          task: {
            isActive: true,
            initiative: {
              isActive: true,
              teamId: { in: uniqueTeamIds },
            },
          },
          userId: { not: userId },
        },
        include: {
          user: { select: { id: true, name: true } },
          task: {
            include: taskIncludeCommon,
          },
        },
      });

      // Ambil task tanpa assignment di DB, tapi inisiatif induknya dimiliki anggota tim lain (fallback PIC inisiatif)
      const memberUnassignedTasks = await prisma.task.findMany({
        where: {
          isActive: true,
          initiative: {
            isActive: true,
            teamId: { in: uniqueTeamIds },
            NOT: [{ ownerId: userId }, { ownerId: null }],
          },
          assignments: {
            none: {},
          },
        },
        include: taskIncludeCommon,
      });

      const memberUnassignedAssignments = memberUnassignedTasks.map((t) => ({
        id: `virtual-member-${t.id}`,
        taskId: t.id,
        userId: t.initiative?.ownerId || userId,
        user: t.initiative?.owner || null,
        task: t,
        createdAt: t.createdAt,
      }));

      const combinedMemberTaskAssignments = [
        ...memberTaskAssignments,
        ...memberUnassignedAssignments,
      ];

      // Inisiatif tim yang dimiliki anggota lain (atau belum diassign)
      const memberInitiatives = await prisma.initiative.findMany({
        where: {
          isActive: true,
          teamId: { in: uniqueTeamIds },
          OR: [{ ownerId: { not: userId } }, { ownerId: null }],
        },
        include: {
          keyResult: { include: { objective: true, departments: true } },
          team: true,
          owner: { select: { id: true, name: true } },
          sprint: { select: { id: true, name: true, status: true, startDate: true, endDate: true } },
          kpis: {
            include: {
              kpi: true,
            },
          },
          tasks: {
            where: { isActive: true },
            include: {
              sprint: { select: { id: true, name: true, status: true, startDate: true, endDate: true } },
              assignments: {
                include: { user: { select: { id: true, name: true } } },
              },
              kpis: {
                include: {
                  kpi: true,
                },
              },
            },
          },
          progressUpdates: { orderBy: { createdAt: "desc" } },
        },
      });

      teamMembersWork = {
        taskAssignments: combinedMemberTaskAssignments,
        initiatives: memberInitiatives,
      };
    }

    // Resolve creators for tasks and initiatives
    const userIdsToFetch = new Set<string>();
    const addId = (id: any) => {
      if (typeof id === "string" && id.length > 5) userIdsToFetch.add(id);
    };

    const allTasks: any[] = [
      ...combinedTaskAssignments.map((a: any) => a.task),
      ...(teamMembersWork.taskAssignments || []).map((a: any) => a.task),
      ...myInitiatives.flatMap((i: any) => i.tasks || []),
      ...(teamMembersWork.initiatives || []).flatMap((i: any) => i.tasks || []),
    ].filter(Boolean);

    const allInis: any[] = [
      ...myInitiatives,
      ...(teamMembersWork.initiatives || []),
      ...allTasks.map((t: any) => t.initiative).filter(Boolean),
    ].filter(Boolean);

    allTasks.forEach((t: any) => {
      if (!t.creator) {
        if (t.creatorId) addId(t.creatorId);
        if (t.assignedBy) addId(t.assignedBy);
      }
    });

    allInis.forEach((i: any) => {
      if (!i.creator) {
        if (i.assignedBy) addId(i.assignedBy);
        if (i.ownerId) addId(i.ownerId);
      }
    });

    if (userIdsToFetch.size > 0) {
      const fetchedUsers = await prisma.user.findMany({
        where: { id: { in: Array.from(userIdsToFetch) } },
        select: { id: true, name: true, department: true, role: true },
      });
      const userMap = new Map<string, any>(fetchedUsers.map((u) => [u.id, u]));

      allTasks.forEach((t: any) => {
        if (!t.creator) {
          t.creator =
            (t.creatorId && userMap.get(t.creatorId)) ||
            (t.assignedBy && userMap.get(t.assignedBy)) ||
            (t.initiative?.owner ? { id: t.initiative.owner.id, name: t.initiative.owner.name } : null);
        }
      });

      allInis.forEach((i: any) => {
        if (!i.creator) {
          i.creator =
            (i.assignedBy && userMap.get(i.assignedBy)) ||
            (i.ownerId && userMap.get(i.ownerId)) ||
            (i.owner ? { id: i.owner.id, name: i.owner.name } : null);
        }
      });
    }

    return res.status(200).json({
      taskAssignments: combinedTaskAssignments.map(
        formatTaskAssignmentForResponse,
      ),
      myInitiatives: myInitiatives.map(formatInitiativeForResponse),
      teamMembersWork: {
        taskAssignments: (teamMembersWork.taskAssignments || []).map(
          formatTaskAssignmentForResponse,
        ),
        initiatives: (teamMembersWork.initiatives || []).map(
          formatInitiativeForResponse,
        ),
      },
    });
  } catch (error) {
    console.error("Get my work error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/initiatives/my-team — Semua inisiatif untuk tim user
export async function getMyTeamInitiatives(req: AuthRequest, res: Response) {
  try {
    const { id: userId, role } = req.user!;

    let where: any = {};
    if (role !== "ADMIN" && role !== "C_LEVEL") {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { teamId: true, department: true },
      });

      let teamIds: string[] = [];
      if (dbUser?.teamId) teamIds.push(dbUser.teamId);

      if (dbUser?.department) {
        const deptTeams = await prisma.team.findMany({
          where: { department: dbUser.department },
          select: { id: true },
        });
        teamIds.push(...deptTeams.map((t) => t.id));
      }

      // Jika LEADER atau MANAGER, ambil juga tim yang dipimpin
      const leadingTeams = await prisma.team.findMany({
        where: {
          OR: [{ leaderId: userId }, { managerId: userId }],
        },
        select: { id: true },
      });
      teamIds.push(...leadingTeams.map((t) => t.id));

      const uniqueTeamIds = Array.from(new Set(teamIds));

      where = {
        OR: [
          ...(uniqueTeamIds.length > 0
            ? [{ teamId: { in: uniqueTeamIds } }]
            : []),
          { ownerId: userId },
          { assignedLeaderId: userId },
          {
            tasks: {
              some: {
                OR: [
                  { assignedTeamMemberId: userId },
                  { assignments: { some: { userId } } },
                ],
              },
            },
          },
        ],
      };
    }

    const initiatives = await prisma.initiative.findMany({
      where: {
        ...where,
        isActive: true,
      },
      include: {
        keyResult: { include: { objective: true } },
        team: true,
        owner: {
          select: { id: true, name: true, email: true, position: true },
        },
        kpis: {
          include: {
            kpi: true,
          },
        },
        tasks: {
          where: { isActive: true },
          include: {
            assignments: {
              include: { user: { select: { id: true, name: true } } },
            },
            kpis: {
              include: {
                kpi: true,
              },
            },
            updates: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(initiatives);
  } catch (error) {
    console.error("Get team initiatives error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── Task ───────────────────────────────────────────────────────────────────

// GET /api/initiatives/:initiativeId/tasks
export async function getTasksForInitiative(req: AuthRequest, res: Response) {
  try {
    const { initiativeId } = req.params;
    const { role, id: userId } = req.user!;

    // TEAM: pastikan initiative ini milik tim user
    if (role === "TEAM") {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { teamId: true },
      });
      const initiative = await prisma.initiative.findUnique({
        where: { id: initiativeId },
      });
      if (!initiative || initiative.teamId !== dbUser?.teamId) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const tasks = await prisma.task.findMany({
      where: { initiativeId, isActive: true },
      include: {
        assignedTeamMember: { select: { id: true, name: true, email: true } },
        assignments: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        updates: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });

    return res.status(200).json(tasks);
  } catch (error) {
    console.error("Get Tasks error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// POST /api/initiatives/:initiativeId/tasks — Create Task
export async function createTask(req: AuthRequest, res: Response) {
  try {
    const { initiativeId } = req.params;
    const {
      title,
      targetValue,
      unit,
      assigneeId,
      assignedTeamMemberId,
      assigneeIds,
      assignedTeamMemberIds,
      sprintMonth,
      startDate,
      finishDate,
      dueDate,
      kanbanStatus,
      keyResultId,
      kpis,
    } = req.body;
    const { role, id: userId } = req.user!;

    if (!title || targetValue === undefined) {
      return res
        .status(400)
        .json({ message: "title dan targetValue wajib diisi" });
    }

    const initiative = await prisma.initiative.findUnique({
      where: { id: initiativeId },
    });
    if (!initiative)
      return res.status(404).json({ message: "Initiative tidak ditemukan" });

    if (role === "TEAM" && !initiative.keyResultId) {
      return res.status(400).json({
        message: "Task tim hanya dapat dibuat pada Inisiatif yang telah terhubung ke Key Result (KR)",
      });
    }

    // Validate Cascade KR if provided
    try {
      await validateCascadeKR(initiativeId, keyResultId);
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }

    // Resolve targetAssigneeIds for multi-assignee task creation (1 card per assignee)
    // ponytail: duplicate records per assignee; upgrade path: shared task assignments table when multi-assignee task sync is explicitly required.
    const rawAssigneeIds = Array.isArray(assigneeIds) && assigneeIds.length > 0
      ? assigneeIds.map((id: any) => String(id).trim()).filter(Boolean)
      : Array.isArray(assignedTeamMemberIds) && assignedTeamMemberIds.length > 0
      ? assignedTeamMemberIds.map((id: any) => String(id).trim()).filter(Boolean)
      : [
          (assignedTeamMemberId && String(assignedTeamMemberId).trim()) ||
          (assigneeId && String(assigneeId).trim()) ||
          null,
        ].filter(Boolean);

    const targetAssigneeIds = rawAssigneeIds.length > 0
      ? rawAssigneeIds
      : [
          (initiative.assignedLeaderId && String(initiative.assignedLeaderId).trim()) ||
          (initiative.ownerId && String(initiative.ownerId).trim()) ||
          userId,
        ].filter(Boolean);

    for (const curAssigneeId of targetAssigneeIds) {
      if (curAssigneeId && (role === "LEADER" || role === "TEAM")) {
        const leaderUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { department: true },
        });
        const targetUser = await prisma.user.findUnique({
          where: { id: curAssigneeId },
          select: { department: true },
        });
        if (!targetUser) {
          return res
            .status(400)
            .json({ message: `Assignee user ${curAssigneeId} tidak ditemukan` });
        }
        if (
          leaderUser?.department &&
          targetUser.department &&
          leaderUser.department !== targetUser.department
        ) {
          return res.status(403).json({
            message:
              "Anggota tim yang dipilih harus berada di departemen yang sama",
          });
        }
      }
    }

    const targetFinishDate = finishDate !== undefined ? finishDate : dueDate;
    const finalSprintMonth = sprintMonth || initiative.sprintMonth || null;
    let finalSprintId = req.body.sprintId || null;
    let finalSprintName: string | null = finalSprintMonth;
    if (finalSprintId) {
      const sp = await prisma.sprint.findUnique({ where: { id: finalSprintId } });
      if (sp) finalSprintName = sp.name;
    } else {
      const matchedSprint = await resolveSprint({
        date: startDate || targetFinishDate || null,
        sprintMonth: finalSprintMonth,
        fallbackToActive: false,
      });
      if (matchedSprint) {
        finalSprintId = matchedSprint.id;
        finalSprintName = matchedSprint.name;
      } else {
        finalSprintId = initiative.sprintId || (await getActiveSprint())?.id || null;
        if (finalSprintId) {
          const sp = await prisma.sprint.findUnique({ where: { id: finalSprintId } });
          if (sp) finalSprintName = sp.name;
        }
      }
    }
    const finalBaselineValue = req.body.baselineValue !== undefined ? parseFloat(req.body.baselineValue) : 0;

    if (req.body.sprintId && role !== "ADMIN") {
      const sp = await prisma.sprint.findUnique({ where: { id: req.body.sprintId } });
      if (sp?.isLocked) {
        return res.status(403).json({ message: "Sprint sudah ditutup dan terkunci. Hanya Admin yang dapat menambah task." });
      }
    }

    const targetTypeVal = req.body.targetType || "AT_LEAST";
    const initialStatus = calculateAutoStatus(
      calculateProgressPercent(0, parseFloat(targetValue), targetTypeVal, finalBaselineValue)
    );

    const createdTasks: any[] = [];

    for (const curAssigneeId of targetAssigneeIds) {
      const task = await prisma.task.create({
        data: {
          initiativeId,
          title,
          targetValue: parseFloat(targetValue),
          baselineValue: finalBaselineValue,
          unit: unit || null,
          status: initialStatus,
          targetType: targetTypeVal,
          kanbanStatus: kanbanStatus || "TODO",
          assignedTeamMemberId: curAssigneeId,
          creatorId: userId,
          assignedBy: userId,
          sprintMonth: finalSprintName || finalSprintMonth,
          sprintId: finalSprintId,
          startDate: startDate ? new Date(startDate) : null,
          finishDate: targetFinishDate ? new Date(targetFinishDate) : null,
          ...(curAssigneeId && {
            assignments: {
              create: {
                userId: curAssigneeId,
              },
            },
          }),
          ...(Array.isArray(kpis) &&
            kpis.length > 0 && {
              kpis: {
                create: kpis.map((k: any) => ({
                  kpiId: k.kpiId,
                  targetValue: parseFloat(k.targetValue) || 0,
                  currentValue: parseFloat(k.currentValue) || 0,
                })),
              },
            }),
        },
        include: {
          assignedTeamMember: { select: { id: true, name: true } },
          kpis: {
            include: {
              kpi: true,
            },
          },
        },
      });

      if (curAssigneeId && curAssigneeId !== userId) {
        await createNotification({
          recipientId: curAssigneeId,
          type: "TASK_ASSIGNED",
          title: "Task Baru Ditugaskan",
          body: `Anda mendapat assignment Task: "${title}"`,
          link: "/team/my-work",
        });
      }

      await logAudit(prisma, {
        userId: req.user?.id,
        action: "CREATE",
        entityType: "TASK",
        entityId: task.id,
        newValues: {
          title: task.title,
          targetValue: task.targetValue,
          initiativeId: task.initiativeId,
          assignedTeamMemberId: task.assignedTeamMemberId,
        },
        req,
      });

      createdTasks.push(task);
    }

    if (createdTasks.length === 1) {
      return res.status(201).json(createdTasks[0]);
    }
    return res.status(201).json({
      ...createdTasks[0],
      tasks: createdTasks,
      count: createdTasks.length,
    });
  } catch (error) {
    console.error("Create Task error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// POST /api/initiatives/:initiativeId/tasks/batch — Create Multiple Tasks at once
export async function createTasksBatch(req: AuthRequest, res: Response) {
  try {
    const { initiativeId } = req.params;
    const { tasks } = req.body;
    const { role, id: userId } = req.user!;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        message:
          "Daftar task (tasks) harus berupa array dan tidak boleh kosong",
      });
    }

    const initiative = await prisma.initiative.findUnique({
      where: { id: initiativeId },
    });
    if (!initiative) {
      return res.status(404).json({ message: "Initiative tidak ditemukan" });
    }

    if (role === "TEAM" && !initiative.keyResultId) {
      return res.status(400).json({
        message: "Task tim hanya dapat dibuat pada Inisiatif yang telah terhubung ke Key Result (KR)",
      });
    }

    if (initiative.keyResultId) {
      try {
        await validateCascadeKR(initiativeId, initiative.keyResultId);
      } catch (err: any) {
        return res.status(400).json({ message: err.message });
      }
    }

    if (initiative.sprintId && role !== "ADMIN") {
      const sp = await prisma.sprint.findUnique({ where: { id: initiative.sprintId } });
      if (sp?.isLocked) {
        return res.status(403).json({ message: "Sprint sudah ditutup dan terkunci. Hanya Admin yang dapat menambah task." });
      }
    }

    const createdTasks: any[] = [];
    const notificationsToSend: {
      recipientId: string;
      title: string;
      body: string;
    }[] = [];

    const validTaskItems = tasks.filter(
      (t: any) => t && typeof t.title === "string" && t.title.trim().length > 0,
    );
    if (validTaskItems.length === 0) {
      return res.status(400).json({
        message: "Tidak ada baris task valid dengan judul yang diisi",
      });
    }

    for (const item of validTaskItems) {
      const itemAssigneeIds = Array.isArray(item.assigneeIds) && item.assigneeIds.length > 0
        ? item.assigneeIds.map((id: any) => String(id).trim()).filter(Boolean)
        : Array.isArray(item.assignedTeamMemberIds) && item.assignedTeamMemberIds.length > 0
        ? item.assignedTeamMemberIds.map((id: any) => String(id).trim()).filter(Boolean)
        : [
            (item.assignedTeamMemberId && String(item.assignedTeamMemberId).trim()) ||
            (item.assignedMemberId && String(item.assignedMemberId).trim()) ||
            (initiative.assignedLeaderId && String(initiative.assignedLeaderId).trim()) ||
            (initiative.ownerId && String(initiative.ownerId).trim()) ||
            userId,
          ].filter(Boolean);

      const targetAssignees = itemAssigneeIds.length > 0 ? itemAssigneeIds : [userId];

      const itemFinishDate = item.finishDate !== undefined ? item.finishDate : item.dueDate;
      const finalSprintMonth =
        item.sprintMonth || initiative.sprintMonth || null;
      let finalSprintId = item.sprintId || null;
      let finalSprintName: string | null = finalSprintMonth;
      if (finalSprintId) {
        const sp = await prisma.sprint.findUnique({ where: { id: finalSprintId } });
        if (sp) finalSprintName = sp.name;
      } else {
        const matchedSprint = await resolveSprint({
          date: item.startDate || itemFinishDate || null,
          sprintMonth: finalSprintMonth,
          fallbackToActive: false,
        });
        if (matchedSprint) {
          finalSprintId = matchedSprint.id;
          finalSprintName = matchedSprint.name;
        } else {
          finalSprintId = initiative.sprintId || (await getActiveSprint())?.id || null;
          if (finalSprintId) {
            const sp = await prisma.sprint.findUnique({ where: { id: finalSprintId } });
            if (sp) finalSprintName = sp.name;
          }
        }
      }
      const finalBaselineValue = item.baselineValue !== undefined ? parseFloat(item.baselineValue) : 0;
      const targetVal = parseFloat(item.targetValue) || 1;
      const itemTargetType = item.targetType || "AT_LEAST";
      const initialStatus = calculateAutoStatus(
        calculateProgressPercent(0, targetVal, itemTargetType, finalBaselineValue)
      );

      for (const targetAssigneeId of targetAssignees) {
        const created = await prisma.task.create({
          data: {
            initiativeId,
            title: item.title.trim(),
            targetValue: targetVal,
            baselineValue: finalBaselineValue,
            unit: item.unit || null,
            status: initialStatus,
            targetType: itemTargetType,
            kanbanStatus: item.kanbanStatus || "TODO",
            assignedTeamMemberId: targetAssigneeId,
            creatorId: userId,
            assignedBy: userId,
            sprintMonth: finalSprintName || finalSprintMonth,
            sprintId: finalSprintId,
            startDate: item.startDate ? new Date(item.startDate) : null,
            finishDate: itemFinishDate ? new Date(itemFinishDate) : null,
            ...(targetAssigneeId && {
              assignments: {
                create: {
                  userId: targetAssigneeId,
                },
              },
            }),
            ...(Array.isArray(item.kpis) &&
              item.kpis.length > 0 && {
                kpis: {
                  create: item.kpis.map((k: any) => ({
                    kpiId: k.kpiId || k.id,
                    targetValue: parseFloat(k.targetValue) || 0,
                    currentValue: parseFloat(k.currentValue) || 0,
                  })),
                },
              }),
          },
          include: {
            assignedTeamMember: { select: { id: true, name: true } },
            kpis: {
              include: {
                kpi: true,
              },
            },
          },
        });

        createdTasks.push(created);

        if (targetAssigneeId && targetAssigneeId !== userId) {
          notificationsToSend.push({
            recipientId: targetAssigneeId,
            title: "Task Baru Ditugaskan",
            body: `Anda mendapat assignment Task: "${item.title.trim()}"`,
          });
        }
      }
    }

    for (const notif of notificationsToSend) {
      createNotification({
        recipientId: notif.recipientId,
        type: "TASK_ASSIGNED",
        title: notif.title,
        body: notif.body,
        link: "/team/my-work",
      }).catch((e) => console.error("Batch task notification error:", e));
    }

    return res.status(201).json({
      message: `${createdTasks.length} task berhasil dibuat`,
      tasks: createdTasks,
    });
  } catch (error) {
    console.error("Create Tasks Batch error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// PUT /api/tasks/:id — Update Task
export async function updateTask(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const {
      title,
      targetValue,
      unit,
      status,
      kanbanStatus,
      assignedTeamMemberId,
      sprintMonth,
      startDate,
      finishDate,
      dueDate,
      keyResultId,
      kpis,
    } = req.body;
    const { role, id: userId } = req.user!;

    const existing = await prisma.task.findUnique({
      where: { id },
      include: { initiative: { include: { team: true } }, assignments: true },
    });
    if (!existing)
      return res.status(404).json({ message: "Task tidak ditemukan" });

    // Guard locked sprint
    if (existing.sprintId && role !== "ADMIN") {
      const sp = await prisma.sprint.findUnique({ where: { id: existing.sprintId } });
      if (sp?.isLocked) {
        return res.status(403).json({ message: "Sprint sudah ditutup dan terkunci. Hanya Admin yang dapat mengubah task." });
      }
    }

    // Role scope checks
    if (role === "MANAGER") {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { department: true },
      });
      const managedDepts = await prisma.department.findMany({
        where: { managerId: userId },
        select: { value: true },
      });
      const deptList = managedDepts.map((d) => d.value);
      if (dbUser?.department) deptList.push(dbUser.department);

      const taskDept =
        existing.initiative?.team?.department ||
        existing.targetDept ||
        existing.creatorDept;

      if (!taskDept || !deptList.includes(taskDept)) {
        return res.status(403).json({
          message:
            "Forbidden: Manager hanya dapat mengubah task di departemennya",
        });
      }
    } else if (role === "LEADER") {
      const leaderTeamIds = await getLeaderTeamIds(userId);
      const isLeaderOfTaskTeam = existing.initiative?.teamId && leaderTeamIds.includes(existing.initiative.teamId);
      const isAssigned = existing.assignments?.some((a) => a.userId === userId);
      if (
        existing.assignedBy !== userId &&
        existing.creatorId !== userId &&
        existing.initiative?.assignedLeaderId !== userId &&
        existing.assignedTeamMemberId !== userId &&
        !isAssigned &&
        !isLeaderOfTaskTeam
      ) {
        return res.status(403).json({
          message:
            "Forbidden: Anda tidak memiliki akses untuk mengubah task ini",
        });
      }
    } else if (role === "TEAM") {
      const isAssigned = existing.assignments?.some((a) => a.userId === userId);
      if (
        existing.assignedTeamMemberId !== userId &&
        existing.assignedBy !== userId &&
        existing.creatorId !== userId &&
        !isAssigned
      ) {
        return res.status(403).json({
          message: "Forbidden: Anda hanya dapat mengubah task Anda sendiri",
        });
      }
    } else if (role !== "ADMIN" && role !== "C_LEVEL") {
      return res.status(403).json({ message: "Forbidden: Role tidak diizinkan" });
    }

    // Validate Cascade KR if provided
    try {
      await validateCascadeKR(existing.initiativeId, keyResultId);
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }

    if (assignedTeamMemberId && (role === "LEADER" || role === "TEAM")) {
      const leaderUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { department: true },
      });
      const targetUser = await prisma.user.findUnique({
        where: { id: assignedTeamMemberId },
        select: { department: true },
      });
      if (
        leaderUser?.department &&
        targetUser?.department &&
        leaderUser.department !== targetUser.department
      ) {
        return res.status(403).json({
          message:
            "Anggota tim yang dipilih harus berada di departemen yang sama",
        });
      }
    }

    const targetFinishDate = finishDate !== undefined ? finishDate : dueDate;

    let targetSprintId = req.body.sprintId !== undefined ? req.body.sprintId : existing.sprintId;
    let targetSprintName: string | null = sprintMonth !== undefined ? sprintMonth : existing.sprintMonth;
    if (targetSprintId) {
      const sp = await prisma.sprint.findUnique({ where: { id: targetSprintId } });
      if (sp) targetSprintName = sp.name;
    } else if (sprintMonth || startDate || targetFinishDate || existing.startDate || existing.finishDate) {
      const sp = await resolveSprint({
        date: startDate || targetFinishDate || existing.startDate || existing.finishDate,
        sprintMonth: sprintMonth || existing.sprintMonth,
        fallbackToActive: false,
      });
      if (sp) {
        targetSprintId = sp.id;
        targetSprintName = sp.name;
      }
    }

    const targetTypeVal = req.body.targetType !== undefined ? req.body.targetType : existing.targetType;
    const finalTgt = targetValue !== undefined ? parseFloat(targetValue) : (existing.targetValue || 0);
    const finalBase = req.body.baselineValue !== undefined ? parseFloat(req.body.baselineValue) : (existing.baselineValue || 0);
    const autoStatus = calculateAutoStatus(calculateProgressPercent(existing.currentValue, finalTgt, targetTypeVal, finalBase));

    let finalStatus = status;
    if (finalStatus === undefined) {
      if (kanbanStatus === "DONE") {
        finalStatus = "DONE";
      } else if (kanbanStatus === "DROP") {
        finalStatus = "DROP";
      } else {
        finalStatus = autoStatus;
      }
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(targetValue !== undefined && {
          targetValue: parseFloat(targetValue),
        }),
        ...(req.body.baselineValue !== undefined && {
          baselineValue: parseFloat(req.body.baselineValue),
        }),
        ...(unit !== undefined && { unit }),
        ...(req.body.targetType !== undefined && { targetType: req.body.targetType }),
        ...(finalStatus !== undefined && { status: finalStatus }),
        ...(kanbanStatus !== undefined && { kanbanStatus }),
        ...(assignedTeamMemberId !== undefined && { assignedTeamMemberId }),
        ...(targetSprintName !== undefined && { sprintMonth: targetSprintName }),
        ...(targetSprintId !== undefined && { sprintId: targetSprintId }),
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
        ...(targetFinishDate !== undefined && {
          finishDate: targetFinishDate ? new Date(targetFinishDate) : null,
        }),
      },
    });

    if (Array.isArray(kpis)) {
      await prisma.taskKpi.deleteMany({ where: { taskId: id } });
      if (kpis.length > 0) {
        await prisma.taskKpi.createMany({
          data: kpis.map((k: any) => ({
            taskId: id,
            kpiId: k.kpiId,
            targetValue: parseFloat(k.targetValue) || 0,
            currentValue: parseFloat(k.currentValue) || 0,
          })),
        });
      }
    }

    // Cascade update task progress to parent initiative & KR
    await cascadeTaskValueUpdate(id, existing.initiativeId);

    if (
      assignedTeamMemberId &&
      assignedTeamMemberId !== existing.assignedTeamMemberId &&
      assignedTeamMemberId !== userId
    ) {
      await createNotification({
        recipientId: assignedTeamMemberId,
        type: "TASK_ASSIGNED",
        title: "Task Ditugaskan ke Anda",
        body: `Task "${updated.title}" telah di-assign ke Anda`,
        link: "/team/my-work",
      });
    }

    await logAudit(prisma, {
      userId: req.user?.id,
      action: "UPDATE",
      entityType: "TASK",
      entityId: id,
      oldValues: {
        title: existing.title,
        status: existing.status,
        targetValue: existing.targetValue,
        currentValue: existing.currentValue,
      },
      newValues: {
        title: updated.title,
        status: updated.status,
        targetValue: updated.targetValue,
        currentValue: updated.currentValue,
      },
      req,
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Update Task error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// DELETE /api/tasks/:id — Delete Task
export async function deleteTask(req: AuthRequest, res: Response): Promise<any> {
  try {
    const { id } = req.params;
    const cleanId = id && id.startsWith("task-") ? id.replace(/^task-/, "") : id;
    const role = req.user?.originalRole === "ADMIN" || req.user?.role === "ADMIN" ? "ADMIN" : req.user!.role;
    const userId = req.user!.id;

    const existing = await prisma.task.findUnique({
      where: { id: cleanId },
      include: { initiative: { include: { team: true } }, assignments: true },
    });
    if (!existing) {
      const existingIni = await prisma.initiative.findUnique({ where: { id: cleanId } });
      if (existingIni) {
        req.params.id = cleanId;
        return deleteInitiative(req, res);
      }
      return res.status(404).json({ message: "Task tidak ditemukan" });
    }

    // Guard locked sprint
    if (existing.sprintId && role !== "ADMIN") {
      const sp = await prisma.sprint.findUnique({ where: { id: existing.sprintId } });
      if (sp?.isLocked) {
        return res.status(403).json({ message: "Sprint sudah ditutup dan terkunci. Hanya Admin yang dapat menghapus task." });
      }
    }

    // Authorization checks based on role
    if (role === "MANAGER") {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { department: true },
      });
      const managedDepts = await prisma.department.findMany({
        where: { managerId: userId },
        select: { value: true },
      });
      const deptList = managedDepts.map((d) => d.value);
      if (dbUser?.department) deptList.push(dbUser.department);

      const taskDept =
        existing.initiative?.team?.department ||
        existing.targetDept ||
        existing.creatorDept;

      if (
        !taskDept ||
        !deptList.includes(taskDept)
      ) {
        return res.status(403).json({
          message:
            "Forbidden: Manager hanya dapat menghapus task di departemennya",
        });
      }
    } else if (role === "LEADER") {
      const leaderTeamIds = await getLeaderTeamIds(userId);
      const isLeaderOfTaskTeam = existing.initiative?.teamId && leaderTeamIds.includes(existing.initiative.teamId);
      const isAssigned = existing.assignments?.some((a) => a.userId === userId);
      if (
        existing.assignedBy !== userId &&
        existing.creatorId !== userId &&
        existing.initiative?.assignedLeaderId !== userId &&
        existing.assignedTeamMemberId !== userId &&
        !isAssigned &&
        !isLeaderOfTaskTeam
      ) {
        return res.status(403).json({
          message:
            "Forbidden: Anda tidak memiliki akses untuk menghapus task ini",
        });
      }
    } else if (role === "TEAM") {
      const isAssigned = existing.assignments?.some((a) => a.userId === userId);
      if (
        existing.assignedTeamMemberId !== userId &&
        existing.assignedBy !== userId &&
        existing.creatorId !== userId &&
        !isAssigned
      ) {
        return res.status(403).json({
          message: "Forbidden: Anda hanya dapat menghapus task Anda sendiri",
        });
      }
    } else if (role !== "ADMIN" && role !== "C_LEVEL") {
      return res
        .status(403)
        .json({ message: "Forbidden: Role tidak diizinkan" });
    }

    // ponytail: soft-delete keeps FK historical integrity (comments, updates, assignments) intact; add hard purge when data retention policy drafted
    await prisma.task.update({
      where: { id: existing.id },
      data: { isActive: false },
    });

    await logAudit(prisma, {
      userId: req.user?.id,
      action: "STATUS_CHANGE",
      entityType: "TASK",
      entityId: existing.id,
      oldValues: {
        title: existing.title,
        isActive: existing.isActive,
      },
      newValues: {
        isActive: false,
      },
      req,
    });

    // Recalculate parent initiative progress
    await cascadeTaskValueUpdate(existing.id, existing.initiativeId);

    return res.status(200).json({ message: "Task berhasil dihapus" });
  } catch (error) {
    console.error("Delete Task error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// POST /api/tasks/:id/assign — Admin / Leader assign user(s) ke Task
export async function assignUsersToTask(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { userIds } = req.body; // array of userId strings
    const { role, id: userId } = req.user!;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res
        .status(400)
        .json({ message: "userIds harus berupa array dan tidak boleh kosong" });
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ message: "Task tidak ditemukan" });

    // LEADER / TEAM: validasi Task milik tim & userIds adalah anggota departemen/tim
    if ((role === "LEADER" || role === "TEAM") && task.initiativeId) {
      const initiative = await prisma.initiative.findUnique({
        where: { id: task.initiativeId },
      });
      if (!initiative)
        return res.status(404).json({ message: "Initiative tidak ditemukan" });

      // Get Leader's department and managed departments
      const leader = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          department: true,
          managedDepartments: { select: { value: true } },
        },
      });

      const leaderDept = leader?.department;
      const managedDeptValues =
        leader?.managedDepartments.map((d) => d.value) || [];

      // Get Leader's leading teams
      const leadingTeams = await prisma.team.findMany({
        where: { leaderId: userId },
        select: { id: true },
      });
      const leadingTeamIds = leadingTeams.map((t) => t.id);

      // Validasi semua userIds adalah anggota tim / department Leader
      const validMembers = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          OR: [
            { id: userId }, // Selalu izinkan Leader meng-assign ke dirinya sendiri
            ...(leaderDept ? [{ department: leaderDept }] : []),
            ...(leadingTeamIds.length > 0
              ? [{ teamId: { in: leadingTeamIds } }]
              : []),
            ...(managedDeptValues.length > 0
              ? [{ department: { in: managedDeptValues } }]
              : []),
          ],
        },
        select: { id: true },
      });

      const invalidIds = userIds.filter(
        (uid: string) => !validMembers.map((m) => m.id).includes(uid),
      );
      if (invalidIds.length > 0) {
        return res.status(403).json({
          message:
            "Beberapa user bukan anggota departemen/tim Anda dan tidak bisa di-assign",
        });
      }
    }

    // Clear old assignments not in userIds
    await prisma.taskAssignment.deleteMany({
      where: {
        taskId: id,
        userId: { notIn: userIds },
      },
    });

    // Upsert assignments
    const results = [];
    for (const uId of userIds) {
      const existing = await prisma.taskAssignment.findUnique({
        where: { taskId_userId: { taskId: id, userId: uId } },
      });
      if (!existing) {
        const assignment = await prisma.taskAssignment.create({
          data: { taskId: id, userId: uId },
        });
        results.push(assignment);
      }
    }

    return res
      .status(200)
      .json({ assigned: results.length, message: "Assignment berhasil" });
  } catch (error) {
    console.error("Assign users to Task error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

function isCurrencyUnit(u?: string | null): boolean {
  const norm = (u || "").toLowerCase().replace(/[^a-z]/g, "");
  return norm === "rp" || norm === "rupiah" || norm === "idr";
}

function isMatchingUnit(u1?: string | null, u2?: string | null): boolean {
  if (isCurrencyUnit(u1) && isCurrencyUnit(u2)) return true;
  return (u1 || "").trim().toLowerCase() === (u2 || "").trim().toLowerCase();
}

// BARU: Cascade dari Initiative ke Monthly Key Result
// Dibuat dari scratch untuk menangani case isManualOverride
export async function cascadeInitiativeToMonthlyKr(
  keyResultId: string,
): Promise<void> {
  const kr = await prisma.keyResult.findUnique({
    where: { id: keyResultId },
  });
  if (!kr) return;

  const allInitiatives = await prisma.initiative.findMany({
    where: { keyResultId, isActive: true },
    include: { tasks: { where: { isActive: true } } },
  });

  if (allInitiatives.length === 0 || kr.targetValue <= 0) return;

  // Jika KR memiliki inisiatif aktif dan sebelumnya terkunci manual override, buka kunciannya otomatis
  if (kr.isManualOverride) {
    await prisma.keyResult.update({
      where: { id: keyResultId },
      data: { isManualOverride: false },
    });
  }

  const isPercentUnit = !kr.unit || kr.unit.trim() === "%";

  // ponytail: simple average across initiatives; weighted average when initiative weight customization active
  const avgPercent =
    allInitiatives.reduce((sum, init) => {
      let initProgress = 0;
      const activeTasks = init.tasks || [];
      if (activeTasks.length > 0) {
        const sumTaskPct = activeTasks.reduce((tSum, t) => {
          const tTgt = t.targetValue || 0;
          const pct =
            tTgt > 0
              ? calculateProgressPercent(t.currentValue, tTgt, t.targetType, t.baselineValue || 0)
              : 0;
          return tSum + pct;
        }, 0);
        initProgress = (sumTaskPct / activeTasks.length) / 100;
      } else {
        const val =
          init.achievedValue !== null && init.achievedValue !== undefined
            ? init.achievedValue
            : (init.currentValue || 0);
        if (init.targetValue > 0) {
          initProgress = calculateProgressPercent(val, init.targetValue, init.targetType) / 100;
        }
      }
      return sum + initProgress;
    }, 0) / allInitiatives.length;

  let newKrValue = 0;

  if (kr.targetType === "AT_MOST") {
    const matching = allInitiatives.filter(
      (i) => isMatchingUnit(i.unit, kr.unit) && (i.unit || "").trim() !== "%",
    );
    if (matching.length > 0) {
      newKrValue = matching.reduce((sum, init) => {
        const val =
          init.achievedValue !== null && init.achievedValue !== undefined
            ? init.achievedValue
            : init.currentValue || 0;
        return sum + val;
      }, 0);
    } else {
      newKrValue = Math.round((1 - avgPercent) * kr.targetValue * 100) / 100;
    }
  } else if (isPercentUnit) {
    newKrValue = Math.round(avgPercent * kr.targetValue * 100) / 100;
  } else {
    const matching = allInitiatives.filter((i) => isMatchingUnit(i.unit, kr.unit));
    if (matching.length > 0) {
      newKrValue = matching.reduce((sum, init) => {
        const val =
          init.achievedValue !== null && init.achievedValue !== undefined
            ? init.achievedValue
            : init.currentValue || 0;
        return sum + val;
      }, 0);
    } else {
      newKrValue = Math.round(avgPercent * kr.targetValue * 100) / 100;
    }
  }

  const krProgress = calculateProgressPercent(newKrValue, kr.targetValue, kr.targetType);
  const newStatus = calculateAutoStatus(krProgress);

  const updatedKr = await prisma.keyResult.update({
    where: { id: keyResultId },
    data: { currentValue: newKrValue, status: newStatus },
  });

  // Cascade to AnnualKeyResult
  if (updatedKr.annualKeyResultId) {
    await cascadeMonthlyKrToAnnual(updatedKr.annualKeyResultId);
  }
}

// ─── HELPER: Cascade Task value update ke Initiative → KR ──────────────────
export async function cascadeTaskValueUpdate(
  taskId: string,
  initiativeId?: string | null,
): Promise<void> {
  if (!initiativeId) return;
  const initiative = await prisma.initiative.findUnique({
    where: { id: initiativeId },
    include: { tasks: { where: { isActive: true } } },
  });

  if (initiative) {
    const activeTasks = initiative.tasks || [];
    if (activeTasks.length > 0 && initiative.targetValue > 0) {
      const isPercentUnit = !initiative.unit || initiative.unit.trim() === "%";
      if (isPercentUnit) {
        const sumTaskPct = activeTasks.reduce((tSum, t) => {
          const tTgt = t.targetValue || 0;
          const pct =
            tTgt > 0
              ? calculateProgressPercent(
                  t.currentValue,
                  tTgt,
                  t.targetType,
                  t.baselineValue || 0,
                )
              : 0;
          return tSum + pct;
        }, 0);
        const avgTaskPct = sumTaskPct / activeTasks.length;
        const newInitVal =
          Math.round((avgTaskPct / 100) * initiative.targetValue * 100) / 100;
        const newInitStatus = calculateAutoStatus(avgTaskPct);
        await prisma.initiative.update({
          where: { id: initiativeId },
          data: {
            currentValue: newInitVal,
            status: newInitStatus,
          },
        });
      }
    }

    // Recalculate KR progress if needed
    if (initiative.keyResultId) {
      await cascadeInitiativeToMonthlyKr(initiative.keyResultId);
    }
  }
}

// POST /api/tasks/:id/updates — Submit progress update (semua role yang di-assign ke Task)
export async function submitTaskUpdate(req: AuthRequest, res: Response) {
  try {
    const { id: taskId } = req.params;
    const { newValue, note, link } = req.body;
    const { id: userId, role } = req.user!;

    if (newValue === undefined) {
      return res.status(400).json({ message: "newValue wajib diisi" });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { initiative: { include: { team: true } } },
    });
    if (!task) return res.status(404).json({ message: "Task tidak ditemukan" });

    const assignment = await prisma.taskAssignment.findUnique({
      where: { taskId_userId: { taskId, userId } },
    });
    const isAssigned =
      assignment ||
      task.assignedTeamMemberId === userId ||
      task.assignedBy === userId;

    if (!isAssigned && !["LEADER", "MANAGER", "ADMIN", "C_LEVEL"].includes(role)) {
      return res
        .status(403)
        .json({ message: "Kamu tidak di-assign ke Task ini" });
    }

    const isAutoApprove = ["LEADER", "MANAGER", "ADMIN", "C_LEVEL"].includes(role);
    const updateStatus = isAutoApprove ? "APPROVED" : "PENDING_APPROVAL";

    const update = await prisma.taskUpdate.create({
      data: {
        taskId,
        oldValue: task.currentValue,
        newValue: parseFloat(newValue),
        note: note || null,
        link: link || null,
        submittedBy: userId,
        status: updateStatus,
        ...(isAutoApprove && { reviewedBy: userId, reviewedAt: new Date() }),
      },
    });

    if (isAutoApprove) {
      const taskStatus = calculateAutoStatus(
        calculateProgressPercent(parseFloat(newValue), task.targetValue || 0, task.targetType, task.baselineValue || 0)
      );
      await prisma.task.update({
        where: { id: taskId },
        data: {
          currentValue: parseFloat(newValue),
          status: taskStatus,
          documentationLink: link || null,
        },
      });
      await cascadeTaskValueUpdate(taskId, task.initiativeId);
    } else {
      const recipientLeaderId = await getTaskApprovalRecipientId(task, userId);
      if (recipientLeaderId) {
        await createNotification({
          recipientId: recipientLeaderId,
          type: "TASK_UPDATE_PENDING",
          title: "Ada Update Task Menunggu Persetujuan",
          body: `Task "${task.title}" memiliki update baru yang perlu Anda setujui`,
          link: "/approvals",
        });
      }
    }

    return res.status(201).json({
      message: isAutoApprove
        ? "Update berhasil diterapkan"
        : "Update berhasil dikirim, menunggu persetujuan tingkat di atasnya",
      update,
    });
  } catch (error) {
    console.error("Submit Task update error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/tasks/:id/updates — Riwayat update Task
export async function getTaskUpdates(req: AuthRequest, res: Response) {
  try {
    const { id: taskId } = req.params;

    const updates = await prisma.taskUpdate.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(updates);
  } catch (error) {
    console.error("Get Task updates error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// PATCH /api/task-updates/:updateId/approve — Manager / Leader approve
export async function approveTaskUpdate(req: AuthRequest, res: Response) {
  try {
    const { updateId } = req.params;
    const { id: managerId, role } = req.user!;

    const taskUpdate = await prisma.taskUpdate.findUnique({
      where: { id: updateId },
      include: {
        task: {
          include: {
            creator: { select: { id: true, name: true, department: true } },
            initiative: { include: { team: true } },
          },
        },
      },
    });
    if (!taskUpdate)
      return res.status(404).json({ message: "Update tidak ditemukan" });
    if (taskUpdate.status !== "PENDING_APPROVAL") {
      return res
        .status(400)
        .json({ message: "Update ini sudah diproses sebelumnya" });
    }

    const isCrossDept = Boolean(taskUpdate.task.isCrossDept);

    // Guard: Task lintas departemen hanya boleh di-approve jika status card sudah CLOSED oleh pembuat tugas
    if (isCrossDept && taskUpdate.task.kanbanStatus !== "CLOSED") {
      return res.status(400).json({
        message:
          "Tugas lintas departemen hanya dapat disetujui setelah card berstatus Closed oleh pembuat tugas",
      });
    }

    // Submitter info untuk scoping persetujuan
    const submitter = await prisma.user.findUnique({
      where: { id: taskUpdate.submittedBy },
      select: { role: true, department: true, teamId: true },
    });

    // Authorization check for approving Task Update
    if (role === "MANAGER") {
      const managedDepts = await prisma.department.findMany({
        where: { managerId: managerId },
        select: { value: true },
      });
      const dbUser = await prisma.user.findUnique({
        where: { id: managerId },
        select: { department: true },
      });
      const deptValues = new Set<string>(managedDepts.map((d) => d.value));
      if (dbUser?.department) deptValues.add(dbUser.department);

      const taskDept =
        taskUpdate.task.initiative?.team?.department ||
        taskUpdate.task.targetDept ||
        taskUpdate.task.creatorDept;

      const isManagerAuthorized =
        (taskDept && deptValues.has(taskDept)) ||
        (taskUpdate.task.targetDept && deptValues.has(taskUpdate.task.targetDept)) ||
        (taskUpdate.task.creatorDept && deptValues.has(taskUpdate.task.creatorDept)) ||
        (submitter?.department && deptValues.has(submitter.department));

      if (!isManagerAuthorized) {
        return res.status(403).json({
          message:
            "Forbidden: Manajer hanya berwenang menyetujui update di departemen yang dikelola",
        });
      }

      // Untuk task internal biasa: jika departemen punya Leader, update anggota tim harus melalui Leader
      // Untuk task cross-dept: Leader dan Manager sama-sama berwenang menyetujui selama card berstatus Closed
      if (!isCrossDept) {
        const leaderInfo = await getDepartmentLeaderInfo(taskDept ? [taskDept] : []);
        const hasLeader = taskDept ? leaderInfo.deptsWithLeader.has(taskDept) : false;

        if (hasLeader) {
          if (submitter?.role !== "LEADER") {
            return res.status(403).json({
              message:
                "Forbidden: Departemen memiliki Leader, update dari anggota tim harus disetujui oleh Leader",
            });
          }
        }
      }
    } else if (role === "LEADER") {
      const leaderTeamIds = await getLeaderTeamIds(managerId);
      const dbUser = await prisma.user.findUnique({
        where: { id: managerId },
        select: { department: true, teamId: true },
      });
      if (dbUser?.teamId) leaderTeamIds.push(dbUser.teamId);

      const taskTeamId = taskUpdate.task.initiative?.teamId;
      const isLeaderOfTeam = taskTeamId ? leaderTeamIds.includes(taskTeamId) : false;
      const isLeaderOfSubmitter = submitter?.teamId ? leaderTeamIds.includes(submitter.teamId) : false;

      const taskDept =
        taskUpdate.task.initiative?.team?.department ||
        taskUpdate.task.targetDept ||
        taskUpdate.task.creatorDept;

      const isLeaderOfDept =
        (dbUser?.department && taskDept === dbUser.department) ||
        (dbUser?.department && taskUpdate.task.targetDept === dbUser.department) ||
        (dbUser?.department && taskUpdate.task.creatorDept === dbUser.department) ||
        (dbUser?.department && submitter?.department === dbUser.department);

      if (!isLeaderOfTeam && !isLeaderOfSubmitter && !isLeaderOfDept) {
        return res.status(403).json({
          message:
            "Forbidden: Leader hanya berwenang menyetujui update Task di tim/departemennya",
        });
      }
    } else if (role === "C_LEVEL") {
      const dbUser = await prisma.user.findUnique({
        where: { id: managerId },
        include: { strategicDepartments: true },
      });
      const isCeo = isCeoUser(dbUser);
      if (!isCeo) {
        const taskDept =
          taskUpdate.task.initiative?.team?.department ||
          taskUpdate.task.targetDept ||
          taskUpdate.task.creatorDept;
        const sponsoredDeptValues = (dbUser?.strategicDepartments || []).map((d) => d.value);
        if (req.user?.activeDepartment && req.user.activeDepartment !== "STRATEGIC") {
          sponsoredDeptValues.push(req.user.activeDepartment);
        }
        const isSupervised =
          (taskDept && sponsoredDeptValues.includes(taskDept)) ||
          (taskUpdate.task.targetDept && sponsoredDeptValues.includes(taskUpdate.task.targetDept)) ||
          (taskUpdate.task.creatorDept && sponsoredDeptValues.includes(taskUpdate.task.creatorDept));

        if (sponsoredDeptValues.length > 0 && !isSupervised) {
          return res.status(403).json({
            message: "Forbidden: C-Level hanya berwenang menyetujui update di departemen yang disupervisi",
          });
        }
      }
    } else if (role !== "ADMIN") {
      return res.status(403).json({
        message: "Forbidden: Peran Anda tidak diizinkan menyetujui update",
      });
    }

    const taskStatus = calculateAutoStatus(
      calculateProgressPercent(
        taskUpdate.newValue,
        taskUpdate.task.targetValue || 0,
        taskUpdate.task.targetType,
        taskUpdate.task.baselineValue || 0
      )
    );

    // Update TaskUpdate status + update currentValue di Task
    const [approved] = await prisma.$transaction([
      prisma.taskUpdate.update({
        where: { id: updateId },
        data: {
          status: "APPROVED",
          reviewedBy: managerId,
          reviewedAt: new Date(),
        },
      }),
      prisma.task.update({
        where: { id: taskUpdate.taskId },
        data: {
          currentValue: taskUpdate.newValue,
          status: taskStatus,
          documentationLink: taskUpdate.link || null,
        },
      }),
    ]);

    // ═══ AUTO-CASCADE: Task → Initiative → KR ═══
    await cascadeTaskValueUpdate(
      taskUpdate.taskId,
      taskUpdate.task.initiativeId,
    );

    if (taskUpdate.submittedBy !== managerId) {
      await createNotification({
        recipientId: taskUpdate.submittedBy,
        type: "TASK_UPDATE_APPROVED",
        title: "Update Task Disetujui",
        body: `Update Task Anda untuk "${taskUpdate.task.title}" telah disetujui`,
        link: "/team/my-work",
      });
    }

    return res
      .status(200)
      .json({ message: "Update disetujui", update: approved });
  } catch (error) {
    console.error("Approve Task update error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// PATCH /api/task-updates/:updateId/reject — Manager / Leader reject
export async function rejectTaskUpdate(req: AuthRequest, res: Response) {
  try {
    const { updateId } = req.params;
    const { reviewNote } = req.body;
    const { id: managerId, role } = req.user!;

    if (!reviewNote || reviewNote.trim() === "") {
      return res
        .status(400)
        .json({ message: "reviewNote wajib diisi saat menolak update" });
    }

    const taskUpdate = await prisma.taskUpdate.findUnique({
      where: { id: updateId },
      include: {
        task: { include: { initiative: { include: { team: true } } } },
      },
    });
    if (!taskUpdate)
      return res.status(404).json({ message: "Update tidak ditemukan" });
    if (taskUpdate.status !== "PENDING_APPROVAL") {
      return res
        .status(400)
        .json({ message: "Update ini sudah diproses sebelumnya" });
    }

    const isCrossDept = Boolean(taskUpdate.task.isCrossDept);

    const submitter = await prisma.user.findUnique({
      where: { id: taskUpdate.submittedBy },
      select: { role: true, department: true, teamId: true },
    });

    // Authorization check for rejecting Task Update
    if (role === "MANAGER") {
      const managedDepts = await prisma.department.findMany({
        where: { managerId: managerId },
        select: { value: true },
      });
      const dbUser = await prisma.user.findUnique({
        where: { id: managerId },
        select: { department: true },
      });
      const deptValues = new Set<string>(managedDepts.map((d) => d.value));
      if (dbUser?.department) deptValues.add(dbUser.department);

      const taskDept =
        taskUpdate.task.initiative?.team?.department ||
        taskUpdate.task.targetDept ||
        taskUpdate.task.creatorDept;

      const isManagerAuthorized =
        (taskDept && deptValues.has(taskDept)) ||
        (taskUpdate.task.targetDept && deptValues.has(taskUpdate.task.targetDept)) ||
        (taskUpdate.task.creatorDept && deptValues.has(taskUpdate.task.creatorDept)) ||
        (submitter?.department && deptValues.has(submitter.department));

      if (!isManagerAuthorized) {
        return res.status(403).json({
          message:
            "Forbidden: Manajer hanya berwenang menolak update di departemen yang dikelola",
        });
      }

      // Cek apakah departemen memiliki Leader aktif (untuk task internal biasa)
      if (!isCrossDept) {
        const leaderInfo = await getDepartmentLeaderInfo(taskDept ? [taskDept] : []);
        const hasLeader = taskDept ? leaderInfo.deptsWithLeader.has(taskDept) : false;

        if (hasLeader) {
          if (submitter?.role !== "LEADER") {
            return res.status(403).json({
              message:
                "Forbidden: Departemen memiliki Leader, penolakan update dari anggota tim dilakukan oleh Leader",
            });
          }
        }
      }
    } else if (role === "LEADER") {
      const leaderTeamIds = await getLeaderTeamIds(managerId);
      const dbUser = await prisma.user.findUnique({
        where: { id: managerId },
        select: { department: true, teamId: true },
      });
      if (dbUser?.teamId) leaderTeamIds.push(dbUser.teamId);

      const taskTeamId = taskUpdate.task.initiative?.teamId;
      const isLeaderOfTeam = taskTeamId ? leaderTeamIds.includes(taskTeamId) : false;
      const isLeaderOfSubmitter = submitter?.teamId ? leaderTeamIds.includes(submitter.teamId) : false;

      const taskDept =
        taskUpdate.task.initiative?.team?.department ||
        taskUpdate.task.targetDept ||
        taskUpdate.task.creatorDept;

      const isLeaderOfDept =
        (dbUser?.department && taskDept === dbUser.department) ||
        (dbUser?.department && taskUpdate.task.targetDept === dbUser.department) ||
        (dbUser?.department && taskUpdate.task.creatorDept === dbUser.department) ||
        (dbUser?.department && submitter?.department === dbUser.department);

      if (!isLeaderOfTeam && !isLeaderOfSubmitter && !isLeaderOfDept) {
        return res.status(403).json({
          message:
            "Forbidden: Leader hanya berwenang menolak update Task di tim/departemennya",
        });
      }
    } else if (role === "C_LEVEL") {
      const dbUser = await prisma.user.findUnique({
        where: { id: managerId },
        include: { strategicDepartments: true },
      });
      const isCeo = isCeoUser(dbUser);
      if (!isCeo) {
        const taskDept =
          taskUpdate.task.initiative?.team?.department ||
          taskUpdate.task.targetDept ||
          taskUpdate.task.creatorDept;
        const sponsoredDeptValues = (dbUser?.strategicDepartments || []).map((d) => d.value);
        if (req.user?.activeDepartment && req.user.activeDepartment !== "STRATEGIC") {
          sponsoredDeptValues.push(req.user.activeDepartment);
        }
        const isSupervised =
          (taskDept && sponsoredDeptValues.includes(taskDept)) ||
          (taskUpdate.task.targetDept && sponsoredDeptValues.includes(taskUpdate.task.targetDept)) ||
          (taskUpdate.task.creatorDept && sponsoredDeptValues.includes(taskUpdate.task.creatorDept));

        if (sponsoredDeptValues.length > 0 && !isSupervised) {
          return res.status(403).json({
            message: "Forbidden: C-Level hanya berwenang menolak update di departemen yang disupervisi",
          });
        }
      }
    } else if (role !== "ADMIN") {
      return res.status(403).json({
        message: "Forbidden: Peran Anda tidak diizinkan menolak update",
      });
    }

    const rejected = await prisma.taskUpdate.update({
      where: { id: updateId },
      data: {
        status: "REJECTED",
        reviewedBy: managerId,
        reviewNote,
        reviewedAt: new Date(),
      },
    });

    if (taskUpdate.submittedBy !== managerId) {
      await createNotification({
        recipientId: taskUpdate.submittedBy,
        type: "TASK_UPDATE_REJECTED",
        title: "Update Task Ditolak",
        body: `Update Task Anda untuk "${taskUpdate.task.title}" ditolak. Catatan: ${reviewNote}`,
        link: "/team/my-work",
      });
    }

    return res
      .status(200)
      .json({ message: "Update ditolak", update: rejected });
  } catch (error) {
    console.error("Reject Task update error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/task-updates/pending — Get all pending Task updates for Manager
export async function getPendingTaskUpdates(req: AuthRequest, res: Response) {
  try {
    const updates = await prisma.taskUpdate.findMany({
      where: { status: "PENDING_APPROVAL" },
      include: {
        task: {
          include: {
            initiative: {
              include: { team: true },
            },
            assignments: {
              include: { user: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(updates);
  } catch (error) {
    console.error("Get pending Task updates error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// POST /api/initiatives/:id/progress-updates
export async function submitInitiativeUpdate(req: AuthRequest, res: Response) {
  try {
    const { id: initiativeId } = req.params;
    const { newValue, note, kanbanStatus, link } = req.body;
    const { id: userId, role } = req.user!;

    if (newValue === undefined) {
      return res.status(400).json({ message: "newValue wajib diisi" });
    }

    const initiative = await prisma.initiative.findUnique({
      where: { id: initiativeId },
    });
    if (!initiative)
      return res.status(404).json({ message: "Initiative tidak ditemukan" });

    // Validasi apakah user tergolong dalam tim inisiatif tersebut atau memiliki role atasan (Leader/Manager/Admin)
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true },
    });
    if (
      dbUser?.teamId !== initiative.teamId &&
      !["LEADER", "MANAGER", "ADMIN", "C_LEVEL"].includes(role)
    ) {
      return res
        .status(403)
        .json({ message: "Anda bukan anggota tim inisiatif ini" });
    }

    let finalNewValue = parseFloat(newValue);
    let finalKanbanStatus = kanbanStatus;

    if (
      initiative.targetValue > 0 &&
      finalNewValue >= initiative.targetValue &&
      !finalKanbanStatus
    ) {
      finalKanbanStatus = "DONE";
    }

    const initProgress = calculateProgressPercent(finalNewValue, initiative.targetValue, initiative.targetType);
    const initStatus = calculateAutoStatus(initProgress);

    const [update] = await prisma.$transaction([
      prisma.initiativeUpdate.create({
        data: {
          initiativeId,
          oldValue: initiative.currentValue,
          newValue: finalNewValue,
          note: note || null,
          kanbanStatus: finalKanbanStatus || null,
          link: link || null,
          submittedBy: userId,
          status: "APPROVED",
          reviewedBy: userId,
          reviewedAt: new Date(),
        },
      }),
      prisma.initiative.update({
        where: { id: initiativeId },
        data: {
          currentValue: finalNewValue,
          status: initStatus,
          ...(finalKanbanStatus ? { kanbanStatus: finalKanbanStatus } : {}),
          ...(link !== undefined && { documentationLink: link || null }),
        },
      }),
    ]);

    // AUTO-CASCADE: recalculate KR.currentValue
    if (initiative.keyResultId) await cascadeInitiativeToMonthlyKr(initiative.keyResultId);

    const recipientManagerId = initiative.assignedBy || initiative.ownerId;
    if (recipientManagerId && recipientManagerId !== userId) {
      await createNotification({
        recipientId: recipientManagerId,
        type: "INITIATIVE_UPDATE_PENDING",
        title: "Ada Update Inisiatif Menunggu Persetujuan",
        body: `Initiative "${initiative.title}" memiliki update baru yang perlu Anda setujui`,
        link: "/approvals",
      });
    }

    return res.status(201).json({
      message: "Progres inisiatif berhasil disimpan dan diperbarui!",
      update,
    });
  } catch (error) {
    console.error("Submit initiative update error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/initiatives/:id/progress-updates
export async function getInitiativeProgressUpdates(
  req: AuthRequest,
  res: Response,
) {
  try {
    const { id: initiativeId } = req.params;
    const updates = await prisma.initiativeUpdate.findMany({
      where: { initiativeId },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(updates);
  } catch (error) {
    console.error("Get initiative progress updates error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/initiatives/initiative-updates/pending
export async function getPendingInitiativeUpdates(
  req: AuthRequest,
  res: Response,
) {
  try {
    const { id: userId, role } = req.user!;

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { department: true, teamId: true },
    });

    let deptValues: string[] = [];
    let leadingTeamIds: string[] = [];

    let whereClause: any = { status: "PENDING_APPROVAL" };
    let taskWhereClause: any = { status: "PENDING_APPROVAL" };

    if (role === "MANAGER") {
      const managedDepts = await prisma.department.findMany({
        where: { managerId: userId },
        select: { value: true },
      });
      deptValues = managedDepts.map((d) => d.value);
      if (
        dbUser?.department &&
        dbUser.department.toUpperCase() !== "STRATEGIC" &&
        !deptValues.includes(dbUser.department)
      ) {
        deptValues.push(dbUser.department);
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

      if (initiativeOrConditions.length > 0) {
        whereClause.OR = initiativeOrConditions;
      } else {
        whereClause.id = "__none__";
      }

      if (taskOrConditions.length > 0) {
        taskWhereClause.OR = taskOrConditions;
      } else {
        taskWhereClause.id = "__none__";
      }
    } else if (role === "LEADER") {
      leadingTeamIds = await getLeaderTeamIds(userId);
      if (dbUser?.teamId && !leadingTeamIds.includes(dbUser.teamId)) {
        leadingTeamIds.push(dbUser.teamId);
      }

      const teamMembers = await prisma.user.findMany({
        where: {
          teamId: { in: leadingTeamIds },
          role: "TEAM",
        },
        select: { id: true },
      });
      const teamMemberIds = teamMembers.map((u) => u.id);

      whereClause.initiative = {
        teamId: { in: leadingTeamIds },
      };
      whereClause.submittedBy = { in: teamMemberIds };

      const leaderTaskOrConditions: any[] = [];

      // 1. Internal tasks from Leader's teams submitted by team members
      if (leadingTeamIds.length > 0 && teamMemberIds.length > 0) {
        leaderTaskOrConditions.push({
          task: {
            NOT: { isCrossDept: true },
            initiative: { teamId: { in: leadingTeamIds } },
          },
          submittedBy: { in: teamMemberIds },
        });
      }

      // 2. Cross-department tasks (closed) scoped to Leader's department or teams
      const leaderCrossDeptOr: any[] = [];
      if (dbUser?.department) {
        leaderCrossDeptOr.push({ targetDept: dbUser.department });
        leaderCrossDeptOr.push({ creatorDept: dbUser.department });
        leaderCrossDeptOr.push({ initiative: { team: { department: dbUser.department } } });
      }
      if (leadingTeamIds.length > 0) {
        leaderCrossDeptOr.push({ initiative: { teamId: { in: leadingTeamIds } } });
        leaderCrossDeptOr.push({ assignedTeamMember: { teamId: { in: leadingTeamIds } } });
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

      if (leaderTaskOrConditions.length > 0) {
        taskWhereClause.OR = leaderTaskOrConditions;
      } else {
        taskWhereClause.id = "__none__";
      }
    } else if (role === "C_LEVEL") {
      const cUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { strategicDepartments: true },
      });
      const isCeo = isCeoUser(cUser);
      if (!isCeo && cUser?.strategicDepartments && cUser.strategicDepartments.length > 0) {
        const sponsoredDeptValues = cUser.strategicDepartments.map((d) => d.value);
        if (req.user?.activeDepartment && req.user.activeDepartment !== "STRATEGIC") {
          if (!sponsoredDeptValues.includes(req.user.activeDepartment)) {
            sponsoredDeptValues.push(req.user.activeDepartment);
          }
        }
        whereClause.initiative = {
          team: { department: { in: sponsoredDeptValues } },
        };
        taskWhereClause.task = {
          OR: [
            { initiative: { team: { department: { in: sponsoredDeptValues } } } },
            { targetDept: { in: sponsoredDeptValues } },
            { creatorDept: { in: sponsoredDeptValues } },
          ],
        };
      }
      taskWhereClause.AND = [
        ...(taskWhereClause.AND || []),
        {
          OR: [
            { task: { NOT: { isCrossDept: true } } },
            { task: { isCrossDept: true, kanbanStatus: "CLOSED" } },
          ],
        },
      ];
    } else if (role === "ADMIN") {
      taskWhereClause.AND = [
        ...(taskWhereClause.AND || []),
        {
          OR: [
            { task: { NOT: { isCrossDept: true } } },
            { task: { isCrossDept: true, kanbanStatus: "CLOSED" } },
          ],
        },
      ];
    } else {
      return res.status(200).json([]);
    }

    const updates = await prisma.initiativeUpdate.findMany({
      where: whereClause,
      include: {
        initiative: {
          include: { team: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const taskUpdates = await prisma.taskUpdate.findMany({
      where: taskWhereClause,
      include: {
        task: {
          include: {
            initiative: {
              include: { team: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const userIds = new Set<string>();
    updates.forEach((u) => {
      if (u.submittedBy) userIds.add(u.submittedBy);
      if (u.reviewedBy) userIds.add(u.reviewedBy);
    });
    taskUpdates.forEach((t) => {
      if (t.submittedBy) userIds.add(t.submittedBy);
      if (t.reviewedBy) userIds.add(t.reviewedBy);
    });

    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, name: true, email: true, role: true, position: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const mappedInitiativeUpdates = updates.map((u: any) => ({
      ...u,
      submitter: userMap.get(u.submittedBy) || null,
      reviewer: u.reviewedBy ? userMap.get(u.reviewedBy) || null : null,
      type: "INITIATIVE",
    }));

    const mappedTaskUpdates = taskUpdates.map((t: any) => ({
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
      reviewNote: t.reviewNote || null,
      link: t.link,
      status: t.status,
      submittedBy: t.submittedBy,
      reviewedBy: t.reviewedBy,
      reviewedAt: t.reviewedAt,
      createdAt: t.createdAt,
      submitter: userMap.get(t.submittedBy) || null,
      reviewer: t.reviewedBy ? userMap.get(t.reviewedBy) || null : null,
      type: "TASK",
      isCrossDept: Boolean(t.task.isCrossDept),
      creatorDept: t.task.creatorDept || null,
      targetDept: t.task.targetDept || null,
    }));

    const combinedUpdates = [
      ...mappedInitiativeUpdates,
      ...mappedTaskUpdates,
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return res.status(200).json(combinedUpdates);
  } catch (error) {
    console.error("Get pending Initiative updates error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/initiatives/initiative-updates/history
export async function getInitiativeUpdatesHistory(
  req: AuthRequest,
  res: Response,
) {
  try {
    const { id: userId, role } = req.user!;

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { department: true, teamId: true },
    });

    let deptValues: string[] = [];
    let leadingTeamIds: string[] = [];

    let whereClause: any = { status: { in: ["APPROVED", "REJECTED"] } };
    let taskWhereClause: any = { status: { in: ["APPROVED", "REJECTED"] } };

    if (role === "MANAGER") {
      const managedDepts = await prisma.department.findMany({
        where: { managerId: userId },
        select: { value: true },
      });
      deptValues = managedDepts.map((d) => d.value);
      if (
        dbUser?.department &&
        dbUser.department.toUpperCase() !== "STRATEGIC" &&
        !deptValues.includes(dbUser.department)
      ) {
        deptValues.push(dbUser.department);
      }

      whereClause.initiative = {
        team: { department: { in: deptValues } },
      };
      taskWhereClause.task = {
        OR: [
          { initiative: { team: { department: { in: deptValues } } } },
          { targetDept: { in: deptValues } },
          { creatorDept: { in: deptValues } },
        ],
      };
    } else if (role === "LEADER") {
      leadingTeamIds = await getLeaderTeamIds(userId);
      if (dbUser?.teamId && !leadingTeamIds.includes(dbUser.teamId)) {
        leadingTeamIds.push(dbUser.teamId);
      }

      whereClause.initiative = {
        teamId: { in: leadingTeamIds },
      };

      const leaderTaskHistoryOr: any[] = [];
      if (leadingTeamIds.length > 0) {
        leaderTaskHistoryOr.push({ initiative: { teamId: { in: leadingTeamIds } } });
        leaderTaskHistoryOr.push({ assignedTeamMember: { teamId: { in: leadingTeamIds } } });
      }
      if (dbUser?.department) {
        leaderTaskHistoryOr.push({ targetDept: dbUser.department });
        leaderTaskHistoryOr.push({ creatorDept: dbUser.department });
        leaderTaskHistoryOr.push({ initiative: { team: { department: dbUser.department } } });
      }

      if (leaderTaskHistoryOr.length > 0) {
        taskWhereClause.task = { OR: leaderTaskHistoryOr };
      } else {
        taskWhereClause.id = "__none__";
      }
    } else if (role === "TEAM") {
      whereClause.submittedBy = userId;
      taskWhereClause.submittedBy = userId;
    }

    const updates = await prisma.initiativeUpdate.findMany({
      where: whereClause,
      include: {
        initiative: {
          include: { team: true },
        },
      },
      orderBy: { reviewedAt: "desc" },
      take: 100,
    });

    const taskUpdates = await prisma.taskUpdate.findMany({
      where: taskWhereClause,
      include: {
        task: {
          include: {
            initiative: {
              include: { team: true },
            },
          },
        },
      },
      orderBy: { reviewedAt: "desc" },
      take: 100,
    });

    const userIds = new Set<string>();
    updates.forEach((u) => {
      if (u.submittedBy) userIds.add(u.submittedBy);
      if (u.reviewedBy) userIds.add(u.reviewedBy);
    });
    taskUpdates.forEach((t) => {
      if (t.submittedBy) userIds.add(t.submittedBy);
      if (t.reviewedBy) userIds.add(t.reviewedBy);
    });

    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, name: true, email: true, role: true, position: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const mappedInitiativeUpdates = updates.map((u: any) => ({
      ...u,
      submitter: userMap.get(u.submittedBy) || null,
      reviewer: u.reviewedBy ? userMap.get(u.reviewedBy) || null : null,
      type: "INITIATIVE",
    }));

    const mappedTaskUpdates = taskUpdates.map((t: any) => ({
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
      reviewNote: t.reviewNote || null,
      link: t.link,
      status: t.status,
      submittedBy: t.submittedBy,
      reviewedBy: t.reviewedBy,
      reviewedAt: t.reviewedAt,
      createdAt: t.createdAt,
      submitter: userMap.get(t.submittedBy) || null,
      reviewer: t.reviewedBy ? userMap.get(t.reviewedBy) || null : null,
      type: "TASK",
      isCrossDept: Boolean(t.task.isCrossDept),
      creatorDept: t.task.creatorDept || null,
      targetDept: t.task.targetDept || null,
    }));

    const combinedUpdates = [
      ...mappedInitiativeUpdates,
      ...mappedTaskUpdates,
    ].sort(
      (a, b) =>
        new Date(b.reviewedAt || b.createdAt).getTime() -
        new Date(a.reviewedAt || a.createdAt).getTime(),
    );

    return res.status(200).json(combinedUpdates);
  } catch (error) {
    console.error("Get Initiative updates history error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// PATCH /api/initiatives/initiative-updates/:updateId/approve
export async function approveInitiativeUpdate(req: AuthRequest, res: Response) {
  try {
    const { updateId } = req.params;
    const { id: managerId, role } = req.user!;

    const initiativeUpdate = await prisma.initiativeUpdate.findUnique({
      where: { id: updateId },
      include: { initiative: { include: { team: true } } },
    });
    if (!initiativeUpdate) {
      const taskUpdateExists = await prisma.taskUpdate.findUnique({
        where: { id: updateId },
      });
      if (taskUpdateExists) {
        return approveTaskUpdate(req, res);
      }
      return res.status(404).json({ message: "Update tidak ditemukan" });
    }
    if (initiativeUpdate.status !== "PENDING_APPROVAL") {
      return res
        .status(400)
        .json({ message: "Update ini sudah diproses sebelumnya" });
    }

    // Cek peran pengaju update (submitter)
    const submitter = await prisma.user.findUnique({
      where: { id: initiativeUpdate.submittedBy },
      select: { role: true },
    });
    const submitterRole = submitter?.role;

    // Filter akses berdasarkan role
    if (role === "MANAGER") {
      const managedDepts = await prisma.department.findMany({
        where: { managerId },
        select: { value: true },
      });
      const deptValues = managedDepts.map((d) => d.value);
      const dbUser = await prisma.user.findUnique({
        where: { id: managerId },
        select: { department: true },
      });
      if (
        dbUser?.department &&
        dbUser.department.toUpperCase() !== "STRATEGIC" &&
        !deptValues.includes(dbUser.department)
      ) {
        deptValues.push(dbUser.department);
      }
      const initiativeDept = initiativeUpdate.initiative.team?.department;
      if (
        !initiativeDept ||
        !deptValues.includes(initiativeDept)
      ) {
        return res.status(403).json({
          message:
            "Forbidden: Anda tidak memiliki akses untuk menyetujui update di departemen ini",
        });
      }

      if (
        initiativeUpdate.initiative.assignedBy &&
        initiativeUpdate.initiative.assignedBy !== managerId
      ) {
        return res.status(403).json({
          message:
            "Forbidden: Hanya Manager yang meng-assign Initiative ini yang dapat menyetujui update-nya",
        });
      }

      // Cek apakah departemen memiliki Leader aktif
      const leaderInfo = await getDepartmentLeaderInfo([initiativeDept]);
      const hasLeader = leaderInfo.deptsWithLeader.has(initiativeDept);

      if (hasLeader && submitterRole !== "LEADER") {
        return res.status(403).json({
          message:
            "Forbidden: Departemen memiliki Leader, update dari anggota tim harus disetujui oleh Leader.",
        });
      }
    } else if (role === "LEADER") {
      if (submitterRole !== "TEAM") {
        return res.status(403).json({
          message:
            "Forbidden: Leader hanya berwenang menyetujui update tingkat Team saja.",
        });
      }

      const leadingTeams = await prisma.team.findMany({
        where: { leaderId: managerId },
        select: { id: true },
      });
      const leadingTeamIds = leadingTeams.map((t) => t.id);
      if (!leadingTeamIds.includes(initiativeUpdate.initiative.teamId)) {
        return res.status(403).json({
          message:
            "Forbidden: Anda hanya bisa menyetujui update untuk tim Anda sendiri",
        });
      }
    } else if (role === "C_LEVEL") {
      const dbUser = await prisma.user.findUnique({
        where: { id: managerId },
        include: { strategicDepartments: true },
      });
      const isCeo = isCeoUser(dbUser);
      if (!isCeo) {
        const initiativeDept = initiativeUpdate.initiative.team?.department;
        const sponsoredDeptValues = (dbUser?.strategicDepartments || []).map((d) => d.value);
        if (req.user?.activeDepartment && req.user.activeDepartment !== "STRATEGIC") {
          sponsoredDeptValues.push(req.user.activeDepartment);
        }
        if (sponsoredDeptValues.length > 0 && initiativeDept && !sponsoredDeptValues.includes(initiativeDept)) {
          return res.status(403).json({
            message: "Forbidden: C-Level hanya berwenang menyetujui update di departemen yang disupervisi",
          });
        }
      }
    } else if (role !== "ADMIN") {
      return res.status(403).json({
        message: "Forbidden: Peran Anda tidak diizinkan menyetujui update",
      });
    }

    const initProgress = calculateProgressPercent(
      initiativeUpdate.newValue,
      initiativeUpdate.initiative.targetValue,
      initiativeUpdate.initiative.targetType
    );
    const initStatus = calculateAutoStatus(initProgress);

    const [approved] = await prisma.$transaction([
      prisma.initiativeUpdate.update({
        where: { id: updateId },
        data: {
          status: "APPROVED",
          reviewedBy: managerId,
          reviewedAt: new Date(),
        },
      }),
      prisma.initiative.update({
        where: { id: initiativeUpdate.initiativeId },
        data: {
          currentValue: initiativeUpdate.newValue,
          status: initStatus,
          ...(initiativeUpdate.kanbanStatus
            ? { kanbanStatus: initiativeUpdate.kanbanStatus }
            : {}),
          documentationLink: initiativeUpdate.link || null,
        },
      }),
    ]);

    // AUTO-CASCADE: recalculate KR.currentValue dari weighted average Initiative progress
    if (initiativeUpdate.initiative.keyResultId) await cascadeInitiativeToMonthlyKr(initiativeUpdate.initiative.keyResultId);

    if (initiativeUpdate.submittedBy !== managerId) {
      await createNotification({
        recipientId: initiativeUpdate.submittedBy,
        type: "INITIATIVE_UPDATE_APPROVED",
        title: "Update Inisiatif Disetujui ✅",
        body: `Update Inisiatif Anda untuk "${initiativeUpdate.initiative.title}" telah disetujui`,
        link: "/initiatives",
      });
    }

    return res
      .status(200)
      .json({ message: "Update inisiatif disetujui", update: approved });
  } catch (error) {
    console.error("Approve Initiative update error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// PATCH /api/initiatives/initiative-updates/:updateId/reject
export async function rejectInitiativeUpdate(req: AuthRequest, res: Response) {
  try {
    const { updateId } = req.params;
    const { id: managerId, role } = req.user!;

    const initiativeUpdate = await prisma.initiativeUpdate.findUnique({
      where: { id: updateId },
      include: { initiative: { include: { team: true } } },
    });
    if (!initiativeUpdate) {
      const taskUpdateExists = await prisma.taskUpdate.findUnique({
        where: { id: updateId },
      });
      if (taskUpdateExists) {
        return rejectTaskUpdate(req, res);
      }
      return res.status(404).json({ message: "Update tidak ditemukan" });
    }
    if (initiativeUpdate.status !== "PENDING_APPROVAL") {
      return res
        .status(400)
        .json({ message: "Update ini sudah diproses sebelumnya" });
    }

    // Cek peran pengaju update (submitter)
    const submitter = await prisma.user.findUnique({
      where: { id: initiativeUpdate.submittedBy },
      select: { role: true },
    });
    const submitterRole = submitter?.role;

    // Filter akses berdasarkan role
    if (role === "MANAGER") {
      const managedDepts = await prisma.department.findMany({
        where: { managerId },
        select: { value: true },
      });
      const deptValues = managedDepts.map((d) => d.value);
      const dbUser = await prisma.user.findUnique({
        where: { id: managerId },
        select: { department: true },
      });
      if (
        dbUser?.department &&
        dbUser.department.toUpperCase() !== "STRATEGIC" &&
        !deptValues.includes(dbUser.department)
      ) {
        deptValues.push(dbUser.department);
      }
      const initiativeDept = initiativeUpdate.initiative.team?.department;
      if (
        !initiativeDept ||
        !deptValues.includes(initiativeDept)
      ) {
        return res.status(403).json({
          message:
            "Forbidden: Anda tidak memiliki akses untuk menolak update di departemen ini",
        });
      }

      // Cek apakah departemen memiliki Leader aktif
      const leaderInfo = await getDepartmentLeaderInfo([initiativeDept]);
      const hasLeader = leaderInfo.deptsWithLeader.has(initiativeDept);

      if (hasLeader && submitterRole !== "LEADER") {
        return res.status(403).json({
          message:
            "Forbidden: Departemen memiliki Leader, penolakan update dari anggota tim dilakukan oleh Leader.",
        });
      }
    } else if (role === "LEADER") {
      if (submitterRole !== "TEAM") {
        return res.status(403).json({
          message:
            "Forbidden: Leader hanya berwenang menolak update tingkat Team saja.",
        });
      }

      const leadingTeams = await prisma.team.findMany({
        where: { leaderId: managerId },
        select: { id: true },
      });
      const leadingTeamIds = leadingTeams.map((t) => t.id);
      if (!leadingTeamIds.includes(initiativeUpdate.initiative.teamId)) {
        return res.status(403).json({
          message:
            "Forbidden: Anda hanya bisa menolak update untuk tim Anda sendiri",
        });
      }
    } else if (role === "C_LEVEL") {
      const dbUser = await prisma.user.findUnique({
        where: { id: managerId },
        include: { strategicDepartments: true },
      });
      const isCeo = isCeoUser(dbUser);
      if (!isCeo) {
        const initiativeDept = initiativeUpdate.initiative.team?.department;
        const sponsoredDeptValues = (dbUser?.strategicDepartments || []).map((d) => d.value);
        if (req.user?.activeDepartment && req.user.activeDepartment !== "STRATEGIC") {
          sponsoredDeptValues.push(req.user.activeDepartment);
        }
        if (sponsoredDeptValues.length > 0 && initiativeDept && !sponsoredDeptValues.includes(initiativeDept)) {
          return res.status(403).json({
            message: "Forbidden: C-Level hanya berwenang menolak update di departemen yang disupervisi",
          });
        }
      }
    } else if (role !== "ADMIN") {
      return res.status(403).json({
        message: "Forbidden: Peran Anda tidak diizinkan menolak update",
      });
    }

    const rejected = await prisma.initiativeUpdate.update({
      where: { id: updateId },
      data: {
        status: "REJECTED",
        reviewedBy: managerId,
        reviewedAt: new Date(),
      },
    });

    if (initiativeUpdate.submittedBy !== managerId) {
      await createNotification({
        recipientId: initiativeUpdate.submittedBy,
        type: "INITIATIVE_UPDATE_REJECTED",
        title: "Update Inisiatif Ditolak ❌",
        body: `Update Inisiatif Anda untuk "${initiativeUpdate.initiative.title}" ditolak`,
        link: "/initiatives",
      });
    }

    return res
      .status(200)
      .json({ message: "Update inisiatif ditolak", update: rejected });
  } catch (error) {
    console.error("Reject Initiative update error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}



// POST /api/initiatives/:id/carry-over
export async function carryOverInitiativeHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const result = await carryOverInitiativeService(id, req.user?.id, req);
    return res.status(200).json({
      message: `Inisiatif berhasil dipindahkan ke sprint ${result.nextSprint.name}`,
      ...result,
    });
  } catch (error: any) {
    console.error("Carry over initiative error:", error);
    return res.status(error.message?.includes("tidak ditemukan") ? 404 : 400).json({
      message: error.message || "Gagal melakukan carry over inisiatif",
    });
  }
}

// POST /api/tasks/:id/carry-over
export async function carryOverTaskHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const cleanId = id && id.startsWith("task-") ? id.replace(/^task-/, "") : id;
    const result = await carryOverTaskService(cleanId, req.user?.id, req);
    return res.status(200).json({
      message: `Task berhasil dipindahkan ke sprint ${result.nextSprint.name}`,
      ...result,
    });
  } catch (error: any) {
    console.error("Carry over task error:", error);
    return res.status(error.message?.includes("tidak ditemukan") ? 404 : 400).json({
      message: error.message || "Gagal melakukan carry over task",
    });
  }
}
