"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bulkUpload_controller_1 = require("../controllers/bulkUpload.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Endpoint Bulk Upload untuk Key Results & Initiatives (hanya ADMIN)
router.post('/krs', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN']), bulkUpload_controller_1.bulkUploadKRs);
router.post('/initiatives', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN']), bulkUpload_controller_1.bulkUploadInitiatives);
router.post('/objectives', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN']), bulkUpload_controller_1.bulkUploadObjectives);
exports.default = router;
