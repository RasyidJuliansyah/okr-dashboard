import { Router } from "express";
import {
  getAllUsers,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateUserDepartment,
  bulkUploadEmployees,
  getTeams,
  updateTeam,
} from "../controllers/user.controller";
import { authMiddleware, roleGuard } from "../middleware/auth.middleware";

const router = Router();

// GET /api/users — Semua role bisa melihat daftar user/pegawai
router.get("/", authMiddleware, roleGuard(["ADMIN", "C_LEVEL", "MANAGER", "LEADER", "TEAM"]), getAllUsers);

// POST /api/users — Admin membuat pegawai baru
router.post("/", authMiddleware, roleGuard(["ADMIN"]), createEmployee);

// POST /api/users/bulk-upload — Admin import banyak pegawai via CSV
router.post("/bulk-upload", authMiddleware, roleGuard(["ADMIN"]), bulkUploadEmployees);

// PATCH /api/users/:id — Admin mengedit data pegawai (nama, posisi, dept)
router.patch("/:id", authMiddleware, roleGuard(["ADMIN"]), updateEmployee);

// DELETE /api/users/:id — Admin menghapus pegawai
router.delete("/:id", authMiddleware, roleGuard(["ADMIN"]), deleteEmployee);

// PATCH /api/users/:id/department — Compatibility route
router.patch(
  "/:id/department",
  authMiddleware,
  roleGuard(["ADMIN"]),
  updateUserDepartment
);

// GET /api/teams — Semua role bisa melihat daftar team
router.get("/teams", authMiddleware, roleGuard(["ADMIN", "C_LEVEL", "MANAGER", "LEADER", "TEAM"]), getTeams);

// PATCH /api/teams/:id — Admin update leader & dept sebuah team
router.patch("/teams/:id", authMiddleware, roleGuard(["ADMIN"]), updateTeam);

export default router;
