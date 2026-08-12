import { Router } from "express";
import { getAllDepartments, createDepartment, assignManager } from "../controllers/department.controller";
import { authMiddleware, roleGuard } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getAllDepartments);
router.post("/", authMiddleware, roleGuard(["ADMIN"]), createDepartment);
router.patch("/:id/manager", authMiddleware, roleGuard(["ADMIN"]), assignManager);

export default router;
