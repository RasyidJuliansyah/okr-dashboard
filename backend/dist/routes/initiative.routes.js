"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const initiative_controller_1 = require("../controllers/initiative.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Initiative
router.get('/', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN', 'MANAGER', 'C_LEVEL', 'LEADER', 'TEAM']), initiative_controller_1.getInitiatives);
router.post('/', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN', 'MANAGER', 'LEADER', 'TEAM']), initiative_controller_1.createInitiative);
router.put('/:id', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN', 'MANAGER', 'LEADER', 'TEAM']), initiative_controller_1.updateInitiative);
router.patch('/:id/kanban-status', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN', 'MANAGER', 'LEADER', 'TEAM']), initiative_controller_1.updateInitiativeKanbanStatus);
router.delete('/:id', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN', 'MANAGER', 'LEADER']), initiative_controller_1.deleteInitiative);
router.get('/my-work/all', auth_middleware_1.authMiddleware, initiative_controller_1.getMyWork);
router.get('/my-team', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN', 'MANAGER', 'C_LEVEL', 'LEADER', 'TEAM']), initiative_controller_1.getMyTeamInitiatives);
// KPI di bawah Initiative
router.get('/:initiativeId/kpis', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN', 'MANAGER', 'C_LEVEL', 'LEADER', 'TEAM']), initiative_controller_1.getKpisForInitiative);
router.post('/:initiativeId/kpis', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN', 'MANAGER', 'LEADER']), initiative_controller_1.createKpi);
// KPI standalone endpoints
router.put('/kpis/:id', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN', 'MANAGER', 'LEADER']), initiative_controller_1.updateKpi);
router.delete('/kpis/:id', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN']), initiative_controller_1.deleteKpi);
router.post('/kpis/:id/assign', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN', 'MANAGER', 'LEADER']), initiative_controller_1.assignUsersToKpi);
router.post('/kpis/:id/updates', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['TEAM']), initiative_controller_1.submitKpiUpdate);
router.get('/kpis/:id/updates', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN', 'MANAGER', 'C_LEVEL', 'LEADER', 'TEAM']), initiative_controller_1.getKpiUpdates);
// Pending KPI Updates
router.get('/kpi-updates/pending', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['MANAGER', 'ADMIN', 'C_LEVEL']), initiative_controller_1.getPendingKpiUpdates);
// KPI Update approval
router.patch('/kpi-updates/:updateId/approve', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['MANAGER', 'LEADER', 'ADMIN']), initiative_controller_1.approveKpiUpdate);
router.patch('/kpi-updates/:updateId/reject', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['MANAGER', 'LEADER', 'ADMIN']), initiative_controller_1.rejectKpiUpdate);
exports.default = router;
