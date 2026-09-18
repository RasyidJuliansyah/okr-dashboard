import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  cascadeMonthlyKrToAnnual,
  normalizeMonthlyKrWeights,
} from "./keyresult.controller";
import { logAudit } from "../utils/auditLogger";

const prisma = new PrismaClient();

// GET /api/annual-key-results
export async function getAnnualKeyResults(req: AuthRequest, res: Response) {
  try {
    const { year, bscPerspective } = req.query;
    const { id: userId, role } = req.user!;

    const where: any = {};
    if (year) {
      where.year = String(year);
    }
    if (bscPerspective) {
      where.bscPerspective = String(bscPerspective);
    }

    if (role === "MANAGER") {
      where.keyResults = {
        some: {
          assignments: {
            some: {
              userId,
            },
          },
        },
      };
    }

    const annualKrs = await prisma.annualKeyResult.findMany({
      where,
      include: {
        objective: { select: { id: true, title: true, year: true } },
        keyResults: {
          include: {
            assignments: { include: { user: true } },
            departments: true,
            initiatives: {
              select: {
                id: true,
                title: true,
                currentValue: true,
                targetValue: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(annualKrs);
  } catch (error) {
    console.error("Get annual key results error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/annual-key-results/:id
export async function getAnnualKeyResultDetail(
  req: AuthRequest,
  res: Response,
) {
  try {
    const { id } = req.params;

    const annualKr = await prisma.annualKeyResult.findUnique({
      where: { id },
      include: {
        objective: { select: { id: true, title: true, year: true } },
        keyResults: {
          include: {
            assignments: {
              include: { user: { select: { id: true, name: true } } },
            },
            departments: true,
            initiatives: {
              include: {
                team: { select: { id: true, name: true } },
                tasks: true,
              },
            },
          },
        },
      },
    });

    if (!annualKr) {
      return res.status(404).json({ message: "Annual Key Result not found" });
    }

    return res.status(200).json(annualKr);
  } catch (error) {
    console.error("Get annual key result detail error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// POST /api/annual-key-results
export async function createAnnualKeyResult(req: AuthRequest, res: Response) {
  try {
    const {
      objectiveId,
      title,
      description,
      targetValue,
      unit,
      bscPerspective,
      year,
    } = req.body;

    if (
      !objectiveId ||
      !title ||
      targetValue === undefined ||
      !unit ||
      !bscPerspective ||
      !year
    ) {
      return res
        .status(400)
        .json({
          message:
            "objectiveId, title, targetValue, unit, bscPerspective, and year are required",
        });
    }

    const valueNum = parseFloat(targetValue);
    if (isNaN(valueNum) || valueNum <= 0) {
      return res
        .status(400)
        .json({ message: "targetValue must be a valid number greater than 0" });
    }

    const newAnnualKr = await prisma.annualKeyResult.create({
      data: {
        objectiveId,
        title,
        description: description || null,
        targetValue: valueNum,
        unit,
        bscPerspective,
        year,
        status: "ON_TRACK",
      },
    });

    await logAudit(prisma, {
      userId: req.user?.id,
      action: "CREATE",
      entityType: "KEY_RESULT",
      entityId: newAnnualKr.id,
      newValues: {
        title: newAnnualKr.title,
        targetValue: newAnnualKr.targetValue,
        unit: newAnnualKr.unit,
        year: newAnnualKr.year,
        bscPerspective: newAnnualKr.bscPerspective,
      },
      req,
    });

    return res.status(201).json(newAnnualKr);
  } catch (error) {
    console.error("Create annual key result error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// PUT /api/annual-key-results/:id
export async function updateAnnualKeyResult(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, description, targetValue, unit, bscPerspective, status } =
      req.body;

    const annualKr = await prisma.annualKeyResult.findUnique({
      where: { id },
    });

    if (!annualKr) {
      return res.status(404).json({ message: "Annual Key Result not found" });
    }

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (unit !== undefined) data.unit = unit;
    if (bscPerspective !== undefined) data.bscPerspective = bscPerspective;
    if (status !== undefined) data.status = status;
    if (targetValue !== undefined) {
      const valNum = parseFloat(targetValue);
      if (isNaN(valNum) || valNum <= 0) {
        return res
          .status(400)
          .json({
            message: "targetValue must be a valid number greater than 0",
          });
      }
      data.targetValue = valNum;
    }

    const updated = await prisma.annualKeyResult.update({
      where: { id },
      data,
    });

    // Recalculate values if targetValue was changed
    if (targetValue !== undefined) {
      await cascadeMonthlyKrToAnnual(id);
    }

    await logAudit(prisma, {
      userId: req.user?.id,
      action: "UPDATE",
      entityType: "KEY_RESULT",
      entityId: id,
      oldValues: {
        title: annualKr.title,
        targetValue: annualKr.targetValue,
        unit: annualKr.unit,
        status: annualKr.status,
      },
      newValues: {
        title: updated.title,
        targetValue: updated.targetValue,
        unit: updated.unit,
        status: updated.status,
      },
      req,
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Update annual key result error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// DELETE /api/annual-key-results/:id
export async function deleteAnnualKeyResult(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const annualKr = await prisma.annualKeyResult.findUnique({
      where: { id },
    });
    if (!annualKr) {
      return res.status(404).json({ message: "Annual Key Result not found" });
    }

    const keyResultCount = await prisma.keyResult.count({
      where: { annualKeyResultId: id },
    });

    if (keyResultCount > 0) {
      return res.status(400).json({
        message:
          "Tidak dapat menghapus Annual Key Result ini karena masih memiliki KR bulanan aktif. Putus link KR bulanan terlebih dahulu.",
      });
    }

    await prisma.annualKeyResult.delete({
      where: { id },
    });

    await logAudit(prisma, {
      userId: req.user?.id,
      action: "DELETE",
      entityType: "KEY_RESULT",
      entityId: id,
      oldValues: {
        title: annualKr.title,
      },
      req,
    });

    return res
      .status(200)
      .json({ message: "Annual Key Result deleted successfully" });
  } catch (error) {
    console.error("Delete annual key result error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// POST /api/annual-key-results/:id/link-kr/:krId
export async function linkMonthlyKrToAnnual(req: AuthRequest, res: Response) {
  try {
    const { id: annualKeyResultId, krId } = req.params;
    const { monthWeight } = req.body;

    const annualKr = await prisma.annualKeyResult.findUnique({
      where: { id: annualKeyResultId },
    });

    if (!annualKr) {
      return res.status(404).json({ message: "Annual Key Result not found" });
    }

    const kr = await prisma.keyResult.findUnique({
      where: { id: krId },
    });

    if (!kr) {
      return res.status(404).json({ message: "Monthly Key Result not found" });
    }

    const weightNum = monthWeight !== undefined ? parseFloat(monthWeight) : 1.0;
    if (isNaN(weightNum) || weightNum < 0) {
      return res
        .status(400)
        .json({ message: "monthWeight must be a non-negative number" });
    }

    const updatedKr = await prisma.keyResult.update({
      where: { id: krId },
      data: {
        annualKeyResultId,
        monthWeight: weightNum,
      },
    });

    // Recalculate weights and cascade
    await normalizeMonthlyKrWeights(annualKeyResultId);

    const finalKr = await prisma.keyResult.findUnique({
      where: { id: krId },
    });

    return res.status(200).json({
      message: "Monthly KR successfully linked to Annual Key Result",
      keyResult: finalKr || updatedKr,
    });
  } catch (error) {
    console.error("Link monthly KR error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/annual-key-results/:id/monthly-breakdown
export async function getMonthlyBreakdown(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const annualKr = await prisma.annualKeyResult.findUnique({
      where: { id },
      include: {
        objective: { select: { id: true, title: true, year: true } },
        keyResults: {
          include: {
            assignments: {
              include: {
                user: { select: { id: true, name: true, role: true } },
              },
            },
            departments: true,
          },
        },
      },
    });

    if (!annualKr) {
      return res.status(404).json({ message: "Annual Key Result not found" });
    }

    const months = [];
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const year = annualKr.year || "2026";

    // Hitung total progress tertimbang (weighted progress)
    const totalWeight = annualKr.keyResults.reduce(
      (s, kr) => s + (kr.monthWeight || 0),
      0,
    );
    const weightedProgress =
      totalWeight > 0
        ? annualKr.keyResults.reduce((s, kr) => {
            const pct =
              kr.targetValue > 0 ? kr.currentValue / kr.targetValue : 0;
            return s + pct * (kr.monthWeight || 0);
          }, 0) / totalWeight
        : 0;

    for (let i = 1; i <= 12; i++) {
      const monthStr = `${year}-${String(i).padStart(2, "0")}`;
      const label = `${monthNames[i - 1]} ${year}`;

      const krsForMonth = annualKr.keyResults.filter(
        (kr) => kr.month === monthStr,
      );

      if (krsForMonth.length > 0) {
        const totalTarget = krsForMonth.reduce((s, k) => s + k.targetValue, 0);
        const totalCurrent = krsForMonth.reduce(
          (s, k) => s + k.currentValue,
          0,
        );
        const sumWeight = krsForMonth.reduce(
          (s, k) => s + (k.monthWeight || 0),
          0,
        );
        const isManualOverride = krsForMonth.some((k) => k.isManualOverride);

        const progressPercent =
          totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

        let status = "ON_TRACK";
        if (progressPercent < 50) status = "OFF_TRACK";
        else if (progressPercent < 80) status = "AT_RISK";

        const leaderAssignees = krsForMonth.flatMap((k) =>
          k.assignments.map((a) => ({
            userId: a.user.id,
            name: a.user.name,
            role: a.user.role,
            raciRole: a.raciRole,
          })),
        );

        // Deduplicate assignees
        const uniqueLeaders = Array.from(
          new Map(leaderAssignees.map((item) => [item.userId, item])).values(),
        );

        months.push({
          month: monthStr,
          monthLabel: label,
          monthWeight: sumWeight,
          monthTarget: totalTarget,
          currentValue: totalCurrent,
          progressPercent: Math.round(progressPercent * 100) / 100,
          status,
          isManualOverride,
          leaderAssignees: uniqueLeaders,
          keyResults: krsForMonth.map((k) => ({
            id: k.id,
            title: k.title,
            targetValue: k.targetValue,
            currentValue: k.currentValue,
            status: k.status,
            isManualOverride: k.isManualOverride,
            monthWeight: k.monthWeight,
            unit: k.unit,
          })),
        });
      } else {
        months.push({
          month: monthStr,
          monthLabel: label,
          monthWeight: 0,
          monthTarget: 0,
          currentValue: 0,
          progressPercent: 0,
          status: "ON_TRACK",
          isManualOverride: false,
          leaderAssignees: [],
          keyResults: [],
        });
      }
    }

    return res.status(200).json({
      annualKrId: annualKr.id,
      title: annualKr.title,
      description: annualKr.description,
      targetValue: annualKr.targetValue,
      currentValue: annualKr.currentValue,
      unit: annualKr.unit,
      bscPerspective: annualKr.bscPerspective,
      year: annualKr.year,
      aggregatedProgress: Math.round(weightedProgress * 100 * 10) / 10,
      months,
    });
  } catch (error) {
    console.error("Get monthly breakdown error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/annual-key-results/by-month
export async function getAnnualKrsByMonth(req: AuthRequest, res: Response) {
  try {
    const { month, year, bscPerspective, department } = req.query;

    if (!month) {
      return res
        .status(400)
        .json({
          message: "Query parameter 'month' (format YYYY-MM) is required",
        });
    }

    const queryYear = year ? String(year) : String(month).split("-")[0];

    const where: any = { year: queryYear };
    if (bscPerspective) {
      where.bscPerspective = String(bscPerspective);
    }

    const annualKrs = await prisma.annualKeyResult.findMany({
      where,
      include: {
        objective: { select: { id: true, title: true, year: true } },
        keyResults: {
          where: {
            month: String(month),
          },
          include: {
            assignments: {
              include: {
                user: { select: { id: true, name: true, role: true } },
              },
            },
            departments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let filteredAnnualKrs = annualKrs;
    if (department) {
      const deptStr = String(department);
      filteredAnnualKrs = annualKrs.filter((akr) => {
        return akr.keyResults.some((kr) =>
          kr.departments.some((d) => d.department === deptStr),
        );
      });
    }

    const responseData = filteredAnnualKrs.map((akr) => {
      const krsForMonth = akr.keyResults;

      const totalTarget = krsForMonth.reduce((s, k) => s + k.targetValue, 0);
      const totalCurrent = krsForMonth.reduce((s, k) => s + k.currentValue, 0);
      const sumWeight = krsForMonth.reduce(
        (s, k) => s + (k.monthWeight || 0),
        0,
      );
      const isManualOverride = krsForMonth.some((k) => k.isManualOverride);

      const progressPercent =
        totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

      let status = "ON_TRACK";
      if (progressPercent < 50) status = "OFF_TRACK";
      else if (progressPercent < 80) status = "AT_RISK";

      const leaderAssignees = krsForMonth.flatMap((k) =>
        k.assignments.map((a) => ({
          userId: a.user.id,
          name: a.user.name,
          role: a.user.role,
          raciRole: a.raciRole,
        })),
      );
      const uniqueLeaders = Array.from(
        new Map(leaderAssignees.map((item) => [item.userId, item])).values(),
      );

      return {
        id: akr.id,
        title: akr.title,
        description: akr.description,
        targetValue: akr.targetValue,
        currentValue: akr.currentValue,
        unit: akr.unit,
        bscPerspective: akr.bscPerspective,
        year: akr.year,
        status: akr.status,
        objective: akr.objective,
        monthlySnapshot: {
          month: String(month),
          monthWeight: sumWeight,
          monthTarget: totalTarget,
          currentValue: totalCurrent,
          progressPercent: Math.round(progressPercent * 100) / 100,
          status,
          isManualOverride,
          leaderAssignees: uniqueLeaders,
          keyResults: krsForMonth.map((k) => ({
            id: k.id,
            title: k.title,
            targetValue: k.targetValue,
            currentValue: k.currentValue,
            status: k.status,
            monthWeight: k.monthWeight,
            isManualOverride: k.isManualOverride,
            unit: k.unit,
          })),
        },
      };
    });

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Get annual key results by month error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
