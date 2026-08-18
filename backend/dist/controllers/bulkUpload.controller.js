"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUploadKRs = bulkUploadKRs;
exports.bulkUploadInitiatives = bulkUploadInitiatives;
exports.bulkUploadObjectives = bulkUploadObjectives;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const VALID_BSC_PERSPECTIVES = ['FINANCIAL', 'CUSTOMER', 'INTERNAL_PROCESS', 'LEARNING_GROWTH'];
function normalizeBscPerspective(val) {
    if (!val)
        return 'FINANCIAL';
    const clean = val.toUpperCase().trim().replace(/[-\s]+/g, '_');
    if (clean.includes('FINANC'))
        return 'FINANCIAL';
    if (clean.includes('CUSTOM'))
        return 'CUSTOMER';
    if (clean.includes('PROCESS') || clean.includes('INTERNAL'))
        return 'INTERNAL_PROCESS';
    if (clean.includes('LEARN') || clean.includes('GROWTH'))
        return 'LEARNING_GROWTH';
    if (VALID_BSC_PERSPECTIVES.includes(clean))
        return clean;
    return 'FINANCIAL';
}
function normalizeKanbanStatus(val) {
    if (!val)
        return 'TODO';
    const clean = val.toUpperCase().trim().replace(/[-\s]+/g, '_');
    if (clean === 'DROP' || clean === 'DROPPED' || clean === 'BATAL' || clean === 'CANCELLED')
        return 'DROP';
    if (clean === 'DONE' || clean === 'SELESAI' || clean === 'COMPLETED')
        return 'DONE';
    if (clean === 'IN_PROGRESS' || clean === 'PROGRESS' || clean === 'SEDANG_BERJALAN' || clean === 'DOING')
        return 'IN_PROGRESS';
    return 'TODO';
}
/**
 * POST /api/bulk-upload/krs
 * Body: {
 *   keyResults: Array<{
 *     objectiveId: string; // or objectiveTitle
 *     title: string;
 *     targetValue: number | string;
 *     unit?: string;
 *     bscPerspective?: string;
 *     direction?: string;
 *     R?: string; // Responsible name(s)
 *     A?: string; // Accountable name(s)
 *     C?: string; // Consulted name(s)
 *     I?: string; // Informed name(s)
 *     departments?: string;
 *   }>
 * }
 */
