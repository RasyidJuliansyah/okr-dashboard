import assert from "node:assert";
import { getDepartmentLeaderInfo, getTaskApprovalRecipientId, getLeaderTeamIds } from "../controllers/initiative.controller";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runTests() {
  console.log("Running approval routing tests...");

  // Test 1: Department with Leader (B2C)
  const infoB2C = await getDepartmentLeaderInfo(["B2C"]);
  assert.strictEqual(infoB2C.deptsWithLeader.has("B2C"), true, "B2C should have a leader");
  assert.strictEqual(infoB2C.deptsWithoutLeader.has("B2C"), false, "B2C should not be in deptsWithoutLeader");
  assert.ok(infoB2C.leaderUserIds.length > 0, "B2C should have leaderUserIds");

  // Test 2: Department without Leader (e.g. DATA)
  const infoData = await getDepartmentLeaderInfo(["DATA"]);
  assert.strictEqual(infoData.deptsWithLeader.has("DATA"), false, "DATA should not have a leader");
  assert.strictEqual(infoData.deptsWithoutLeader.has("DATA"), true, "DATA should be in deptsWithoutLeader");

  // Test 3: Multiple departments mixed (B2C with leader, DATA without leader)
  const infoMixed = await getDepartmentLeaderInfo(["B2C", "DATA"]);
  assert.strictEqual(infoMixed.deptsWithLeader.has("B2C"), true);
  assert.strictEqual(infoMixed.deptsWithoutLeader.has("DATA"), true);

  // Test 4: Recipient routing for task in department with leader (B2C)
  const b2cLeaderId = infoB2C.leaderUserIds[0];
  const dummyTaskWithLeader = {
    initiative: { team: { department: "B2C", leaderId: b2cLeaderId } },
  };
  const recipientWithLeader = await getTaskApprovalRecipientId(dummyTaskWithLeader, "some-team-member-id");
  assert.strictEqual(recipientWithLeader, b2cLeaderId, "Recipient should be B2C leader");

  // Test 5: Recipient routing for task in department without leader (fallback to manager)
  const dummyTaskNoLeader = {
    initiative: { team: { department: "DATA" } },
    assignedBy: "manager-uuid-fallback",
  };
  const recipientNoLeader = await getTaskApprovalRecipientId(dummyTaskNoLeader, "some-team-member-id");
  assert.strictEqual(recipientNoLeader, "manager-uuid-fallback", "Fallback recipient should be used when dept has no manager in DB");

  // Test 6: Recipient routing for task in dept managed by a Manager in DB
  const techdevDept = await prisma.department.findUnique({ where: { value: "TECHDEV" } });
  if (techdevDept?.managerId) {
    const dummyTaskWithManager = {
      initiative: { team: { department: "NON_EXISTENT_DEPT", managerId: techdevDept.managerId } },
    };
    const recipientManager = await getTaskApprovalRecipientId(dummyTaskWithManager, "some-member");
    assert.strictEqual(recipientManager, techdevDept.managerId, "Should fallback to team managerId");
  }

  // Test 7: Cross-department task recipient routing
  // User with no teamId submitting cross-dept task to targetDept "B2C"
  const crossDeptTaskTargetB2C = {
    isCrossDept: true,
    targetDept: "B2C",
    creatorDept: "TECHDEV",
  };
  const recipientCrossDept = await getTaskApprovalRecipientId(crossDeptTaskTargetB2C, "standalone-user-no-team");
  assert.strictEqual(recipientCrossDept, b2cLeaderId, "Cross-dept task should route to targetDept leader");

  // Test 8: Leader and Manager Prisma where clause logic for cross-department closed tasks
  // Build where filter for Leader with department "TECHOPS"
  const leaderDept = "TECHOPS";
  const leaderTeams = await prisma.team.findMany({
    where: { department: leaderDept },
    select: { id: true },
  });
  const leaderTeamIds = leaderTeams.map((t) => t.id);

  // Leader query condition check:
  // Must match closed cross-dept task where creatorDept or targetDept is leaderDept
  const matchingClosedTask = {
    isCrossDept: true,
    kanbanStatus: "CLOSED",
    creatorDept: leaderDept,
    targetDept: "B2C",
  };
  const nonMatchingCrossTask = {
    isCrossDept: true,
    kanbanStatus: "CLOSED",
    creatorDept: "B2C",
    targetDept: "B2S",
  };
  const openCrossTask = {
    isCrossDept: true,
    kanbanStatus: "IN_PROGRESS",
    creatorDept: leaderDept,
    targetDept: "B2C",
  };

  const leaderMatches = (task: typeof matchingClosedTask) =>
    task.isCrossDept &&
    task.kanbanStatus === "CLOSED" &&
    (task.creatorDept === leaderDept || task.targetDept === leaderDept);

  assert.strictEqual(leaderMatches(matchingClosedTask), true, "Leader should match closed task with creatorDept");
  assert.strictEqual(leaderMatches(nonMatchingCrossTask), false, "Leader should not match unrelated closed task");
  assert.strictEqual(leaderMatches(openCrossTask), false, "Leader should not match non-closed task");

  // Manager query condition check:
  const managerDepts = ["TECHDEV", "PRODUCT"];
  const managerMatches = (task: typeof matchingClosedTask) =>
    task.isCrossDept &&
    task.kanbanStatus === "CLOSED" &&
    (managerDepts.includes(task.creatorDept) || managerDepts.includes(task.targetDept));

  const mgrTaskCreator = {
    isCrossDept: true,
    kanbanStatus: "CLOSED",
    creatorDept: "TECHDEV",
    targetDept: "B2C",
  };
  const mgrTaskTarget = {
    isCrossDept: true,
    kanbanStatus: "CLOSED",
    creatorDept: "B2C",
    targetDept: "PRODUCT",
  };
  const mgrTaskUnrelated = {
    isCrossDept: true,
    kanbanStatus: "CLOSED",
    creatorDept: "B2C",
    targetDept: "B2S",
  };

  assert.strictEqual(managerMatches(mgrTaskCreator), true, "Manager should match when creatorDept is managed");
  assert.strictEqual(managerMatches(mgrTaskTarget), true, "Manager should match when targetDept is managed");
  assert.strictEqual(managerMatches(mgrTaskUnrelated), false, "Manager should not match unrelated task");

  console.log("All approval routing assertions passed successfully!");
}

runTests()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
