const assert = require("assert");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function runTests() {
  console.log("Running Cross-Dept Task tests...");

  // 1. Fetch an existing user as creator and target user
  const users = await prisma.user.findMany({ take: 5 });
  assert(users.length >= 2, "Need at least 2 users");
  const creator = users[0];
  const targetUser = users[1];

  // 2. Create standalone cross-dept task
  const task = await prisma.task.create({
    data: {
      title: "Test Cross-Dept Task",
      description: "Mohon bantuan koordinasi materi",
      targetDept: targetUser.department || "TECHDEV",
      creatorDept: creator.department || "EDUCATION",
      creatorId: creator.id,
      isCrossDept: true,
      initiativeId: null,
      assignedTeamMemberId: targetUser.id,
      kanbanStatus: "TODO",
      status: "ON_TRACK",
      targetValue: 1,
      currentValue: 0,
    },
    include: {
      creator: true,
      assignedTeamMember: true,
    },
  });

  assert.strictEqual(task.isCrossDept, true);
  assert.strictEqual(task.initiativeId, null);
  assert.strictEqual(task.kanbanStatus, "TODO");
  console.log("✓ Cross-dept task created successfully:", task.id);

  // 3. Create comment on task
  const comment = await prisma.taskComment.create({
    data: {
      taskId: task.id,
      userId: targetUser.id,
      message: "Butuh brief lebih detail mengenai materi.",
    },
    include: { user: true },
  });

  assert.strictEqual(comment.taskId, task.id);
  assert.strictEqual(comment.userId, targetUser.id);
  console.log("✓ Task comment created successfully:", comment.id);

  // 4. Update status to NEED_INFO
  const updatedTask = await prisma.task.update({
    where: { id: task.id },
    data: { kanbanStatus: "NEED_INFO" },
  });
  assert.strictEqual(updatedTask.kanbanStatus, "NEED_INFO");
  console.log("✓ Status transitioned to NEED_INFO");

  // 5. Update status to RESOLVED -> status becomes DONE
  const resolvedTask = await prisma.task.update({
    where: { id: task.id },
    data: { kanbanStatus: "RESOLVED", status: "DONE" },
  });
  assert.strictEqual(resolvedTask.kanbanStatus, "RESOLVED");
  assert.strictEqual(resolvedTask.status, "DONE");
  console.log("✓ Status transitioned to RESOLVED");

  // 6. Close task
  const closedTask = await prisma.task.update({
    where: { id: task.id },
    data: { kanbanStatus: "CLOSED", status: "DONE" },
  });
  assert.strictEqual(closedTask.kanbanStatus, "CLOSED");
  console.log("✓ Status transitioned to CLOSED");

  // 7. Cleanup test data
  await prisma.taskComment.deleteMany({ where: { taskId: task.id } });
  await prisma.task.delete({ where: { id: task.id } });
  console.log("✓ Test task and comments cleaned up");

  console.log("All Cross-Dept Task tests passed!");
}

runTests()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
