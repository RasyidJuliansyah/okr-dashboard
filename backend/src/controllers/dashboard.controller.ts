import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export async function getDashboardSummary(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id: userId, role } = req.user;
    let scope = req.query.scope as string || 'self';

    // Role-based restrictions on scope
    if (role === 'EMPLOYEE') {
      scope = 'self';
    } else if (role === 'MANAGER' && scope === 'company') {
      scope = 'team'; // Downgrade managers to team scope if they try to access company
    }

    // Fetch user details to get team ID
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true },
    });

    const teamId = dbUser?.teamId;

    // Build query conditions based on scope
    let whereClause: any = {};

    if (scope === 'self') {
      whereClause.ownerId = userId;
    } else if (scope === 'team') {
      if (!teamId) {
        // User is not in a team, return empty
        return res.status(200).json({
          scope,
          metrics: { totalObjectives: 0, averageProgress: 0, onTrackCount: 0, atRiskCount: 0, offTrackCount: 0 },
          objectives: [],
        });
      }
      // Get all user IDs in the same team
      const teamUsers = await prisma.user.findMany({
        where: { teamId },
        select: { id: true },
      });
      const teamUserIds = teamUsers.map(u => u.id);
      whereClause.ownerId = { in: teamUserIds };
    } else if (scope === 'company') {
      // Company scope shows everything, no ownerId filter
    }

    // Fetch objectives and nested Key Results
    const objectives = await prisma.objective.findMany({
      where: whereClause,
      include: {
        keyResults: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate metrics
    let totalObjectives = objectives.length;
    let totalKRs = 0;
    let sumProgress = 0;
    let onTrackCount = 0;
    let atRiskCount = 0;
    let offTrackCount = 0;

    const detailedObjectives = objectives.map(obj => {
      let objProgressSum = 0;
      let objKrCount = obj.keyResults.length;

      const keyResultsWithProgress = obj.keyResults.map(kr => {
        totalKRs++;
        // Calculate individual KR progress percentage
        const progressPercent = kr.targetValue > 0 
          ? Math.min(100, Math.max(0, (kr.currentValue / kr.targetValue) * 100))
          : 0;

        sumProgress += progressPercent;
        objProgressSum += progressPercent;

        // Categorize status count
        if (kr.status === 'ON_TRACK') onTrackCount++;
        else if (kr.status === 'AT_RISK') atRiskCount++;
        else if (kr.status === 'OFF_TRACK') offTrackCount++;

        return {
          ...kr,
          progress: progressPercent,
        };
      });

      const avgObjProgress = objKrCount > 0 ? objProgressSum / objKrCount : 0;

      return {
        ...obj,
        keyResults: keyResultsWithProgress,
        progress: avgObjProgress,
      };
    });

    const averageProgress = totalKRs > 0 ? sumProgress / totalKRs : 0;

    // Calculate previous metrics for comparison if date range is provided
    const compareFrom = req.query.compareFrom as string | undefined;
    const compareTo = req.query.compareTo as string | undefined;
    let previousMetrics: any = null;

    if (compareFrom && compareTo) {
      const fromDate = new Date(compareFrom);
      const toDate = new Date(compareTo);
      toDate.setHours(23, 59, 59, 999);

      const krIds = detailedObjectives.flatMap(obj => obj.keyResults.map(kr => kr.id));

      // 1. Check if there are any updates in the selected range
      const updatesInPeriod = await prisma.krUpdate.findMany({
        where: {
          keyResultId: { in: krIds },
          updatedAt: { gte: fromDate, lte: toDate },
        },
        select: { id: true },
      });

      if (updatesInPeriod.length > 0) {
        // 2. Fetch all updates for these KRs to correctly reconstruct historical state
        const allUpdates = await prisma.krUpdate.findMany({
          where: {
            keyResultId: { in: krIds },
          },
          orderBy: {
            updatedAt: 'asc',
          },
        });

        // Group updates by keyResultId
        const updatesByKrMap = new Map<string, typeof allUpdates>();
        for (const u of allUpdates) {
          if (!updatesByKrMap.has(u.keyResultId)) {
            updatesByKrMap.set(u.keyResultId, []);
          }
          updatesByKrMap.get(u.keyResultId)!.push(u);
        }

        let prevSumProgress = 0;
        let prevOnTrack = 0;
        let prevAtRisk = 0;
        let prevOffTrack = 0;
        let prevTotalKRs = 0;

        for (const obj of detailedObjectives) {
          for (const kr of obj.keyResults) {
            prevTotalKRs++;
            const krUpdates = updatesByKrMap.get(kr.id) || [];
            
            let val = kr.currentValue;

            // Filter updates that happened before or equal to target end date
            const updatesBeforeOrEqualToTarget = krUpdates.filter(u => new Date(u.updatedAt) <= toDate);
            const updatesAfterTarget = krUpdates.filter(u => new Date(u.updatedAt) > toDate);

            if (updatesBeforeOrEqualToTarget.length > 0) {
              // The value was the newValue of the last update before/at the target date
              val = updatesBeforeOrEqualToTarget[updatesBeforeOrEqualToTarget.length - 1].newValue;
            } else if (updatesAfterTarget.length > 0) {
              // The value was the oldValue of the first update after target date
              val = updatesAfterTarget[0].oldValue;
            }

            const pct = kr.targetValue > 0
              ? Math.min(100, Math.max(0, (val / kr.targetValue) * 100))
              : 0;

            prevSumProgress += pct;

            if (pct >= 80) prevOnTrack++;
            else if (pct >= 50) prevAtRisk++;
            else prevOffTrack++;
          }
        }

        previousMetrics = {
          averageProgress: prevTotalKRs > 0 ? Math.round((prevSumProgress / prevTotalKRs) * 10) / 10 : 0,
          onTrackCount: prevOnTrack,
          atRiskCount: prevAtRisk,
          offTrackCount: prevOffTrack,
          rangeLabel: `${compareFrom} s/d ${compareTo}`,
        };
      }
    }

    return res.status(200).json({
      scope,
      metrics: {
        totalObjectives,
        totalKeyResults: totalKRs,
        averageProgress: Math.round(averageProgress * 10) / 10,
        onTrackCount,
        atRiskCount,
        offTrackCount,
      },
      previousMetrics,
      objectives: detailedObjectives,
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
