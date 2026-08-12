"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const keyresult_controller_1 = require("../controllers/keyresult.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Manajemen KR (hanya Admin)
router.post('/', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN']), keyresult_controller_1.createKeyResult);
router.put('/:id', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN']), keyresult_controller_1.updateKeyResult);
router.delete('/:id', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN']), keyresult_controller_1.deleteKeyResult);
router.patch('/:id/progress', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN']), keyresult_controller_1.updateKeyResultProgress);
// History — Semua role yang terotentikasi dapat melihat history
router.get('/:id/history', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN', 'MANAGER', 'C_LEVEL', 'LEADER', 'TEAM']), keyresult_controller_1.getKeyResultHistory);
// Assignment — Admin dan Manager bisa assign, semua yang login bisa lihat
router.post('/:id/assign', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN', 'MANAGER']), keyresult_controller_1.assignUsersToKeyResult);
router.get('/:id/assignments', auth_middleware_1.authMiddleware, keyresult_controller_1.getKeyResultAssignments);
// My Assigned
router.get('/my/assigned', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['LEADER', 'ADMIN']), keyresult_controller_1.getMyAssignedKrs);
exports.default = router;
