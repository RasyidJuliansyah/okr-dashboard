import assert from "assert";
import { PrismaClient } from "@prisma/client";
import { getDashboardSummary } from "../controllers/dashboard.controller";
import * as sprintService from "../services/sprint.service";

const prisma = new PrismaClient();

function createMockResponse() {
  const res: any = {
    statusCode: 200,
    data: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.data = payload;
      return this;
    },
  };
  return res;
}

async function runTests() {
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  assert(adminUser, "Admin user must exist in DB");

  const activeSprint = await sprintService.getActiveSprint();
  assert(activeSprint, "Active sprint must exist in DB");

  // 1. Fallback to active sprint when month query is omitted
  {
    const req: any = {
      user: { id: adminUser.id, role: adminUser.role },
      query: {},
    };
    const res = createMockResponse();
    await getDashboardSummary(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.month, activeSprint.name);
    assert.strictEqual(res.data.sprint?.id, activeSprint.id);
    assert(res.data.metrics, "Metrics should be present");
    assert(typeof res.data.metrics.averageProgress === "number");
    assert(typeof res.data.metrics.onTrackCount === "number");
    assert(typeof res.data.metrics.atRiskCount === "number");
    assert(typeof res.data.metrics.offTrackCount === "number");
    assert(typeof res.data.metrics.behindCount === "number");
    assert(typeof res.data.metrics.notStartedCount === "number");
  }

  // 2. Resolve sprint when explicit month is passed
  {
    const targetSprint = await prisma.sprint.findFirst({
      where: { name: { contains: "Oktober" } },
    });
    if (targetSprint) {
      // Test by name
      const reqByName: any = {
        user: { id: adminUser.id, role: adminUser.role },
        query: { month: targetSprint.name },
      };
      const resByName = createMockResponse();
      await getDashboardSummary(reqByName, resByName);

      assert.strictEqual(resByName.statusCode, 200);
      assert.strictEqual(resByName.data.month, targetSprint.name);
      assert.strictEqual(resByName.data.sprint?.id, targetSprint.id);

      // Test by ID (as passed from frontend select value)
      const reqById: any = {
        user: { id: adminUser.id, role: adminUser.role },
        query: { month: targetSprint.id },
      };
      const resById = createMockResponse();
      await getDashboardSummary(reqById, resById);

      assert.strictEqual(resById.statusCode, 200);
      assert.strictEqual(resById.data.sprint?.id, targetSprint.id);
      assert.strictEqual(resById.data.month, targetSprint.name);
    }
  }

  // 3. KrSprintTarget calculation vs Annual KR fallback
  const firstKr = await prisma.keyResult.findFirst({
    where: { isActive: true },
  });
  assert(firstKr, "At least one active KeyResult should exist");

  let createdTargetId: string | null = null;
  try {
    // Create test monthly target: target 100, current 85 -> 85% progress -> ON_TRACK
    const created = await prisma.krSprintTarget.create({
      data: {
        keyResultId: firstKr.id,
        sprintId: activeSprint.id,
        targetValue: 100,
        currentValue: 85,
        baselineValue: 0,
      },
    });
    createdTargetId = created.id;

    const req: any = {
      user: { id: adminUser.id, role: adminUser.role },
      query: { month: activeSprint.name },
    };
    const res = createMockResponse();
    await getDashboardSummary(req, res);

    assert.strictEqual(res.statusCode, 200);

    // Find the KR in the returned objectives
    let foundKr: any = null;
    for (const obj of res.data.objectives || []) {
      for (const kr of obj.keyResults || []) {
        if (kr.id === firstKr.id) {
          foundKr = kr;
          break;
        }
      }
      if (foundKr) break;
    }

    assert(foundKr, "Targeted KR must be present in dashboard summary");
    assert.strictEqual(foundKr.targetValue, 100);
    assert.strictEqual(foundKr.currentValue, 85);
    assert.strictEqual(foundKr.progress, 85);
    assert.strictEqual(foundKr.status, "ON_TRACK");
    assert(foundKr.sprintTarget, "Sprint target should be attached");
    assert.strictEqual(foundKr.sprintTarget.id, createdTargetId);
  } finally {
    if (createdTargetId) {
      await prisma.krSprintTarget.delete({ where: { id: createdTargetId } });
    }
  }

  console.log("Dashboard summary tests passed successfully.");
}

runTests()
  .catch((err) => {
    console.error("Dashboard summary test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
