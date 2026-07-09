import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export async function createCausalLink(req: AuthRequest, res: Response) {
  try {
    const { sourceKrId, targetKrId, relationship, note } = req.body;

    if (!sourceKrId || !targetKrId || !relationship) {
      return res.status(400).json({ message: 'sourceKrId, targetKrId, and relationship are required' });
    }

    if (sourceKrId === targetKrId) {
      return res.status(400).json({ message: 'Source and target Key Results cannot be the same' });
    }

    // Verify both Key Results exist
    const sourceKr = await prisma.keyResult.findUnique({ where: { id: sourceKrId } });
    const targetKr = await prisma.keyResult.findUnique({ where: { id: targetKrId } });

    if (!sourceKr || !targetKr) {
      return res.status(404).json({ message: 'One or both Key Results not found' });
    }

    // Create the causal link
    const newLink = await prisma.causalLink.create({
      data: {
        sourceKrId,
        targetKrId,
        relationship,
        note: note || null,
        createdBy: req.user?.name || req.user?.email || 'System Admin',
      },
    });

    return res.status(201).json(newLink);
  } catch (error) {
    console.error('Create causal link error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getStrategyMap(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Fetch all KRs for nodes
    const keyResults = await prisma.keyResult.findMany({
      include: {
        objective: {
          select: {
            title: true,
            quarter: true,
          },
        },
      },
    });

    // Fetch all CausalLinks for edges
    const links = await prisma.causalLink.findMany();

    // Group keyResults by BSC perspective
    const groups: { [key: string]: typeof keyResults } = {
      FINANCIAL: [],
      CUSTOMER: [],
      INTERNAL_PROCESS: [],
      LEARNING_GROWTH: [],
    };

    keyResults.forEach(kr => {
      const perspective = kr.bscPerspective;
      if (groups[perspective]) {
        groups[perspective].push(kr);
      } else {
        groups.LEARNING_GROWTH.push(kr);
      }
    });

    const nodeWidth = 320;
    const centerX = 640;
    const nodes: any[] = [];
    const perspectives = ['FINANCIAL', 'CUSTOMER', 'INTERNAL_PROCESS', 'LEARNING_GROWTH'];

    perspectives.forEach((perspective, level) => {
      const levelKrs = groups[perspective];
      const count = levelKrs.length;
      const y = 80 + level * 220; // FINANCIAL (80) -> CUSTOMER (300) -> INTERNAL_PROCESS (520) -> LEARNING_GROWTH (740)

      levelKrs.forEach((kr, index) => {
        const progress = kr.targetValue > 0 
          ? Math.min(100, Math.max(0, (kr.currentValue / kr.targetValue) * 100))
          : 0;

        // Center nodes on this level horizontally
        const offset = index - (count - 1) / 2;
        const x = centerX + offset * nodeWidth;

        nodes.push({
          id: kr.id,
          type: 'custom',
          position: { x, y },
          data: {
            title: kr.title,
            status: kr.status,
            progress: Math.round(progress),
            perspective: kr.bscPerspective,
            objectiveTitle: kr.objective?.title,
            objectiveQuarter: kr.objective?.quarter,
          },
        });
      });
    });

    const edges = links.map(link => ({
      id: link.id,
      source: link.sourceKrId,
      target: link.targetKrId,
      animated: true,
      label: link.relationship === 'driver' ? 'Driver' : 'Outcome',
      data: {
        note: link.note,
        createdBy: link.createdBy,
      },
    }));

    return res.status(200).json({ nodes, edges });
  } catch (error) {
    console.error('Get strategy map error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function deleteCausalLink(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const link = await prisma.causalLink.findUnique({ where: { id } });
    if (!link) {
      return res.status(404).json({ message: 'Causal link not found' });
    }

    await prisma.causalLink.delete({ where: { id } });

    return res.status(200).json({ message: 'Causal link deleted successfully' });
  } catch (error) {
    console.error('Delete causal link error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateCausalLink(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { sourceKrId, targetKrId, relationship, note } = req.body;

    const link = await prisma.causalLink.findUnique({ where: { id } });
    if (!link) {
      return res.status(404).json({ message: 'Causal link not found' });
    }

    if (!sourceKrId || !targetKrId || !relationship) {
      return res.status(400).json({ message: 'sourceKrId, targetKrId, and relationship are required' });
    }

    if (sourceKrId === targetKrId) {
      return res.status(400).json({ message: 'Source and target Key Results cannot be the same' });
    }

    const sourceKr = await prisma.keyResult.findUnique({ where: { id: sourceKrId } });
    const targetKr = await prisma.keyResult.findUnique({ where: { id: targetKrId } });

    if (!sourceKr || !targetKr) {
      return res.status(404).json({ message: 'One or both Key Results not found' });
    }

    const updatedLink = await prisma.causalLink.update({
      where: { id },
      data: {
        sourceKrId,
        targetKrId,
        relationship,
        note: note || null,
      },
    });

    return res.status(200).json(updatedLink);
  } catch (error) {
    console.error('Update causal link error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
