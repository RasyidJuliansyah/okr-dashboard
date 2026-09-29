import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";
import { logAudit } from "../utils/auditLogger";

const prisma = new PrismaClient();

export async function createObjective(req: AuthRequest, res: Response) {
  try {
    const { title, description, year, ownerId, keyResults } = req.body;

    if (!title || !year) {
      return res.status(400).json({ message: "Title and year are required" });
    }

    // Prepare nested key results creation if provided
    const keyResultsData = [];
    if (keyResults && Array.isArray(keyResults)) {
      for (const kr of keyResults) {
        if (!kr.title || kr.targetValue === undefined || !kr.bscPerspective) {
          return res.status(400).json({
            message:
              "Key Results must have a title, target value, and BSC perspective",
          });
        }
        if (kr.targetValue <= 0) {
          return res
            .status(400)
            .json({ message: "Target value must be greater than 0" });
        }
        keyResultsData.push({
          title: kr.title,
          targetValue: parseFloat(kr.targetValue),
          currentValue:
            kr.currentValue !== undefined ? parseFloat(kr.currentValue) : 0,
          unit: kr.unit || "%",
          bscPerspective: kr.bscPerspective,
          status: kr.status || "ON_TRACK",
          targetType: kr.targetType || "AT_LEAST",
        });
      }
    }

    const newObjective = await prisma.objective.create({
      data: {
        title,
        description,
        year,
        ownerId: ownerId || req.user?.id || null,
        keyResults: {
          create: keyResultsData,
        },
      },
      include: {
        keyResults: true,
      },
    });

    return res.status(201).json(newObjective);
  } catch (error) {
    console.error("Create objective error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getObjectives(req: AuthRequest, res: Response) {
  try {
    const { year, includeInactive } = req.query;

    const whereClause: any = {};
    if (includeInactive !== "true") {
      whereClause.isActive = true;
    }
    if (year) {
      whereClause.year = String(year);
    }

    const objectives = await prisma.objective.findMany({
      where: whereClause,
      include: {
        keyResults: {
          where: includeInactive === "true" ? undefined : { isActive: true },
          include: {
            updates: true,
            assignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    role: true,
                    department: true,
                  },
                },
              },
            },
            departments: true,
            initiatives: {
              where: includeInactive === "true" ? undefined : { isActive: true },
              include: {
                team: { select: { id: true, name: true, department: true } },
                owner: {
                  select: { id: true, name: true, email: true, position: true },
                },
                tasks: {
                  where: includeInactive === "true" ? undefined : { isActive: true },
                  include: {
                    assignments: {
                      include: { user: { select: { id: true, name: true } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(objectives);
  } catch (error) {
    console.error("Get objectives error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteObjective(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const objective = await prisma.objective.findUnique({
      where: { id },
    });
    if (!objective) {
      return res.status(404).json({ message: "Objective tidak ditemukan" });
    }

    // Find all Key Results associated with this Objective
    const keyResults = await prisma.keyResult.findMany({
      where: { objectiveId: id },
      select: { id: true },
    });
    const krIds = keyResults.map((kr) => kr.id);

    const initiatives = await prisma.initiative.findMany({
      where: { keyResultId: { in: krIds } },
      select: { id: true },
    });
    const initiativeIds = initiatives.map((i) => i.id);

    // ponytail: soft-delete keeps FK historical integrity (AKR, KR, initiatives, tasks, audit) intact; add hard purge when data retention policy drafted
    await prisma.$transaction([
      prisma.objective.update({
        where: { id },
        data: { isActive: false },
      }),
      prisma.annualKeyResult.updateMany({
        where: { objectiveId: id },
        data: { isActive: false },
      }),
      prisma.keyResult.updateMany({
        where: { objectiveId: id },
        data: { isActive: false },
      }),
      prisma.initiative.updateMany({
        where: { keyResultId: { in: krIds } },
        data: { isActive: false },
      }),
      prisma.task.updateMany({
        where: { initiativeId: { in: initiativeIds } },
        data: { isActive: false },
      }),
    ]);

    await logAudit(prisma, {
      userId: req.user?.id,
      action: "STATUS_CHANGE",
      entityType: "OBJECTIVE",
      entityId: id,
      oldValues: {
        title: objective.title,
        isActive: objective.isActive,
      },
      newValues: {
        isActive: false,
      },
      req,
    });

    return res
      .status(200)
      .json({ message: "Objective and associated Key Results deactivated successfully" });
  } catch (error) {
    console.error("Delete objective error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateObjective(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, description, year } = req.body;

    if (!title || !year) {
      return res.status(400).json({ message: "Title and year are required" });
    }

    const objective = await prisma.objective.findFirst({
      where: { id, isActive: true },
    });
    if (!objective) {
      return res.status(404).json({ message: "Objective not found" });
    }

    const updated = await prisma.objective.update({
      where: { id },
      data: { title, description: description || null, year },
    });

    await logAudit(prisma, {
      userId: req.user?.id,
      action: "UPDATE",
      entityType: "OBJECTIVE",
      entityId: id,
      oldValues: { title: objective.title, description: objective.description, year: objective.year },
      newValues: { title, description, year },
      req,
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Update objective error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/objectives/manager-overview
export async function getManagerOverview(req: AuthRequest, res: Response) {
  try {
    const { id: userId, role } = req.user!;

    let whereClause: any = { isActive: true };
    let krWhereClause: any = { isActive: true };

    if (role !== "ADMIN") {
      // Hanya tampilkan KR yang di-assign ke user ini
      krWhereClause = {
        isActive: true,
        assignments: {
          some: {
            userId: userId,
          },
        },
      };

      // Hanya tampilkan Objective yang memiliki KR yang di-assign ke user ini
      whereClause = {
        isActive: true,
        keyResults: {
          some: {
            isActive: true,
            assignments: {
              some: {
                userId: userId,
              },
            },
          },
        },
      };
    }

    const objectives = await prisma.objective.findMany({
      where: whereClause,
      include: {
        keyResults: {
          where: krWhereClause,
          include: {
            assignments: { include: { user: true } },
            departments: true,
            initiatives: {
              where: { isActive: true },
              include: {
                team: true,
                tasks: {
                  where: { isActive: true },
                  include: { assignments: { include: { user: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(objectives);
  } catch (error) {
    console.error("Get manager overview error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
