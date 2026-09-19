import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";
import * as sprintService from "../services/sprint.service";

const prisma = new PrismaClient();

export async function getSprints(req: AuthRequest, res: Response) {
  try {
    const sprints = await sprintService.getAllSprints();
    const activeSprint = await sprintService.getActiveSprint();
    res.json({ sprints, activeSprint });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch sprints" });
  }
}

export async function getActiveSprint(req: AuthRequest, res: Response) {
  try {
    const active = await sprintService.getActiveSprint();
    res.json({ activeSprint: active });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch active sprint" });
  }
}

export async function generateYearly(req: AuthRequest, res: Response) {
  try {
    const { baseYear } = req.body;
    const result = await sprintService.generateYearlySprints(baseYear ? parseInt(baseYear) : 2026);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate sprints" });
  }
}

export async function updateSprint(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { startDate, endDate, name } = req.body;
    const updated = await sprintService.updateSprint(
      id,
      { startDate, endDate, name },
      req.user?.id,
      req
    );
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update sprint" });
  }
}

export async function toggleLock(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { isLocked } = req.body;
    const updated = await sprintService.toggleSprintLock(
      id,
      Boolean(isLocked),
      req.user?.id,
      req
    );
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to toggle sprint lock" });
  }
}

export async function closeSprint(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const result = await sprintService.closeAndRolloverSprint(
      id,
      req.user?.id,
      req
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to close sprint" });
  }
}

export async function getSprintMemberScores(req: AuthRequest, res: Response) {
  try {
    const { id: sprintId } = req.params;
    const scores = await prisma.memberSprintProgress.findMany({
      where: { sprintId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            position: true,
            department: true,
          },
        },
      },
      orderBy: { totalScore: "desc" },
    });
    res.json({ sprintId, scores });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch sprint member scores" });
  }
}

export async function upsertKrSprintTarget(req: AuthRequest, res: Response) {
  try {
    const { sprintId, keyResultId, baselineValue, targetValue, currentValue, aggregationType } = req.body;
    if (!sprintId || !keyResultId) {
      return res.status(400).json({ error: "sprintId and keyResultId are required" });
    }

    const target = await prisma.krSprintTarget.upsert({
      where: {
        keyResultId_sprintId: { sprintId, keyResultId },
      },
      create: {
        sprintId,
        keyResultId,
        baselineValue: baselineValue ? parseFloat(baselineValue) : 0,
        targetValue: targetValue ? parseFloat(targetValue) : 0,
        currentValue: currentValue ? parseFloat(currentValue) : 0,
        aggregationType: aggregationType || "SUM",
      },
      update: {
        ...(baselineValue !== undefined ? { baselineValue: parseFloat(baselineValue) } : {}),
        ...(targetValue !== undefined ? { targetValue: parseFloat(targetValue) } : {}),
        ...(currentValue !== undefined ? { currentValue: parseFloat(currentValue) } : {}),
        ...(aggregationType !== undefined ? { aggregationType } : {}),
      },
    });

    res.json(target);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to upsert KR sprint target" });
  }
}
