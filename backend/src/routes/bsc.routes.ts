import { Router } from 'express';
import { getBscOverview, getCLevelBscDashboard } from '../controllers/bsc.controller';
import { authMiddleware, roleGuard } from '../middleware/auth.middleware';

const router = Router();

// Route for getting BSC 4-quadrant grouped overview (all roles)
router.get('/overview', authMiddleware, getBscOverview);

// C-Level Executive BSC Dashboard (C_LEVEL + ADMIN only)
router.get('/c-level-dashboard', authMiddleware, roleGuard(['C_LEVEL', 'ADMIN']), getCLevelBscDashboard);

export default router;
