import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  getBoard,
  openBoard,
  closeBoard,
  getHistory,
  addCard,
  deleteCard,
  setMood,
  toggleReaction,
  getMentionableUsers,
  getAiSummary,
} from "../controllers/retro.controller";

const router = Router();

// Semua user login boleh akses; aturan baca/tulis/kelola per departemen dicek di controller.
router.use(authMiddleware);
router.get("/", getBoard);
router.get("/mentionable-users", getMentionableUsers);
router.post("/", openBoard);
router.delete("/cards/:cardId", deleteCard);
router.post("/cards/:cardId/reactions", toggleReaction);
router.post("/:id/close", closeBoard);
router.get("/:id/history", getHistory);
router.post("/:id/cards", addCard);
router.put("/:id/mood", setMood);
router.post("/:id/ai-summary", getAiSummary);

export default router;
