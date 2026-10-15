import { Router } from "express";
import { login, getMe, changePassword, switchContext } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/login", login);
router.get("/me", authMiddleware, getMe);
router.post("/switch-context", authMiddleware, switchContext);
router.post("/change-password", authMiddleware, changePassword);

export default router;
