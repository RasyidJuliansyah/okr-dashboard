import { Router } from "express";
import {
  getInitiatives,
  getInitiativeProgress,
  getMemberProgress,
  createInitiative,
  updateInitiative,
  deleteInitiative,
  updateInitiativeKanbanStatus,
  getTasksForInitiative,
  createTask,
  updateTask,
  deleteTask,
  assignUsersToTask,
  submitTaskUpdate,
  getTaskUpdates,
  approveTaskUpdate,
  rejectTaskUpdate,
  getMyWork,
  getMyTeamInitiatives,
  getPendingTaskUpdates,
  getInitiativeWeightBudget,
  submitInitiativeUpdate,
  getInitiativeProgressUpdates,
  getPendingInitiativeUpdates,
  getInitiativeUpdatesHistory,
  approveInitiativeUpdate,
  rejectInitiativeUpdate,
  reassignInitiative,
} from "../controllers/initiative.controller";
import { authMiddleware, roleGuard } from "../middleware/auth.middleware";

const router = Router();

// Initiative
router.get(
  "/",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "C_LEVEL", "LEADER", "TEAM"]),
  getInitiatives,
);
router.get(
  "/progress",
  authMiddleware,
  roleGuard(["ADMIN", "C_LEVEL", "MANAGER", "LEADER"]),
  getInitiativeProgress,
);
router.get(
  "/member-progress",
  authMiddleware,
  roleGuard(["ADMIN", "C_LEVEL", "MANAGER", "LEADER", "TEAM"]),
  getMemberProgress,
);
router.get(
  "/weight-budget",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "C_LEVEL", "LEADER", "TEAM"]),
  getInitiativeWeightBudget,
);
router.post(
  "/",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "LEADER", "TEAM"]),
  createInitiative,
);
router.put(
  "/:id",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "LEADER", "TEAM"]),
  updateInitiative,
);
router.patch(
  "/:id/reassign",
  authMiddleware,
  roleGuard(["LEADER", "MANAGER", "ADMIN"]),
  reassignInitiative,
);
router.patch(
  "/:id/kanban-status",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "LEADER", "TEAM"]),
  updateInitiativeKanbanStatus,
);
router.delete(
  "/:id",
  authMiddleware,
  roleGuard(["ADMIN", "C_LEVEL", "MANAGER", "LEADER", "TEAM"]),
  deleteInitiative,
);
router.get("/my-work/all", authMiddleware, getMyWork);
router.get(
  "/my-team",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "C_LEVEL", "LEADER", "TEAM"]),
  getMyTeamInitiatives,
);
router.post(
  "/:id/progress-updates",
  authMiddleware,
  roleGuard(["TEAM", "LEADER", "ADMIN"]),
  submitInitiativeUpdate,
);
router.get(
  "/:id/progress-updates",
  authMiddleware,
  getInitiativeProgressUpdates,
);

// Task di bawah Initiative
router.get(
  "/:initiativeId/tasks",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "C_LEVEL", "LEADER", "TEAM"]),
  getTasksForInitiative,
);
router.post(
  "/:initiativeId/tasks",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "LEADER", "TEAM"]),
  createTask,
);

// Task standalone endpoints
router.put(
  "/tasks/:id",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "LEADER", "TEAM"]),
  updateTask,
);
router.delete(
  "/tasks/:id",
  authMiddleware,
  roleGuard(["ADMIN", "C_LEVEL", "MANAGER", "LEADER", "TEAM"]),
  deleteTask,
);
router.post(
  "/tasks/:id/assign",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "LEADER", "TEAM"]),
  assignUsersToTask,
);
router.post(
  "/tasks/:id/updates",
  authMiddleware,
  roleGuard(["TEAM", "LEADER", "MANAGER", "ADMIN"]),
  submitTaskUpdate,
);
router.get(
  "/tasks/:id/updates",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "C_LEVEL", "LEADER", "TEAM"]),
  getTaskUpdates,
);

// Pending Task Updates
router.get(
  "/task-updates/pending",
  authMiddleware,
  roleGuard(["MANAGER", "ADMIN", "C_LEVEL"]),
  getPendingTaskUpdates,
);

// Task Update approval
router.patch(
  "/task-updates/:updateId/approve",
  authMiddleware,
  roleGuard(["MANAGER", "LEADER", "ADMIN"]),
  approveTaskUpdate,
);
router.patch(
  "/task-updates/:updateId/reject",
  authMiddleware,
  roleGuard(["MANAGER", "LEADER", "ADMIN"]),
  rejectTaskUpdate,
);

// Pending & Approval for Initiative Updates (NEW)
router.get(
  "/initiative-updates/pending",
  authMiddleware,
  roleGuard(["MANAGER", "LEADER", "TEAM", "ADMIN", "C_LEVEL"]),
  getPendingInitiativeUpdates,
);
router.get(
  "/initiative-updates/history",
  authMiddleware,
  roleGuard(["MANAGER", "LEADER", "TEAM", "ADMIN", "C_LEVEL"]),
  getInitiativeUpdatesHistory,
);
router.patch(
  "/initiative-updates/:updateId/approve",
  authMiddleware,
  roleGuard(["MANAGER", "LEADER", "ADMIN"]),
  approveInitiativeUpdate,
);
router.patch(
  "/initiative-updates/:updateId/reject",
  authMiddleware,
  roleGuard(["MANAGER", "LEADER", "ADMIN"]),
  rejectInitiativeUpdate,
);

export default router;
