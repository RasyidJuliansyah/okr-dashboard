import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";
import { cascadeMonthlyKrToAnnual } from "./keyresult.controller";

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
  initiativeId: string,
  keyResultId?: string,
): Promise<void> {
  if (!keyResultId) return;
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

async function getLeaderTeamIds(userId: string): Promise<string[]> {
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

// GET /api/initiatives/member-progress — Capaian 100% per member dengan strict role-based visibility
export async function getMemberProgress(req: AuthRequest, res: Response) {
  try {
    const { role, id: userId } = req.user!;
    const { sprintMonth } = req.query as { sprintMonth?: string };
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { department: true, teamId: true },
    });

    // 1. Tentukan user mana saja yang boleh dilihat oleh req.user berdasarkan Role
    let visibleUserIds: string[] = [];

    if (role === "TEAM") {
      // TEAM HANYA boleh melihat dirinya sendiri!
      visibleUserIds = [userId];
    } else if (role === "LEADER") {
      // LEADER melihat dirinya + anggota tim yang dipimpin/dimilikinya/departemennya
      const leaderTeamIds = await getLeaderTeamIds(userId);
      const teamMembers = await prisma.user.findMany({
        where: {
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
      // MANAGER melihat dirinya + Leader & Team di seluruh departemen yang dikelolanya
      const managedDepts = await prisma.department.findMany({
        where: { managerId: userId },
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
          OR: [{ id: userId }, { department: { in: deptList } }],
        },
        select: { id: true },
      });
      visibleUserIds = deptUsers.map((u) => u.id);
    } else {
      // ADMIN & C_LEVEL melihat semua user
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      visibleUserIds = allUsers.map((u) => u.id);
    }

    // 2. Ambil Initiative (card) yang dimiliki (ownerId) oleh user-user yang diizinkan.
    // Capaian member sekarang dihitung dari bobot (%) tiap card, bukan rata-rata Task polos,
    // agar konsisten dengan aturan "total bobot card per pegawai per sprint = 100%".
    // 2. Fetch users and their associated Initiatives (weight 2) and Tasks (weight 1)
    const users = await prisma.user.findMany({
      where: { id: { in: visibleUserIds } },
      select: {
        id: true,
        name: true,
        role: true,
        position: true,
        department: true,
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
            OR: [{ ownerId: user.id }, { assignedLeaderId: user.id }],
            kanbanStatus: { not: "DROP" },
          },
          select: {
            id: true,
            title: true,
            weight: true,
            kanbanStatus: true,
            targetValue: true,
            currentValue: true,
            achievedValue: true,
            sprintMonth: true,
            keyResult: { select: { title: true } },
            tasks: { select: { targetValue: true, currentValue: true } },
          },
        });

        // Tasks (Di-assign ke user ini oleh leader / role atas) - Bobot = 1
        const assignedTasks = await prisma.task.findMany({
          where: {
            OR: [
              { assignedTeamMemberId: user.id },
              { assignments: { some: { userId: user.id } } },
            ],
            initiative: { kanbanStatus: { not: "DROP" } },
          },
          select: {
            id: true,
            title: true,
            targetValue: true,
            currentValue: true,
            status: true,
            sprintMonth: true,
            initiative: {
              select: {
                title: true,
                sprintMonth: true,
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

        // Filter per sprintMonth jika ada
        const filteredInitiatives = ownedInitiatives.filter((init) => {
          return sprintMonth ? init.sprintMonth === sprintMonth : true;
        });

        const filteredTasks = assignedTasks.filter((t) => {
          const taskSprint = t.sprintMonth || t.initiative?.sprintMonth;
          return sprintMonth ? taskSprint === sprintMonth : true;
        });

        // Process Initiatives (Bobot = 2)
        let iniWeightedSum = 0;
        let iniTotalWeight = 0;

        const processedInitiatives = filteredInitiatives.map((init) => {
          let progressPct: number;
          if (
            init.achievedValue !== null &&
            init.achievedValue !== undefined &&
            init.targetValue > 0
          ) {
            progressPct = (init.achievedValue / init.targetValue) * 100;
          } else if (init.currentValue > 0 && init.targetValue > 0) {
            progressPct = (init.currentValue / init.targetValue) * 100;
          } else if (init.tasks && init.tasks.length > 0) {
            progressPct =
              init.tasks.reduce((sum, k) => {
                const pct =
                  k.targetValue > 0
                    ? Math.min(
                        100,
                        Math.max(0, (k.currentValue / k.targetValue) * 100),
                      )
                    : 0;
                return sum + pct;
              }, 0) / init.tasks.length;
          } else if (init.kanbanStatus === "DONE") {
            progressPct = 100;
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
          if (t.status === "ON_TRACK" && t.currentValue >= t.targetValue) {
            progressPct = 100;
          } else if (t.targetValue > 0) {
            progressPct = Math.min(
              100,
              Math.max(0, (t.currentValue / t.targetValue) * 100),
            );
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
            kanbanStatus: t.status,
            progressPct: roundedPct,
            parentTitle: t.initiative?.title || "",
            krTitle: t.initiative?.keyResult?.title || "",
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

    return res.status(200).json({
      role,
      userCount: memberProgressList.length,
      sprintMonth: sprintMonth || null,
      availableSprintMonths: Array.from(allSprintMonths).sort().reverse(),
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
    let where: any = {};

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
          where: { department: dbUser.department },
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
          },
        },
        team: { select: { id: true, name: true, department: true } },
        owner: { select: { id: true, name: true, position: true } },
        tasks: {
          include: {
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
        const pct =
          task.targetValue > 0
            ? Math.min(
                100,
                Math.max(0, (task.currentValue / task.targetValue) * 100),
              )
            : 0;
        return { ...task, progressPercent: Math.round(pct * 10) / 10 };
      });

      const avgProgress =
        init.achievedValue !== null &&
        init.achievedValue !== undefined &&
        init.targetValue > 0
          ? (init.achievedValue / init.targetValue) * 100
          : taskProgress.length > 0
            ? taskProgress.reduce((sum, k) => sum + k.progressPercent, 0) /
              taskProgress.length
            : init.targetValue > 0
              ? Math.min(100, (init.currentValue / init.targetValue) * 100)
              : 0;

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
      const krId = init.keyResultId;
      if (!byKeyResult[krId]) {
        byKeyResult[krId] = {
          keyResult: init.keyResult,
          initiatives: [],
          krProgress: 0,
        };
      }
      byKeyResult[krId].initiatives.push(init);
    }

    // Hitung progress KR dari Initiative (weighted average)
    for (const kr of Object.values(byKeyResult)) {
      const totalWeight = kr.initiatives.reduce(
        (s: number, i: any) => s + (i.weight || 1),
        0,
      );
      kr.krProgress =
        totalWeight > 0
          ? Math.round(
              (kr.initiatives.reduce(
                (s: number, i: any) =>
                  s + i.calculatedProgress * (i.weight || 1),
                0,
              ) /
                totalWeight) *
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
    const { krId, kanbanStatus, teamId, ownerId, sprintMonth } = req.query;
    const { role, id: userId } = req.user!;

    let where: any = {};
    if (krId) where.keyResultId = krId as string;
    if (kanbanStatus) where.kanbanStatus = kanbanStatus as string;
    if (sprintMonth) where.sprintMonth = sprintMonth as string;

    // 1. TEAM (T): hanya melihat inisiatif milik sendiri + inisiatif yang di-assign khusus padanya (bukan inisiatif induk Leader)
    if (role === "TEAM") {
      where.OR = [{ ownerId: userId }, { assignedLeaderId: userId }];
      if (teamId) where.teamId = teamId as string;
    }

    // 2. LEADER (P): melihat card miliknya sendiri + semua card anggota tim di bawahnya
    else if (role === "LEADER") {
      const leaderTeams = await prisma.team.findMany({
        where: { leaderId: userId },
        select: { id: true },
      });
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { teamId: true },
      });
      const teamIdSet = new Set<string>(leaderTeams.map((t) => t.id));
      if (dbUser?.teamId) teamIdSet.add(dbUser.teamId);
      const teamIds = Array.from(teamIdSet);

      if (ownerId) {
        // Filter spesifik pegawai di bawahnya / dirinya
        where.ownerId = ownerId as string;
        where.OR = [{ teamId: { in: teamIds } }, { ownerId: userId }];
      } else {
        where.OR = [{ teamId: { in: teamIds } }, { ownerId: userId }];
      }

      if (teamId && teamIds.includes(teamId as string)) {
        where.teamId = teamId as string;
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

      where.teamId = { in: teamIds };

      if (ownerId) {
        where.ownerId = ownerId as string;
      }

      if (teamId && teamIds.includes(teamId as string)) {
        where.teamId = teamId as string;
      }
    }

    // 4. ADMIN & C_LEVEL: Seluruh departemen (Company-wide)
    else {
      if (teamId) where.teamId = teamId as string;
      if (ownerId) where.ownerId = ownerId as string;
    }

    let initiatives = await prisma.initiative.findMany({
      where,
      include: {
        keyResult: { select: { id: true, title: true, bscPerspective: true } },
        team: { select: { id: true, name: true, department: true } },
        owner: {
          select: { id: true, name: true, email: true, position: true },
        },
        assignedLeader: {
          select: { id: true, name: true, position: true },
        },
        tasks: {
          include: {
            assignedTeamMember: {
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

    // Query Task cards for Kanban (Task Turunan)
    let taskWhere: any = {};
    if (sprintMonth) {
      taskWhere.OR = [
        { sprintMonth: sprintMonth as string },
        { initiative: { sprintMonth: sprintMonth as string } },
      ];
    }
    if (krId) {
      taskWhere.initiative = {
        ...(taskWhere.initiative || {}),
        keyResultId: krId as string,
      };
    }
    if (teamId) {
      taskWhere.initiative = {
        ...(taskWhere.initiative || {}),
        teamId: teamId as string,
      };
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
      taskWhere.AND = [
        ...(taskWhere.AND || []),
        {
          OR: [
            { assignedTeamMemberId: userId },
            { assignments: { some: { userId } } },
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
        select: { teamId: true },
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
        assignedTeamMember: { select: { id: true, name: true } },
        assignments: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const taskCards = tasksList.map((t: any) => {
      let taskKanbanStatus = "TODO";
      if (t.status === "DROP" || t.status === "OFF_TRACK") {
        taskKanbanStatus = "DROP";
      } else if (
        t.status === "DONE" ||
        (t.targetValue > 0 && t.currentValue >= t.targetValue)
      ) {
        taskKanbanStatus = "DONE";
      } else if (t.currentValue > 0) {
        taskKanbanStatus = "IN_PROGRESS";
      }

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
        title: t.title,
        description: t.initiative?.title
          ? `Task dari Inisiatif: ${t.initiative.title}`
          : "Task Turunan",
        targetValue: t.targetValue,
        currentValue: t.currentValue,
        unit: t.unit || "",
        weight: t.weight || 1.0,
        status: t.status,
        kanbanStatus: taskKanbanStatus,
        sprintMonth: t.sprintMonth || t.initiative?.sprintMonth || null,
        startDate: t.startDate || t.initiative?.startDate || null,
        dueDate: t.finishDate || t.initiative?.dueDate || null,
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
    } = req.body;
    const { role, id: userId } = req.user!;

    if (!keyResultId || !title) {
      return res
        .status(400)
        .json({ message: "keyResultId dan title wajib diisi" });
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

    // TEAM (T): Membuat inisiatif untuk dirinya sendiri
    if (role === "TEAM") {
      ownerId = userId;
      if (!teamId && dbUser?.teamId) {
        teamId = dbUser.teamId;
      }
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

    const kr = await prisma.keyResult.findUnique({
      where: { id: keyResultId },
    });
    if (!kr)
      return res.status(404).json({ message: "KeyResult tidak ditemukan" });

    // Auto-heal kr.month if it is null/empty to allow initiative creation
    if (!kr.month) {
      const now = new Date();
      const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const krMonth = sprintMonth || defaultMonth;
      await prisma.keyResult.update({
        where: { id: keyResultId },
        data: { month: krMonth },
      });
      kr.month = krMonth;
    }

    const finalOwnerId = ownerId || (role === "TEAM" ? userId : null);
    const parsedWeight =
      weight !== undefined && weight !== null && weight !== ""
        ? parseFloat(weight)
        : 1.0;

    if (
      isNaN(parsedWeight) ||
      parsedWeight <= 0 ||
      parsedWeight > WEIGHT_BUDGET_MAX
    ) {
      return res.status(400).json({
        message: `Bobot inisiatif harus berupa angka lebih dari 0 dan maksimal ${WEIGHT_BUDGET_MAX}%`,
      });
    }

    if (finalOwnerId && sprintMonth) {
      const used = await getUsedWeight(finalOwnerId, sprintMonth);
      const total = used + parsedWeight;
      if (total > WEIGHT_BUDGET_MAX + WEIGHT_EPSILON) {
        return res.status(400).json({
          message: `Total bobot inisiatif pegawai ini pada sprint ${sprintMonth} akan menjadi ${total.toFixed(1)}%, melebihi batas ${WEIGHT_BUDGET_MAX}%. Sisa bobot tersedia: ${Math.max(0, WEIGHT_BUDGET_MAX - used).toFixed(1)}%`,
        });
      }
    }

    const initiative = await prisma.initiative.create({
      data: {
        keyResultId,
        teamId,
        ownerId: finalOwnerId,
        assignedLeaderId: assignedLeaderId || null,
        assignedBy: userId,
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
        status: "ON_TRACK",
        kanbanStatus: kanbanStatus || "TODO",
        weight: parsedWeight,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        finishDate: finishDate ? new Date(finishDate) : null,
        sprintMonth: sprintMonth || null,
      },
      include: {
        team: true,
        owner: {
          select: { id: true, name: true, email: true, position: true },
        },
        assignedLeader: {
          select: { id: true, name: true, position: true },
        },
      },
    });

    if (assignedLeaderId) {
      await createNotification({
        recipientId: assignedLeaderId,
        type: "INITIATIVE_ASSIGNED",
        title: "Inisiatif Baru Ditugaskan",
        body: `Anda mendapat assignment Initiative: "${title}" dari Manager`,
        link: "/initiatives",
      });
    }

    return res.status(201).json(initiative);
  } catch (error) {
    console.error("Create initiative error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// PUT /api/initiatives/:id — Update initiative
export async function updateInitiative(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const {
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
    } = req.body;
    const { role, id: userId } = req.user!;

    const existing = await prisma.initiative.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ message: "Initiative tidak ditemukan" });

    // Non-restricted initiative editing
    const effectiveOwnerId =
      ownerId !== undefined ? ownerId || null : existing.ownerId;
    const effectiveSprintMonth =
      sprintMonth !== undefined ? sprintMonth || null : existing.sprintMonth;
    const effectiveWeight =
      weight !== undefined ? parseFloat(weight) : existing.weight;

    if (
      weight !== undefined &&
      (isNaN(effectiveWeight) ||
        effectiveWeight <= 0 ||
        effectiveWeight > WEIGHT_BUDGET_MAX)
    ) {
      return res.status(400).json({
        message: `Bobot inisiatif harus berupa angka lebih dari 0 dan maksimal ${WEIGHT_BUDGET_MAX}%`,
      });
    }

    if (effectiveOwnerId && effectiveSprintMonth) {
      const used = await getUsedWeight(
        effectiveOwnerId,
        effectiveSprintMonth,
        id,
      );
      const total = used + effectiveWeight;
      if (total > WEIGHT_BUDGET_MAX + WEIGHT_EPSILON) {
        return res.status(400).json({
          message: `Total bobot inisiatif pegawai ini pada sprint ${effectiveSprintMonth} akan menjadi ${total.toFixed(1)}%, melebihi batas ${WEIGHT_BUDGET_MAX}%. Sisa bobot tersedia: ${Math.max(0, WEIGHT_BUDGET_MAX - used).toFixed(1)}%`,
        });
      }
    }

    const updated = await prisma.initiative.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(ownerId !== undefined &&
          role !== "TEAM" && { ownerId: ownerId || null }),
        ...(assignedLeaderId !== undefined &&
          role !== "TEAM" && { assignedLeaderId: assignedLeaderId || null }),
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
        ...(status !== undefined && { status }),
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
        ...(sprintMonth !== undefined && { sprintMonth: sprintMonth || null }),
      },
      include: {
        team: true,
        owner: {
          select: { id: true, name: true, email: true, position: true },
        },
        assignedLeader: {
          select: { id: true, name: true, position: true },
        },
      },
    });

    if (assignedLeaderId && assignedLeaderId !== existing.assignedLeaderId) {
      await createNotification({
        recipientId: assignedLeaderId,
        type: "INITIATIVE_ASSIGNED",
        title: "Inisiatif Ditugaskan ke Anda",
        body: `Initiative "${updated.title}" telah di-assign ke Anda`,
        link: "/initiatives",
      });
    }

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

      let newCurrentValue = task.currentValue;
      let newStatus = task.status;

      if (kanbanStatus === "DONE") {
        newCurrentValue =
          task.currentValue > 0
            ? task.currentValue
            : task.targetValue > 0
              ? task.targetValue
              : 1;
        newStatus = "DONE";
      } else if (kanbanStatus === "TODO") {
        newCurrentValue = 0;
        newStatus = "ON_TRACK";
      } else if (kanbanStatus === "IN_PROGRESS") {
        if (task.currentValue <= 0) {
          newCurrentValue =
            task.targetValue > 0
              ? Math.max(1, Math.round(task.targetValue * 0.1 * 10) / 10)
              : 1;
        } else if (
          task.targetValue > 0 &&
          task.currentValue >= task.targetValue
        ) {
          newCurrentValue = Math.round(task.targetValue * 0.5 * 10) / 10;
        }
        newStatus = "ON_TRACK";
      } else if (kanbanStatus === "DROP") {
        newStatus = "DROP";
      }

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          currentValue: newCurrentValue,
          status: newStatus,
        },
      });

      // Auto-cascade Task → Initiative → KR
      await cascadeTaskValueUpdate(taskId, task.initiativeId);

      // Send notification to leader if moved by team member
      const recipientLeaderId =
        task.assignedBy ||
        task.initiative.assignedLeaderId ||
        task.initiative.ownerId;
      if (recipientLeaderId && recipientLeaderId !== userId) {
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

    const shouldSetToDone = kanbanStatus === "DONE";

    const updated = await prisma.initiative.update({
      where: { id },
      data: {
        kanbanStatus,
        ...(shouldSetToDone &&
          existing.targetValue > 0 &&
          existing.currentValue <= 0 && { currentValue: existing.targetValue }),
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
    await cascadeInitiativeToMonthlyKr(existing.keyResultId);

    // Send notification to leader if moved by team member
    const recipientLeaderId =
      existing.assignedLeaderId || existing.assignedBy || existing.ownerId;
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
        newValue:
          shouldSetToDone && existing.targetValue > 0
            ? existing.targetValue
            : existing.currentValue,
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
export async function deleteInitiative(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user!;

    const existing = await prisma.initiative.findUnique({
      where: { id },
      include: { team: true },
    });
    if (!existing)
      return res.status(404).json({ message: "Initiative tidak ditemukan" });

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
      if (
        existing.assignedLeaderId !== userId &&
        existing.ownerId !== userId &&
        existing.assignedBy !== userId
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

    // Hapus InitiativeUpdate (riwayat progress inisiatif)
    await prisma.initiativeUpdate.deleteMany({ where: { initiativeId: id } });

    // Hapus TaskUpdate & TaskAssignment dari semua Task child
    const tasks = await prisma.task.findMany({
      where: { initiativeId: id },
      select: { id: true },
    });
    const taskIds = tasks.map((k) => k.id);
    await prisma.taskUpdate.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.taskAssignment.deleteMany({
      where: { taskId: { in: taskIds } },
    });
    await prisma.task.deleteMany({ where: { initiativeId: id } });
    await prisma.initiative.delete({ where: { id } });

    // Recalculate parent KeyResult progress jika ada
    if (existing.keyResultId) {
      const remainingInitiatives = await prisma.initiative.findMany({
        where: { keyResultId: existing.keyResultId },
      });
      let avgProgress = 0;
      if (remainingInitiatives.length > 0) {
        const totalProgress = remainingInitiatives.reduce((acc, ini) => {
          const p =
            ini.targetValue > 0
              ? Math.min(100, (ini.currentValue / ini.targetValue) * 100)
              : 0;
          return acc + p * (ini.weight || 1.0);
        }, 0);
        const totalWeight = remainingInitiatives.reduce(
          (acc, ini) => acc + (ini.weight || 1.0),
          0,
        );
        avgProgress = totalWeight > 0 ? totalProgress / totalWeight : 0;
      }
      const kr = await prisma.keyResult.findUnique({
        where: { id: existing.keyResultId },
      });
      if (kr) {
        const newKrValue = (avgProgress / 100) * kr.targetValue;
        let krStatus = "ON_TRACK";
        if (avgProgress < 50) krStatus = "OFF_TRACK";
        else if (avgProgress < 75) krStatus = "AT_RISK";

        await prisma.keyResult.update({
          where: { id: existing.keyResultId },
          data: { currentValue: newKrValue, status: krStatus },
        });
      }
    }

    return res.status(200).json({ message: "Initiative berhasil dihapus" });
  } catch (error) {
    console.error("Delete initiative error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/initiatives/my-work — Semua Task yang di-assign ke user
export async function getMyWork(req: AuthRequest, res: Response) {
  try {
    const { id: userId, role } = req.user!;

    // TEAM & LEADER lihat full history; MANAGER & C_LEVEL hanya 1 terakhir
    const historyLimit = ["MANAGER", "C_LEVEL"].includes(role) ? 1 : undefined;

    const taskAssignments = await prisma.taskAssignment.findMany({
      where: { userId },
      include: {
        task: {
          include: {
            initiative: {
              include: {
                keyResult: { include: { objective: true, departments: true } },
                team: true,
              },
            },
            updates: {
              orderBy: { createdAt: "desc" },
              ...(historyLimit !== undefined ? { take: historyLimit } : {}),
            },
          },
        },
      },
    });

    // Ambil juga task yang assignedTeamMemberId = userId tetapi belum ada di taskAssignment
    const existingTaskIds = taskAssignments.map((a) => a.taskId);
    const directTasks = await prisma.task.findMany({
      where: {
        assignedTeamMemberId: userId,
        ...(existingTaskIds.length > 0
          ? { id: { notIn: existingTaskIds } }
          : {}),
      },
      include: {
        initiative: {
          include: {
            keyResult: { include: { objective: true, departments: true } },
            team: true,
          },
        },
        updates: {
          orderBy: { createdAt: "desc" },
          ...(historyLimit !== undefined ? { take: historyLimit } : {}),
        },
      },
    });

    const directTaskAssignments = directTasks.map((t) => ({
      id: `virtual-direct-${t.id}`,
      taskId: t.id,
      userId,
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
        initiative: {
          ownerId: userId,
        },
        ...(allFetchedTaskIds.length > 0
          ? { id: { notIn: allFetchedTaskIds } }
          : {}),
      },
      include: {
        initiative: {
          include: {
            keyResult: { include: { objective: true, departments: true } },
            team: true,
          },
        },
        updates: {
          orderBy: { createdAt: "desc" },
          ...(historyLimit !== undefined ? { take: historyLimit } : {}),
        },
      },
    });

    const unassignedTaskAssignments = unassignedTasks.map((t) => ({
      id: `virtual-${t.id}`,
      taskId: t.id,
      userId,
      task: t,
      createdAt: t.createdAt,
    }));

    const combinedTaskAssignments = [
      ...taskAssignments,
      ...directTaskAssignments,
      ...unassignedTaskAssignments,
    ];

    // Ambil inisiatif yang dimiliki sendiri ATAU di mana user memiliki Task yang di-assign padanya
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true, department: true },
    });
    let myInitiatives: any[] = [];
    myInitiatives = await prisma.initiative.findMany({
      where: {
        OR: [
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
          ...(dbUser?.teamId ? [{ teamId: dbUser.teamId }] : []),
        ],
      },
      include: {
        keyResult: { include: { objective: true, departments: true } },
        team: true,
        owner: { select: { id: true, name: true } },
        tasks: {
          include: {
            assignments: {
              include: { user: { select: { id: true, name: true } } },
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
    if (role === "MANAGER" || role === "ADMIN") {
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
            initiative: {
              teamId: { in: uniqueTeamIds },
            },
          },
          userId: { not: userId },
        },
        include: {
          user: { select: { id: true, name: true } },
          task: {
            include: {
              initiative: {
                include: {
                  keyResult: {
                    include: { objective: true, departments: true },
                  },
                  team: true,
                },
              },
              updates: { orderBy: { createdAt: "desc" } },
            },
          },
        },
      });

      // Ambil task tanpa assignment di DB, tapi inisiatif induknya dimiliki anggota tim lain (fallback PIC inisiatif)
      const memberUnassignedTasks = await prisma.task.findMany({
        where: {
          initiative: {
            teamId: { in: uniqueTeamIds },
            NOT: [{ ownerId: userId }, { ownerId: null }],
          },
          assignments: {
            none: {},
          },
        },
        include: {
          initiative: {
            include: {
              keyResult: { include: { objective: true, departments: true } },
              team: true,
              owner: { select: { id: true, name: true } },
            },
          },
          updates: { orderBy: { createdAt: "desc" } },
        },
      });

      const memberUnassignedAssignments = memberUnassignedTasks.map((t) => ({
        id: `virtual-member-${t.id}`,
        taskId: t.id,
        userId: t.initiative.ownerId!,
        user: t.initiative.owner,
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
          teamId: { in: uniqueTeamIds },
          OR: [{ ownerId: { not: userId } }, { ownerId: null }],
        },
        include: {
          keyResult: { include: { objective: true, departments: true } },
          team: true,
          owner: { select: { id: true, name: true } },
          tasks: true,
          progressUpdates: { orderBy: { createdAt: "desc" } },
        },
      });

      teamMembersWork = {
        taskAssignments: combinedMemberTaskAssignments,
        initiatives: memberInitiatives,
      };
    }

    return res.status(200).json({
      taskAssignments: combinedTaskAssignments,
      myInitiatives,
      teamMembersWork,
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
      where,
      include: {
        keyResult: { include: { objective: true } },
        team: true,
        owner: {
          select: { id: true, name: true, email: true, position: true },
        },
        tasks: {
          include: {
            assignments: {
              include: { user: { select: { id: true, name: true } } },
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
      where: { initiativeId },
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
      sprintMonth,
      startDate,
      finishDate,
      keyResultId,
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

    // Validate Cascade KR if provided
    try {
      await validateCascadeKR(initiativeId, keyResultId);
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }

    const targetMemberId = assignedTeamMemberId || assigneeId;

    if (targetMemberId && (role === "LEADER" || role === "TEAM")) {
      const leaderUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { department: true },
      });
      const targetUser = await prisma.user.findUnique({
        where: { id: targetMemberId },
        select: { department: true },
      });
      if (!targetUser) {
        return res
          .status(400)
          .json({ message: "Assignee user tidak ditemukan" });
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

    const targetAssigneeId =
      targetMemberId ||
      initiative.assignedLeaderId ||
      initiative.ownerId ||
      userId;
    const finalSprintMonth = sprintMonth || initiative.sprintMonth || null;

    const task = await prisma.task.create({
      data: {
        initiativeId,
        title,
        targetValue: parseFloat(targetValue),
        unit: unit || null,
        status: "ON_TRACK",
        assignedTeamMemberId: targetAssigneeId,
        assignedBy: userId,
        sprintMonth: finalSprintMonth,
        startDate: startDate ? new Date(startDate) : null,
        finishDate: finishDate ? new Date(finishDate) : null,
        ...(targetAssigneeId && {
          assignments: {
            create: {
              userId: targetAssigneeId,
            },
          },
        }),
      },
      include: {
        assignedTeamMember: { select: { id: true, name: true } },
      },
    });

    if (targetAssigneeId && targetAssigneeId !== userId) {
      await createNotification({
        recipientId: targetAssigneeId,
        type: "TASK_ASSIGNED",
        title: "Task Baru Ditugaskan",
        body: `Anda mendapat assignment Task: "${title}"`,
        link: "/team/my-work",
      });
    }

    return res.status(201).json(task);
  } catch (error) {
    console.error("Create Task error:", error);
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
      assignedTeamMemberId,
      sprintMonth,
      startDate,
      finishDate,
      keyResultId,
    } = req.body;
    const { role, id: userId } = req.user!;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ message: "Task tidak ditemukan" });

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

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(targetValue !== undefined && {
          targetValue: parseFloat(targetValue),
        }),
        ...(unit !== undefined && { unit }),
        ...(status !== undefined && { status }),
        ...(assignedTeamMemberId !== undefined && { assignedTeamMemberId }),
        ...(sprintMonth !== undefined && { sprintMonth }),
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
        ...(finishDate !== undefined && {
          finishDate: finishDate ? new Date(finishDate) : null,
        }),
      },
    });

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

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Update Task error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// DELETE /api/tasks/:id — Delete Task
export async function deleteTask(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user!;

    const existing = await prisma.task.findUnique({
      where: { id },
      include: { initiative: { include: { team: true } } },
    });
    if (!existing)
      return res.status(404).json({ message: "Task tidak ditemukan" });

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
        !existing.initiative.team?.department ||
        !deptList.includes(existing.initiative.team.department)
      ) {
        return res.status(403).json({
          message:
            "Forbidden: Manager hanya dapat menghapus task di departemennya",
        });
      }
    } else if (role === "LEADER") {
      if (
        existing.assignedBy !== userId &&
        existing.initiative.assignedLeaderId !== userId &&
        existing.assignedTeamMemberId !== userId
      ) {
        return res.status(403).json({
          message:
            "Forbidden: Anda tidak memiliki akses untuk menghapus task ini",
        });
      }
    } else if (role === "TEAM") {
      if (
        existing.assignedTeamMemberId !== userId &&
        existing.assignedBy !== userId
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

    await prisma.taskUpdate.deleteMany({ where: { taskId: id } });
    await prisma.taskAssignment.deleteMany({ where: { taskId: id } });
    await prisma.task.delete({ where: { id } });

    // Recalculate parent initiative progress
    await cascadeTaskValueUpdate(id, existing.initiativeId);

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
    if (role === "LEADER" || role === "TEAM") {
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

// BARU: Cascade dari Initiative ke Monthly Key Result
// Dibuat dari scratch untuk menangani case isManualOverride
export async function cascadeInitiativeToMonthlyKr(
  keyResultId: string,
): Promise<void> {
  const kr = await prisma.keyResult.findUnique({
    where: { id: keyResultId },
  });
  if (!kr) return;

  // Jika di-override secara manual oleh Leader, skip sinkronisasi otomatis dari Initiative
  if (kr.isManualOverride) {
    return;
  }

  const allInitiatives = await prisma.initiative.findMany({
    where: { keyResultId },
    include: { tasks: true },
  });

  if (allInitiatives.length === 0 || kr.targetValue <= 0) return;

  const totalWeight = allInitiatives.reduce((s, i) => s + (i.weight || 1), 0);
  const weightedAvgPercent =
    allInitiatives.reduce((sum, init) => {
      let initProgress = 0;
      if (
        init.achievedValue !== null &&
        init.achievedValue !== undefined &&
        init.targetValue > 0
      ) {
        initProgress = init.achievedValue / init.targetValue;
      } else if (init.tasks.length > 0) {
        const initTasksWeight = init.tasks.reduce(
          (s, t) => s + (t.weight || 1),
          0,
        );
        initProgress =
          init.tasks.reduce((s, k) => {
            return (
              s +
              (k.targetValue > 0 ? k.currentValue / k.targetValue : 0) *
                (k.weight || 1)
            );
          }, 0) / (initTasksWeight || 1);
      } else if (init.targetValue > 0) {
        initProgress = init.currentValue / init.targetValue;
      }
      return sum + initProgress * (init.weight || 1);
    }, 0) / (totalWeight || 1);

  const newKrValue =
    Math.round(weightedAvgPercent * kr.targetValue * 100) / 100;

  const krProgress = newKrValue / kr.targetValue;
  let newStatus = "ON_TRACK";
  if (krProgress < 0.5) newStatus = "OFF_TRACK";
  else if (krProgress < 0.8) newStatus = "AT_RISK";

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
  initiativeId: string,
): Promise<void> {
  // 1. Recalculate Initiative.currentValue dari weighted average Task progress
  const allTasks = await prisma.task.findMany({ where: { initiativeId } });
  const initiative = await prisma.initiative.findUnique({
    where: { id: initiativeId },
  });

  if (initiative && allTasks.length > 0 && initiative.targetValue > 0) {
    const totalTaskWeight = allTasks.reduce((s, t) => s + (t.weight || 1), 0);
    const weightedTaskPercent =
      allTasks.reduce((sum, t) => {
        const pct = t.targetValue > 0 ? t.currentValue / t.targetValue : 0;
        return sum + pct * (t.weight || 1);
      }, 0) / (totalTaskWeight || 1);
    const newInitiativeValue =
      Math.round(weightedTaskPercent * initiative.targetValue * 100) / 100;

    await prisma.initiative.update({
      where: { id: initiative.id },
      data: { currentValue: newInitiativeValue },
    });

    // 2. Recalculate KR.currentValue dari weighted average Initiative progress
    await cascadeInitiativeToMonthlyKr(initiative.keyResultId);
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
      include: { initiative: true },
    });
    if (!task) return res.status(404).json({ message: "Task tidak ditemukan" });

    const assignment = await prisma.taskAssignment.findUnique({
      where: { taskId_userId: { taskId, userId } },
    });
    const isAssigned =
      assignment ||
      task.assignedTeamMemberId === userId ||
      task.assignedBy === userId;

    if (!isAssigned && !["LEADER", "MANAGER", "ADMIN"].includes(role)) {
      return res
        .status(403)
        .json({ message: "Kamu tidak di-assign ke Task ini" });
    }

    const isAutoApprove = ["LEADER", "MANAGER", "ADMIN"].includes(role);
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
      await prisma.task.update({
        where: { id: taskId },
        data: {
          currentValue: parseFloat(newValue),
          documentationLink: link || null,
        },
      });
      await cascadeTaskValueUpdate(taskId, task.initiativeId);
    } else {
      const recipientLeaderId = task.assignedBy || task.initiative.ownerId;
      if (recipientLeaderId && recipientLeaderId !== userId) {
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

      const taskDept = taskUpdate.task.initiative.team?.department;
      if (!taskDept || !deptValues.has(taskDept)) {
        return res.status(403).json({
          message:
            "Forbidden: Manajer hanya berwenang menyetujui update di departemen yang dikelola",
        });
      }
    } else if (role === "LEADER") {
      const leaderTeamIds = await getLeaderTeamIds(managerId);
      const dbUser = await prisma.user.findUnique({
        where: { id: managerId },
        select: { department: true, teamId: true },
      });
      if (dbUser?.teamId) leaderTeamIds.push(dbUser.teamId);

      const taskTeamId = taskUpdate.task.initiative.teamId;
      const isLeaderOfTeam = leaderTeamIds.includes(taskTeamId);

      if (!isLeaderOfTeam) {
        const taskDept = taskUpdate.task.initiative.team?.department;
        if (!dbUser?.department || taskDept !== dbUser.department) {
          return res.status(403).json({
            message:
              "Forbidden: Leader hanya berwenang menyetujui update Task di tim/departemennya",
          });
        }
      }
    }

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

      const taskDept = taskUpdate.task.initiative.team?.department;
      if (!taskDept || !deptValues.has(taskDept)) {
        return res.status(403).json({
          message:
            "Forbidden: Manajer hanya berwenang menolak update di departemen yang dikelola",
        });
      }
    } else if (role === "LEADER") {
      const leaderTeamIds = await getLeaderTeamIds(managerId);
      const dbUser = await prisma.user.findUnique({
        where: { id: managerId },
        select: { department: true, teamId: true },
      });
      if (dbUser?.teamId) leaderTeamIds.push(dbUser.teamId);

      const taskTeamId = taskUpdate.task.initiative.teamId;
      const isLeaderOfTeam = leaderTeamIds.includes(taskTeamId);

      if (!isLeaderOfTeam) {
        const taskDept = taskUpdate.task.initiative.team?.department;
        if (!dbUser?.department || taskDept !== dbUser.department) {
          return res.status(403).json({
            message:
              "Forbidden: Leader hanya berwenang menolak update Task di tim/departemennya",
          });
        }
      }
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
      !["LEADER", "MANAGER", "ADMIN"].includes(role)
    ) {
      return res
        .status(403)
        .json({ message: "Anda bukan anggota tim inisiatif ini" });
    }

    let finalNewValue = parseFloat(newValue);
    let finalKanbanStatus = kanbanStatus;

    if (kanbanStatus === "DONE" && initiative.targetValue > 0) {
      finalNewValue = initiative.targetValue;
    } else if (
      initiative.targetValue > 0 &&
      finalNewValue >= initiative.targetValue
    ) {
      finalKanbanStatus = "DONE";
    }

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
          ...(finalKanbanStatus ? { kanbanStatus: finalKanbanStatus } : {}),
          ...(link !== undefined && { documentationLink: link || null }),
        },
      }),
    ]);

    // AUTO-CASCADE: recalculate KR.currentValue
    await cascadeInitiativeToMonthlyKr(initiative.keyResultId);

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
      select: { department: true },
    });

    let deptValues: string[] = [];
    let leadingTeamIds: string[] = [];

    let whereClause: any = { status: "PENDING_APPROVAL" };

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

      const leadersInDept = await prisma.user.findMany({
        where: {
          department: { in: deptValues },
          role: "LEADER",
        },
        select: { id: true },
      });
      const leaderUserIds = leadersInDept.map((u) => u.id);

      whereClause.initiative = {
        team: { department: { in: deptValues } },
      };
      whereClause.submittedBy = { in: leaderUserIds };
    } else if (role === "LEADER") {
      leadingTeamIds = await getLeaderTeamIds(userId);

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
    } else if (role !== "ADMIN" && role !== "C_LEVEL") {
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

    // Query pending task updates matching the same team/department access filter
    let taskWhereClause: any = { status: "PENDING_APPROVAL" };
    if (role === "MANAGER") {
      const leadersInDept = await prisma.user.findMany({
        where: {
          department: { in: deptValues },
          role: "LEADER",
        },
        select: { id: true },
      });
      const leaderUserIds = leadersInDept.map((u) => u.id);

      taskWhereClause.task = {
        initiative: {
          team: { department: { in: deptValues } },
        },
      };
      taskWhereClause.submittedBy = { in: leaderUserIds };
    } else if (role === "LEADER") {
      const teamMembers = await prisma.user.findMany({
        where: {
          teamId: { in: leadingTeamIds },
          role: "TEAM",
        },
        select: { id: true },
      });
      const teamMemberIds = teamMembers.map((u) => u.id);

      taskWhereClause.task = {
        initiative: {
          teamId: { in: leadingTeamIds },
        },
      };
      taskWhereClause.submittedBy = { in: teamMemberIds };
    }

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

    const mappedInitiativeUpdates = updates.map((u: any) => ({
      ...u,
      type: "INITIATIVE",
    }));

    const mappedTaskUpdates = taskUpdates.map((t: any) => ({
      id: t.id,
      initiativeId: t.task.initiativeId,
      initiative: {
        id: t.task.initiativeId,
        title: `[TASK] ${t.task.title} (Inisiatif: ${t.task.initiative.title})`,
        team: t.task.initiative.team,
      },
      oldValue: t.oldValue,
      newValue: t.newValue,
      note: t.note,
      link: t.link,
      status: t.status,
      createdAt: t.createdAt,
      type: "TASK",
    }));

    const combinedUpdates = [
      ...mappedInitiativeUpdates,
      ...mappedTaskUpdates,
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return res.status(200).json(combinedUpdates);
  } catch (error) {
    console.error("Get pending Initiative updates error:", error);
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
      if (submitterRole !== "LEADER") {
        return res.status(403).json({
          message:
            "Forbidden: Manajer hanya berwenang menyetujui update tingkat Leader saja.",
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
      if (
        !initiativeUpdate.initiative.team?.department ||
        !deptValues.includes(initiativeUpdate.initiative.team.department)
      ) {
        return res.status(403).json({
          message:
            "Forbidden: Anda tidak memiliki akses untuk menyetujui update di departemen ini",
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
    } else if (role !== "ADMIN" && role !== "C_LEVEL") {
      return res.status(403).json({
        message: "Forbidden: Peran Anda tidak diizinkan menyetujui update",
      });
    }

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
          ...(initiativeUpdate.kanbanStatus
            ? { kanbanStatus: initiativeUpdate.kanbanStatus }
            : {}),
          documentationLink: initiativeUpdate.link || null,
        },
      }),
    ]);

    // AUTO-CASCADE: recalculate KR.currentValue dari weighted average Initiative progress
    await cascadeInitiativeToMonthlyKr(initiativeUpdate.initiative.keyResultId);

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
      if (submitterRole !== "LEADER") {
        return res.status(403).json({
          message:
            "Forbidden: Manajer hanya berwenang menolak update tingkat Leader saja.",
        });
      }

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
      if (
        !initiativeUpdate.initiative.team?.department ||
        !deptValues.includes(initiativeUpdate.initiative.team.department)
      ) {
        return res.status(403).json({
          message:
            "Forbidden: Anda tidak memiliki akses untuk menolak update di departemen ini",
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
    } else if (role !== "ADMIN" && role !== "C_LEVEL") {
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
