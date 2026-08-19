import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { cascadeMonthlyKrToAnnual } from './keyresult.controller';

const prisma = new PrismaClient();

// GET /api/annual-key-results
export async function getAnnualKeyResults(req: AuthRequest, res: Response) {
  try {
    const { year, bscPerspective } = req.query;

    const where: any = {};
    if (year) {
      where.year = String(year);
    }
    if (bscPerspective) {
      where.bscPerspective = String(bscPerspective);
    }

    const annualKrs = await prisma.annualKeyResult.findMany({
      where,
      include: {
        objective: { select: { id: true, title: true, year: true } },
        keyResults: {
          include: {
            initiatives: { select: { id: true, title: true, currentValue: true, targetValue: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(annualKrs);
  } catch (error) {
    console.error('Get annual key results error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/annual-key-results/:id
export async function getAnnualKeyResultDetail(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const annualKr = await prisma.annualKeyResult.findUnique({
      where: { id },
      include: {
        objective: { select: { id: true, title: true, year: true } },
        keyResults: {
          include: {
            assignments: { include: { user: { select: { id: true, name: true } } } },
            departments: true,
            initiatives: {
              include: {
                team: { select: { id: true, name: true } },
                tasks: true
              }
            }
          }
        }
      }
    });

    if (!annualKr) {
      return res.status(404).json({ message: 'Annual Key Result not found' });
    }

    return res.status(200).json(annualKr);
  } catch (error) {
    console.error('Get annual key result detail error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /api/annual-key-results
export async function createAnnualKeyResult(req: AuthRequest, res: Response) {
  try {
    const { objectiveId, title, description, targetValue, unit, bscPerspective, year } = req.body;

    if (!objectiveId || !title || targetValue === undefined || !unit || !bscPerspective || !year) {
      return res.status(400).json({ message: 'objectiveId, title, targetValue, unit, bscPerspective, and year are required' });
    }

    const valueNum = parseFloat(targetValue);
    if (isNaN(valueNum) || valueNum <= 0) {
      return res.status(400).json({ message: 'targetValue must be a valid number greater than 0' });
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
        status: 'ON_TRACK',
      }
    });

    return res.status(201).json(newAnnualKr);
  } catch (error) {
    console.error('Create annual key result error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// PUT /api/annual-key-results/:id
export async function updateAnnualKeyResult(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, description, targetValue, unit, bscPerspective, status } = req.body;

    const annualKr = await prisma.annualKeyResult.findUnique({
      where: { id }
    });

    if (!annualKr) {
      return res.status(404).json({ message: 'Annual Key Result not found' });
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
        return res.status(400).json({ message: 'targetValue must be a valid number greater than 0' });
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

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Update annual key result error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// DELETE /api/annual-key-results/:id
export async function deleteAnnualKeyResult(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const keyResultCount = await prisma.keyResult.count({
      where: { annualKeyResultId: id }
    });

    if (keyResultCount > 0) {
      return res.status(400).json({
        message: 'Tidak dapat menghapus Annual Key Result ini karena masih memiliki KR bulanan aktif. Putus link KR bulanan terlebih dahulu.'
      });
    }

    await prisma.annualKeyResult.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Annual Key Result deleted successfully' });
  } catch (error) {
    console.error('Delete annual key result error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /api/annual-key-results/:id/link-kr/:krId
export async function linkMonthlyKrToAnnual(req: AuthRequest, res: Response) {
  try {
    const { id: annualKeyResultId, krId } = req.params;
    const { monthWeight } = req.body;

    const annualKr = await prisma.annualKeyResult.findUnique({
      where: { id: annualKeyResultId }
    });

    if (!annualKr) {
      return res.status(404).json({ message: 'Annual Key Result not found' });
    }

    const kr = await prisma.keyResult.findUnique({
      where: { id: krId }
    });

    if (!kr) {
      return res.status(404).json({ message: 'Monthly Key Result not found' });
    }

    const weightNum = monthWeight !== undefined ? parseFloat(monthWeight) : 1.0;
    if (isNaN(weightNum) || weightNum < 0) {
      return res.status(400).json({ message: 'monthWeight must be a non-negative number' });
    }

    const updatedKr = await prisma.keyResult.update({
      where: { id: krId },
      data: {
        annualKeyResultId,
        monthWeight: weightNum,
      }
    });

    // Recalculate cascade
    await cascadeMonthlyKrToAnnual(annualKeyResultId);

    return res.status(200).json({
      message: 'Monthly KR successfully linked to Annual Key Result',
      keyResult: updatedKr
    });
  } catch (error) {
    console.error('Link monthly KR error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
