import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { cascadeMonthlyKrToAnnual } from './keyresult.controller';

const prisma = new PrismaClient();

// ─── INITIATIVE ────────────────────────────────────────────────────────────

// Bobot setiap initiative card adalah persentase (0-100). Total bobot seluruh
// card milik satu pegawai (ownerId) pada satu sprint (sprintMonth) tidak boleh
// melebihi 100%, agar beban kerja per-sprint pegawai selalu proporsional.
const WEIGHT_BUDGET_MAX = 100;
const WEIGHT_EPSILON = 0.01;

async function getUsedWeight(ownerId: string, sprintMonth: string, excludeId?: string): Promise<number> {
  const initiatives = await prisma.initiative.findMany({
    where: {
      ownerId,
      sprintMonth,
      kanbanStatus: { not: 'DROP' },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { weight: true },
  });
  return initiatives.reduce((sum, i) => sum + (i.weight || 0), 0);
}

// GET /api/initiatives/weight-budget — Cek sisa bobot (%) pegawai pada sprint tertentu
export async function getInitiativeWeightBudget(req: AuthRequest, res: Response) {
  try {
    const { ownerId, sprintMonth, excludeId } = req.query as { ownerId?: string; sprintMonth?: string; excludeId?: string };
    if (!ownerId || !sprintMonth) {
      return res.status(400).json({ message: 'ownerId dan sprintMonth wajib diisi' });
    }
    const used = await getUsedWeight(ownerId, sprintMonth, excludeId);
    return res.status(200).json({ used, remaining: Math.max(0, WEIGHT_BUDGET_MAX - used) });
  } catch (error) {
    console.error('Get initiative weight budget error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getLeaderTeamIds(userId: string): Promise<string[]> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { teamId: true, department: true }
  });
  const leaderTeams = await prisma.team.findMany({
    where: { leaderId: userId },
    select: { id: true }
  });
  const teamIdSet = new Set<string>(leaderTeams.map(t => t.id));
  if (dbUser?.teamId) teamIdSet.add(dbUser.teamId);
  if (dbUser?.department) {
    const deptTeams = await prisma.team.findMany({
      where: { department: dbUser.department },
      select: { id: true }
    });
    deptTeams.forEach(t => teamIdSet.add(t.id));
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
      select: { department: true, teamId: true }
    });

    // 1. Tentukan user mana saja yang boleh dilihat oleh req.user berdasarkan Role
    let visibleUserIds: string[] = [];

    if (role === 'TEAM') {
      // TEAM HANYA boleh melihat dirinya sendiri!
      visibleUserIds = [userId];
    } else if (role === 'LEADER') {
      // LEADER melihat dirinya + anggota tim yang dipimpin/dimilikinya/departemennya
      const leaderTeamIds = await getLeaderTeamIds(userId);
      const teamMembers = await prisma.user.findMany({
        where: {
          OR: [
            { id: userId },
            { teamId: { in: leaderTeamIds } },
            ...(dbUser?.department ? [{ department: dbUser.department, role: 'TEAM' }] : [])
          ]
        },
        select: { id: true }
      });
      visibleUserIds = teamMembers.map(u => u.id);
    } else if (role === 'MANAGER') {
      // MANAGER melihat dirinya + Leader & Team di seluruh departemen yang dikelolanya
      const managedDepts = await prisma.department.findMany({
        where: { managerId: userId },
        select: { value: true }
      });
      const deptList = managedDepts.map(d => d.value);
      if (dbUser?.department && !deptList.includes(dbUser.department)) {
        deptList.push(dbUser.department);
      }

      const deptUsers = await prisma.user.findMany({
        where: {
          OR: [
            { id: userId },
            { department: { in: deptList } }
          ]
        },
        select: { id: true }
      });
      visibleUserIds = deptUsers.map(u => u.id);
    } else {
      // ADMIN & C_LEVEL melihat semua user
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      visibleUserIds = allUsers.map(u => u.id);
    }

    // 2. Ambil Initiative (card) yang dimiliki (ownerId) oleh user-user yang diizinkan.
    // Capaian member sekarang dihitung dari bobot (%) tiap card, bukan rata-rata Task polos,
    // agar konsisten dengan aturan "total bobot card per pegawai per sprint = 100%".
    const usersWithInitiatives = await prisma.user.findMany({
      where: { id: { in: visibleUserIds } },
      select: {
        id: true,
        name: true,
        role: true,
        position: true,
        department: true,
        team: { select: { id: true, name: true } },
        ownedInitiatives: {
          where: { kanbanStatus: { not: 'DROP' } },
          select: {
            id: true,
            title: true,
            weight: true,
            kanbanStatus: true,
            targetValue: true,
            currentValue: true,
            sprintMonth: true,
            tasks: { select: { targetValue: true, currentValue: true } },
          },
        },
      },
      orderBy: { name: 'asc' }
    });

    // 3. Hitung capaian weighted-average per member (opsional difilter per sprint)
    const allSprintMonths = new Set<string>();
    const result = usersWithInitiatives.map(user => {
      const initiatives = user.ownedInitiatives
        .filter(init => {
          if (init.sprintMonth) allSprintMonths.add(init.sprintMonth);
          return sprintMonth ? init.sprintMonth === sprintMonth : true;
        })
        .map(init => {
          let progressPct: number;
          if (init.kanbanStatus === 'DONE') {
            progressPct = 100;
          } else if (init.tasks.length > 0) {
            progressPct = init.tasks.reduce((sum, k) => {
              const pct = k.targetValue > 0
                ? Math.min(100, Math.max(0, (k.currentValue / k.targetValue) * 100))
                : 0;
              return sum + pct;
            }, 0) / init.tasks.length;
          } else if (init.targetValue > 0) {
            progressPct = Math.min(100, Math.max(0, (init.currentValue / init.targetValue) * 100));
          } else {
            progressPct = 0;
          }
          return {
            id: init.id,
            title: init.title,
            weight: init.weight,
            sprintMonth: init.sprintMonth,
            kanbanStatus: init.kanbanStatus,
            progressPct: Math.round(progressPct * 10) / 10,
          };
        });

      const totalWeight = initiatives.reduce((s, i) => s + (i.weight || 0), 0);
      const achievementPct = totalWeight > 0
        ? Math.round(
            initiatives.reduce((s, i) => s + i.progressPct * i.weight, 0) / totalWeight * 10
          ) / 10
        : 0;

      return {
        userId: user.id,
        userName: user.name,
        role: user.role,
        position: user.position,
        department: user.department,
        teamName: user.team?.name,
        totalAssignedTasks: initiatives.length,
        totalWeight: Math.round(totalWeight * 10) / 10,
        achievementPct, // Out of 100%, weighted by bobot tiap card inisiatif
        initiatives
      };
    });

    return res.status(200).json({
      role,
      userCount: result.length,
      sprintMonth: sprintMonth || null,
      availableSprintMonths: Array.from(allSprintMonths).sort().reverse(),
      members: result
    });
  } catch (error) {
    console.error('Get member progress error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/initiatives/progress — Initiative progress per role
export async function getInitiativeProgress(req: AuthRequest, res: Response) {
  try {
    const { role, id: userId } = req.user!;
    let where: any = {};

    // LEADER: hanya tim yang dipimpin
    if (role === 'LEADER') {
      const leaderTeamIds = await getLeaderTeamIds(userId);
      where.teamId = { in: leaderTeamIds };
    }
    // MANAGER: semua tim di departemennya
    else if (role === 'MANAGER') {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { department: true }
      });
      if (dbUser?.department) {
        const deptTeams = await prisma.team.findMany({
          where: { department: dbUser.department },
          select: { id: true }
        });
        where.teamId = { in: deptTeams.map(t => t.id) };
      }
    }
    // ADMIN & C_LEVEL: semua (no filter)

    const initiatives = await prisma.initiative.findMany({
      where,
      include: {
        keyResult: {
          select: {
            id: true, title: true, bscPerspective: true,
            targetValue: true, currentValue: true, status: true,
            objective: { select: { id: true, title: true, year: true } }
          }
        },
        team: { select: { id: true, name: true, department: true } },
        owner: { select: { id: true, name: true, position: true } },
        tasks: {
          include: {
            assignments: {
              include: { user: { select: { id: true, name: true } } }
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Kalkulasi progress per Initiative dari Task
    const enriched = initiatives.map(init => {
      const taskProgress = init.tasks.map(task => {
        const pct = task.targetValue > 0
          ? Math.min(100, Math.max(0, (task.currentValue / task.targetValue) * 100))
          : 0;
        return { ...task, progressPercent: Math.round(pct * 10) / 10 };
      });

      const avgProgress = taskProgress.length > 0
        ? taskProgress.reduce((sum, k) => sum + k.progressPercent, 0) / taskProgress.length
        : (init.targetValue > 0
            ? Math.min(100, (init.currentValue / init.targetValue) * 100)
            : 0);

      const completedTasks = taskProgress.filter(k => k.progressPercent >= 100).length;

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
      const totalWeight = kr.initiatives.reduce((s: number, i: any) => s + (i.weight || 1), 0);
      kr.krProgress = totalWeight > 0
        ? Math.round(
            kr.initiatives.reduce(
              (s: number, i: any) => s + i.calculatedProgress * (i.weight || 1), 0
            ) / totalWeight * 10
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
        avgProgress: enriched.length > 0
          ? Math.round(enriched.reduce((s, i) => s + i.calculatedProgress, 0) / enriched.length * 10) / 10
          : 0,
        byKanbanStatus: {
          TODO: enriched.filter(i => i.kanbanStatus === 'TODO').length,
          IN_PROGRESS: enriched.filter(i => i.kanbanStatus === 'IN_PROGRESS').length,
          DONE: enriched.filter(i => i.kanbanStatus === 'DONE').length,
          DROP: enriched.filter(i => i.kanbanStatus === 'DROP').length,
        }
      }
    });
  } catch (error) {
    console.error('Get initiative progress error:', error);
    return res.status(500).json({ message: 'Internal server error' });
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

    // 1. TEAM (T): melihat semua inisiatif dalam departemen yang sama
    if (role === 'TEAM') {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { department: true, teamId: true }
      });

      if (dbUser?.department) {
        // Ambil semua tim di departemen yang sama
        const deptTeams = await prisma.team.findMany({
          where: { department: dbUser.department },
          select: { id: true }
        });
        const deptTeamIds = deptTeams.map(t => t.id);

        // Tampilkan inisiatif dari seluruh tim dalam departemen ini
        where.teamId = { in: deptTeamIds };
      } else if (dbUser?.teamId) {
        // Fallback: jika user tidak punya department, scope ke tim sendiri
        where.teamId = dbUser.teamId;
      } else {
        // Fallback terakhir: hanya milik sendiri
        where.ownerId = userId;
      }

      // Filter ownerId tambahan dari query param tetap bisa diterapkan
      if (ownerId) where.ownerId = ownerId as string;
      if (teamId) where.teamId = teamId as string;
    }

    // 2. LEADER (P): melihat card miliknya sendiri + semua card anggota tim di bawahnya
    else if (role === 'LEADER') {
      const leaderTeams = await prisma.team.findMany({ where: { leaderId: userId }, select: { id: true } });
      const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { teamId: true } });
      const teamIdSet = new Set<string>(leaderTeams.map(t => t.id));
      if (dbUser?.teamId) teamIdSet.add(dbUser.teamId);
      const teamIds = Array.from(teamIdSet);

      if (ownerId) {
        // Filter spesifik pegawai di bawahnya / dirinya
        where.ownerId = ownerId as string;
        where.OR = [
          { teamId: { in: teamIds } },
          { ownerId: userId }
        ];
      } else {
        where.OR = [
          { teamId: { in: teamIds } },
          { ownerId: userId }
        ];
      }

      if (teamId && teamIds.includes(teamId as string)) {
        where.teamId = teamId as string;
      }
    }

    // 3. MANAGER (M): melihat semua card P (Leader) dan T (Team) di departemen yang dikelola
    else if (role === 'MANAGER') {
      const managedDepts = await prisma.department.findMany({ where: { managerId: userId }, select: { value: true } });
      const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { department: true, teamId: true } });
      
      const deptValues = new Set<string>(managedDepts.map(d => d.value));
      if (dbUser?.department) deptValues.add(dbUser.department);

      const deptTeams = await prisma.team.findMany({
        where: {
          OR: [
            { department: { in: Array.from(deptValues) } },
            { managerId: userId }
          ]
        },
        select: { id: true }
      });
      
      const teamIdSet = new Set<string>(deptTeams.map(t => t.id));
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

    const initiatives = await prisma.initiative.findMany({
      where,
      include: {
        keyResult: { select: { id: true, title: true, bscPerspective: true } },
        team: { select: { id: true, name: true, department: true } },
        owner: { select: { id: true, name: true, email: true, position: true } },
        tasks: {
          include: {
            assignments: { include: { user: { select: { id: true, name: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(initiatives);
  } catch (error) {
    console.error('Get initiatives error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function createInitiative(req: AuthRequest, res: Response) {
  try {
    let { keyResultId, teamId, ownerId, title, description, targetValue, achievedValue, unit, kanbanStatus, weight, startDate, dueDate, sprintMonth } = req.body;
    const { role, id: userId } = req.user!;

    if (!keyResultId || !title) {
      return res.status(400).json({ message: 'keyResultId dan title wajib diisi' });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: userId } });

    // TEAM (T): Membuat inisiatif untuk dirinya sendiri
    if (role === 'TEAM') {
      ownerId = userId;
      if (!teamId && dbUser?.teamId) {
        teamId = dbUser.teamId;
      }
    }

    // LEADER (P): Jika teamId belum ditentukan, pakai tim yang dipimpin
    if (role === 'LEADER' && !teamId) {
      const leaderTeamIds = await getLeaderTeamIds(userId);
      teamId = leaderTeamIds[0] || dbUser?.teamId;
    }

    // LEADER: Validasi bahwa teamId yang dipilih adalah tim yang dipimpin/dipunyai Leader
    if (role === 'LEADER' && teamId) {
      const leaderTeamIds = await getLeaderTeamIds(userId);
      if (!leaderTeamIds.includes(teamId)) {
        return res.status(403).json({
          message: 'Anda hanya bisa membuat inisiatif untuk tim yang Anda pimpin'
        });
      }
    }

    if (!teamId) {
      // Cari tim pertama yang tersedia
      const firstTeam = await prisma.team.findFirst();
      if (!firstTeam) return res.status(400).json({ message: 'Belum ada tim terdaftar di sistem' });
      teamId = firstTeam.id;
    }

    const kr = await prisma.keyResult.findUnique({ where: { id: keyResultId } });
    if (!kr) return res.status(404).json({ message: 'KeyResult tidak ditemukan' });
    
    // Auto-heal kr.month if it is null/empty to allow initiative creation
    if (!kr.month) {
      const now = new Date();
      const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const krMonth = sprintMonth || defaultMonth;
      await prisma.keyResult.update({
        where: { id: keyResultId },
        data: { month: krMonth }
      });
      kr.month = krMonth;
    }

    const finalOwnerId = ownerId || (role === 'TEAM' ? userId : null);
    const parsedWeight = weight !== undefined && weight !== null && weight !== '' ? parseFloat(weight) : 1.0;

    if (isNaN(parsedWeight) || parsedWeight <= 0 || parsedWeight > WEIGHT_BUDGET_MAX) {
      return res.status(400).json({ message: `Bobot inisiatif harus berupa angka lebih dari 0 dan maksimal ${WEIGHT_BUDGET_MAX}%` });
    }

    if (finalOwnerId && sprintMonth) {
      const used = await getUsedWeight(finalOwnerId, sprintMonth);
      const total = used + parsedWeight;
      if (total > WEIGHT_BUDGET_MAX + WEIGHT_EPSILON) {
        return res.status(400).json({
          message: `Total bobot inisiatif pegawai ini pada sprint ${sprintMonth} akan menjadi ${total.toFixed(1)}%, melebihi batas ${WEIGHT_BUDGET_MAX}%. Sisa bobot tersedia: ${Math.max(0, WEIGHT_BUDGET_MAX - used).toFixed(1)}%`
        });
      }
    }

    const initiative = await prisma.initiative.create({
      data: {
        keyResultId,
        teamId,
        ownerId: finalOwnerId,
        title,
        description: description || null,
        targetValue: targetValue ? parseFloat(targetValue) : 0,
        achievedValue: achievedValue !== undefined && achievedValue !== null && achievedValue !== '' ? parseFloat(achievedValue) : null,
        unit: unit || null,
        status: 'ON_TRACK',
        kanbanStatus: kanbanStatus || 'TODO',
        weight: parsedWeight,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        sprintMonth: sprintMonth || null,
      },
      include: {
        team: true,
        owner: { select: { id: true, name: true, email: true, position: true } },
      },
    });

    return res.status(201).json(initiative);
  } catch (error) {
    console.error('Create initiative error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// PUT /api/initiatives/:id — Update initiative
export async function updateInitiative(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, description, ownerId, targetValue, achievedValue, unit, status, kanbanStatus, weight, startDate, dueDate, sprintMonth } = req.body;
    const { role, id: userId } = req.user!;

    const existing = await prisma.initiative.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Initiative tidak ditemukan' });

    // TEAM hanya bisa edit inisiatif miliknya sendiri
    if (role === 'TEAM' && existing.ownerId !== userId) {
      return res.status(403).json({ message: 'Anda hanya bisa mengedit inisiatif milik sendiri' });
    }

    const effectiveOwnerId = role === 'TEAM'
      ? existing.ownerId
      : (ownerId !== undefined ? (ownerId || null) : existing.ownerId);
    const effectiveSprintMonth = sprintMonth !== undefined ? (sprintMonth || null) : existing.sprintMonth;
    const effectiveWeight = weight !== undefined ? parseFloat(weight) : existing.weight;

    if (weight !== undefined && (isNaN(effectiveWeight) || effectiveWeight <= 0 || effectiveWeight > WEIGHT_BUDGET_MAX)) {
      return res.status(400).json({ message: `Bobot inisiatif harus berupa angka lebih dari 0 dan maksimal ${WEIGHT_BUDGET_MAX}%` });
    }

    if (effectiveOwnerId && effectiveSprintMonth) {
      const used = await getUsedWeight(effectiveOwnerId, effectiveSprintMonth, id);
      const total = used + effectiveWeight;
      if (total > WEIGHT_BUDGET_MAX + WEIGHT_EPSILON) {
        return res.status(400).json({
          message: `Total bobot inisiatif pegawai ini pada sprint ${effectiveSprintMonth} akan menjadi ${total.toFixed(1)}%, melebihi batas ${WEIGHT_BUDGET_MAX}%. Sisa bobot tersedia: ${Math.max(0, WEIGHT_BUDGET_MAX - used).toFixed(1)}%`
        });
      }
    }

    const updated = await prisma.initiative.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(ownerId !== undefined && role !== 'TEAM' && { ownerId: ownerId || null }),
        ...(targetValue !== undefined && { targetValue: parseFloat(targetValue) }),
        ...(achievedValue !== undefined && { achievedValue: achievedValue !== null && achievedValue !== '' ? parseFloat(achievedValue) : null }),
        ...(unit !== undefined && { unit }),
        ...(status !== undefined && { status }),
        ...(kanbanStatus !== undefined && { kanbanStatus }),
        ...(weight !== undefined && { weight: parseFloat(weight) }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(sprintMonth !== undefined && { sprintMonth: sprintMonth || null }),
      },
      include: {
        team: true,
        owner: { select: { id: true, name: true, email: true, position: true } },
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Update initiative error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// PATCH /api/initiatives/:id/kanban-status — Update Kanban column
export async function updateInitiativeKanbanStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { kanbanStatus, achievedValue } = req.body;
    const { role, id: userId } = req.user!;

    if (!kanbanStatus || !['TODO', 'IN_PROGRESS', 'DONE', 'DROP'].includes(kanbanStatus)) {
      return res.status(400).json({ message: "kanbanStatus harus 'TODO', 'IN_PROGRESS', 'DONE', atau 'DROP'" });
    }

    const existing = await prisma.initiative.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Initiative tidak ditemukan' });

    // TEAM (T) hanya bisa memindahkan card miliknya sendiri
    if (role === 'TEAM' && existing.ownerId !== userId) {
      return res.status(403).json({ message: 'Anda hanya bisa memindahkan inisiatif milik Anda sendiri' });
    }

    const updated = await prisma.initiative.update({
      where: { id },
      data: {
        kanbanStatus,
        ...(achievedValue !== undefined && { achievedValue: achievedValue !== null && achievedValue !== '' ? parseFloat(achievedValue) : null }),
      },
      include: {
        keyResult: { select: { id: true, title: true, bscPerspective: true } },
        team: { select: { id: true, name: true, department: true } },
        owner: { select: { id: true, name: true, email: true, position: true } },
      }
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Update initiative kanban status error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// DELETE /api/initiatives/:id — Admin delete initiative (cascade hapus Task & InitiativeUpdate)
export async function deleteInitiative(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { role } = req.user!;

    if (role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: Hanya Admin yang dapat menghapus inisiatif' });
    }

    const existing = await prisma.initiative.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Initiative tidak ditemukan' });

    // Hapus InitiativeUpdate (riwayat progress inisiatif)
    await prisma.initiativeUpdate.deleteMany({ where: { initiativeId: id } });

    // Hapus TaskUpdate & TaskAssignment dari semua Task child
    const tasks = await prisma.task.findMany({ where: { initiativeId: id }, select: { id: true } });
    const taskIds = tasks.map(k => k.id);
    await prisma.taskUpdate.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.taskAssignment.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.task.deleteMany({ where: { initiativeId: id } });
    await prisma.initiative.delete({ where: { id } });

    // Recalculate parent KeyResult progress jika ada
    if (existing.keyResultId) {
      const remainingInitiatives = await prisma.initiative.findMany({
        where: { keyResultId: existing.keyResultId }
      });
      let avgProgress = 0;
      if (remainingInitiatives.length > 0) {
        const totalProgress = remainingInitiatives.reduce((acc, ini) => {
          const p = ini.targetValue > 0 ? Math.min(100, (ini.currentValue / ini.targetValue) * 100) : 0;
          return acc + (p * (ini.weight || 1.0));
        }, 0);
        const totalWeight = remainingInitiatives.reduce((acc, ini) => acc + (ini.weight || 1.0), 0);
        avgProgress = totalWeight > 0 ? totalProgress / totalWeight : 0;
      }
      const kr = await prisma.keyResult.findUnique({ where: { id: existing.keyResultId } });
      if (kr) {
        const newKrValue = (avgProgress / 100) * kr.targetValue;
        let krStatus = 'ON_TRACK';
        if (avgProgress < 50) krStatus = 'OFF_TRACK';
        else if (avgProgress < 75) krStatus = 'AT_RISK';
        
        await prisma.keyResult.update({
          where: { id: existing.keyResultId },
          data: { currentValue: newKrValue, status: krStatus }
        });
      }
    }

    return res.status(200).json({ message: 'Initiative berhasil dihapus' });
  } catch (error) {
    console.error('Delete initiative error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/initiatives/my-work — Semua Task yang di-assign ke user
export async function getMyWork(req: AuthRequest, res: Response) {
  try {
    const { id: userId, role } = req.user!;

    // TEAM & LEADER lihat full history; MANAGER & C_LEVEL hanya 1 terakhir
    const historyLimit = ['MANAGER', 'C_LEVEL'].includes(role) ? 1 : undefined;

    const taskAssignments = await prisma.taskAssignment.findMany({
      where: { userId },
      include: {
        task: {
          include: {
            initiative: {
              include: {
                keyResult: { include: { objective: true } },
                team: true
              }
            },
            updates: {
              orderBy: { createdAt: 'desc' },
              ...(historyLimit !== undefined ? { take: historyLimit } : {})
            }
          }
        }
      }
    });

    // Ambil inisiatif tim user yang dimiliki sendiri
    const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { teamId: true } });
    let myInitiatives: any[] = [];
    if (dbUser?.teamId) {
      myInitiatives = await prisma.initiative.findMany({
        where: { 
          teamId: dbUser.teamId,
          ownerId: userId
        },
        include: {
          keyResult: { include: { objective: true } },
          team: true,
          owner: { select: { id: true, name: true } },
          tasks: true,
          progressUpdates: {
            orderBy: { createdAt: 'desc' },
            ...(historyLimit !== undefined ? { take: historyLimit } : {})
          }
        }
      });
    }

    // Ambil data update/tugas dari anggota tim lainnya (selain dirinya)
    let teamMembersWork: any = { taskAssignments: [], initiatives: [] };
    let teamIds: string[] = [];
    if (dbUser?.teamId) {
      teamIds.push(dbUser.teamId);
    }
    if (role === 'LEADER') {
      const leadingTeams = await prisma.team.findMany({
        where: { leaderId: userId },
        select: { id: true }
      });
      teamIds.push(...leadingTeams.map(t => t.id));
    }
    const uniqueTeamIds = Array.from(new Set(teamIds));

    if (uniqueTeamIds.length > 0) {
      // Task yang diassign ke anggota tim lain
      const memberTaskAssignments = await prisma.taskAssignment.findMany({
        where: {
          task: {
            initiative: {
              teamId: { in: uniqueTeamIds }
            }
          },
          userId: { not: userId }
        },
        include: {
          user: { select: { id: true, name: true } },
          task: {
            include: {
              initiative: {
                include: {
                  keyResult: { include: { objective: true } },
                  team: true
                }
              },
              updates: { orderBy: { createdAt: 'desc' } }
            }
          }
        }
      });

      // Inisiatif tim yang dimiliki anggota lain (atau belum diassign)
      const memberInitiatives = await prisma.initiative.findMany({
        where: {
          teamId: { in: uniqueTeamIds },
          OR: [
            { ownerId: { not: userId } },
            { ownerId: null }
          ]
        },
        include: {
          keyResult: { include: { objective: true } },
          team: true,
          owner: { select: { id: true, name: true } },
          tasks: true,
          progressUpdates: { orderBy: { createdAt: 'desc' } }
        }
      });

      teamMembersWork = { taskAssignments: memberTaskAssignments, initiatives: memberInitiatives };
    }

    return res.status(200).json({ taskAssignments, myInitiatives, teamMembersWork });
  } catch (error) {
    console.error('Get my work error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/initiatives/my-team — Semua inisiatif untuk tim user
export async function getMyTeamInitiatives(req: AuthRequest, res: Response) {
  try {
    const { id: userId, role } = req.user!;

    let where: any = {};
    if (role !== 'ADMIN' && role !== 'C_LEVEL') {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { teamId: true, department: true }
      });

      let teamIds: string[] = [];
      if (dbUser?.teamId) teamIds.push(dbUser.teamId);

      if (dbUser?.department) {
        const deptTeams = await prisma.team.findMany({
          where: { department: dbUser.department },
          select: { id: true }
        });
        teamIds.push(...deptTeams.map(t => t.id));
      }

      // Jika LEADER atau MANAGER, ambil juga tim yang dipimpin
      const leadingTeams = await prisma.team.findMany({
        where: {
          OR: [
            { leaderId: userId },
            { managerId: userId }
          ]
        }, 
        select: { id: true }
      });
      teamIds.push(...leadingTeams.map(t => t.id));

      const uniqueTeamIds = Array.from(new Set(teamIds));
      if (uniqueTeamIds.length === 0) return res.status(200).json([]);

      where = { teamId: { in: uniqueTeamIds } };
    }

    const initiatives = await prisma.initiative.findMany({
      where,
      include: {
        keyResult: { include: { objective: true } },
        team: true,
        owner: { select: { id: true, name: true, email: true, position: true } },
        tasks: {
          include: {
            assignments: { include: { user: { select: { id: true, name: true } } } },
            updates: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(initiatives);
  } catch (error) {
    console.error('Get team initiatives error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ─── Task ───────────────────────────────────────────────────────────────────

// GET /api/initiatives/:initiativeId/tasks
export async function getTasksForInitiative(req: AuthRequest, res: Response) {
  try {
    const { initiativeId } = req.params;
    const { role, id: userId } = req.user!;

    // TEAM: pastikan initiative ini milik tim user
    if (role === 'TEAM') {
      const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { teamId: true } });
      const initiative = await prisma.initiative.findUnique({ where: { id: initiativeId } });
      if (!initiative || initiative.teamId !== dbUser?.teamId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    const tasks = await prisma.task.findMany({
      where: { initiativeId },
      include: {
        assignments: { include: { user: { select: { id: true, name: true, email: true } } } },
        updates: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    return res.status(200).json(tasks);
  } catch (error) {
    console.error('Get Tasks error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /api/initiatives/:initiativeId/tasks — Admin create Task
export async function createTask(req: AuthRequest, res: Response) {
  try {
    const { initiativeId } = req.params;
    const { title, targetValue, unit } = req.body;

    if (!title || targetValue === undefined) {
      return res.status(400).json({ message: 'title dan targetValue wajib diisi' });
    }

    const initiative = await prisma.initiative.findUnique({ where: { id: initiativeId } });
    if (!initiative) return res.status(404).json({ message: 'Initiative tidak ditemukan' });

    const task = await prisma.task.create({
      data: {
        initiativeId,
        title,
        targetValue: parseFloat(targetValue),
        unit: unit || null,
        status: 'ON_TRACK',
      },
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error('Create Task error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// PUT /api/tasks/:id — Admin update Task
export async function updateTask(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, targetValue, unit, status } = req.body;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Task tidak ditemukan' });

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(targetValue !== undefined && { targetValue: parseFloat(targetValue) }),
        ...(unit !== undefined && { unit }),
        ...(status !== undefined && { status }),
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Update Task error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// DELETE /api/tasks/:id — Admin delete Task
export async function deleteTask(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Task tidak ditemukan' });

    await prisma.taskUpdate.deleteMany({ where: { taskId: id } });
    await prisma.taskAssignment.deleteMany({ where: { taskId: id } });
    await prisma.task.delete({ where: { id } });

    return res.status(200).json({ message: 'Task berhasil dihapus' });
  } catch (error) {
    console.error('Delete Task error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /api/tasks/:id/assign — Admin / Leader assign user(s) ke Task
export async function assignUsersToTask(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { userIds } = req.body; // array of userId strings
    const { role, id: userId } = req.user!;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds harus berupa array dan tidak boleh kosong' });
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ message: 'Task tidak ditemukan' });

    // LEADER: validasi Task milik tim yang dipimpin & userIds adalah anggota tim
    if (role === 'LEADER') {
      const initiative = await prisma.initiative.findUnique({
        where: { id: task.initiativeId }
      });
      if (!initiative) return res.status(404).json({ message: 'Initiative tidak ditemukan' });

      const leaderTeamIds = await getLeaderTeamIds(userId);

      if (!leaderTeamIds.includes(initiative.teamId)) {
        return res.status(403).json({
          message: 'Anda hanya bisa assign member untuk Task di tim yang Anda pimpin'
        });
      }

      // Validasi semua userIds adalah anggota tim Leader
      const validMembers = await prisma.user.findMany({
        where: { id: { in: userIds }, teamId: { in: leaderTeamIds } },
        select: { id: true }
      });
      const invalidIds = userIds.filter((uid: string) =>
        !validMembers.map(m => m.id).includes(uid)
      );
      if (invalidIds.length > 0) {
        return res.status(403).json({
          message: 'Beberapa user bukan anggota tim Anda dan tidak bisa di-assign'
        });
      }
    }

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

    return res.status(200).json({ assigned: results.length, message: 'Assignment berhasil' });
  } catch (error) {
    console.error('Assign users to Task error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


// ─── HELPER: Cascade Task value update ke Initiative → KR ──────────────────
export async function cascadeTaskValueUpdate(taskId: string, initiativeId: string): Promise<void> {
  // 1. Recalculate Initiative.currentValue dari weighted average Task progress
  const allTasks = await prisma.task.findMany({ where: { initiativeId } });
  const initiative = await prisma.initiative.findUnique({ where: { id: initiativeId } });

  if (initiative && allTasks.length > 0 && initiative.targetValue > 0) {
    const totalTaskWeight = allTasks.reduce((s, t) => s + (t.weight || 1), 0);
    const weightedTaskPercent = allTasks.reduce((sum, t) => {
      const pct = t.targetValue > 0 ? t.currentValue / t.targetValue : 0;
      return sum + pct * (t.weight || 1);
    }, 0) / (totalTaskWeight || 1);
    const newInitiativeValue = Math.round(weightedTaskPercent * initiative.targetValue * 100) / 100;

    await prisma.initiative.update({
      where: { id: initiative.id },
      data: { currentValue: newInitiativeValue },
    });

    // 2. Recalculate KR.currentValue dari weighted average Initiative progress
    const allInitiatives = await prisma.initiative.findMany({
      where: { keyResultId: initiative.keyResultId },
      include: { tasks: true },
    });
    const kr = await prisma.keyResult.findUnique({ where: { id: initiative.keyResultId } });

    if (kr && allInitiatives.length > 0 && kr.targetValue > 0) {
      const totalWeight = allInitiatives.reduce((s, i) => s + (i.weight || 1), 0);
      const weightedAvgPercent = allInitiatives.reduce((sum, init) => {
        let initProgress = 0;
        if (init.tasks.length > 0) {
          const initTasksWeight = init.tasks.reduce((s, t) => s + (t.weight || 1), 0);
          initProgress = init.tasks.reduce((s, k) => {
            return s + (k.targetValue > 0 ? k.currentValue / k.targetValue : 0) * (k.weight || 1);
          }, 0) / (initTasksWeight || 1);
        } else if (init.targetValue > 0) {
          initProgress = init.currentValue / init.targetValue;
        }
        return sum + initProgress * (init.weight || 1);
      }, 0) / (totalWeight || 1);

      const newKrValue = Math.round(weightedAvgPercent * kr.targetValue * 100) / 100;

      const krProgress = newKrValue / kr.targetValue;
      let newStatus = 'ON_TRACK';
      if (krProgress < 0.5) newStatus = 'OFF_TRACK';
      else if (krProgress < 0.8) newStatus = 'AT_RISK';

      const updatedKr = await prisma.keyResult.update({
        where: { id: kr.id },
        data: { currentValue: newKrValue, status: newStatus },
      });

      // 3. Cascade to AnnualKeyResult
      if (updatedKr.annualKeyResultId) {
        await cascadeMonthlyKrToAnnual(updatedKr.annualKeyResultId);
      }
    }
  }
}

// POST /api/tasks/:id/updates — Submit progress update (semua role yang di-assign ke Task)
// LEADER / MANAGER / ADMIN → auto-approve & langsung cascade
// TEAM → PENDING_APPROVAL, menunggu persetujuan
export async function submitTaskUpdate(req: AuthRequest, res: Response) {
  try {
    const { id: taskId } = req.params;
    const { newValue, note } = req.body;
    const { id: userId, role } = req.user!;

    if (newValue === undefined) {
      return res.status(400).json({ message: 'newValue wajib diisi' });
    }

    // Pastikan user ini memang di-assign ke Task ini
    const assignment = await prisma.taskAssignment.findUnique({
      where: { taskId_userId: { taskId, userId } },
    });
    if (!assignment) {
      return res.status(403).json({ message: 'Kamu tidak di-assign ke Task ini' });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { initiative: true },
    });
    if (!task) return res.status(404).json({ message: 'Task tidak ditemukan' });

    // LEADER, MANAGER, ADMIN → auto-approve (tidak perlu menunggu persetujuan)
    const isAutoApprove = ['LEADER', 'MANAGER', 'ADMIN'].includes(role);
    const updateStatus = isAutoApprove ? 'APPROVED' : 'PENDING_APPROVAL';

    const update = await prisma.taskUpdate.create({
      data: {
        taskId,
        oldValue: task.currentValue,
        newValue: parseFloat(newValue),
        note: note || null,
        submittedBy: userId,
        status: updateStatus,
        ...(isAutoApprove ? { reviewedBy: userId, reviewedAt: new Date() } : {}),
      },
    });

    if (isAutoApprove) {
      // Langsung update currentValue Task dan cascade ke Initiative & KR
      await prisma.task.update({
        where: { id: taskId },
        data: { currentValue: parseFloat(newValue) },
      });
      await cascadeTaskValueUpdate(taskId, task.initiativeId);
    }

    return res.status(201).json({
      message: isAutoApprove
        ? 'Update berhasil disimpan dan langsung diterapkan'
        : 'Update berhasil dikirim, menunggu persetujuan',
      update,
    });
  } catch (error) {
    console.error('Submit Task update error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/tasks/:id/updates — Riwayat update Task
export async function getTaskUpdates(req: AuthRequest, res: Response) {
  try {
    const { id: taskId } = req.params;

    const updates = await prisma.taskUpdate.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(updates);
  } catch (error) {
    console.error('Get Task updates error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


// PATCH /api/task-updates/:updateId/approve — Manager / Leader approve
export async function approveTaskUpdate(req: AuthRequest, res: Response) {
  try {
    const { updateId } = req.params;
    const { id: managerId, role } = req.user!;

    const taskUpdate = await prisma.taskUpdate.findUnique({
      where: { id: updateId },
      include: { task: { include: { initiative: true } } },
    });
    if (!taskUpdate) return res.status(404).json({ message: 'Update tidak ditemukan' });
    if (taskUpdate.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ message: 'Update ini sudah diproses sebelumnya' });
    }

    if (role === 'LEADER') {
      const leaderTeamIds = await getLeaderTeamIds(managerId);
      if (!leaderTeamIds.includes(taskUpdate.task.initiative.teamId)) {
        return res.status(403).json({ message: 'Forbidden: Task update is from a different team' });
      }
    }

    // Update TaskUpdate status + update currentValue di Task
    const [approved] = await prisma.$transaction([
      prisma.taskUpdate.update({
        where: { id: updateId },
        data: { status: 'APPROVED', reviewedBy: managerId, reviewedAt: new Date() },
      }),
      prisma.task.update({
        where: { id: taskUpdate.taskId },
        data: { currentValue: taskUpdate.newValue },
      }),
    ]);

    // ═══ AUTO-CASCADE: Task → Initiative → KR ═══
    await cascadeTaskValueUpdate(taskUpdate.taskId, taskUpdate.task.initiativeId);

    return res.status(200).json({ message: 'Update disetujui', update: approved });
  } catch (error) {
    console.error('Approve Task update error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// PATCH /api/task-updates/:updateId/reject — Manager / Leader reject
export async function rejectTaskUpdate(req: AuthRequest, res: Response) {
  try {
    const { updateId } = req.params;
    const { reviewNote } = req.body;
    const { id: managerId, role } = req.user!;

    if (!reviewNote || reviewNote.trim() === '') {
      return res.status(400).json({ message: 'reviewNote wajib diisi saat menolak update' });
    }

    const taskUpdate = await prisma.taskUpdate.findUnique({ 
      where: { id: updateId },
      include: { task: { include: { initiative: true } } },
    });
    if (!taskUpdate) return res.status(404).json({ message: 'Update tidak ditemukan' });
    if (taskUpdate.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ message: 'Update ini sudah diproses sebelumnya' });
    }

    if (role === 'LEADER') {
      const leaderTeams = await prisma.team.findMany({ where: { leaderId: managerId } });
      const teamIds = leaderTeams.map(t => t.id);
      if (!teamIds.includes(taskUpdate.task.initiative.teamId)) {
        return res.status(403).json({ message: 'Forbidden: Task update is from a different team' });
      }
    }

    const rejected = await prisma.taskUpdate.update({
      where: { id: updateId },
      data: { status: 'REJECTED', reviewedBy: managerId, reviewNote, reviewedAt: new Date() },
    });

    return res.status(200).json({ message: 'Update ditolak', update: rejected });
  } catch (error) {
    console.error('Reject Task update error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/task-updates/pending — Get all pending Task updates for Manager
export async function getPendingTaskUpdates(req: AuthRequest, res: Response) {
  try {
    const updates = await prisma.taskUpdate.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: {
        task: {
          include: {
            initiative: {
              include: { team: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(updates);
  } catch (error) {
    console.error('Get pending Task updates error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /api/initiatives/:id/progress-updates
export async function submitInitiativeUpdate(req: AuthRequest, res: Response) {
  try {
    const { id: initiativeId } = req.params;
    const { newValue, note, kanbanStatus } = req.body;
    const { id: userId } = req.user!;

    if (newValue === undefined) {
      return res.status(400).json({ message: 'newValue wajib diisi' });
    }

    const initiative = await prisma.initiative.findUnique({ where: { id: initiativeId } });
    if (!initiative) return res.status(404).json({ message: 'Initiative tidak ditemukan' });

    // Validasi apakah user tergolong dalam tim inisiatif tersebut
    const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { teamId: true } });
    if (dbUser?.teamId !== initiative.teamId) {
      return res.status(403).json({ message: 'Anda bukan anggota tim inisiatif ini' });
    }

    const [update] = await prisma.$transaction([
      prisma.initiativeUpdate.create({
        data: {
          initiativeId,
          oldValue: initiative.currentValue,
          newValue: parseFloat(newValue),
          note: note || null,
          kanbanStatus: kanbanStatus || null,
          submittedBy: userId,
        }
      }),
      prisma.initiative.update({
        where: { id: initiativeId },
        data: {
          currentValue: parseFloat(newValue),
          ...(kanbanStatus ? { kanbanStatus } : {})
        }
      })
    ]);

    return res.status(201).json({ message: 'Progress berhasil dicatat', update });
  } catch (error) {
    console.error('Submit initiative update error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/initiatives/:id/progress-updates
export async function getInitiativeProgressUpdates(req: AuthRequest, res: Response) {
  try {
    const { id: initiativeId } = req.params;
    const updates = await prisma.initiativeUpdate.findMany({
      where: { initiativeId },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(updates);
  } catch (error) {
    console.error('Get initiative progress updates error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


