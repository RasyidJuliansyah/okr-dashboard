import assert from "assert";
import { PrismaClient } from "@prisma/client";
import { getActiveSprint, getSprintReportData, resolveSprint } from "../src/services/sprint.service";

const prisma = new PrismaClient();

async function run() {
  console.log("=== VERIFYING KR DECOUPLING & INVARIANT CHECK (TARGET: 42 KRs) ===");

  const activeSprint = await getActiveSprint();
  assert(activeSprint, "Active sprint must exist");
  console.log(`Active Sprint: "${activeSprint.name}" (${activeSprint.id})`);

  // 1. Objectives & KR count for year 2026
  const allObjectives2026 = await prisma.objective.findMany({
    where: { year: "2026" },
  });
  const activeObjectives2026 = await prisma.objective.findMany({
    where: { year: "2026", isActive: true },
    include: {
      keyResults: {
        where: { isActive: true },
      },
    },
  });
  const totalKrsInObjs = activeObjectives2026.reduce((acc, o) => acc + o.keyResults.length, 0);
  console.log(`\n1. Objectives (year=2026): ${allObjectives2026.length} total, ${activeObjectives2026.length} active`);
  console.log(`   Active KRs under Active Objectives: ${totalKrsInObjs}`);
  assert.strictEqual(allObjectives2026.length, 18, "Must have exactly 18 Objectives under year 2026 in DB");
  assert.strictEqual(activeObjectives2026.length, 16, "Must have 16 active Objectives under year 2026");
  assert.strictEqual(totalKrsInObjs, 42, "Must have exactly 42 active Key Results under year 2026");

  // 2. Sprint Report Data invariance
  console.log("\n2. Testing Sprint Report (Sprint Oktober 2026)...");
  const sprintReport = await getSprintReportData(activeSprint.id);
  console.log(`   Report Sprint KR Count: ${sprintReport.krs.length}`);
  assert.strictEqual(sprintReport.krs.length, 42, "Sprint report must return exactly 42 KRs (invariant)");

  // 3. Department scoped Sprint Report Data
  console.log("\n3. Testing Sprint Report Department Filtering...");
  const eduReport = await getSprintReportData(activeSprint.id, "EDUCATION");
  console.log(`   EDUCATION Sprint KRs: ${eduReport.krs.length}, Initiatives: ${eduReport.initiatives.length}`);
  assert.strictEqual(eduReport.krs.length, 3, "EDUCATION must return 3 KRs");

  const opsReport = await getSprintReportData(activeSprint.id, "TECHOPS");
  console.log(`   TECHOPS Sprint Initiatives: ${opsReport.initiatives.length}`);
  assert.strictEqual(opsReport.initiatives.length, 13, "TECHOPS initiatives must match 13");

  // 4. BSC C-Level Key Result Invariance
  console.log("\n4. Testing BSC C-Level query simulation...");

  // 4a. No month filter
  const bscAllKrs = await prisma.keyResult.findMany({
    where: {
      isActive: true,
      objective: { isActive: true, year: "2026" },
    },
  });
  console.log(`   BSC (no filter) KR Count: ${bscAllKrs.length}`);
  assert.strictEqual(bscAllKrs.length, 42, "BSC without filter must have 42 KRs");

  // 4b. With month filter simulating getCLevelBscDashboard logic
  const monthQueries = ["2026-10", activeSprint.id, "ALL"];
  for (const m of monthQueries) {
    let matchedSprintId: string | null = null;
    if (m && m !== "ALL") {
      const sp = await resolveSprint({
        sprintId: m,
        sprintMonth: m,
        fallbackToActive: false,
      });
      matchedSprintId = sp?.id || m;
    }

    const bscScopedKrs = await prisma.keyResult.findMany({
      where: {
        isActive: true,
        objective: { isActive: true, year: "2026" },
      },
      include: {
        initiatives: {
          where: {
            isActive: true,
            ...(matchedSprintId
              ? {
                  OR: [
                    { sprintId: matchedSprintId },
                    { sprintMonth: matchedSprintId },
                    { sprintMonth: m },
                  ],
                }
              : {}),
          },
        },
      },
    });

    const totalScopedInits = bscScopedKrs.reduce((sum, kr) => sum + kr.initiatives.length, 0);
    console.log(`   BSC (filter=${m}) -> KRs: ${bscScopedKrs.length}, Linked Initiatives: ${totalScopedInits}`);
    assert.strictEqual(bscScopedKrs.length, 42, `BSC with filter=${m} must maintain 42 KRs invariant`);
  }

  // 5. Foreign Key and Sprint Month Normalization check
  console.log("\n5. Testing Data Normalization integrity...");
  const inits = await prisma.initiative.findMany({ select: { sprintId: true, sprintMonth: true, sprint: { select: { name: true } } } });
  const invalidInits = inits.filter((i) => i.sprintMonth !== i.sprint?.name).length;
  console.log(`   Initiatives where sprintMonth != sprint.name: ${invalidInits}`);
  assert.strictEqual(invalidInits, 0, "All initiatives must have sprintMonth == sprint.name");

  const tasks = await prisma.task.findMany({ select: { sprintId: true, sprintMonth: true, sprint: { select: { name: true } } } });
  const invalidTasks = tasks.filter((t) => t.sprintMonth !== t.sprint?.name).length;
  console.log(`   Tasks where sprintMonth != sprint.name: ${invalidTasks}`);
  assert.strictEqual(invalidTasks, 0, "All tasks must have sprintMonth == sprint.name");

  const normalizedKrs = await prisma.keyResult.count({
    where: {
      isActive: true,
      month: activeSprint.id,
    },
  });
  console.log(`   Active KRs with month = activeSprint.id: ${normalizedKrs}`);
  assert.strictEqual(normalizedKrs, 42, "All 42 active KRs must have month = activeSprint.id");

  console.log("\n✅ ALL ASSERTIONS PASSED! 42 Key Results invariant strictly maintained across all views.");
}

run()
  .catch((err) => {
    console.error("❌ Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
