import { Router } from "express";
import { getAuditLogs } from "../controllers/auditLog.controller";
import { authMiddleware, roleGuard } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, roleGuard(["ADMIN"]), getAuditLogs);

export default router;
