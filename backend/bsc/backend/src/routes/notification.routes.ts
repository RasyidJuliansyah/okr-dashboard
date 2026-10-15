import { Router } from "express";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notification.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getNotifications);
router.patch("/read-all", authMiddleware, markAllNotificationsRead);
router.patch("/:id/read", authMiddleware, markNotificationRead);

export default router;
