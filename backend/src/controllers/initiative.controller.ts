import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// ─── INITIATIVE ────────────────────────────────────────────────────────────

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
      // MANAGER melihat dirinya + Leader & Team di departemennya
      const deptUsers = await prisma.user.findMany({
        where: {
          OR: [
            { id: userId },
            ...(dbUser?.department ? [{ department: dbUser.department }] : [])
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

    // 2. Ambil data KPI assignment untuk user-user yang diizinkan
    const usersWithKpis = await prisma.user.findMany({
      where: { id: { in: visibleUserIds } },
      select: {
        id: true,
        name: true,
        role: true,
        position: true,
        department: true,
        team: { select: { id: true, name: true } },
        kpiAssignments: {
          include: {
            kpi: {
              include: {
                initiative: { select: { id: true, title: true } }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // 3. Hitung kumulatif progress 100% per member
    const result = usersWithKpis.map(user => {
      const kpis = user.kpiAssignments.map(a => a.kpi);
      let totalPct = 0;
      const kpiDetails = kpis.map(kpi => {
        const pct = kpi.targetValue > 0
          ? Math.min(100, Math.max(0, (kpi.currentValue / kpi.targetValue) * 100))
          : 0;
        totalPct += pct;
        return {
          id: kpi.id,
          title: kpi.title,
          currentValue: kpi.currentValue,
          targetValue: kpi.targetValue,
          unit: kpi.unit,
          progressPct: Math.round(pct * 10) / 10,
          initiativeTitle: kpi.initiative?.title
        };
      });

      const overallProgress = kpis.length > 0
        ? Math.round((totalPct / kpis.length) * 10) / 10
        : 0;

      return {
        userId: user.id,
        userName: user.name,
        role: user.role,
        position: user.position,
        department: user.department,
        teamName: user.team?.name,
        totalAssignedTasks: kpis.length,
        achievementPct: overallProgress, // Out of 100%
        kpis: kpiDetails
      };
    });

    return res.status(200).json({
      role,
      userCount: result.length,
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
            objective: { select: { id: true, title: true, quarter: true } }
          }
        },
        team: { select: { id: true, name: true, department: true } },
        owner: { select: { id: true, name: true, position: true } },
        kpis: {
          include: {
            assignments: {
              include: { user: { select: { id: true, name: true } } }
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Kalkulasi progress per Initiative dari KPI
    const enriched = initiatives.map(init => {
      const kpiProgress = init.kpis.map(kpi => {
        const pct = kpi.targetValue > 0
          ? Math.min(100, Math.max(0, (kpi.currentValue / kpi.targetValue) * 100))
          : 0;
        return { ...kpi, progressPercent: Math.round(pct * 10) / 10 };
      });

      const avgProgress = kpiProgress.length > 0
        ? kpiProgress.reduce((sum, k) => sum + k.progressPercent, 0) / kpiProgress.length
        : (init.targetValue > 0
            ? Math.min(100, (init.currentValue / init.targetValue) * 100)
            : 0);

      const completedKpis = kpiProgress.filter(k => k.progressPercent >= 100).length;

      return {
        ...init,
        kpis: kpiProgress,
        calculatedProgress: Math.round(avgProgress * 10) / 10,
        completedKpis,
        totalKpis: kpiProgress.length,
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
        totalKpis: enriched.reduce((s, i) => s + i.totalKpis, 0),
        completedKpis: enriched.reduce((s, i) => s + i.completedKpis, 0),
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
        kpis: {
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

    const initiative = await prisma.initiative.create({
      data: {
        keyResultId,
        teamId,
        ownerId: ownerId || (role === 'TEAM' ? userId : null),
        title,
        description: description || null,
        targetValue: targetValue ? parseFloat(targetValue) : 0,
        achievedValue: achievedValue !== undefined && achievedValue !== null && achievedValue !== '' ? parseFloat(achievedValue) : null,
        unit: unit || null,
        status: 'ON_TRACK',
        kanbanStatus: kanbanStatus || 'TODO',
        weight: weight !== undefined ? parseFloat(weight) : 1.0,
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

// DELETE /api/initiatives/:id — Admin delete initiative (cascade hapus KPI)
export async function deleteInitiative(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { role } = req.user!;

    if (role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: Hanya Admin yang dapat menghapus inisiatif' });
    }

    const existing = await prisma.initiative.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Initiative tidak ditemukan' });

    // Hapus KpiUpdate & KpiAssignment dari semua KPI child
    const kpis = await prisma.kpi.findMany({ where: { initiativeId: id }, select: { id: true } });
    const kpiIds = kpis.map(k => k.id);
    await prisma.kpiUpdate.deleteMany({ where: { kpiId: { in: kpiIds } } });
    await prisma.kpiAssignment.deleteMany({ where: { kpiId: { in: kpiIds } } });
    await prisma.kpi.deleteMany({ where: { initiativeId: id } });
    await prisma.initiative.delete({ where: { id } });

    return res.status(200).json({ message: 'Initiative berhasil dihapus' });
  } catch (error) {
    console.error('Delete initiative error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/initiatives/my-work — Semua KPI yang di-assign ke user
export async function getMyWork(req: AuthRequest, res: Response) {
  try {
    const { id: userId } = req.user!;
    const kpiAssignments = await prisma.kpiAssignment.findMany({
      where: { userId },
      include: {
        kpi: {
          include: {
            initiative: {
              include: {
                keyResult: { include: { objective: true } },
                team: true
              }
            },
            updates: { orderBy: { createdAt: 'desc' }, take: 3 }
          }
        }
      }
    });
    return res.status(200).json(kpiAssignments);
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
        kpis: {
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

// ─── KPI ───────────────────────────────────────────────────────────────────

// GET /api/initiatives/:initiativeId/kpis
export async function getKpisForInitiative(req: AuthRequest, res: Response) {
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

    const kpis = await prisma.kpi.findMany({
      where: { initiativeId },
      include: {
        assignments: { include: { user: { select: { id: true, name: true, email: true } } } },
        updates: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    return res.status(200).json(kpis);
  } catch (error) {
    console.error('Get KPIs error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /api/initiatives/:initiativeId/kpis — Admin create KPI
export async function createKpi(req: AuthRequest, res: Response) {
  try {
    const { initiativeId } = req.params;
    const { title, targetValue, unit } = req.body;

    if (!title || targetValue === undefined) {
      return res.status(400).json({ message: 'title dan targetValue wajib diisi' });
    }

    const initiative = await prisma.initiative.findUnique({ where: { id: initiativeId } });
    if (!initiative) return res.status(404).json({ message: 'Initiative tidak ditemukan' });

    const kpi = await prisma.kpi.create({
      data: {
        initiativeId,
        title,
        targetValue: parseFloat(targetValue),
        unit: unit || null,
        status: 'ON_TRACK',
      },
    });

    return res.status(201).json(kpi);
  } catch (error) {
    console.error('Create KPI error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// PUT /api/kpis/:id — Admin update KPI
export async function updateKpi(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, targetValue, unit, status } = req.body;

    const existing = await prisma.kpi.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'KPI tidak ditemukan' });

    const updated = await prisma.kpi.update({
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
    console.error('Update KPI error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// DELETE /api/kpis/:id — Admin delete KPI
export async function deleteKpi(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.kpi.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'KPI tidak ditemukan' });

    await prisma.kpiUpdate.deleteMany({ where: { kpiId: id } });
    await prisma.kpiAssignment.deleteMany({ where: { kpiId: id } });
    await prisma.kpi.delete({ where: { id } });

    return res.status(200).json({ message: 'KPI berhasil dihapus' });
  } catch (error) {
    console.error('Delete KPI error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /api/kpis/:id/assign — Admin / Leader assign user(s) ke KPI
export async function assignUsersToKpi(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { userIds } = req.body; // array of userId strings
    const { role, id: userId } = req.user!;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds harus berupa array dan tidak boleh kosong' });
    }

    const kpi = await prisma.kpi.findUnique({ where: { id } });
    if (!kpi) return res.status(404).json({ message: 'KPI tidak ditemukan' });

    // LEADER: validasi KPI milik tim yang dipimpin & userIds adalah anggota tim
    if (role === 'LEADER') {
      const initiative = await prisma.initiative.findUnique({
        where: { id: kpi.initiativeId }
      });
      if (!initiative) return res.status(404).json({ message: 'Initiative tidak ditemukan' });

      const leaderTeamIds = await getLeaderTeamIds(userId);

      if (!leaderTeamIds.includes(initiative.teamId)) {
        return res.status(403).json({
          message: 'Anda hanya bisa assign member untuk KPI di tim yang Anda pimpin'
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
      const existing = await prisma.kpiAssignment.findUnique({
        where: { kpiId_userId: { kpiId: id, userId: uId } },
      });
      if (!existing) {
        const assignment = await prisma.kpiAssignment.create({
          data: { kpiId: id, userId: uId },
        });
        results.push(assignment);
      }
    }

    return res.status(200).json({ assigned: results.length, message: 'Assignment berhasil' });
  } catch (error) {
    console.error('Assign users to KPI error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ─── KPI UPDATE (Submit / Approve / Reject) ────────────────────────────────

// POST /api/kpis/:id/updates — TEAM member submit progress update
export async function submitKpiUpdate(req: AuthRequest, res: Response) {
  try {
    const { id: kpiId } = req.params;
    const { newValue, note } = req.body;
    const { id: userId } = req.user!;

    if (newValue === undefined) {
      return res.status(400).json({ message: 'newValue wajib diisi' });
    }

    // Pastikan user ini memang di-assign ke KPI ini
    const assignment = await prisma.kpiAssignment.findUnique({
      where: { kpiId_userId: { kpiId, userId } },
    });
    if (!assignment) {
      return res.status(403).json({ message: 'Kamu tidak di-assign ke KPI ini' });
    }

    const kpi = await prisma.kpi.findUnique({ where: { id: kpiId } });
    if (!kpi) return res.status(404).json({ message: 'KPI tidak ditemukan' });

    const update = await prisma.kpiUpdate.create({
      data: {
        kpiId,
        oldValue: kpi.currentValue,
        newValue: parseFloat(newValue),
        note: note || null,
        submittedBy: userId,
        status: 'PENDING_APPROVAL',
      },
    });

    return res.status(201).json({ message: 'Update berhasil dikirim, menunggu persetujuan Manager', update });
  } catch (error) {
    console.error('Submit KPI update error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/kpis/:id/updates — Riwayat update KPI
export async function getKpiUpdates(req: AuthRequest, res: Response) {
  try {
    const { id: kpiId } = req.params;

    const updates = await prisma.kpiUpdate.findMany({
      where: { kpiId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(updates);
  } catch (error) {
    console.error('Get KPI updates error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// PATCH /api/kpi-updates/:updateId/approve — Manager / Leader approve
export async function approveKpiUpdate(req: AuthRequest, res: Response) {
  try {
    const { updateId } = req.params;
    const { id: managerId, role } = req.user!;

    const kpiUpdate = await prisma.kpiUpdate.findUnique({
      where: { id: updateId },
      include: { kpi: { include: { initiative: true } } },
    });
    if (!kpiUpdate) return res.status(404).json({ message: 'Update tidak ditemukan' });
    if (kpiUpdate.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ message: 'Update ini sudah diproses sebelumnya' });
    }

    if (role === 'LEADER') {
      const leaderTeamIds = await getLeaderTeamIds(managerId);
      if (!leaderTeamIds.includes(kpiUpdate.kpi.initiative.teamId)) {
        return res.status(403).json({ message: 'Forbidden: KPI update is from a different team' });
      }
    }

    // Update KpiUpdate status + update currentValue di Kpi
    const [approved] = await prisma.$transaction([
      prisma.kpiUpdate.update({
        where: { id: updateId },
        data: { status: 'APPROVED', reviewedBy: managerId, reviewedAt: new Date() },
      }),
      prisma.kpi.update({
        where: { id: kpiUpdate.kpiId },
        data: { currentValue: kpiUpdate.newValue },
      }),
    ]);

    // ═══ AUTO-CASCADE: KPI → Initiative → KR ═══

    // 1. Recalculate Initiative.currentValue dari rata-rata KPI progress
    const allKpis = await prisma.kpi.findMany({
      where: { initiativeId: kpiUpdate.kpi.initiativeId },
    });
    const initiative = await prisma.initiative.findUnique({
      where: { id: kpiUpdate.kpi.initiativeId }
    });

    if (initiative && allKpis.length > 0 && initiative.targetValue > 0) {
      const avgKpiPercent = allKpis.reduce((sum, k) => {
        return sum + (k.targetValue > 0 ? (k.currentValue / k.targetValue) : 0);
      }, 0) / allKpis.length;
      const newInitiativeValue = Math.round(avgKpiPercent * initiative.targetValue * 100) / 100;

      await prisma.initiative.update({
        where: { id: initiative.id },
        data: { currentValue: newInitiativeValue }
      });

      // 2. Recalculate KR.currentValue dari weighted average Initiative progress
      const allInitiatives = await prisma.initiative.findMany({
        where: { keyResultId: initiative.keyResultId },
        include: { kpis: true }
      });
      const kr = await prisma.keyResult.findUnique({
        where: { id: initiative.keyResultId }
      });

      if (kr && allInitiatives.length > 0 && kr.targetValue > 0) {
        const totalWeight = allInitiatives.reduce((s, i) => s + (i.weight || 1), 0);
        const weightedAvgPercent = allInitiatives.reduce((sum, init) => {
          // Hitung progress tiap initiative dari KPI-nya
          let initProgress = 0;
          if (init.kpis.length > 0) {
            initProgress = init.kpis.reduce((s, k) => {
              return s + (k.targetValue > 0 ? k.currentValue / k.targetValue : 0);
            }, 0) / init.kpis.length;
          } else if (init.targetValue > 0) {
            initProgress = init.currentValue / init.targetValue;
          }
          return sum + initProgress * (init.weight || 1);
        }, 0) / (totalWeight || 1);

        const newKrValue = Math.round(weightedAvgPercent * kr.targetValue * 100) / 100;

        // Auto-status berdasarkan threshold
        const krProgress = newKrValue / kr.targetValue;
        let newStatus = 'ON_TRACK';
        if (krProgress < 0.5) newStatus = 'OFF_TRACK';
        else if (krProgress < 0.8) newStatus = 'AT_RISK';

        await prisma.keyResult.update({
          where: { id: kr.id },
          data: { currentValue: newKrValue, status: newStatus }
        });
      }
    }

    return res.status(200).json({ message: 'Update disetujui', update: approved });
  } catch (error) {
    console.error('Approve KPI update error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// PATCH /api/kpi-updates/:updateId/reject — Manager / Leader reject
export async function rejectKpiUpdate(req: AuthRequest, res: Response) {
  try {
    const { updateId } = req.params;
    const { reviewNote } = req.body;
    const { id: managerId, role } = req.user!;

    if (!reviewNote || reviewNote.trim() === '') {
      return res.status(400).json({ message: 'reviewNote wajib diisi saat menolak update' });
    }

    const kpiUpdate = await prisma.kpiUpdate.findUnique({ 
      where: { id: updateId },
      include: { kpi: { include: { initiative: true } } },
    });
    if (!kpiUpdate) return res.status(404).json({ message: 'Update tidak ditemukan' });
    if (kpiUpdate.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ message: 'Update ini sudah diproses sebelumnya' });
    }

    if (role === 'LEADER') {
      const leaderTeams = await prisma.team.findMany({ where: { leaderId: managerId } });
      const teamIds = leaderTeams.map(t => t.id);
      if (!teamIds.includes(kpiUpdate.kpi.initiative.teamId)) {
        return res.status(403).json({ message: 'Forbidden: KPI update is from a different team' });
      }
    }

    const rejected = await prisma.kpiUpdate.update({
      where: { id: updateId },
      data: { status: 'REJECTED', reviewedBy: managerId, reviewNote, reviewedAt: new Date() },
    });

    return res.status(200).json({ message: 'Update ditolak', update: rejected });
  } catch (error) {
    console.error('Reject KPI update error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/kpi-updates/pending — Get all pending KPI updates for Manager
export async function getPendingKpiUpdates(req: AuthRequest, res: Response) {
  try {
    const updates = await prisma.kpiUpdate.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: {
        kpi: {
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
    console.error('Get pending KPI updates error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

