import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";
import { logAudit } from "../utils/auditLogger";

const prisma = new PrismaClient();

const VALID_BSC_PERSPECTIVES = [
  "FINANCIAL",
  "CUSTOMER",
  "INTERNAL_PROCESS",
  "LEARNING_GROWTH",
];

export async function createKeyResult(req: AuthRequest, res: Response) {
  try {
    const {
      objectiveId,
      title,
      targetValue,
      currentValue,
      unit,
      bscPerspective,
      month,
      monthWeight,
      annualKeyResultId,
    } = req.body;

    if (
      !objectiveId ||
      !title ||
      targetValue === undefined ||
      !bscPerspective
    ) {
      return res.status(400).json({
        message:
          "objectiveId, title, targetValue, and bscPerspective are required",
      });
    }

    if (targetValue <= 0) {
      return res
        .status(400)
        .json({ message: "Target value must be greater than 0" });
    }

    if (!VALID_BSC_PERSPECTIVES.includes(bscPerspective)) {
      return res.status(400).json({
        message: `bscPerspective must be one of: ${VALID_BSC_PERSPECTIVES.join(", ")}`,
      });
    }

    // Check if objective exists
    const objective = await prisma.objective.findUnique({
      where: { id: objectiveId },
    });
    if (!objective) {
      return res.status(404).json({ message: "Objective not found" });
    }

    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const newKR = await prisma.keyResult.create({
      data: {
        objectiveId,
        title,
        targetValue: parseFloat(targetValue),
        currentValue: currentValue !== undefined ? parseFloat(currentValue) : 0,
        unit: unit || "%",
        bscPerspective,
        status: "ON_TRACK",
        month: month || defaultMonth,
        monthWeight: monthWeight !== undefined ? parseFloat(monthWeight) : 1.0,
        annualKeyResultId: annualKeyResultId || null,
      },
    });

    if (newKR.annualKeyResultId) {
      await normalizeMonthlyKrWeights(newKR.annualKeyResultId);
      const refetchedKR = await prisma.keyResult.findUnique({
        where: { id: newKR.id },
      });
      await logAudit(prisma, {
        userId: req.user?.id,
        action: "CREATE",
        entityType: "KEY_RESULT",
        entityId: newKR.id,
        newValues: {
          title: newKR.title,
          targetValue: newKR.targetValue,
          month: newKR.month,
          bscPerspective: newKR.bscPerspective,
        },
        req,
      });
      return res.status(201).json(refetchedKR || newKR);
    }

    await logAudit(prisma, {
      userId: req.user?.id,
      action: "CREATE",
      entityType: "KEY_RESULT",
      entityId: newKR.id,
      newValues: {
        title: newKR.title,
        targetValue: newKR.targetValue,
        month: newKR.month,
        bscPerspective: newKR.bscPerspective,
      },
      req,
    });

    return res.status(201).json(newKR);
  } catch (error) {
    console.error("Create key result error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteKeyResult(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    // Check if KR exists
    const kr = await prisma.keyResult.findUnique({
      where: { id },
      include: { initiatives: { include: { tasks: true } } },
    });
    if (!kr) {
      return res.status(404).json({ message: "Key Result not found" });
    }

    const initiativeIds = kr.initiatives.map((i) => i.id);
    const taskIds = kr.initiatives.flatMap((i) => i.tasks.map((k) => k.id));

    const annualKeyResultId = kr.annualKeyResultId;

    // Cascade delete in transaction to prevent Foreign Key Violation (P2003)
    await prisma.$transaction([
      // 1. Delete Task updates & Task assignments
      prisma.taskUpdate.deleteMany({
        where: { taskId: { in: taskIds } },
      }),
      prisma.taskAssignment.deleteMany({
        where: { taskId: { in: taskIds } },
      }),
      // 2. Delete Tasks
      prisma.task.deleteMany({
        where: { id: { in: taskIds } },
      }),
      // 3. Delete Initiative Updates & Initiatives
      prisma.initiativeUpdate.deleteMany({
        where: { initiativeId: { in: initiativeIds } },
      }),
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

    if (annualKeyResultId) {
      await normalizeMonthlyKrWeights(annualKeyResultId);
    }

    await logAudit(prisma, {
      userId: req.user?.id,
      action: "DELETE",
      entityType: "KEY_RESULT",
      entityId: id,
      oldValues: {
        title: kr.title,
        targetValue: kr.targetValue,
      },
      req,
    });

    return res.status(200).json({ message: "Key Result deleted successfully" });
  } catch (error) {
    console.error("Delete key result error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function bulkDeleteKeyResults(req: AuthRequest, res: Response) {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "IDs must be a non-empty array" });
    }

    const krs = await prisma.keyResult.findMany({
      where: { id: { in: ids } },
      include: { initiatives: { include: { tasks: true } } },
    });

    const initiativeIds = krs.flatMap((kr) => kr.initiatives.map((i) => i.id));
    const taskIds = krs.flatMap((kr) =>
      kr.initiatives.flatMap((i) => i.tasks.map((k) => k.id)),
    );

    const annualKeyResultIds = Array.from(
      new Set(krs.map((kr) => kr.annualKeyResultId).filter(Boolean)),
    ) as string[];

    await prisma.$transaction([
      prisma.taskUpdate.deleteMany({
        where: { taskId: { in: taskIds } },
      }),
      prisma.taskAssignment.deleteMany({
        where: { taskId: { in: taskIds } },
      }),
      prisma.task.deleteMany({
        where: { id: { in: taskIds } },
      }),
      prisma.initiativeUpdate.deleteMany({
        where: { initiativeId: { in: initiativeIds } },
      }),
      prisma.initiative.deleteMany({
        where: { id: { in: initiativeIds } },
      }),
      prisma.krAssignment.deleteMany({
        where: { keyResultId: { in: ids } },
      }),
      prisma.krDepartment.deleteMany({
        where: { keyResultId: { in: ids } },
      }),
      prisma.krUpdate.deleteMany({
        where: { keyResultId: { in: ids } },
      }),
      prisma.causalLink.deleteMany({
        where: {
          OR: [{ sourceKrId: { in: ids } }, { targetKrId: { in: ids } }],
        },
      }),
      prisma.keyResult.deleteMany({
        where: { id: { in: ids } },
      }),
    ]);

    for (const annualId of annualKeyResultIds) {
      await normalizeMonthlyKrWeights(annualId);
    }

    return res
      .status(200)
      .json({ message: "Key Results deleted successfully" });
  } catch (error) {
    console.error("Bulk delete key results error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateKeyResultProgress(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { newValue, note } = req.body;

    if (newValue === undefined || newValue === null) {
      return res.status(400).json({ message: "newValue is required" });
    }

    const valueNum = parseFloat(newValue);
    if (isNaN(valueNum)) {
      return res
        .status(400)
        .json({ message: "newValue must be a valid number" });
    }

    const kr = await prisma.keyResult.findUnique({
      where: { id },
    });

    if (!kr) {
      return res.status(404).json({ message: "Key Result not found" });
    }

    const initiativeCount = await prisma.initiative.count({
      where: { keyResultId: id },
    });

    if (initiativeCount > 0) {
      return res.status(400).json({
        message:
          "KR ini punya Initiative aktif — update progress harus lewat Task/Initiative, bukan manual.",
      });
    }

    const oldValue = kr.currentValue;
    const progress = valueNum / kr.targetValue;
    let newStatus = "ON_TRACK";
    if (progress < 0.5) {
      newStatus = "OFF_TRACK";
    } else if (progress < 0.8) {
      newStatus = "AT_RISK";
    }

    const result = await prisma.$transaction([
      prisma.keyResult.update({
        where: { id },
        data: {
          currentValue: valueNum,
          status: newStatus,
          isManualOverride: true,
        },
      }),
      prisma.krUpdate.create({
        data: {
          keyResultId: id,
          oldValue,
          newValue: valueNum,
          note: note || null,
          updatedBy: req.user?.name || req.user?.email || "System Admin",
        },
      }),
    ]);

    if (result[0].annualKeyResultId) {
      await cascadeMonthlyKrToAnnual(result[0].annualKeyResultId);
    }

    await logAudit(prisma, {
      userId: req.user?.id,
      action: "UPDATE",
      entityType: "KEY_RESULT",
      entityId: id,
      oldValues: {
        currentValue: oldValue,
        status: kr.status,
      },
      newValues: {
        currentValue: valueNum,
        status: newStatus,
        note: note || null,
      },
      req,
    });

    return res.status(200).json({
      keyResult: result[0],
      updateLog: result[1],
    });
  } catch (error) {
    console.error("Update progress error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getKeyResultHistory(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const history = await prisma.krUpdate.findMany({
      where: { keyResultId: id },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return res.status(200).json(history);
  } catch (error) {
    console.error("Get history error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateKeyResult(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const {
      title,
      targetValue,
      unit,
      bscPerspective,
      month,
      monthWeight,
      annualKeyResultId,
    } = req.body;

    if (!title || targetValue === undefined || !bscPerspective) {
      return res.status(400).json({
        message: "title, targetValue, and bscPerspective are required",
      });
    }

    if (targetValue <= 0) {
      return res
        .status(400)
        .json({ message: "Target value must be greater than 0" });
    }

    if (!VALID_BSC_PERSPECTIVES.includes(bscPerspective)) {
      return res.status(400).json({
        message: `bscPerspective must be one of: ${VALID_BSC_PERSPECTIVES.join(", ")}`,
      });
    }

    // Check if KR exists
    const kr = await prisma.keyResult.findUnique({
      where: { id },
    });
    if (!kr) {
      return res.status(404).json({ message: "Key Result not found" });
    }

    // Calculate new status based on current progress
    const progress = kr.currentValue / parseFloat(targetValue);
    let newStatus = "ON_TRACK";
    if (progress < 0.5) {
      newStatus = "OFF_TRACK";
    } else if (progress < 0.8) {
      newStatus = "AT_RISK";
    }

    const originalAnnualId = kr.annualKeyResultId;

    const updatedKR = await prisma.keyResult.update({
      where: { id },
      data: {
        title,
        targetValue: parseFloat(targetValue),
        unit: unit || "%",
        bscPerspective,
        status: newStatus,
        ...(month !== undefined && { month: month || null }),
        ...(monthWeight !== undefined && {
          monthWeight: parseFloat(monthWeight),
        }),
        ...(annualKeyResultId !== undefined && {
          annualKeyResultId: annualKeyResultId || null,
        }),
      },
    });

    const annualIdsToNormalize = new Set<string>();
    if (originalAnnualId) annualIdsToNormalize.add(originalAnnualId);
    if (updatedKR.annualKeyResultId)
      annualIdsToNormalize.add(updatedKR.annualKeyResultId);

    for (const annualId of annualIdsToNormalize) {
      await normalizeMonthlyKrWeights(annualId);
    }

    const finalKR = await prisma.keyResult.findUnique({
      where: { id: updatedKR.id },
    });

    return res.status(200).json(finalKR || updatedKR);
  } catch (error) {
    console.error("Update key result details error:", error);
    return res.status(500).json({ message: "Internal server error" });
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
        raciRole: "RESPONSIBLE",
      }));
    } else if (Array.isArray(assignments)) {
      normalizedAssignments = assignments;
    } else {
      return res
        .status(400)
        .json({ message: "assignments harus berupa array" });
    }

    // Validasi KR ada
    const kr = await prisma.keyResult.findUnique({ where: { id } });
    if (!kr) return res.status(404).json({ message: "Key Result not found" });

    // Jika ada assignments yang dipass (bukan array kosong)
    if (normalizedAssignments.length > 0) {
      // Validasi RACI: minimal 1 ACCOUNTABLE
      const accountables = normalizedAssignments.filter(
        (a) => a.raciRole === "ACCOUNTABLE",
      );
      if (accountables.length < 1) {
        return res.status(400).json({
          message: "Setiap KR harus memiliki minimal 1 Accountable",
        });
      }

      // Validasi RACI: tepat 1 RESPONSIBLE
      const responsibles = normalizedAssignments.filter(
        (a) => a.raciRole === "RESPONSIBLE",
      );
      if (responsibles.length !== 1) {
        return res.status(400).json({
          message: "Setiap KR harus memiliki tepat 1 Responsible",
        });
      }

      // Validasi user IDs
      const userIds = normalizedAssignments.map((a) => a.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true },
      });
      if (users.length !== userIds.length) {
        return res
          .status(400)
          .json({ message: "Satu atau lebih user tidak ditemukan" });
      }
    }

    // Validasi departments
    const validDeptRecords = await prisma.department.findMany({
      select: { value: true },
    });
    const validDepartments = validDeptRecords.map((d) => d.value);
    if (departments && Array.isArray(departments)) {
      for (const dept of departments) {
        if (!validDepartments.includes(dept)) {
          return res
            .status(400)
            .json({ message: `Department tidak valid: ${dept}` });
        }
      }
    }

    // Transaksi: replace assignments + departments
    await prisma.$transaction([
      prisma.krAssignment.deleteMany({ where: { keyResultId: id } }),
      ...(normalizedAssignments.length > 0
        ? [
            prisma.krAssignment.createMany({
              data: normalizedAssignments.map((a) => ({
                keyResultId: id,
                userId: a.userId,
                raciRole: a.raciRole,
                assignedBy: req.user?.id || "system",
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
          orderBy: { raciRole: "asc" },
        },
        departments: true,
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Assign users error:", error);
    return res.status(500).json({ message: "Internal server error" });
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
          orderBy: { assignedAt: "asc" },
        },
        departments: true,
      },
    });

    if (!kr) {
      return res.status(404).json({ message: "Key Result not found" });
    }

    return res.status(200).json({
      assignments: kr.assignments,
      departments: kr.departments,
    });
  } catch (error) {
    console.error("Get assignments error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/key-results/my-assigned
export async function getMyAssignedKrs(req: AuthRequest, res: Response) {
  try {
    const { id: userId, role } = req.user!;

    let whereClause: any = { userId };

    if (role === "LEADER") {
      whereClause = {
        userId,
        keyResult: {
          month: { not: null },
          targetValue: { gt: 0 },
        },
      };
    }

    const assignments = await prisma.krAssignment.findMany({
      where: whereClause,
      include: {
        keyResult: {
          include: {
            objective: true,
            initiatives: {
              include: {
                team: true,
                owner: true,
                assignedLeader: true,
                tasks: {
                  include: { assignments: { include: { user: true } } },
                },
              },
            },
            departments: true,
            annualKeyResult: {
              select: {
                id: true,
                title: true,
                targetValue: true,
                currentValue: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json(assignments);
  } catch (error) {
    console.error("Get my assigned KRs error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/key-results/dropdown
// Mengembalikan KR yang relevan dengan scope user yang login, untuk dropdown modal buat inisiatif
export async function getKrsForInitiativeDropdown(
  req: AuthRequest,
  res: Response,
) {
  try {
    const { role, id: userId } = req.user!;
    let krWhere: any = {};

    if (role === "ADMIN" || role === "C_LEVEL") {
      // Admin & C-Level: lihat semua KR perusahaan
      krWhere = {};
    } else if (role === "MANAGER") {
      // Manager: kombinasi KR yang di-assign ke dia UNION KR yang dept-nya cocok
      const managedDepts = await prisma.department.findMany({
        where: { managerId: userId },
        select: { value: true },
      });
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { department: true },
      });

      const deptValues: string[] = managedDepts.map((d) => d.value);
      if (
        dbUser?.department &&
        dbUser.department.toUpperCase() !== "STRATEGIC" &&
        !deptValues.includes(dbUser.department)
      ) {
        deptValues.push(dbUser.department);
      }

      krWhere = {
        OR: [
          { assignments: { some: { userId } } },
          { departments: { some: { department: { in: deptValues } } } },
        ],
      };
    } else if (role === "LEADER") {
      // Leader: kombinasi KR yang di-assign ke dia UNION KR yang dept-nya cocok
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { department: true },
      });

      krWhere = {
        OR: [
          { assignments: { some: { userId } } },
          ...(dbUser?.department
            ? [{ departments: { some: { department: dbUser.department } } }]
            : []),
        ],
      };
    } else {
      // TEAM: KR yang terkait dengan tim mereka (via inisiatif yang sudah ada)
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { teamId: true },
      });
      if (dbUser?.teamId) {
        krWhere = {
          initiatives: { some: { teamId: dbUser.teamId } },
        };
      } else {
        // Fallback: tampilkan KR yang di-assign ke user ini
        krWhere = { assignments: { some: { userId } } };
      }
    }

    const keyResults = await prisma.keyResult.findMany({
      where: krWhere,
      include: {
        objective: { select: { id: true, title: true, year: true } },
        departments: true,
        assignments: { select: { userId: true, raciRole: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(keyResults);
  } catch (error) {
    console.error("Get KRs for dropdown error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function cascadeMonthlyKrToAnnual(
  annualKeyResultId: string,
): Promise<void> {
  const monthlyKrs = await prisma.keyResult.findMany({
    where: { annualKeyResultId },
  });
  const annualKr = await prisma.annualKeyResult.findUnique({
    where: { id: annualKeyResultId },
  });

  if (!annualKr || monthlyKrs.length === 0 || annualKr.targetValue <= 0) return;

  const totalWeight = monthlyKrs.reduce(
    (s, kr) => s + (kr.monthWeight || 0),
    0,
  );
  if (Math.abs(totalWeight - 1.0) > 0.001) {
    console.warn(
      `[AnnualKR ${annualKeyResultId}] Total monthWeight = ${totalWeight}, expected 1.0`,
    );
  }

  const divisor = totalWeight || 1;
  const weightedPercent =
    monthlyKrs.reduce((sum, kr) => {
      const pct = kr.targetValue > 0 ? kr.currentValue / kr.targetValue : 0;
      return sum + pct * (kr.monthWeight || 0);
    }, 0) / divisor;

  const newAnnualValue =
    Math.round(weightedPercent * annualKr.targetValue * 100) / 100;
  const progress = newAnnualValue / annualKr.targetValue;
  const newStatus =
    progress < 0.5 ? "OFF_TRACK" : progress < 0.8 ? "AT_RISK" : "ON_TRACK";

  await prisma.annualKeyResult.update({
    where: { id: annualKeyResultId },
    data: { currentValue: newAnnualValue, status: newStatus },
  });
}

// BARU: Fungsi untuk menormalisasi bobot (monthWeight) bulanan agar totalnya selalu 1.0
export async function normalizeMonthlyKrWeights(
  annualKeyResultId: string,
): Promise<void> {
  const monthlyKrs = await prisma.keyResult.findMany({
    where: { annualKeyResultId },
  });
  if (monthlyKrs.length === 0) return;

  const totalWeight = monthlyKrs.reduce(
    (s, kr) => s + (kr.monthWeight || 0),
    0,
  );

  if (totalWeight <= 0) {
    // Jika semua bobot <= 0, bagi rata
    const equalWeight = 1.0 / monthlyKrs.length;
    await prisma.$transaction(
      monthlyKrs.map((kr) =>
        prisma.keyResult.update({
          where: { id: kr.id },
          data: { monthWeight: equalWeight },
        }),
      ),
    );
  } else {
    // Normalisasi: bagi tiap bobot dengan total bobot
    await prisma.$transaction(
      monthlyKrs.map((kr) =>
        prisma.keyResult.update({
          where: { id: kr.id },
          data: { monthWeight: (kr.monthWeight || 0) / totalWeight },
        }),
      ),
    );
  }

  // Rekalkulasi progress Annual Key Result setelah normalisasi
  await cascadeMonthlyKrToAnnual(annualKeyResultId);
}

// POST /api/key-results/:id/delegate
// Body: { leaderId: string }
export async function delegateKeyResult(req: AuthRequest, res: Response) {
  try {
    const { id: keyResultId } = req.params;
    const { leaderId } = req.body;
    const { id: userId, role } = req.user!;

    if (!leaderId) {
      return res.status(400).json({ message: "leaderId wajib diisi" });
    }

    const kr = await prisma.keyResult.findUnique({
      where: { id: keyResultId },
      include: { assignments: true },
    });
    if (!kr) {
      return res.status(404).json({ message: "Key Result tidak ditemukan" });
    }

    const isAssigned = kr.assignments.some((a) => a.userId === userId);
    if (role !== "ADMIN" && !isAssigned) {
      return res.status(403).json({
        message: "Anda tidak memiliki wewenang untuk mendelegasikan KR ini",
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: leaderId },
    });
    if (!targetUser) {
      return res.status(404).json({ message: "Target Leader tidak ditemukan" });
    }

    let updatedAssignments = kr.assignments.map((a) => ({
      userId: a.userId,
      raciRole: a.raciRole,
    }));

    const myAssignment = updatedAssignments.find((a) => a.userId === userId);
    if (myAssignment && myAssignment.raciRole === "RESPONSIBLE") {
      myAssignment.raciRole = "ACCOUNTABLE";
    }

    const targetAssignment = updatedAssignments.find(
      (a) => a.userId === leaderId,
    );
    if (targetAssignment) {
      targetAssignment.raciRole = "RESPONSIBLE";
    } else {
      updatedAssignments.push({
        userId: leaderId,
        raciRole: "RESPONSIBLE",
      });
    }

    updatedAssignments = updatedAssignments.map((a) => {
      if (a.userId === leaderId) {
        return { userId: a.userId, raciRole: "RESPONSIBLE" };
      } else {
        return { userId: a.userId, raciRole: "ACCOUNTABLE" };
      }
    });

    await prisma.$transaction([
      prisma.krAssignment.deleteMany({ where: { keyResultId } }),
      prisma.krAssignment.createMany({
        data: updatedAssignments.map((a) => ({
          keyResultId,
          userId: a.userId,
          raciRole: a.raciRole,
          assignedBy: userId,
        })),
      }),
    ]);

    const updated = await prisma.keyResult.findUnique({
      where: { id: keyResultId },
      include: { assignments: { include: { user: true } } },
    });

    return res.status(200).json({
      message: "Berhasil mendelegasikan Key Result",
      keyResult: updated,
    });
  } catch (error) {
    console.error("Delegate Key Result error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
