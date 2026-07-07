"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const causal_controller_1 = require("../controllers/causal.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Retrieve strategy map nodes and edges
router.get('/strategy-map', auth_middleware_1.authMiddleware, causal_controller_1.getStrategyMap);
// Define or delete causal relationships (Admin only)
router.post('/causal-links', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN']), causal_controller_1.createCausalLink);
router.delete('/causal-links/:id', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ADMIN']), causal_controller_1.deleteCausalLink);
exports.default = router;
