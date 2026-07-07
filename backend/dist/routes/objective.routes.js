"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const objective_controller_1 = require("../controllers/objective.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Everyone can view objectives
router.get('/', auth_middleware_1.authMiddleware, objective_controller_1.getObjectives);
// Only admin can create or delete objectives
router.post('/', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN']), objective_controller_1.createObjective);
router.delete('/:id', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN']), objective_controller_1.deleteObjective);
exports.default = router;
