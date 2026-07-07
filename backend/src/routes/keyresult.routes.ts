import { Router } from 'express';
import { createKeyResult, deleteKeyResult, updateKeyResultProgress, getKeyResultHistory } from '../controllers/keyresult.controller';
import { authMiddleware, roleGuard } from '../middleware/auth.middleware';

const router = Router();

// Only admin can manage key results
router.post('/', authMiddleware, roleGuard(['ADMIN']), createKeyResult);
router.delete('/:id', authMiddleware, roleGuard(['ADMIN']), deleteKeyResult);
router.patch('/:id/progress', authMiddleware, roleGuard(['ADMIN']), updateKeyResultProgress);
router.get('/:id/history', authMiddleware, roleGuard(['ADMIN', 'MANAGER']), getKeyResultHistory);

export default router;
