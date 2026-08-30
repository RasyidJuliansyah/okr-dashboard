import { Router } from "express";
import {
  createKeyResult,
  deleteKeyResult,
  updateKeyResultProgress,
  getKeyResultHistory,
  updateKeyResult,
  assignUsersToKeyResult,
  getKeyResultAssignments,
  getMyAssignedKrs,
  getKrsForInitiativeDropdown,
  bulkDeleteKeyResults,
  delegateKeyResult,
} from "../controllers/keyresult.controller";
import { authMiddleware, roleGuard } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/dropdown",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "C_LEVEL", "LEADER", "TEAM"]),
  getKrsForInitiativeDropdown,
);

// Manajemen KR (hanya Admin)
router.post("/", authMiddleware, roleGuard(["ADMIN"]), createKeyResult);
router.post(
  "/bulk-delete",
  authMiddleware,
  roleGuard(["ADMIN"]),
  bulkDeleteKeyResults,
);
router.put("/:id", authMiddleware, roleGuard(["ADMIN"]), updateKeyResult);
router.delete("/:id", authMiddleware, roleGuard(["ADMIN"]), deleteKeyResult);
router.patch(
  "/:id/progress",
  authMiddleware,
  roleGuard(["ADMIN", "LEADER", "MANAGER"]),
  updateKeyResultProgress,
);

// History — Semua role yang terotentikasi dapat melihat history
router.get(
  "/:id/history",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "C_LEVEL", "LEADER", "TEAM"]),
  getKeyResultHistory,
);

// Assignment — Admin dan Manager bisa assign, semua yang login bisa lihat
router.post(
  "/:id/assign",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER"]),
  assignUsersToKeyResult,
);
router.post(
  "/:id/delegate",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "LEADER"]),
  delegateKeyResult,
);
router.get("/:id/assignments", authMiddleware, getKeyResultAssignments);

// My Assigned
router.get(
  "/my/assigned",
  authMiddleware,
  roleGuard(["LEADER", "MANAGER", "ADMIN"]),
  getMyAssignedKrs,
);

export default router;
