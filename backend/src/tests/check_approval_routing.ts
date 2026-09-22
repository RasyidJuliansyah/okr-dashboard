import assert from "node:assert";
import { getDepartmentLeaderInfo, getTaskApprovalRecipientId } from "../controllers/initiative.controller";
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
  // B2B_EXPANSION or B2S has manager '2fe0bee9-fe63-472d-be9c-735ee11ab167'
  // If we simulate a dept with manager but without leader:
  const dummyTaskNoLeader = {
    initiative: { team: { department: "DATA" } },
    assignedBy: "manager-uuid-fallback",
  };
  const recipientNoLeader = await getTaskApprovalRecipientId(dummyTaskNoLeader, "some-team-member-id");
  assert.strictEqual(recipientNoLeader, "manager-uuid-fallback", "Fallback recipient should be used when dept has no manager in DB");

  // Test 6: Recipient routing for task in dept managed by a Manager in DB
  const techdevDept = await prisma.department.findUnique({ where: { value: "TECHDEV" } });
  if (techdevDept?.managerId) {
    // If dept has no leader, should return techdevDept.managerId
    // Let's test with a fictional dept or with team.managerId
    const dummyTaskWithManager = {
      initiative: { team: { department: "NON_EXISTENT_DEPT", managerId: techdevDept.managerId } },
    };
    const recipientManager = await getTaskApprovalRecipientId(dummyTaskWithManager, "some-member");
    assert.strictEqual(recipientManager, techdevDept.managerId, "Should fallback to team managerId");
  }

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
