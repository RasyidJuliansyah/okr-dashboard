import assert from "assert";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runTest() {
  console.log("Starting Roadmap integration self-check...");

  // 1. Check Domains exist
  const domains = await prisma.roadmapDomain.findMany({
    include: {
      epics: {
        include: {
          features: true,
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  assert(domains.length >= 3, `Expected at least 3 domains, got ${domains.length}`);
  console.log(`✓ Found ${domains.length} domains`);

  const schoolDomain = domains.find((d) => d.code === "SCHOOL_EXP");
  assert(schoolDomain, "Expected domain SCHOOL_EXP to exist");
  assert(schoolDomain.epics.length >= 1, "Expected epics in SCHOOL_EXP");
  console.log(`✓ Domain SCHOOL_EXP has ${schoolDomain.epics.length} epics`);

  // 2. Test Epic Rollup calculation logic
  const epic = schoolDomain.epics[0];
  assert(epic.features.length >= 1, "Expected features in first epic");

  let minStart = epic.startDate;
  let maxEnd = epic.endDate;
  let totalProg = 0;
  epic.features.forEach((f) => {
    if (f.startDate && (!minStart || new Date(f.startDate) < new Date(minStart))) minStart = f.startDate;
    if (f.endDate && (!maxEnd || new Date(f.endDate) > new Date(maxEnd))) maxEnd = f.endDate;
    totalProg += f.progressPercent;
  });
  const avgProg = Math.round(totalProg / epic.features.length);

  assert(minStart !== null, "Min start should not be null");
  assert(maxEnd !== null, "Max end should not be null");
  assert(avgProg >= 0 && avgProg <= 100, `Average progress ${avgProg}% out of bounds`);
  console.log(`✓ Epic rollup dates & progress calculated: ${avgProg}%`);

  // 3. Test Patching Feature Dates & bounds
  const feature = epic.features[0];
  const updated = await prisma.roadmapFeature.update({
    where: { id: feature.id },
    data: {
      startDate: new Date("2026-10-25"),
      endDate: new Date("2026-12-10"),
      progressPercent: 95,
    },
  });

  assert.strictEqual(updated.progressPercent, 95);
  assert(updated.startDate !== null);
  const startStr = updated.startDate.toISOString().substring(0, 10);
  assert.strictEqual(startStr, "2026-10-25");
  console.log("✓ Feature date patching and progress check passed");

  console.log("All roadmap self-checks passed successfully!");
}

runTest()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error("Test failed:", err);
    prisma.$disconnect();
    process.exit(1);
  });
