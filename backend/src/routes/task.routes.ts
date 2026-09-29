import { Router } from "express";
import {
  authMiddleware,
  roleGuard,
} from "../middleware/auth.middleware";
import {
  createCrossDeptTask,
  getCrossDeptTasks,
  getTaskById,
  updateCrossDeptStatus,
  reassignCrossDeptTask,
  getTaskComments,
  addTaskComment,
} from "../controllers/task.controller";
import {
  deleteTask,
  updateTask,
} from "../controllers/initiative.controller";


const router = Router();

// Cross-dept task endpoints
router.post(
  "/cross-dept",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "C_LEVEL", "LEADER", "TEAM"]),
  createCrossDeptTask,
);

router.get(
  "/cross-dept",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "C_LEVEL", "LEADER", "TEAM"]),
  getCrossDeptTasks,
);

// Status lifecycle (TODO -> IN_PROGRESS <-> NEED_INFO -> RESOLVED -> CLOSED)
router.patch(
  "/:id/status",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "C_LEVEL", "LEADER", "TEAM"]),
  updateCrossDeptStatus,
);

// Reassign task
router.patch(
  "/:id/reassign",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "LEADER", "TEAM"]),
  reassignCrossDeptTask,
);

// Comments / Q&A thread
router.get(
  "/:id/comments",
  authMiddleware,
  getTaskComments,
);

router.post(
  "/:id/comments",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "C_LEVEL", "LEADER", "TEAM"]),
  addTaskComment,
);

// Task detail
router.get(
  "/:id",
  authMiddleware,
  getTaskById,
);

// Update task
router.put(
  "/:id",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "LEADER", "TEAM"]),
  updateTask,
);

// Delete task
router.delete(
  "/:id",
  authMiddleware,
  roleGuard(["ADMIN", "C_LEVEL", "MANAGER", "LEADER", "TEAM"]),
  deleteTask,
);

export default router;
