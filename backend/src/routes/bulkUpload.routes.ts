import { Router } from 'express';
import { bulkUploadKRs, bulkUploadInitiatives } from '../controllers/bulkUpload.controller';
import { authMiddleware, roleGuard } from '../middleware/auth.middleware';

const router = Router();

// Endpoint Bulk Upload untuk Key Results & Initiatives (hanya ADMIN)
router.post('/krs', authMiddleware, roleGuard(['ADMIN']), bulkUploadKRs);
router.post('/initiatives', authMiddleware, roleGuard(['ADMIN']), bulkUploadInitiatives);

export default router;
