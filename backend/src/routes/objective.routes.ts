import { Router } from 'express';
import { createObjective, getObjectives, deleteObjective } from '../controllers/objective.controller';
import { authMiddleware, roleGuard } from '../middleware/auth.middleware';

const router = Router();

// Everyone can view objectives
router.get('/', authMiddleware, getObjectives);

// Only admin can create or delete objectives
router.post('/', authMiddleware, roleGuard(['ADMIN']), createObjective);
router.delete('/:id', authMiddleware, roleGuard(['ADMIN']), deleteObjective);

export default router;
