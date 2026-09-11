import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";

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
    const { year } = req.query;

    const whereClause: any = {};
    if (year) {
      whereClause.year = String(year);
    }

    const objectives = await prisma.objective.findMany({
      where: whereClause,
      include: {
        keyResults: {
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
              include: {
                team: { select: { id: true, name: true, department: true } },
                owner: {
                  select: { id: true, name: true, email: true, position: true },
                },
                tasks: {
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

    // Find all Key Results associated with this Objective
    const keyResults = await prisma.keyResult.findMany({
      where: { objectiveId: id },
      select: { id: true },
    });
    const krIds = keyResults.map((kr) => kr.id);

    // Delete everything in a transaction to maintain integrity
    await prisma.$transaction([
      // 1. Delete all updates for these Key Results
      prisma.krUpdate.deleteMany({
        where: { keyResultId: { in: krIds } },
      }),
      // 2. Delete all causal links involving these Key Results
      prisma.causalLink.deleteMany({
        where: {
          OR: [{ sourceKrId: { in: krIds } }, { targetKrId: { in: krIds } }],
        },
      }),
      // 3. Delete the Key Results themselves
      prisma.keyResult.deleteMany({
        where: { objectiveId: id },
      }),
      // 4. Delete the Objective
      prisma.objective.delete({
        where: { id },
      }),
    ]);

    return res
      .status(200)
      .json({ message: "Objective and its Key Results deleted successfully" });
  } catch (error) {
    console.error("Delete objective error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/objectives/manager-overview
export async function getManagerOverview(req: AuthRequest, res: Response) {
  try {
    const { id: userId, role } = req.user!;

    let whereClause: any = {};
    let krWhereClause: any = {};

    if (role !== "ADMIN") {
      // Hanya tampilkan KR yang di-assign ke user ini
      krWhereClause = {
        assignments: {
          some: {
            userId: userId,
          },
        },
      };

      // Hanya tampilkan Objective yang memiliki KR yang di-assign ke user ini
      whereClause = {
        keyResults: {
          some: {
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
              include: {
                team: true,
                tasks: {
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
