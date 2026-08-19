import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

const PERSPECTIVES = ['FINANCIAL', 'CUSTOMER', 'INTERNAL_PROCESS', 'LEARNING_GROWTH'];

export async function getBscOverview(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Fetch all annual key results with their parent objectives
    const keyResults = await prisma.annualKeyResult.findMany({
      include: {
        objective: {
          select: {
            title: true,
            year: true,
          },
        },
      },
    });

    // Initialize groupings
    const bscData: any = {};
    PERSPECTIVES.forEach(p => {
      bscData[p] = {
        perspective: p,
        krs: [],
        metrics: {
          totalCount: 0,
          averageProgress: 0,
          onTrackCount: 0,
          atRiskCount: 0,
          offTrackCount: 0,
        },
      };
    });

    // Process and group KRs
    keyResults.forEach(kr => {
      const p = kr.bscPerspective;
      if (!bscData[p]) return; // Safeguard

      const progress = kr.targetValue > 0
        ? Math.min(100, Math.max(0, (kr.currentValue / kr.targetValue) * 100))
        : 0;

      const krWithProgress = {
        ...kr,
        progress: Math.round(progress * 10) / 10,
      };

      bscData[p].krs.push(krWithProgress);
      bscData[p].metrics.totalCount++;

      if (kr.status === 'ON_TRACK') bscData[p].metrics.onTrackCount++;
      else if (kr.status === 'AT_RISK') bscData[p].metrics.atRiskCount++;
      else if (kr.status === 'OFF_TRACK') bscData[p].metrics.offTrackCount++;

      bscData[p].metrics.averageProgress += progress;
    });

    // Finalize averages
    PERSPECTIVES.forEach(p => {
      const count = bscData[p].metrics.totalCount;
      if (count > 0) {
        bscData[p].metrics.averageProgress = Math.round((bscData[p].metrics.averageProgress / count) * 10) / 10;
      }
    });

    return res.status(200).json(bscData);
  } catch (error) {
    console.error('Get BSC overview error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ─── C-Level Executive BSC Dashboard ──────────────────────────────────────

export async function getCLevelBscDashboard(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    // 1. Fetch all KRs with context
    const keyResults = await prisma.keyResult.findMany({
      include: {
        objective: { select: { title: true, year: true } },
        assignments: {
          where: { raciRole: 'RESPONSIBLE' },
          include: { user: { select: { id: true, name: true, department: true } } },
        },
        departments: { select: { department: true } },
        updates: {
          orderBy: { updatedAt: 'asc' },
          select: { newValue: true, updatedAt: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 2. Aggregate by BSC perspective
    const perspectiveMap: Record<string, any> = {};
    PERSPECTIVES.forEach(p => {
      perspectiveMap[p] = {
        perspective: p,
        totalCount: 0,
        onTrackCount: 0,
        atRiskCount: 0,
        offTrackCount: 0,
        totalProgress: 0,
        averageProgress: 0,
      };
    });

    // 3. Department progress aggregation
    const deptMap: Record<string, { name: string; totalProgress: number; count: number }> = {};

    // 4. Critical KRs
    const criticalKrs: any[] = [];

    // 5. Trend: bucket KrUpdates by ISO-week (last 8 weeks)
    const now = new Date();
    const trendWeeks: { label: string; weekStart: Date }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      d.setHours(0, 0, 0, 0);
      // Set to Monday of that week
      const day = d.getDay();
      d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
      const label = `${d.toLocaleString('default', { month: 'short' })} W${Math.ceil(d.getDate() / 7)}`;
      trendWeeks.push({ label, weekStart: new Date(d) });
    }

    // trendAccum[perspective][weekIndex] = { sum, count }
    const trendAccum: Record<string, { sum: number; count: number }[]> = {};
    PERSPECTIVES.forEach(p => {
      trendAccum[p] = Array.from({ length: 8 }, () => ({ sum: 0, count: 0 }));
    });

    keyResults.forEach(kr => {
      const p = kr.bscPerspective;
      if (!perspectiveMap[p]) return;

      const progress = kr.targetValue > 0
        ? Math.min(100, Math.max(0, (kr.currentValue / kr.targetValue) * 100))
        : 0;
      const progressRounded = Math.round(progress * 10) / 10;

      perspectiveMap[p].totalCount++;
      perspectiveMap[p].totalProgress += progressRounded;

      if (kr.status === 'ON_TRACK') perspectiveMap[p].onTrackCount++;
      else if (kr.status === 'AT_RISK') perspectiveMap[p].atRiskCount++;
      else if (kr.status === 'OFF_TRACK') perspectiveMap[p].offTrackCount++;

      // Department aggregation
      kr.departments.forEach(d => {
        if (!deptMap[d.department]) {
          deptMap[d.department] = { name: d.department, totalProgress: 0, count: 0 };
        }
        deptMap[d.department].totalProgress += progressRounded;
        deptMap[d.department].count++;
      });

      // Critical KRs (AT_RISK or OFF_TRACK)
      if (kr.status === 'AT_RISK' || kr.status === 'OFF_TRACK') {
        const responsible = kr.assignments[0]?.user ?? null;
        criticalKrs.push({
          id: kr.id,
          title: kr.title,
          bscPerspective: kr.bscPerspective,
          status: kr.status,
          progress: progressRounded,
          currentValue: kr.currentValue,
          targetValue: kr.targetValue,
          unit: kr.unit,
          objectiveTitle: kr.objective.title,
          year: kr.objective.year,
          responsible,
          departments: kr.departments.map(d => d.department),
        });
      }

      // Trend mapping: each KrUpdate to the appropriate week bucket
      if (kr.updates.length > 0) {
        kr.updates.forEach(upd => {
          const updDate = new Date(upd.updatedAt);
          for (let wi = trendWeeks.length - 1; wi >= 0; wi--) {
            if (updDate >= trendWeeks[wi].weekStart) {
              const pct = kr.targetValue > 0
                ? Math.min(100, Math.max(0, (upd.newValue / kr.targetValue) * 100))
                : 0;
              trendAccum[p][wi].sum += pct;
              trendAccum[p][wi].count++;
              break;
            }
          }
        });
      }
    });

    // Finalize perspective averages
    PERSPECTIVES.forEach(p => {
      const count = perspectiveMap[p].totalCount;
      perspectiveMap[p].averageProgress = count > 0
        ? Math.round((perspectiveMap[p].totalProgress / count) * 10) / 10
        : 0;
      delete perspectiveMap[p].totalProgress;
    });

    // Finalize trend data
    const trendData: Record<string, (number | null)[]> = {};
    PERSPECTIVES.forEach(p => {
      trendData[p] = trendAccum[p].map(b =>
        b.count > 0 ? Math.round((b.sum / b.count) * 10) / 10 : null
      );
    });

    // Department averages, sorted by progress desc
    const byDepartment = Object.values(deptMap).map(d => ({
      department: d.name,
      averageProgress: d.count > 0 ? Math.round((d.totalProgress / d.count) * 10) / 10 : 0,
      krCount: d.count,
    })).sort((a, b) => b.averageProgress - a.averageProgress);

    // Overall health score = mean of non-empty perspectives
    const nonEmpty = PERSPECTIVES.filter(p => perspectiveMap[p].totalCount > 0);
    const overallHealthScore = nonEmpty.length > 0
      ? Math.round(nonEmpty.reduce((s, p) => s + perspectiveMap[p].averageProgress, 0) / nonEmpty.length * 10) / 10
      : 0;

    const totalKRs = keyResults.length;
    const totalOnTrack = keyResults.filter(k => k.status === 'ON_TRACK').length;
    const totalAtRisk = keyResults.filter(k => k.status === 'AT_RISK').length;
    const totalOffTrack = keyResults.filter(k => k.status === 'OFF_TRACK').length;

    return res.status(200).json({
      overallHealthScore,
      totalKRs,
      totalOnTrack,
      totalAtRisk,
      totalOffTrack,
      bscByPerspective: perspectiveMap,
      criticalKrs: criticalKrs.sort((a, b) => a.progress - b.progress),
      byDepartment,
      trendData,
      trendLabels: trendWeeks.map(w => w.label),
    });
  } catch (error) {
    console.error('Get C-Level BSC dashboard error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
