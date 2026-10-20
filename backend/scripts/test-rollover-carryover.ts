import assert from "assert";
import { PrismaClient } from "@prisma/client";
import {
  getActiveSprint,
  getPendingSprintItemsService,
  carryOverInitiativeService,
  carryOverTaskService,
} from "../src/services/sprint.service";

const prisma = new PrismaClient();

async function run() {
  console.log("=== Testing Sprint Carry-Over & Pending Items System ===");

  const activeSprint = await getActiveSprint();
  assert(activeSprint, "Active sprint must exist");
  console.log(`Active Sprint: ${activeSprint.name} (${activeSprint.id})`);

  // 1. Test getPendingSprintItemsService
  const pendingData = await getPendingSprintItemsService(activeSprint.id);
  assert(pendingData.sprint, "Must return current sprint");
  assert(Array.isArray(pendingData.initiatives), "Must return initiatives array");
  assert(Array.isArray(pendingData.tasks), "Must return tasks array");
  console.log(`Pending initiatives count: ${pendingData.initiatives.length}`);
  console.log(`Pending tasks count: ${pendingData.tasks.length}`);
  if (pendingData.nextSprint) {
    console.log(`Next Sprint: ${pendingData.nextSprint.name}`);
  }

  // Find next sprint
  const nextSprint = await prisma.sprint.findFirst({
    where: { startDate: { gt: activeSprint.startDate } },
    orderBy: { startDate: "asc" },
  });
  assert(nextSprint, "Next sprint must exist in database");

  // Find a test user & KR
  const testUser = await prisma.user.findFirst();
  assert(testUser, "Test user must exist");
  const testKr = await prisma.keyResult.findFirst();
  assert(testKr, "Test KR must exist");
  const testTeam = await prisma.team.findFirst();
  assert(testTeam, "Test team must exist");

  // 2. Create temporary initiative in activeSprint
  const tempIni = await prisma.initiative.create({
    data: {
      title: "TEMPORARY TEST INITIATIVE FOR CARRY OVER",
      keyResultId: testKr.id,
      teamId: testTeam.id,
      ownerId: testUser.id,
      targetValue: 10,
      currentValue: 3,
      sprintId: activeSprint.id,
      sprintMonth: activeSprint.name,
      kanbanStatus: "IN_PROGRESS",
    },
  });

  try {
    // 3. Test carry-over initiative
    const carriedIni = await carryOverInitiativeService(tempIni.id, testUser.id);
    assert.strictEqual(carriedIni.initiative.sprintId, nextSprint.id, "Initiative sprintId must match next sprint");
    assert.strictEqual(carriedIni.initiative.sprintMonth, nextSprint.name, "Initiative sprintMonth must match next sprint name");
    console.log(`✅ Initiative carry over passed: moved to ${carriedIni.nextSprint.name}`);

    // 4. Create temporary task in activeSprint
    const tempTask = await prisma.task.create({
      data: {
        title: "TEMPORARY TEST TASK FOR CARRY OVER",
        initiativeId: tempIni.id,
        assignedTeamMemberId: testUser.id,
        targetValue: 20,
        currentValue: 5,
        sprintId: activeSprint.id,
        sprintMonth: activeSprint.name,
        kanbanStatus: "IN_PROGRESS",
      },
    });

    try {
      // 5. Test carry-over task
      const carriedTask = await carryOverTaskService(tempTask.id, testUser.id);
      assert.strictEqual(carriedTask.task.sprintId, nextSprint.id, "Task sprintId must match next sprint");
      assert.strictEqual(carriedTask.task.sprintMonth, nextSprint.name, "Task sprintMonth must match next sprint name");
      assert.strictEqual(carriedTask.task.baselineValue, 5, "Baseline value should be set to currentValue (5)");
      console.log(`✅ Task carry over passed: moved to ${carriedTask.nextSprint.name} with baseline=5`);
    } finally {
      await prisma.task.delete({ where: { id: tempTask.id } });
    }
  } finally {
    await prisma.initiative.delete({ where: { id: tempIni.id } });
  }

  console.log("🎉 All Carry-Over assertions passed successfully!");
}

run()
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
