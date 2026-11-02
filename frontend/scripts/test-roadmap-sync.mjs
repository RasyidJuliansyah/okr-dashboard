import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targetDir = path.resolve(__dirname, "../public/roadmap");

// Assert destination directory and synced files exist
assert.ok(fs.existsSync(targetDir), "Target roadmap directory should exist");

const indexPath = path.join(targetDir, "index.html");
assert.ok(fs.existsSync(indexPath), "roadmap/index.html should exist");

const mainDcPath = path.join(targetDir, "Main.dc.html");
assert.ok(fs.existsSync(mainDcPath), "roadmap/Main.dc.html should exist");

const supportPath = path.join(targetDir, "support.js");
assert.ok(fs.existsSync(supportPath), "roadmap/support.js should exist");

const indexContent = fs.readFileSync(indexPath, "utf8");
assert.ok(
  indexContent.includes("Roadmap") || indexContent.includes("Skolla") || indexContent.includes("DOCTYPE"),
  "roadmap/index.html should have valid HTML content"
);

console.log("All roadmap sync assertions passed successfully.");
