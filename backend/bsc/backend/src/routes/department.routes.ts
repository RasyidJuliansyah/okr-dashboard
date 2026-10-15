import { Router } from "express";
import { getAllDepartments, createDepartment, assignManager, assignCLevel, toggleDepartmentStatus, updateDepartment } from "../controllers/department.controller";
import { authMiddleware, roleGuard } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getAllDepartments);
router.post("/", authMiddleware, roleGuard(["ADMIN"]), createDepartment);
router.patch("/:id", authMiddleware, roleGuard(["ADMIN"]), updateDepartment);
router.put("/:id", authMiddleware, roleGuard(["ADMIN"]), updateDepartment);
router.patch("/:id/manager", authMiddleware, roleGuard(["ADMIN"]), assignManager);
router.patch("/:id/c-level", authMiddleware, roleGuard(["ADMIN"]), assignCLevel);
router.put("/:id/c-level", authMiddleware, roleGuard(["ADMIN"]), assignCLevel);
router.patch("/:id/status", authMiddleware, roleGuard(["ADMIN"]), toggleDepartmentStatus);

export default router;
