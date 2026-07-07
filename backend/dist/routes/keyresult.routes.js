"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const keyresult_controller_1 = require("../controllers/keyresult.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Only admin can manage key results
router.post('/', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN']), keyresult_controller_1.createKeyResult);
router.delete('/:id', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN']), keyresult_controller_1.deleteKeyResult);
router.patch('/:id/progress', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN']), keyresult_controller_1.updateKeyResultProgress);
router.get('/:id/history', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN', 'MANAGER']), keyresult_controller_1.getKeyResultHistory);
exports.default = router;
