import { Router } from 'express';
import { getBscOverview } from '../controllers/bsc.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Route for getting BSC 4-quadrant grouped overview
router.get('/overview', authMiddleware, getBscOverview);

export default router;
