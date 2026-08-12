import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// ─── INITIATIVE ────────────────────────────────────────────────────────────

// GET /api/initiatives?krId=xxx&kanbanStatus=xxx&teamId=xxx&ownerId=xxx — list initiatives
export async function getInitiatives(req: AuthRequest, res: Response) {
  try {
    const { krId, kanbanStatus, teamId, ownerId } = req.query;
    const { role, id: userId } = req.user!;

    let where: any = {};
    if (krId) where.keyResultId = krId as string;
    if (kanbanStatus) where.kanbanStatus = kanbanStatus as string;

    // 1. TEAM (T): HANYA melihat card inisiatif miliknya sendiri
    if (role === 'TEAM') {
      where.ownerId = userId;
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
    let { keyResultId, teamId, ownerId, title, description, targetValue, unit, kanbanStatus } = req.body;
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
      const leaderTeam = await prisma.team.findFirst({ where: { leaderId: userId } });
      teamId = leaderTeam?.id || dbUser?.teamId;
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
        unit: unit || null,
        status: 'ON_TRACK',
        kanbanStatus: kanbanStatus || 'TODO',
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
    const { title, description, ownerId, targetValue, unit, status, kanbanStatus } = req.body;
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
        ...(unit !== undefined && { unit }),
        ...(status !== undefined && { status }),
        ...(kanbanStatus !== undefined && { kanbanStatus }),
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
    const { kanbanStatus } = req.body;
    const { role, id: userId } = req.user!;

    if (!kanbanStatus || !['TODO', 'IN_PROGRESS', 'DONE'].includes(kanbanStatus)) {
      return res.status(400).json({ message: "kanbanStatus harus 'TODO', 'IN_PROGRESS', atau 'DONE'" });
    }

    const existing = await prisma.initiative.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Initiative tidak ditemukan' });

    // TEAM (T) hanya bisa memindahkan card miliknya sendiri
    if (role === 'TEAM' && existing.ownerId !== userId) {
      return res.status(403).json({ message: 'Anda hanya bisa memindahkan inisiatif milik Anda sendiri' });
    }

    const updated = await prisma.initiative.update({
      where: { id },
      data: { kanbanStatus },
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

// POST /api/kpis/:id/assign — Admin assign user(s) ke KPI
export async function assignUsersToKpi(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { userIds } = req.body; // array of userId strings

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds harus berupa array dan tidak boleh kosong' });
    }

    const kpi = await prisma.kpi.findUnique({ where: { id } });
    if (!kpi) return res.status(404).json({ message: 'KPI tidak ditemukan' });

    // Upsert assignments
    const results = [];
    for (const userId of userIds) {
      const existing = await prisma.kpiAssignment.findUnique({
        where: { kpiId_userId: { kpiId: id, userId } },
      });
      if (!existing) {
        const assignment = await prisma.kpiAssignment.create({
          data: { kpiId: id, userId },
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
      const leaderTeams = await prisma.team.findMany({ where: { leaderId: managerId } });
      const teamIds = leaderTeams.map(t => t.id);
      if (!teamIds.includes(kpiUpdate.kpi.initiative.teamId)) {
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
