import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

const PERSPECTIVES = [
  "FINANCIAL",
  "CUSTOMER",
  "INTERNAL_PROCESS",
  "LEARNING_GROWTH",
];

export async function getBscOverview(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Fetch all annual key results with their parent objectives
    const keyResults = await prisma.annualKeyResult.findMany({
      where: { isActive: true },
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
    PERSPECTIVES.forEach((p) => {
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
    keyResults.forEach((kr) => {
      const p = kr.bscPerspective;
      if (!bscData[p]) return; // Safeguard

      const progress =
        kr.targetValue > 0
          ? Math.min(100, Math.max(0, (kr.currentValue / kr.targetValue) * 100))
          : 0;

      const krWithProgress = {
        ...kr,
        progress: Math.round(progress * 10) / 10,
      };

      bscData[p].krs.push(krWithProgress);
      bscData[p].metrics.totalCount++;

      if (kr.status === "ON_TRACK") bscData[p].metrics.onTrackCount++;
      else if (kr.status === "AT_RISK") bscData[p].metrics.atRiskCount++;
      else if (kr.status === "OFF_TRACK") bscData[p].metrics.offTrackCount++;

      bscData[p].metrics.averageProgress += progress;
    });

    // Finalize averages
    PERSPECTIVES.forEach((p) => {
      const count = bscData[p].metrics.totalCount;
      if (count > 0) {
        bscData[p].metrics.averageProgress =
          Math.round((bscData[p].metrics.averageProgress / count) * 10) / 10;
      }
    });

    return res.status(200).json(bscData);
  } catch (error) {
    console.error("Get BSC overview error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── C-Level Executive BSC Dashboard ──────────────────────────────────────

export async function getCLevelBscDashboard(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { month } = req.query;
    const where: any = { isActive: true };
    if (month) {
      where.month = String(month);
    }

    // 1. Fetch all KRs with context
    const keyResults = await prisma.keyResult.findMany({
      where,
      include: {
        objective: { select: { title: true, year: true } },
        assignments: {
          where: { raciRole: "RESPONSIBLE" },
          include: {
            user: { select: { id: true, name: true, department: true } },
          },
        },
        departments: { select: { department: true } },
        updates: {
          orderBy: { updatedAt: "asc" },
          select: { newValue: true, updatedAt: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 2. Aggregate by BSC perspective
    const perspectiveMap: Record<string, any> = {};
    PERSPECTIVES.forEach((p) => {
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
    const deptMap: Record<
      string,
      { name: string; totalProgress: number; count: number }
    > = {};

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
      const label = `${d.toLocaleString("default", { month: "short" })} W${Math.ceil(d.getDate() / 7)}`;
      trendWeeks.push({ label, weekStart: new Date(d) });
    }

    // trendAccum[perspective][weekIndex] = { sum, count }
    const trendAccum: Record<string, { sum: number; count: number }[]> = {};
    PERSPECTIVES.forEach((p) => {
      trendAccum[p] = Array.from({ length: 8 }, () => ({ sum: 0, count: 0 }));
    });

    keyResults.forEach((kr) => {
      const p = kr.bscPerspective;
      if (!perspectiveMap[p]) return;

      const progress =
        kr.targetValue > 0
          ? Math.min(100, Math.max(0, (kr.currentValue / kr.targetValue) * 100))
          : 0;
      const progressRounded = Math.round(progress * 10) / 10;

      perspectiveMap[p].totalCount++;
      perspectiveMap[p].totalProgress += progressRounded;

      if (kr.status === "ON_TRACK") perspectiveMap[p].onTrackCount++;
      else if (kr.status === "AT_RISK") perspectiveMap[p].atRiskCount++;
      else if (kr.status === "OFF_TRACK") perspectiveMap[p].offTrackCount++;

      // Department aggregation
      kr.departments.forEach((d) => {
        if (!deptMap[d.department]) {
          deptMap[d.department] = {
            name: d.department,
            totalProgress: 0,
            count: 0,
          };
        }
        deptMap[d.department].totalProgress += progressRounded;
        deptMap[d.department].count++;
      });

      // Critical KRs (AT_RISK or OFF_TRACK)
      if (kr.status === "AT_RISK" || kr.status === "OFF_TRACK") {
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
          departments: kr.departments.map((d) => d.department),
        });
      }

      // Trend mapping: each KrUpdate to the appropriate week bucket
      if (kr.updates.length > 0) {
        kr.updates.forEach((upd) => {
          const updDate = new Date(upd.updatedAt);
          for (let wi = trendWeeks.length - 1; wi >= 0; wi--) {
            if (updDate >= trendWeeks[wi].weekStart) {
              const pct =
                kr.targetValue > 0
                  ? Math.min(
                      100,
                      Math.max(0, (upd.newValue / kr.targetValue) * 100),
                    )
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
    PERSPECTIVES.forEach((p) => {
      const count = perspectiveMap[p].totalCount;
      perspectiveMap[p].averageProgress =
        count > 0
          ? Math.round((perspectiveMap[p].totalProgress / count) * 10) / 10
          : 0;
      delete perspectiveMap[p].totalProgress;
    });

    // Finalize trend data
    const trendData: Record<string, (number | null)[]> = {};
    PERSPECTIVES.forEach((p) => {
      trendData[p] = trendAccum[p].map((b) =>
        b.count > 0 ? Math.round((b.sum / b.count) * 10) / 10 : null,
      );
    });

    // Department averages, sorted by progress desc
    const byDepartment = Object.values(deptMap)
      .map((d) => ({
        department: d.name,
        averageProgress:
          d.count > 0 ? Math.round((d.totalProgress / d.count) * 10) / 10 : 0,
        krCount: d.count,
      }))
      .sort((a, b) => b.averageProgress - a.averageProgress);

    // Overall health score = mean of non-empty perspectives
    const nonEmpty = PERSPECTIVES.filter(
      (p) => perspectiveMap[p].totalCount > 0,
    );
    const overallHealthScore =
      nonEmpty.length > 0
        ? Math.round(
            (nonEmpty.reduce(
              (s, p) => s + perspectiveMap[p].averageProgress,
              0,
            ) /
              nonEmpty.length) *
              10,
          ) / 10
        : 0;

    const totalKRs = keyResults.length;
    const totalOnTrack = keyResults.filter(
      (k) => k.status === "ON_TRACK",
    ).length;
    const totalAtRisk = keyResults.filter((k) => k.status === "AT_RISK").length;
    const totalOffTrack = keyResults.filter(
      (k) => k.status === "OFF_TRACK",
    ).length;

    // Calculate monthly health scores across all 12 sprint months for the year
    const targetYear = req.query.year
      ? parseInt(String(req.query.year))
      : month
      ? parseInt(String(month).split("-")[0])
      : 2026;

    const allYearKrs = await prisma.keyResult.findMany({
      where: {
        isActive: true,
        OR: [
          { month: { startsWith: `${targetYear}-` } },
          { objective: { year: `${targetYear}` } },
          { objective: { year: `Q1-${targetYear}` } },
          { objective: { year: `Q2-${targetYear}` } },
          { objective: { year: `Q3-${targetYear}` } },
          { objective: { year: `Q4-${targetYear}` } },
        ],
      },
      select: {
        month: true,
        bscPerspective: true,
        currentValue: true,
        targetValue: true,
      },
    });

    const calcPerspectiveHealth = (
      krs: { bscPerspective: string; currentValue: number; targetValue: number }[],
    ) => {
      const pMap: Record<string, { count: number; totalProgress: number }> = {};
      PERSPECTIVES.forEach((p) => {
        pMap[p] = { count: 0, totalProgress: 0 };
      });
      krs.forEach((kr) => {
        const p = kr.bscPerspective;
        if (!pMap[p]) return;
        const progress =
          kr.targetValue > 0
            ? Math.min(100, Math.max(0, (kr.currentValue / kr.targetValue) * 100))
            : 0;
        pMap[p].count++;
        pMap[p].totalProgress += Math.round(progress * 10) / 10;
      });
      const validPerspectives = PERSPECTIVES.filter((p) => pMap[p].count > 0);
      if (validPerspectives.length === 0) return null;
      const avgSum = validPerspectives.reduce((sum, p) => {
        return sum + Math.round((pMap[p].totalProgress / pMap[p].count) * 10) / 10;
      }, 0);
      return Math.round((avgSum / validPerspectives.length) * 10) / 10;
    };

    const monthlyHealthScores: Record<string, number | null> = {};
    for (let m = 1; m <= 12; m++) {
      const mStr = `${targetYear}-${String(m).padStart(2, "0")}`;
      const monthKrs = allYearKrs.filter((k) => k.month === mStr);
      monthlyHealthScores[mStr] = calcPerspectiveHealth(monthKrs);
    }

    const ytdHealthScore = calcPerspectiveHealth(allYearKrs) ?? 0;

    return res.status(200).json({
      overallHealthScore,
      ytdHealthScore,
      monthlyHealthScores,
      totalKRs,
      totalOnTrack,
      totalAtRisk,
      totalOffTrack,
      bscByPerspective: perspectiveMap,
      criticalKrs: criticalKrs.sort((a, b) => a.progress - b.progress),
      byDepartment,
      trendData,
      trendLabels: trendWeeks.map((w) => w.label),
    });
  } catch (error) {
    console.error("Get C-Level BSC dashboard error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── OKR Cascading Tree & Matrix Data ──────────────────────────────────────

export async function getCascadingTree(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const {
      quarter,
      sprintId,
      teamId,
      employeeId,
      perspective,
      year,
      status,
      search,
    } = req.query as Record<string, string | undefined>;

    // 1. Fetch reference lists for filters
    const [allSprints, allTeams, allUsers] = await Promise.all([
      prisma.sprint.findMany({
        where: { isActive: true },
        orderBy: { orderIndex: "asc" },
        select: { id: true, name: true, status: true, year: true, startDate: true, endDate: true },
      }),
      prisma.team.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, department: true },
      }),
      prisma.user.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, role: true, department: true, position: true, teamId: true },
      }),
    ]);

    // 2. Fetch full hierarchy of Objectives -> KeyResults -> Initiatives -> Tasks
    const objectives = await prisma.objective.findMany({
      where: {
        isActive: true,
        ...(year && year !== "ALL" ? { year: { contains: year.replace("FY ", "") } } : {}),
        ...(quarter && quarter !== "ALL"
          ? {
              OR: [
                { quarter: { equals: quarter } },
                { year: { contains: quarter } },
              ],
            }
          : {}),
      },
      include: {
        keyResults: {
          where: {
            isActive: true,
            ...(perspective && perspective !== "ALL" ? { bscPerspective: perspective } : {}),
            ...(status && status !== "ALL" ? { status } : {}),
          },
          include: {
            departments: true,
            sourceLinksA: {
              where: { isActive: true },
              include: {
                targetKr: {
                  select: {
                    id: true,
                    title: true,
                    status: true,
                    bscPerspective: true,
                    departments: true,
                    initiatives: {
                      select: {
                        team: { select: { id: true, name: true } },
                      },
                    },
                  },
                },
              },
            },
            sourceLinksB: {
              where: { isActive: true },
              include: {
                sourceKr: {
                  select: {
                    id: true,
                    title: true,
                    status: true,
                    bscPerspective: true,
                    departments: true,
                    initiatives: {
                      select: {
                        team: { select: { id: true, name: true } },
                      },
                    },
                  },
                },
              },
            },
            assignments: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, department: true, position: true, role: true },
                },
              },
            },
            initiatives: {
              where: {
                isActive: true,
                ...(sprintId && sprintId !== "ALL" ? { sprintId } : {}),
                ...(teamId && teamId !== "ALL" ? { teamId } : {}),
              },
              include: {
                team: { select: { id: true, name: true } },
                owner: { select: { id: true, name: true, email: true, position: true } },
                assignedLeader: { select: { id: true, name: true, email: true } },
                sprint: { select: { id: true, name: true } },
                tasks: {
                  where: {
                    isActive: true,
                    ...(sprintId && sprintId !== "ALL" ? { sprintId } : {}),
                    ...(employeeId && employeeId !== "ALL" ? { assignedTeamMemberId: employeeId } : {}),
                  },
                  include: {
                    assignedTeamMember: {
                      select: { id: true, name: true, email: true, position: true },
                    },
                    sprint: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });


    // 3. Perspectives metadata and filtering
    const perspectiveMeta: Record<string, { label: string; code: string; color: string }> = {
      FINANCIAL: { label: "Finance", code: "FIN", color: "#10b981" },
      CUSTOMER: { label: "Customer", code: "CUS", color: "#3b82f6" },
      INTERNAL_PROCESS: { label: "Internal Process", code: "PRC", color: "#8b5cf6" },
      LEARNING_GROWTH: { label: "Learning & Growth", code: "LRN", color: "#f59e0b" },
    };

    const treePerspectives: any[] = [];
    const teamCounts: Record<string, { name: string; count: number }> = {};
    allTeams.forEach((t) => {
      teamCounts[t.id] = { name: t.name, count: 0 };
    });

    const searchLower = (search || "").toLowerCase().trim();

    PERSPECTIVES.forEach((pKey) => {
      if (perspective && perspective !== "ALL" && perspective !== pKey) {
        return;
      }

      const pMeta = perspectiveMeta[pKey] || { label: pKey, code: pKey.slice(0, 3), color: "#38bdf8" };
      const pObjectives: any[] = [];
      let pTotalKrs = 0;
      let pOnTrack = 0;
      let pAtRisk = 0;
      let pOffTrack = 0;
      let pProgressSum = 0;

      objectives.forEach((obj) => {
        const krsForP = obj.keyResults.filter((kr) => kr.bscPerspective === pKey);
        if (krsForP.length === 0) return;

        const processedKrs: any[] = [];

        krsForP.forEach((kr) => {
          if (employeeId && employeeId !== "ALL") {
            const isAssignedKr = kr.assignments.some((a) => a.userId === employeeId);
            const isInitiativeOwner = kr.initiatives.some((i) => i.ownerId === employeeId);
            const isTaskAssignee = kr.initiatives.some((i) =>
              i.tasks.some((t) => t.assignedTeamMemberId === employeeId),
            );
            if (!isAssignedKr && !isInitiativeOwner && !isTaskAssignee) return;
          }

          if (teamId && teamId !== "ALL") {
            const hasTeamInit = kr.initiatives.some((i) => i.teamId === teamId);
            const hasTeamDept = kr.departments.some((d) => {
              const matchedTeam = allTeams.find((t) => t.department === d.department);
              return matchedTeam?.id === teamId;
            });
            if (!hasTeamInit && !hasTeamDept) return;
          }

          if (searchLower) {
            const matchesObj = obj.title.toLowerCase().includes(searchLower);
            const matchesKr = kr.title.toLowerCase().includes(searchLower);
            const matchesInit = kr.initiatives.some((i) => i.title.toLowerCase().includes(searchLower));
            const matchesTask = kr.initiatives.some((i) =>
              i.tasks.some((t) => t.title.toLowerCase().includes(searchLower)),
            );
            const matchesTeam = kr.initiatives.some((i) => i.team?.name?.toLowerCase().includes(searchLower));
            if (!matchesObj && !matchesKr && !matchesInit && !matchesTask && !matchesTeam) return;
          }

          const progress =
            kr.targetValue > 0
              ? Math.min(100, Math.max(0, (kr.currentValue / kr.targetValue) * 100))
              : 0;
          const roundedProgress = Math.round(progress * 10) / 10;

          kr.initiatives.forEach((i) => {
            if (teamCounts[i.teamId]) teamCounts[i.teamId].count++;
          });

          const primaryAssignment = kr.assignments.find((a) => a.raciRole === "RESPONSIBLE") || kr.assignments[0];
          const primaryOwner = primaryAssignment?.user || null;

          let depts = kr.departments.map((d) => d.department);
          if (depts.length === 0) {
            const titleMatch = kr.title.match(/^\[([^\]]+)\]/);
            if (titleMatch) {
              depts = [titleMatch[1]];
            } else if (kr.initiatives.length > 0 && kr.initiatives[0].team?.name) {
              depts = [kr.initiatives[0].team.name];
            }
          }

          processedKrs.push({
            id: kr.id,
            title: kr.title,
            targetValue: kr.targetValue,
            currentValue: kr.currentValue,
            unit: kr.unit,
            status: kr.status,
            progress: roundedProgress,
            targetType: kr.targetType,
            bscPerspective: kr.bscPerspective,
            month: kr.month,
            departments: depts,
            owner: primaryOwner,
            causalLinks: {
              outbound: (kr.sourceLinksA || []).map((l: any) => ({
                id: l.id,
                relationship: l.relationship,
                targetKrId: l.targetKr?.id,
                targetKrTitle: l.targetKr?.title,
                targetPerspective: l.targetKr?.bscPerspective,
                targetTeams: (l.targetKr?.departments || []).map((d: any) => d.department).length
                  ? l.targetKr.departments.map((d: any) => d.department)
                  : (l.targetKr?.initiatives || []).map((i: any) => i.team?.name).filter(Boolean),
              })),
              inbound: (kr.sourceLinksB || []).map((l: any) => ({
                id: l.id,
                relationship: l.relationship,
                sourceKrId: l.sourceKr?.id,
                sourceKrTitle: l.sourceKr?.title,
                sourcePerspective: l.sourceKr?.bscPerspective,
                sourceTeams: (l.sourceKr?.departments || []).map((d: any) => d.department).length
                  ? l.sourceKr.departments.map((d: any) => d.department)
                  : (l.sourceKr?.initiatives || []).map((i: any) => i.team?.name).filter(Boolean),
              })),
            },
            initiatives: kr.initiatives.map((init) => {
              const initProg =
                init.targetValue > 0
                  ? Math.min(100, Math.max(0, (init.currentValue / init.targetValue) * 100))
                  : init.kanbanStatus === "DONE"
                  ? 100
                  : 0;

              const mappedTasks = init.tasks.map((task) => {
                const taskProg =
                  task.targetValue && task.targetValue > 0
                    ? Math.min(100, Math.max(0, (task.currentValue / task.targetValue) * 100))
                    : task.kanbanStatus === "DONE"
                    ? 100
                    : 0;
                return {
                  id: task.id,
                  title: task.title,
                  description: task.description,
                  targetValue: task.targetValue,
                  currentValue: task.currentValue,
                  unit: task.unit,
                  status: task.status,
                  kanbanStatus: task.kanbanStatus,
                  progress: Math.round(taskProg * 10) / 10,
                  assignedTeamMember: task.assignedTeamMember,
                  assignedUser: task.assignedTeamMember,
                  sprint: task.sprint,
                };
              });

              return {
                id: init.id,
                title: init.title,
                description: init.description,
                targetValue: init.targetValue,
                currentValue: init.currentValue,
                unit: init.unit,
                status: init.status,
                kanbanStatus: init.kanbanStatus,
                progress: Math.round(initProg * 10) / 10,
                sprintMonth: init.sprintMonth,
                sprint: init.sprint,
                team: init.team,
                owner: init.owner,
                tasks: mappedTasks,
                kpis: mappedTasks,
              };
            }),
          });

          pTotalKrs++;
          pProgressSum += roundedProgress;
          if (kr.status === "ON_TRACK") pOnTrack++;
          else if (kr.status === "AT_RISK") pAtRisk++;
          else if (kr.status === "OFF_TRACK") pOffTrack++;
        });

        if (processedKrs.length > 0) {
          const objProgress =
            Math.round(
              (processedKrs.reduce((sum, k) => sum + k.progress, 0) / processedKrs.length) * 10,
            ) / 10;

          pObjectives.push({
            id: obj.id,
            title: obj.title,
            description: obj.description,
            quarter: obj.quarter,
            year: obj.year,
            progress: objProgress,
            status: objProgress >= 70 ? "ON_TRACK" : objProgress >= 40 ? "AT_RISK" : "OFF_TRACK",
            keyResults: processedKrs,
          });
        }
      });

      if (pObjectives.length > 0 || !perspective || perspective === "ALL") {
        treePerspectives.push({
          id: pKey,
          key: pKey,
          name: pMeta.label,
          code: pMeta.code,
          color: pMeta.color,
          totalKrs: pTotalKrs,
          totalObjectives: pObjectives.length,
          averageProgress: pTotalKrs > 0 ? Math.round((pProgressSum / pTotalKrs) * 10) / 10 : 0,
          onTrackCount: pOnTrack,
          atRiskCount: pAtRisk,
          offTrackCount: pOffTrack,
          objectives: pObjectives,
        });
      }
    });

    const totalActiveKrs = treePerspectives.reduce((sum, p) => sum + p.totalKrs, 0);
    const totalTeamHits = Object.values(teamCounts).reduce((s, t) => s + t.count, 0) || 1;
    const teamDistribution = Object.values(teamCounts)
      .filter((t) => t.count > 0)
      .map((t) => ({
        name: t.name,
        krCount: t.count,
        percentage: Math.round((t.count / totalTeamHits) * 100),
      }))
      .sort((a, b) => b.krCount - a.krCount);

    return res.status(200).json({
      root: {
        title: "BSC-OKR Suite",
        subtitle: "SKOLLA STRATEGY 2026",
        year: year || "FY 2026",
      },
      perspectives: treePerspectives,
      totalActiveKrs,
      teamDistribution,
      filterOptions: {
        perspectives: PERSPECTIVES.map((p) => ({
          value: p,
          label: perspectiveMeta[p]?.label || p,
        })),
        sprints: allSprints,
        teams: allTeams,
        employees: allUsers,
        quarters: ["ALL", "Q1", "Q2", "Q3", "Q4", "Annual"],
        years: ["FY 2026", "2026", "Q3-2026"],
        statuses: [
          { value: "ALL", label: "Semua Status" },
          { value: "ON_TRACK", label: "On Track (>70%)" },
          { value: "AT_RISK", label: "At Risk (40% - 70%)" },
          { value: "OFF_TRACK", label: "Off Track (<40%)" },
        ],
      },
    });
  } catch (error) {
    console.error("Get cascading tree error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}


