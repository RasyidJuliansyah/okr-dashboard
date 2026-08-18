import { Router } from 'express';
import {
  getInitiatives,
  getInitiativeProgress,
  getMemberProgress,
  createInitiative,
  updateInitiative,
  deleteInitiative,
  updateInitiativeKanbanStatus,
  getKpisForInitiative,
  createKpi,
  updateKpi,
  deleteKpi,
  assignUsersToKpi,
  submitKpiUpdate,
  getKpiUpdates,
  approveKpiUpdate,
  rejectKpiUpdate,
  getMyWork,
  getMyTeamInitiatives,
  getPendingKpiUpdates,
} from '../controllers/initiative.controller';
import { authMiddleware, roleGuard } from '../middleware/auth.middleware';

const router = Router();

// Initiative
router.get('/', authMiddleware, roleGuard(['ADMIN', 'MANAGER', 'C_LEVEL', 'LEADER', 'TEAM']), getInitiatives);
router.get('/progress', authMiddleware, roleGuard(['ADMIN', 'C_LEVEL', 'MANAGER', 'LEADER']), getInitiativeProgress);
router.get('/member-progress', authMiddleware, roleGuard(['ADMIN', 'C_LEVEL', 'MANAGER', 'LEADER', 'TEAM']), getMemberProgress);
router.post('/', authMiddleware, roleGuard(['ADMIN', 'MANAGER', 'LEADER', 'TEAM']), createInitiative);
router.put('/:id', authMiddleware, roleGuard(['ADMIN', 'MANAGER', 'LEADER', 'TEAM']), updateInitiative);
router.patch('/:id/kanban-status', authMiddleware, roleGuard(['ADMIN', 'MANAGER', 'LEADER', 'TEAM']), updateInitiativeKanbanStatus);
router.delete('/:id', authMiddleware, roleGuard(['ADMIN']), deleteInitiative);
router.get('/my-work/all', authMiddleware, getMyWork);
router.get('/my-team', authMiddleware, roleGuard(['ADMIN', 'MANAGER', 'C_LEVEL', 'LEADER', 'TEAM']), getMyTeamInitiatives);

// KPI di bawah Initiative
router.get('/:initiativeId/kpis', authMiddleware, roleGuard(['ADMIN', 'MANAGER', 'C_LEVEL', 'LEADER', 'TEAM']), getKpisForInitiative);
router.post('/:initiativeId/kpis', authMiddleware, roleGuard(['ADMIN', 'MANAGER', 'LEADER']), createKpi);

// KPI standalone endpoints
router.put('/kpis/:id', authMiddleware, roleGuard(['ADMIN', 'MANAGER', 'LEADER']), updateKpi);
router.delete('/kpis/:id', authMiddleware, roleGuard(['ADMIN']), deleteKpi);
router.post('/kpis/:id/assign', authMiddleware, roleGuard(['ADMIN', 'MANAGER', 'LEADER']), assignUsersToKpi);
router.post('/kpis/:id/updates', authMiddleware, roleGuard(['TEAM']), submitKpiUpdate);
router.get('/kpis/:id/updates', authMiddleware, roleGuard(['ADMIN', 'MANAGER', 'C_LEVEL', 'LEADER', 'TEAM']), getKpiUpdates);

// Pending KPI Updates
router.get('/kpi-updates/pending', authMiddleware, roleGuard(['MANAGER', 'ADMIN', 'C_LEVEL']), getPendingKpiUpdates);

// KPI Update approval
router.patch('/kpi-updates/:updateId/approve', authMiddleware, roleGuard(['MANAGER', 'LEADER', 'ADMIN']), approveKpiUpdate);
router.patch('/kpi-updates/:updateId/reject', authMiddleware, roleGuard(['MANAGER', 'LEADER', 'ADMIN']), rejectKpiUpdate);

export default router;
