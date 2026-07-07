"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBscOverview = getBscOverview;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const PERSPECTIVES = ['FINANCIAL', 'CUSTOMER', 'INTERNAL_PROCESS', 'LEARNING_GROWTH'];
async function getBscOverview(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // Fetch all key results with their parent objectives
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
        // Initialize groupings
        const bscData = {};
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
            if (!bscData[p])
                return; // Safeguard
            const progress = kr.targetValue > 0
                ? Math.min(100, Math.max(0, (kr.currentValue / kr.targetValue) * 100))
                : 0;
            const krWithProgress = {
                ...kr,
                progress: Math.round(progress * 10) / 10,
            };
            bscData[p].krs.push(krWithProgress);
            bscData[p].metrics.totalCount++;
            if (kr.status === 'ON_TRACK')
                bscData[p].metrics.onTrackCount++;
            else if (kr.status === 'AT_RISK')
                bscData[p].metrics.atRiskCount++;
            else if (kr.status === 'OFF_TRACK')
                bscData[p].metrics.offTrackCount++;
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
    }
    catch (error) {
        console.error('Get BSC overview error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
