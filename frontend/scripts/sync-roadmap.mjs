import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ponytail: direct copy from local reference directory; upgrade path: S3/CDN sync or webhook when roadmap is hosted remotely.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CANDIDATE_SOURCES = [
  process.env.ROADMAP_SOURCE_DIR,
  '/Users/rasyidjuliansyah/Development/okr-dashboard2/Landing page roadmap Q4 2026-html (3)',
  path.resolve(__dirname, '../../../../Landing page roadmap Q4 2026-html (3)'),
  path.resolve(__dirname, '../../../Landing page roadmap Q4 2026-html (3)'),
].filter(Boolean);

const targetDir = path.resolve(__dirname, '../public/roadmap');

function resolveSourceDir() {
  for (const src of CANDIDATE_SOURCES) {
    if (src && fs.existsSync(src)) {
      return src;
    }
  }
  return null;
}

export function syncRoadmap() {
  const sourceDir = resolveSourceDir();
  if (!sourceDir) {
    console.warn('[sync-roadmap] Source directory not found. Skipping sync. Target will use existing public/roadmap files.');
    return { success: false, reason: 'SOURCE_NOT_FOUND' };
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.cpSync(sourceDir, targetDir, { recursive: true });

  const mainHtml = path.join(targetDir, 'Main.dc.html');
  const indexHtml = path.join(targetDir, 'index.html');
  if (fs.existsSync(mainHtml)) {
    fs.copyFileSync(mainHtml, indexHtml);
  }

  const stat = fs.statSync(mainHtml);
  console.log(`[sync-roadmap] Synced from ${sourceDir} -> ${targetDir} (last modified: ${stat.mtime.toISOString()})`);
  return { success: true, sourceDir, targetDir, lastModified: stat.mtime.toISOString() };
}

const isDirectRun = process.argv[1] === __filename;
if (isDirectRun) {
  const isWatch = process.argv.includes('--watch');
  syncRoadmap();

  if (isWatch) {
    const src = resolveSourceDir();
    if (src) {
      console.log(`[sync-roadmap] Watching ${src} for changes...`);
      fs.watch(src, { recursive: true }, (eventType, filename) => {
        console.log(`[sync-roadmap] Detected ${eventType} in ${filename}. Re-syncing...`);
        try {
          syncRoadmap();
        } catch (err) {
          console.error('[sync-roadmap] Sync error:', err.message);
        }
      });
    }
  }
}
