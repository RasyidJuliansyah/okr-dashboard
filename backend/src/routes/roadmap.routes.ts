import { Router } from "express";
import fs from "fs";
import path from "path";
import * as jwt from "jsonwebtoken";
import { authMiddleware, roleGuard, AuthRequest } from "../middleware/auth.middleware";
import {
  getRoadmapTree,
  createDomain,
  updateDomain,
  deleteDomain,
  createEpic,
  updateEpic,
  deleteEpic,
  createFeature,
  updateFeature,
  patchFeatureDates,
  deleteFeature,
  seedRoadmap,
} from "../controllers/roadmap.controller";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-okr-bsc-dashboard-2026";

function optionalAuth(req: AuthRequest, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
  } catch {}
  next();
}

const router = Router();
const canEdit = [authMiddleware, roleGuard(["ADMIN", "MANAGER"])];

// Interactive 3-Level Roadmap Endpoints
router.get("/domains", optionalAuth, getRoadmapTree);
router.post("/domains", ...canEdit, createDomain);
router.put("/domains/:id", ...canEdit, updateDomain);
router.delete("/domains/:id", ...canEdit, deleteDomain);

router.post("/epics", ...canEdit, createEpic);
router.put("/epics/:id", ...canEdit, updateEpic);
router.delete("/epics/:id", ...canEdit, deleteEpic);

router.post("/features", ...canEdit, createFeature);
router.put("/features/:id", ...canEdit, updateFeature);
router.patch("/features/:id/dates", ...canEdit, patchFeatureDates);
router.delete("/features/:id", ...canEdit, deleteFeature);

router.post("/seed", ...canEdit, seedRoadmap);

// Legacy static sync endpoints (retained for backward compatibility)
const CANDIDATE_SOURCES = [
  process.env.ROADMAP_SOURCE_DIR,
  "/Users/rasyidjuliansyah/Development/okr-dashboard2/Landing page roadmap Q4 2026-html (3)",
  path.resolve(__dirname, "../../../Landing page roadmap Q4 2026-html (3)"),
  path.resolve(__dirname, "../../../../Landing page roadmap Q4 2026-html (3)"),
].filter(Boolean) as string[];

const targetDir = [
  path.resolve(__dirname, "../../../frontend/public/roadmap"),
  path.resolve(__dirname, "../../frontend/public/roadmap"),
].find((p) => fs.existsSync(p)) || path.resolve(__dirname, "../../../frontend/public/roadmap");

function resolveSourceDir(): string | null {
  for (const src of CANDIDATE_SOURCES) {
    if (src && fs.existsSync(src)) {
      return src;
    }
  }
  return null;
}

function doSync() {
  const sourceDir = resolveSourceDir();
  if (!sourceDir) {
    return { success: false, reason: "SOURCE_NOT_FOUND" };
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.cpSync(sourceDir, targetDir, { recursive: true });

  const mainHtml = path.join(targetDir, "Main.dc.html");
  const indexHtml = path.join(targetDir, "index.html");
  if (fs.existsSync(mainHtml)) {
    fs.copyFileSync(mainHtml, indexHtml);
  }

  const stat = fs.statSync(mainHtml);
  return {
    success: true,
    sourceDir,
    targetDir,
    lastModified: stat.mtime.toISOString(),
  };
}

router.get("/status", authMiddleware, (req, res) => {
  try {
    const sourceDir = resolveSourceDir();
    const targetMain = path.join(targetDir, "Main.dc.html");
    const targetExists = fs.existsSync(targetMain);
    let targetMtime: string | null = null;
    let sourceMtime: string | null = null;

    if (targetExists) {
      targetMtime = fs.statSync(targetMain).mtime.toISOString();
    }
    if (sourceDir) {
      const srcMain = path.join(sourceDir, "Main.dc.html");
      if (fs.existsSync(srcMain)) {
        sourceMtime = fs.statSync(srcMain).mtime.toISOString();
      }
    }

    res.json({
      success: true,
      sourceExists: Boolean(sourceDir),
      sourceDir,
      sourceLastModified: sourceMtime,
      targetExists,
      targetLastModified: targetMtime,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/sync", authMiddleware, (req, res) => {
  try {
    const result = doSync();
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

