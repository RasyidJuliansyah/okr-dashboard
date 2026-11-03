import { Router } from "express";
import fs from "fs";
import path from "path";
import { authMiddleware } from "../middleware/auth.middleware";

// ponytail: local directory sync endpoint; upgrade path: webhook receiver for automated CMS/Figma sync.
const router = Router();

const CANDIDATE_SOURCES = [
  process.env.ROADMAP_SOURCE_DIR,
  "/Users/rasyidjuliansyah/Development/okr-dashboard2/Landing page roadmap Q4 2026-html (3)",
  path.resolve(__dirname, "../../../Landing page roadmap Q4 2026-html (3)"),
  path.resolve(__dirname, "../../../../Landing page roadmap Q4 2026-html (3)"),
].filter(Boolean) as string[];

const targetDir = [
  path.resolve(__dirname, "../../../frontend/public/roadmap"),
  path.resolve(__dirname, "../../frontend/public/roadmap"),
].find(p => fs.existsSync(p)) || path.resolve(__dirname, "../../../frontend/public/roadmap");

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
