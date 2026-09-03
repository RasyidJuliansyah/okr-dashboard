import { Router } from "express";
import {
  getAllKpis,
  createKpi,
  updateKpi,
  deleteKpi,
  bulkUploadKpis,
} from "../controllers/kpi.controller";
import { authMiddleware, roleGuard } from "../middleware/auth.middleware";

const router = Router();

// GET /api/kpis — Semua role terotentikasi dapat melihat daftar KPI
router.get("/", authMiddleware, getAllKpis);

// POST /api/kpis — Admin membuat KPI baru
router.post("/", authMiddleware, roleGuard(["ADMIN"]), createKpi);

// POST /api/kpis/bulk-upload — Admin import banyak KPI via CSV
router.post(
  "/bulk-upload",
  authMiddleware,
  roleGuard(["ADMIN"]),
  bulkUploadKpis,
);

// PATCH /api/kpis/:id — Admin mengedit KPI
router.patch("/:id", authMiddleware, roleGuard(["ADMIN"]), updateKpi);

// DELETE /api/kpis/:id — Admin menghapus KPI
router.delete("/:id", authMiddleware, roleGuard(["ADMIN"]), deleteKpi);

export default router;
