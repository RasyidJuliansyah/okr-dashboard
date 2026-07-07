"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardSummary = getDashboardSummary;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function getDashboardSummary(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { id: userId, role } = req.user;
        let scope = req.query.scope || 'self';
        // Role-based restrictions on scope
        if (role === 'EMPLOYEE') {
            scope = 'self';
        }
        else if (role === 'MANAGER' && scope === 'company') {
            scope = 'team'; // Downgrade managers to team scope if they try to access company
        }
        // Fetch user details to get team ID
        const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { teamId: true },
        });
        const teamId = dbUser?.teamId;
        // Build query conditions based on scope
        let whereClause = {};
        if (scope === 'self') {
            whereClause.ownerId = userId;
        }
        else if (scope === 'team') {
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
        }
        else if (scope === 'company') {
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
                if (kr.status === 'ON_TRACK')
                    onTrackCount++;
                else if (kr.status === 'AT_RISK')
                    atRiskCount++;
                else if (kr.status === 'OFF_TRACK')
                    offTrackCount++;
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
            objectives: detailedObjectives,
        });
    }
    catch (error) {
        console.error('Get dashboard summary error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