async function bulkUploadKRs(req, res) {
    try {
        const { keyResults } = req.body;
        if (!Array.isArray(keyResults) || keyResults.length === 0) {
            return res.status(400).json({ message: 'Payload keyResults harus berupa array tidak kosong' });
        }
        const currentUserName = req.user?.name || 'Bulk Upload Admin';
        // Preload users and objectives for fast matching
        const allUsers = await prisma.user.findMany({
            select: { id: true, name: true, email: true }
        });
        const allObjectives = await prisma.objective.findMany({
            select: { id: true, title: true }
        });
        const userLookup = new Map();
        for (const u of allUsers) {
            userLookup.set(u.name.toLowerCase().trim(), u);
            userLookup.set(u.email.toLowerCase().trim(), u);
        }
        const objLookup = new Map();
        for (const o of allObjectives) {
            objLookup.set(o.id.toLowerCase().trim(), o.id);
            objLookup.set(o.title.toLowerCase().trim(), o.id);
        }
        const results = {
            total: keyResults.length,
            success: 0,
            warned: 0,
            errors: []
        };
        for (let index = 0; index < keyResults.length; index++) {
            const row = keyResults[index];
            const rowNum = index + 2; // header is row 1
            const itemTitle = row.title ? String(row.title).trim() : `Baris #${rowNum}`;
            try {
                if (!row.title || row.targetValue === undefined || row.targetValue === '') {
                    results.errors.push({
                        row: rowNum,
                        item: itemTitle,
                        reason: 'Title dan Target Value wajib diisi'
                    });
                    continue;
                }
                const targetNum = parseFloat(String(row.targetValue));
                if (isNaN(targetNum) || targetNum <= 0) {
                    results.errors.push({
                        row: rowNum,
                        item: itemTitle,
                        reason: `Target Value '${row.targetValue}' harus angka > 0`
                    });
                    continue;
                }
                // Resolve objectiveId
                let resolvedObjId = '';
                if (row.objectiveId) {
                    const key = String(row.objectiveId).toLowerCase().trim();
                    resolvedObjId = objLookup.get(key) || '';
                    if (!resolvedObjId) {
                        // Partial / substring match
                        for (const o of allObjectives) {
                            if (o.title.toLowerCase().includes(key) || key.includes(o.title.toLowerCase())) {
                                resolvedObjId = o.id;
                                break;
                            }
                        }
                    }
                }
                if (!resolvedObjId) {
                    // If at least one objective exists in database, fallback to the first/latest objective
                    if (allObjectives.length > 0) {
                        resolvedObjId = allObjectives[0].id;
                    }
                    else {
                        // Create a default objective if database has 0 objectives
                        const newObj = await prisma.objective.create({
                            data: {
                                title: 'Corporate Strategic Objectives 2026',
                                quarter: 'Q3-2026',
                            }
                        });
                        allObjectives.push(newObj);
                        objLookup.set(newObj.id.toLowerCase(), newObj.id);
                        objLookup.set(newObj.title.toLowerCase(), newObj.id);
                        resolvedObjId = newObj.id;
                    }
                }
                const bscPerspective = normalizeBscPerspective(row.bscPerspective || 'FINANCIAL');
                const unit = row.unit ? String(row.unit).trim() : '%';
                // Create KR
                const newKR = await prisma.keyResult.create({
                    data: {
                        objectiveId: resolvedObjId,
                        title: itemTitle,
                        targetValue: targetNum,
                        currentValue: 0,
                        unit,
                        bscPerspective,
                        status: 'ON_TRACK',
                    }
                });
                // Resolve RACI assignments
                const raciWarnings = [];
                const raciMap = {
                    R: 'RESPONSIBLE',
                    A: 'ACCOUNTABLE',
                    C: 'CONSULTED',
                    I: 'INFORMED'
                };
                const assignmentsToCreate = [];
                for (const [colKey, roleName] of Object.entries(raciMap)) {
                    const rawNames = row[colKey] ? String(row[colKey]) : '';
                    if (!rawNames.trim())
                        continue;
                    // Split by comma or semicolon
                    const names = rawNames.split(/[,;]+/).map((n) => n.trim()).filter(Boolean);
                    for (const name of names) {
                        const user = userLookup.get(name.toLowerCase());
                        if (user) {
                            assignmentsToCreate.push({ userId: user.id, raciRole: roleName });
                        }
                        else {
                            raciWarnings.push(`Pegawai '${name}' (${colKey}) tidak ditemukan`);
                        }
                    }
                }
                // Apply RACI assignments
                for (const assign of assignmentsToCreate) {
                    await prisma.krAssignment.upsert({
                        where: {
                            keyResultId_userId: {
                                keyResultId: newKR.id,
                                userId: assign.userId
                            }
                        },
                        update: {
                            raciRole: assign.raciRole
                        },
                        create: {
                            keyResultId: newKR.id,
                            userId: assign.userId,
                            raciRole: assign.raciRole,
                            assignedBy: currentUserName
                        }
                    });
                }
                // Apply Departments if provided
                if (row.departments) {
                    const deptNames = String(row.departments).split(/[,;]+/).map((d) => d.trim()).filter(Boolean);
                    for (const dept of deptNames) {
                        await prisma.krDepartment.upsert({
                            where: {
                                keyResultId_department: {
                                    keyResultId: newKR.id,
                                    department: dept
                                }
                            },
                            update: {},
                            create: {
                                keyResultId: newKR.id,
                                department: dept
                            }
                        }).catch(() => { });
                    }
                }
                if (raciWarnings.length > 0) {
                    results.warned++;
                    results.errors.push({
                        row: rowNum,
                        item: itemTitle,
                        reason: `KR berhasil dibuat, tetapi ada peringatan: ${raciWarnings.join(', ')}`
                    });
                }
                else {
                    results.success++;
                }
            }
            catch (err) {
                results.errors.push({
                    row: rowNum,
                    item: itemTitle,
                    reason: err.message || 'Gagal menyimpan Key Result'
                });
            }
        }
        return res.status(200).json(results);
    }
    catch (error) {
        console.error('Bulk upload KRs error:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}
/**
 * POST /api/bulk-upload/initiatives
 * Body: {
 *   initiatives: Array<{
 *     keyResultId: string; // or krTitle
 *     teamName?: string; // or teamId
 *     ownerName?: string; // or ownerId
 *     title: string;
 *     description?: string;
 *     targetValue?: number | string;
 *     unit?: string;
 *     kanbanStatus?: string; // TODO | IN_PROGRESS | DONE
 *   }>
 * }
 */
async function bulkUploadInitiatives(req, res) {
    try {
        const { initiatives } = req.body;
        if (!Array.isArray(initiatives) || initiatives.length === 0) {
            return res.status(400).json({ message: 'Payload initiatives harus berupa array tidak kosong' });
        }
        // Preload dependencies
        const allUsers = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
        const allTeams = await prisma.team.findMany({ select: { id: true, name: true } });
        const allKrs = await prisma.keyResult.findMany({ select: { id: true, title: true } });
        const userLookup = new Map();
        for (const u of allUsers) {
            userLookup.set(u.name.toLowerCase().trim(), u.id);
            userLookup.set(u.email.toLowerCase().trim(), u.id);
            userLookup.set(u.id.toLowerCase().trim(), u.id);
        }
        const teamLookup = new Map();
        for (const t of allTeams) {
            teamLookup.set(t.name.toLowerCase().trim(), t.id);
            teamLookup.set(t.id.toLowerCase().trim(), t.id);
        }
        const krLookup = new Map();
        for (const k of allKrs) {
            krLookup.set(k.id.toLowerCase().trim(), k.id);
            krLookup.set(k.title.toLowerCase().trim(), k.id);
        }
        const results = {
            total: initiatives.length,
            success: 0,
            warned: 0,
            errors: []
        };
        for (let index = 0; index < initiatives.length; index++) {
            const row = initiatives[index];
            const rowNum = index + 2;
            const itemTitle = row.title ? String(row.title).trim() : `Baris #${rowNum}`;
            try {
                if (!row.title) {
                    results.errors.push({
                        row: rowNum,
                        item: itemTitle,
                        reason: 'Judul inisiatif (title) wajib diisi'
                    });
                    continue;
                }
                // Resolve Key Result
                let resolvedKrId = '';
                if (row.keyResultId) {
                    const key = String(row.keyResultId).toLowerCase().trim();
                    resolvedKrId = krLookup.get(key) || '';
                }
                if (!resolvedKrId) {
                    if (allKrs.length === 1) {
                        resolvedKrId = allKrs[0].id;
                    }
                    else {
                        results.errors.push({
                            row: rowNum,
                            item: itemTitle,
                            reason: `Key Result '${row.keyResultId || ''}' tidak ditemukan`
                        });
                        continue;
                    }
                }
                // Resolve Team
                let resolvedTeamId = '';
                const teamKey = (row.teamName || row.teamId || '').toString().toLowerCase().trim();
                if (teamKey) {
                    resolvedTeamId = teamLookup.get(teamKey) || '';
                }
                if (!resolvedTeamId) {
                    if (allTeams.length > 0) {
                        resolvedTeamId = allTeams[0].id; // default to first team if not specified
                    }
                    else {
                        results.errors.push({
                            row: rowNum,
                            item: itemTitle,
                            reason: `Tim '${row.teamName || row.teamId || ''}' tidak ditemukan`
                        });
                        continue;
                    }
                }
                // Resolve Owner (optional)
                let resolvedOwnerId = null;
                const ownerWarnings = [];
                const ownerKey = (row.ownerName || row.ownerId || '').toString().toLowerCase().trim();
                if (ownerKey) {
                    resolvedOwnerId = userLookup.get(ownerKey) || null;
                    if (!resolvedOwnerId) {
                        ownerWarnings.push(`Owner '${row.ownerName || row.ownerId}' tidak ditemukan`);
                    }
                }
                const kanbanStatus = normalizeKanbanStatus(row.kanbanStatus || 'TODO');
                const targetValue = row.targetValue ? parseFloat(String(row.targetValue)) : 0;
                const unit = row.unit ? String(row.unit).trim() : null;
                const description = row.description ? String(row.description).trim() : null;
                await prisma.initiative.create({
                    data: {
                        keyResultId: resolvedKrId,
                        teamId: resolvedTeamId,
                        ownerId: resolvedOwnerId,
                        title: itemTitle,
                        description,
                        targetValue: isNaN(targetValue) ? 0 : targetValue,
                        unit,
                        status: 'ON_TRACK',
                        kanbanStatus,
                    }
                });
                if (ownerWarnings.length > 0) {
                    results.warned++;
                    results.errors.push({
                        row: rowNum,
                        item: itemTitle,
                        reason: `Inisiatif dibuat, tetapi: ${ownerWarnings.join(', ')}`
                    });
                }
                else {
                    results.success++;
                }
            }
            catch (err) {
                results.errors.push({
                    row: rowNum,
                    item: itemTitle,
                    reason: err.message || 'Gagal menyimpan Inisiatif'
                });
            }
        }
        return res.status(200).json(results);
    }
    catch (error) {
        console.error('Bulk upload initiatives error:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}
/**
 * POST /api/bulk-upload/objectives
 * Body: {
 *   objectives: Array<{
 *     title: string;
 *     description?: string;
 *     quarter: string;
 *     ownerName?: string; // or ownerId
 *   }>
 * }
 */
async function bulkUploadObjectives(req, res) {
    try {
        const { objectives } = req.body;
        if (!Array.isArray(objectives) || objectives.length === 0) {
            return res.status(400).json({ message: 'Payload objectives harus berupa array tidak kosong' });
        }
        // Preload users for owner mapping
        const allUsers = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
        const userLookup = new Map();
        for (const u of allUsers) {
            userLookup.set(u.name.toLowerCase().trim(), u.id);
            userLookup.set(u.email.toLowerCase().trim(), u.id);
            userLookup.set(u.id.toLowerCase().trim(), u.id);
        }
        const results = {
            total: objectives.length,
            success: 0,
            warned: 0,
            errors: []
        };
        for (let index = 0; index < objectives.length; index++) {
            const row = objectives[index];
            const rowNum = index + 2;
            const itemTitle = row.title ? String(row.title).trim() : `Baris #${rowNum}`;
            try {
                if (!row.title || !row.quarter) {
                    results.errors.push({
                        row: rowNum,
                        item: itemTitle,
                        reason: 'Judul objective (title) dan Quarter wajib diisi'
                    });
                    continue;
                }
                // Resolve Owner (optional)
                let resolvedOwnerId = null;
                const ownerWarnings = [];
                const ownerKey = (row.ownerName || row.ownerId || '').toString().toLowerCase().trim();
                if (ownerKey) {
                    resolvedOwnerId = userLookup.get(ownerKey) || null;
                    if (!resolvedOwnerId) {
                        ownerWarnings.push(`Owner '${row.ownerName || row.ownerId}' tidak ditemukan`);
                    }
                }
                const description = row.description ? String(row.description).trim() : null;
                const quarter = String(row.quarter).trim();
                await prisma.objective.create({
                    data: {
                        title: itemTitle,
                        description,
                        quarter,
                        ownerId: resolvedOwnerId
                    }
                });
                if (ownerWarnings.length > 0) {
                    results.warned++;
                    results.errors.push({
                        row: rowNum,
                        item: itemTitle,
                        reason: `Objective dibuat, tetapi: ${ownerWarnings.join(', ')}`
                    });
                }
                else {
                    results.success++;
                }
            }
            catch (err) {
                results.errors.push({
                    row: rowNum,
                    item: itemTitle,
                    reason: err.message || 'Gagal menyimpan Objective'
                });
            }
        }
        return res.status(200).json(results);
    }
    catch (error) {
        console.error('Bulk upload objectives error:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}
