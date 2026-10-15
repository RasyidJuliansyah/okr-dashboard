import { Router } from 'express';
import { createCausalLink, getStrategyMap, deleteCausalLink, updateCausalLink } from '../controllers/causal.controller';
import { authMiddleware, roleGuard } from '../middleware/auth.middleware';

const router = Router();

// Retrieve strategy map nodes and edges
router.get('/strategy-map', authMiddleware, getStrategyMap);

// Define or delete causal relationships (Admin only)
router.post('/causal-links', authMiddleware, roleGuard(['ADMIN']), createCausalLink);
router.put('/causal-links/:id', authMiddleware, updateCausalLink);
router.delete('/causal-links/:id', authMiddleware, deleteCausalLink);

export default router;
