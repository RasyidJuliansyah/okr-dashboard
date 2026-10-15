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
  createTasksBatch,
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

// Static Initiative endpoints
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
router.get("/my-work/all", authMiddleware, getMyWork);
router.get(
  "/my-team",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "C_LEVEL", "LEADER", "TEAM"]),
  getMyTeamInitiatives,
);
router.post(
  "/",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "LEADER", "TEAM"]),
  createInitiative,
);

// Task standalone endpoints (registered before /:id routes to avoid route precedence conflict)
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
  roleGuard(["TEAM", "LEADER", "MANAGER", "ADMIN", "C_LEVEL"]),
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
  roleGuard(["MANAGER", "LEADER", "ADMIN", "C_LEVEL"]),
  approveTaskUpdate,
);
router.patch(
  "/task-updates/:updateId/reject",
  authMiddleware,
  roleGuard(["MANAGER", "LEADER", "ADMIN", "C_LEVEL"]),
  rejectTaskUpdate,
);

// Pending & Approval for Initiative Updates
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
  roleGuard(["MANAGER", "LEADER", "ADMIN", "C_LEVEL"]),
  approveInitiativeUpdate,
);
router.patch(
  "/initiative-updates/:updateId/reject",
  authMiddleware,
  roleGuard(["MANAGER", "LEADER", "ADMIN", "C_LEVEL"]),
  rejectInitiativeUpdate,
);

// Tasks under Initiative
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
router.post(
  "/:initiativeId/tasks/batch",
  authMiddleware,
  roleGuard(["ADMIN", "MANAGER", "LEADER", "TEAM"]),
  createTasksBatch,
);

// Initiative progress updates & parameterized routes
router.post(
  "/:id/progress-updates",
  authMiddleware,
  roleGuard(["TEAM", "LEADER", "MANAGER", "ADMIN", "C_LEVEL"]),
  submitInitiativeUpdate,
);
router.get(
  "/:id/progress-updates",
  authMiddleware,
  getInitiativeProgressUpdates,
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

export default router;
