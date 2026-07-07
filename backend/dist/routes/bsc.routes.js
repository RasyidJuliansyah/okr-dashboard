"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bsc_controller_1 = require("../controllers/bsc.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Route for getting BSC 4-quadrant grouped overview
router.get('/overview', auth_middleware_1.authMiddleware, bsc_controller_1.getBscOverview);
exports.default = router;
