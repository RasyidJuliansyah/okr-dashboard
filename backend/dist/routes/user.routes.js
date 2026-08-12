"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/users — Semua role bisa melihat daftar user/pegawai
router.get("/", auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(["ADMIN", "C_LEVEL", "MANAGER", "LEADER", "TEAM"]), user_controller_1.getAllUsers);
// POST /api/users — Admin membuat pegawai baru
router.post("/", auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(["ADMIN"]), user_controller_1.createEmployee);
// POST /api/users/bulk-upload — Admin import banyak pegawai via CSV
router.post("/bulk-upload", auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(["ADMIN"]), user_controller_1.bulkUploadEmployees);
// PATCH /api/users/:id — Admin mengedit data pegawai (nama, posisi, dept)
router.patch("/:id", auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(["ADMIN"]), user_controller_1.updateEmployee);
// DELETE /api/users/:id — Admin menghapus pegawai
router.delete("/:id", auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(["ADMIN"]), user_controller_1.deleteEmployee);
// PATCH /api/users/:id/department — Compatibility route
router.patch("/:id/department", auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(["ADMIN"]), user_controller_1.updateUserDepartment);
// GET /api/teams — Semua role bisa melihat daftar team
router.get("/teams", auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(["ADMIN", "C_LEVEL", "MANAGER", "LEADER", "TEAM"]), user_controller_1.getTeams);
// PATCH /api/teams/:id — Admin update leader & dept sebuah team
router.patch("/teams/:id", auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(["ADMIN"]), user_controller_1.updateTeam);
exports.default = router;
