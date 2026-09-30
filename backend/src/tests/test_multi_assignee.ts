import assert from "assert";
import { PrismaClient } from "@prisma/client";
import { createInitiative, createTask } from "../controllers/initiative.controller";

const prisma = new PrismaClient();

async function runTest() {
  console.log("Starting multi-assignee discrete card tests...");

  // Pick two test users
  const users = await prisma.user.findMany({ take: 2 });
  if (users.length < 2) {
    console.log("Need at least 2 users in database to test, skipping live test");
    process.exit(0);
  }

  const [u1, u2] = users;
  const team = await prisma.team.findFirst();
  const testTitle = `TEST_MULTI_PIC_${Date.now()}`;

  // Mock response collector
  function mockRes() {
    let statusCode = 200;
    let jsonBody: any = null;
    return {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        jsonBody = data;
        return this;
      },
      getStatusCode: () => statusCode,
      getBody: () => jsonBody,
    };
  }

  // 1. Test Initiative multi-assignee creation
  const mockReqIni: any = {
    user: { id: u1.id, role: "ADMIN" },
    body: {
      title: testTitle,
      teamId: team?.id,
      ownerIds: [u1.id, u2.id],
      targetValue: 100,
      unit: "%",
      startDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 86400000).toISOString(),
    },
  };

  const resIni = mockRes();
  await createInitiative(mockReqIni, resIni as any);

  assert.strictEqual(resIni.getStatusCode(), 201, "Initiative creation should return 201");
  const createdInis = await prisma.initiative.findMany({
    where: { title: testTitle },
  });

  assert.strictEqual(createdInis.length, 2, "Must create exactly 2 discrete initiative cards");
  const owners = createdInis.map((i) => i.ownerId).sort();
  const expectedOwners = [u1.id, u2.id].sort();
  assert.deepStrictEqual(owners, expectedOwners, "Each initiative must belong to its respective owner");
  console.log("✓ Initiative multi-assignee discrete card creation passed");

  // 2. Test Task multi-assignee creation
  const parentIni = createdInis[0];
  const testTaskTitle = `TEST_MULTI_TASK_${Date.now()}`;
  const mockReqTask: any = {
    params: { initiativeId: parentIni.id },
    user: { id: u1.id, role: "ADMIN" },
    body: {
      title: testTaskTitle,
      targetValue: 50,
      unit: "%",
      assigneeIds: [u1.id, u2.id],
    },
  };

  const resTask = mockRes();
  await createTask(mockReqTask, resTask as any);

  assert.strictEqual(resTask.getStatusCode(), 201, "Task creation should return 201");
  const createdTasks = await prisma.task.findMany({
    where: { title: testTaskTitle },
  });

  assert.strictEqual(createdTasks.length, 2, "Must create exactly 2 discrete task cards");
  const assignees = createdTasks.map((t) => t.assignedTeamMemberId).sort();
  assert.deepStrictEqual(assignees, expectedOwners, "Each task must be assigned to its respective assignee");
  console.log("✓ Task multi-assignee discrete card creation passed");

  // Cleanup test artifacts
  const taskIds = createdTasks.map((t) => t.id);
  await (prisma as any).taskAssignment.deleteMany({ where: { taskId: { in: taskIds } } });
  await prisma.task.deleteMany({ where: { id: { in: taskIds } } });
  await prisma.initiative.deleteMany({ where: { title: testTitle } });
  console.log("✓ Test cleanup completed");

  console.log("ALL MULTI-ASSIGNEE TESTS PASSED!");
  await prisma.$disconnect();
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  prisma.$disconnect();
  process.exit(1);
});
