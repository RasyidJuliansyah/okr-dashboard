import assert from "assert";
import { PrismaClient } from "@prisma/client";
import {
  generateYearlySprints,
  getAllSprints,
  getActiveSprint,
  toggleSprintLock,
  closeAndRolloverSprint,
} from "../src/services/sprint.service";

const prisma = new PrismaClient();

async function run() {
  console.log("=== Testing Sprint Cadence & Snapshot System ===");

  // 1. Generate Yearly Sprints
  const genResult = await generateYearlySprints(2026);
  console.log(`Generated: ${genResult.createdCount} new, ${genResult.existingCount} existing.`);
  assert(genResult.sprints.length >= 12, "Should have at least 12 sprints generated");

  // 2. Verify Cadence of first sprints
  const all = await getAllSprints();
  console.log(`Total sprints in DB: ${all.length}`);
  const octSprint = all.find((s) => s.name === "Sprint Oktober 2026");
  assert(octSprint, "Sprint Oktober 2026 must exist");
  assert.strictEqual(new Date(octSprint.startDate).getUTCDate(), 21, "Start date must be 21st");
  assert.strictEqual(new Date(octSprint.endDate).getUTCDate(), 20, "End date must be 20th");

  // 3. Active Sprint Check
  const active = await getActiveSprint();
  console.log(`Current active sprint: ${active?.name} (${active?.status})`);
  assert(active, "An active sprint should be resolved");

  // 4. Toggle Lock Check
  if (octSprint) {
    const locked = await toggleSprintLock(octSprint.id, true, "TEST_ADMIN");
    assert.strictEqual(locked.isLocked, true, "Sprint should now be locked");
    const unlocked = await toggleSprintLock(octSprint.id, false, "TEST_ADMIN");
    assert.strictEqual(unlocked.isLocked, false, "Sprint should now be unlocked");
  }

  // 5. Test Audit Log Entry
  const audit = await prisma.auditLog.findFirst({
    where: { entityType: "SPRINT" },
    orderBy: { createdAt: "desc" },
  });
  assert(audit, "Audit log entry should exist for sprint actions");
  console.log(`Last audit log: ${audit.action} on ${audit.entityType}`);

  console.log("✅ All Sprint Cadence test assertions passed successfully!");
}

run()
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
