import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Endpoint for role-based dashboard summary
router.get('/summary', authMiddleware, getDashboardSummary);

export default router;
