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
    });
    if (!kr) {
      return res.status(404).json({ message: 'Key Result not found' });
    }

    await prisma.keyResult.delete({
      where: { id },
    });

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

