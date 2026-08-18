import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

const VALID_BSC_PERSPECTIVES = ['FINANCIAL', 'CUSTOMER', 'INTERNAL_PROCESS', 'LEARNING_GROWTH'];

export async function createKeyResult(req: AuthRequest, res: Response) {
  try {
    const { objectiveId, title, targetValue, currentValue, unit, bscPerspective } = req.body;

    if (!objectiveId || !title || targetValue === undefined || !bscPerspective) {
      return res.status(400).json({
        message: 'objectiveId, title, targetValue, and bscPerspective are required',
      });
    }

    if (targetValue <= 0) {
      return res.status(400).json({ message: 'Target value must be greater than 0' });
    }

    if (!VALID_BSC_PERSPECTIVES.includes(bscPerspective)) {
      return res.status(400).json({
        message: `bscPerspective must be one of: ${VALID_BSC_PERSPECTIVES.join(', ')}`,
      });
    }

    // Check if objective exists
    const objective = await prisma.objective.findUnique({
      where: { id: objectiveId },
    });
    if (!objective) {
      return res.status(404).json({ message: 'Objective not found' });
    }

    const newKR = await prisma.keyResult.create({
      data: {
        objectiveId,
        title,
        targetValue: parseFloat(targetValue),
        currentValue: currentValue !== undefined ? parseFloat(currentValue) : 0,
        unit: unit || '%',
        bscPerspective,
        status: 'ON_TRACK',
      },
    });

    return res.status(201).json(newKR);
  } catch (error) {
    console.error('Create key result error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function deleteKeyResult(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    // Check if KR exists
    const kr = await prisma.keyResult.findUnique({
      where: { id },
      include: { initiatives: { include: { kpis: true } } },
    });
    if (!kr) {
      return res.status(404).json({ message: 'Key Result not found' });
    }

    const initiativeIds = kr.initiatives.map((i) => i.id);
    const kpiIds = kr.initiatives.flatMap((i) => i.kpis.map((k) => k.id));

    // Cascade delete in transaction to prevent Foreign Key Violation (P2003)
    await prisma.$transaction([
      // 1. Delete KPI updates & KPI assignments
      prisma.kpiUpdate.deleteMany({
        where: { kpiId: { in: kpiIds } },
      }),
      prisma.kpiAssignment.deleteMany({
        where: { kpiId: { in: kpiIds } },
      }),
      // 2. Delete KPIs
      prisma.kpi.deleteMany({
        where: { id: { in: kpiIds } },
      }),
      // 3. Delete Initiatives
      prisma.initiative.deleteMany({
        where: { id: { in: initiativeIds } },
      }),
      // 4. Delete KR Assignments (RACI) & KR Departments & KR Updates
      prisma.krAssignment.deleteMany({
        where: { keyResultId: id },
      }),
      prisma.krDepartment.deleteMany({
        where: { keyResultId: id },
      }),
      prisma.krUpdate.deleteMany({
        where: { keyResultId: id },
      }),
      // 5. Delete Causal Links
      prisma.causalLink.deleteMany({
        where: {
          OR: [{ sourceKrId: id }, { targetKrId: id }],
        },
      }),
      // 6. Delete Key Result
      prisma.keyResult.delete({
        where: { id },
      }),
    ]);

    return res.status(200).json({ message: 'Key Result deleted successfully' });
  } catch (error) {
    console.error('Delete key result error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateKeyResultProgress(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { newValue, note } = req.body;

    if (newValue === undefined || newValue === null) {
      return res.status(400).json({ message: 'newValue is required' });
    }

    const valueNum = parseFloat(newValue);
    if (isNaN(valueNum)) {
      return res.status(400).json({ message: 'newValue must be a valid number' });
    }

    const kr = await prisma.keyResult.findUnique({
      where: { id },
    });

    if (!kr) {
      return res.status(404).json({ message: 'Key Result not found' });
    }

    const oldValue = kr.currentValue;
    const progress = valueNum / kr.targetValue;
    let newStatus = 'ON_TRACK';
    if (progress < 0.5) {
      newStatus = 'OFF_TRACK';
    } else if (progress < 0.8) {
      newStatus = 'AT_RISK';
    }

    const result = await prisma.$transaction([
      prisma.keyResult.update({
        where: { id },
        data: {
          currentValue: valueNum,
          status: newStatus,
        },
      }),
      prisma.krUpdate.create({
        data: {
          keyResultId: id,
          oldValue,
          newValue: valueNum,
          note: note || null,
          updatedBy: req.user?.name || req.user?.email || 'System Admin',
        },
      }),
    ]);

    return res.status(200).json({
      keyResult: result[0],
      updateLog: result[1],
    });
  } catch (error) {
    console.error('Update progress error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getKeyResultHistory(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const history = await prisma.krUpdate.findMany({
      where: { keyResultId: id },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return res.status(200).json(history);
  } catch (error) {
    console.error('Get history error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateKeyResult(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, targetValue, unit, bscPerspective } = req.body;

    if (!title || targetValue === undefined || !bscPerspective) {
      return res.status(400).json({
        message: 'title, targetValue, and bscPerspective are required',
      });
    }

    if (targetValue <= 0) {
      return res.status(400).json({ message: 'Target value must be greater than 0' });
    }

    if (!VALID_BSC_PERSPECTIVES.includes(bscPerspective)) {
      return res.status(400).json({
        message: `bscPerspective must be one of: ${VALID_BSC_PERSPECTIVES.join(', ')}`,
      });
    }

    // Check if KR exists
    const kr = await prisma.keyResult.findUnique({
      where: { id },
    });
    if (!kr) {
      return res.status(404).json({ message: 'Key Result not found' });
    }

    // Calculate new status based on current progress
    const progress = kr.currentValue / parseFloat(targetValue);
    let newStatus = 'ON_TRACK';
    if (progress < 0.5) {
      newStatus = 'OFF_TRACK';
    } else if (progress < 0.8) {
      newStatus = 'AT_RISK';
    }

    const updatedKR = await prisma.keyResult.update({
      where: { id },
      data: {
        title,
        targetValue: parseFloat(targetValue),
        unit: unit || '%',
        bscPerspective,
        status: newStatus,
      },
    });

    return res.status(200).json(updatedKR);
  } catch (error) {
    console.error('Update key result details error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /api/key-results/:id/assign
// Body: { assignments: [{userId, raciRole}][], departments: string[] } OR { userIds: string[] }
export async function assignUsersToKeyResult(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { assignments, departments } = req.body;

    // --- Backward compatibility: support lama { userIds: string[] } ---
    let normalizedAssignments: { userId: string; raciRole: string }[] = [];
    if (Array.isArray(req.body.userIds)) {
      normalizedAssignments = req.body.userIds.map((uid: string) => ({
        userId: uid,
        raciRole: 'RESPONSIBLE',
      }));
    } else if (Array.isArray(assignments)) {
      normalizedAssignments = assignments;
    } else {
      return res.status(400).json({ message: 'assignments harus berupa array' });
    }

    // Validasi KR ada
    const kr = await prisma.keyResult.findUnique({ where: { id } });
    if (!kr) return res.status(404).json({ message: 'Key Result not found' });

    // Jika ada assignments yang dipass (bukan array kosong)
    if (normalizedAssignments.length > 0) {
      // Validasi RACI: minimal 1 ACCOUNTABLE
      const accountables = normalizedAssignments.filter(a => a.raciRole === 'ACCOUNTABLE');
      if (accountables.length < 1) {
        return res.status(400).json({
          message: 'Setiap KR harus memiliki minimal 1 Accountable',
        });
      }

      // Validasi RACI: tepat 1 RESPONSIBLE
      const responsibles = normalizedAssignments.filter(a => a.raciRole === 'RESPONSIBLE');
      if (responsibles.length !== 1) {
        return res.status(400).json({
          message: 'Setiap KR harus memiliki tepat 1 Responsible',
        });
      }

      // Validasi user IDs
      const userIds = normalizedAssignments.map(a => a.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true },
      });
      if (users.length !== userIds.length) {
        return res.status(400).json({ message: 'Satu atau lebih user tidak ditemukan' });
      }
    }

    // Validasi departments
    const validDeptRecords = await prisma.department.findMany({ select: { value: true } });
    const validDepartments = validDeptRecords.map(d => d.value);
    if (departments && Array.isArray(departments)) {
      for (const dept of departments) {
        if (!validDepartments.includes(dept)) {
          return res.status(400).json({ message: `Department tidak valid: ${dept}` });
        }
      }
    }

    // Transaksi: replace assignments + departments
    await prisma.$transaction([
      prisma.krAssignment.deleteMany({ where: { keyResultId: id } }),
      ...(normalizedAssignments.length > 0
        ? [
            prisma.krAssignment.createMany({
              data: normalizedAssignments.map(a => ({
                keyResultId: id,
                userId: a.userId,
                raciRole: a.raciRole,
                assignedBy: req.user?.id || 'system',
              })),
            }),
          ]
        : []),
      prisma.krDepartment.deleteMany({ where: { keyResultId: id } }),
      ...(departments && Array.isArray(departments) && departments.length > 0
        ? [
            prisma.krDepartment.createMany({
              data: departments.map((dept: string) => ({
                keyResultId: id,
                department: dept,
              })),
            }),
          ]
        : []),
    ]);

    const updated = await prisma.keyResult.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true, email: true, department: true, role: true } },
          },
          orderBy: { raciRole: 'asc' },
        },
        departments: true,
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Assign users error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/key-results/:id/assignments
export async function getKeyResultAssignments(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const kr = await prisma.keyResult.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
                role: true,
              },
            },
          },
          orderBy: { assignedAt: 'asc' },
        },
        departments: true,
      },
    });

    if (!kr) {
      return res.status(404).json({ message: 'Key Result not found' });
    }

    return res.status(200).json({
      assignments: kr.assignments,
      departments: kr.departments,
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/key-results/my-assigned
export async function getMyAssignedKrs(req: AuthRequest, res: Response) {
  try {
    const { id: userId } = req.user!;
    
    const assignments = await prisma.krAssignment.findMany({
      where: { userId },
      include: {
        keyResult: {
          include: {
            objective: true,
            initiatives: {
              include: { team: true, kpis: { include: { assignments: { include: { user: true } } } } }
            },
            departments: true
          }
        }
      }
    });
    
    return res.status(200).json(assignments);
  } catch (error) {
    console.error('Get my assigned KRs error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/key-results/dropdown
// Mengembalikan KR yang relevan dengan scope user yang login, untuk dropdown modal buat inisiatif
export async function getKrsForInitiativeDropdown(req: AuthRequest, res: Response) {
  try {
    const { role, id: userId } = req.user!;
    let krWhere: any = {};

    if (role === 'ADMIN' || role === 'C_LEVEL') {
      // Admin & C-Level: lihat semua KR perusahaan
      krWhere = {};
    } else if (role === 'MANAGER') {
      // Manager: kombinasi KR yang di-assign ke dia UNION KR yang dept-nya cocok
      const managedDepts = await prisma.department.findMany({
        where: { managerId: userId },
        select: { value: true }
      });
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { department: true }
      });

      const deptValues: string[] = managedDepts.map(d => d.value);
      if (dbUser?.department) deptValues.push(dbUser.department);

      krWhere = {
        OR: [
          { assignments: { some: { userId } } },
          { departments: { some: { department: { in: deptValues } } } }
        ]
      };
    } else if (role === 'LEADER') {
      // Leader: kombinasi KR yang di-assign ke dia UNION KR yang dept-nya cocok
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { department: true }
      });

      krWhere = {
        OR: [
          { assignments: { some: { userId } } },
          ...(dbUser?.department
            ? [{ departments: { some: { department: dbUser.department } } }]
            : [])
        ]
      };
    } else {
      // TEAM: KR yang terkait dengan tim mereka (via inisiatif yang sudah ada)
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { teamId: true }
      });
      if (dbUser?.teamId) {
        krWhere = {
          initiatives: { some: { teamId: dbUser.teamId } }
        };
      } else {
        // Fallback: tampilkan KR yang di-assign ke user ini
        krWhere = { assignments: { some: { userId } } };
      }
    }

    const keyResults = await prisma.keyResult.findMany({
      where: krWhere,
      include: {
        objective: { select: { id: true, title: true, quarter: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(keyResults);
  } catch (error) {
    console.error('Get KRs for dropdown error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

