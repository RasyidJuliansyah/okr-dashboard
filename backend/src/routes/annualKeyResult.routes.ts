import { Router } from 'express';
import {
  getAnnualKeyResults,
  getAnnualKeyResultDetail,
  createAnnualKeyResult,
  updateAnnualKeyResult,
  deleteAnnualKeyResult,
  linkMonthlyKrToAnnual,
} from '../controllers/annualKeyResult.controller';
import { authMiddleware, roleGuard } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, getAnnualKeyResults);
router.get('/:id', authMiddleware, getAnnualKeyResultDetail);
router.post('/', authMiddleware, roleGuard(['ADMIN', 'MANAGER']), createAnnualKeyResult);
router.put('/:id', authMiddleware, roleGuard(['ADMIN', 'MANAGER']), updateAnnualKeyResult);
router.delete('/:id', authMiddleware, roleGuard(['ADMIN', 'MANAGER']), deleteAnnualKeyResult);
router.post('/:id/link-kr/:krId', authMiddleware, roleGuard(['ADMIN', 'MANAGER']), linkMonthlyKrToAnnual);

export default router;
