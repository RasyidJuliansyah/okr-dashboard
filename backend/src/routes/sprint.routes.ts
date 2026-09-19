import { Router } from "express";
import { authMiddleware, roleGuard } from "../middleware/auth.middleware";
import {
  getSprints,
  getActiveSprint,
  generateYearly,
  updateSprint,
  toggleLock,
  closeSprint,
  getSprintMemberScores,
  upsertKrSprintTarget,
} from "../controllers/sprint.controller";

const router = Router();

// Public / Authenticated read routes
router.get("/", authMiddleware, getSprints);
router.get("/active", authMiddleware, getActiveSprint);
router.get("/:id/member-scores", authMiddleware, getSprintMemberScores);

// Admin-only management routes
router.post("/generate-yearly", authMiddleware, roleGuard(["ADMIN"]), generateYearly);
router.put("/:id", authMiddleware, roleGuard(["ADMIN"]), updateSprint);
router.post("/:id/toggle-lock", authMiddleware, roleGuard(["ADMIN"]), toggleLock);
router.post("/:id/close", authMiddleware, roleGuard(["ADMIN"]), closeSprint);
router.post("/kr-target", authMiddleware, roleGuard(["ADMIN", "MANAGER"]), upsertKrSprintTarget);

export default router;
