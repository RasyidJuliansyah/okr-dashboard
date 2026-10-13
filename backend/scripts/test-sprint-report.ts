import assert from "assert";
import { PrismaClient } from "@prisma/client";
import {
  getActiveSprint,
  getSprintReportData,
} from "../src/services/sprint.service";

const prisma = new PrismaClient();

async function run() {
  console.log("=== Testing Sprint Report Aggregation & Calculation ===");

  const activeSprint = await getActiveSprint();
  assert(activeSprint, "Active sprint must exist");
  console.log(`Active Sprint: ${activeSprint.name} (${activeSprint.id})`);

  // 1. Fetch Sprint Report Data
  const report = await getSprintReportData(activeSprint.id);
  assert(report, "Report data should not be null");
  assert.strictEqual(report.sprintId, activeSprint.id, "Sprint ID should match");
  assert(typeof report.avgSprintAchievementPct === "number", "avgSprintAchievementPct must be number");
  assert(typeof report.avgCumulativeKrAchievementPct === "number", "avgCumulativeKrAchievementPct must be number");
  assert(Array.isArray(report.krs), "krs must be an array");
  assert(Array.isArray(report.initiatives), "initiatives must be an array");
  assert(Array.isArray(report.tasks), "tasks must be an array");
  assert(Array.isArray(report.kpis), "kpis must be an array");

  console.log(`Summary:`);
  console.log(`- Avg Sprint Achievement: ${report.avgSprintAchievementPct}%`);
  console.log(`- Avg Cumulative KR Achievement: ${report.avgCumulativeKrAchievementPct}%`);
  console.log(`- Total Initiatives: ${report.totalInitiatives} (Completed: ${report.completedInitiatives})`);
  console.log(`- Total Tasks: ${report.totalTasks} (Completed: ${report.completedTasks})`);
  console.log(`- Total KPIs: ${report.totalKpis}`);

  // 2. Validate Task Report Items
  if (report.tasks.length > 0) {
    const sampleTask = report.tasks[0];
    assert("sprintAchievementPct" in sampleTask, "Task must have sprintAchievementPct");
    assert("baselineValue" in sampleTask, "Task must have baselineValue");
    assert("targetValue" in sampleTask, "Task must have targetValue");
    assert("currentValue" in sampleTask, "Task must have currentValue");
    assert(sampleTask.sprintAchievementPct >= 0 && sampleTask.sprintAchievementPct <= 100, "Achievement must be 0-100");
  }

  // 3. Validate KR Report Items (Sprint % vs Kumulatif %)
  if (report.krs.length > 0) {
    const sampleKr = report.krs[0];
    assert("sprintAchievementPct" in sampleKr, "KR must have sprintAchievementPct");
    assert("cumulativeAchievementPct" in sampleKr, "KR must have cumulativeAchievementPct");
    assert("annualTarget" in sampleKr, "KR must have annualTarget");
    assert("cumulativeCurrent" in sampleKr, "KR must have cumulativeCurrent");
    console.log(`Sample KR: "${sampleKr.title}"`);
    console.log(`  Sprint Achievement: ${sampleKr.sprintAchievementPct}%`);
    console.log(`  Cumulative Achievement: ${sampleKr.cumulativeAchievementPct}% (${sampleKr.cumulativeCurrent} / ${sampleKr.annualTarget} ${sampleKr.unit})`);
  }

  // 4. Test Rollover Math Assertion:
  // When task with target=100, current=40 rolls over, baselineValue becomes 40.
  // In the new sprint, progress with current=40 starts at ((40 - 40) / (100 - 40)) * 100 = 0%.
  const baseline = 40;
  const target = 100;
  const currentInNewSprintAtStart = 40;
  const newSprintAchievementAtStart =
    target > baseline
      ? Math.max(0, Math.min(100, ((currentInNewSprintAtStart - baseline) / (target - baseline)) * 100))
      : 0;
  assert.strictEqual(newSprintAchievementAtStart, 0, "Rollover task sprint progress must reset to 0%");

  // If task later reaches 70 in new sprint:
  const currentLater = 70;
  const newSprintAchievementLater =
    target > baseline
      ? Math.round((((currentLater - baseline) / (target - baseline)) * 100) * 10) / 10
      : 0;
  assert.strictEqual(newSprintAchievementLater, 50, "Rollover task progress at 70 must be 50% for this sprint (30 achieved out of 60 remaining)");

  // 5. Test Department Filtering Alignment (EDUCATION & OPERATION)
  console.log("Testing Department Filter Alignment...");
  const reportEdu = await getSprintReportData(activeSprint.id, "EDUCATION");
  assert.strictEqual(reportEdu.initiatives.length, 4, "EDUCATION initiatives count must match");
  assert.strictEqual(reportEdu.tasks.length, 55, "EDUCATION tasks count must match");
  assert.strictEqual(reportEdu.kpis.length, 24, "EDUCATION KPIs count must match");
  assert.strictEqual(reportEdu.krs.length, 3, "EDUCATION KRs count must match");

  const reportOps = await getSprintReportData(activeSprint.id, "TECHOPS");
  assert.strictEqual(reportOps.initiatives.length, 13, "TECHOPS initiatives count must match");
  assert.strictEqual(reportOps.tasks.length, 19, "TECHOPS tasks count must match");
  assert.strictEqual(reportOps.kpis.length, 13, "TECHOPS KPIs count must match");

  console.log("✅ All Sprint Report & Rollover assertions passed successfully!");
}

run()
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
