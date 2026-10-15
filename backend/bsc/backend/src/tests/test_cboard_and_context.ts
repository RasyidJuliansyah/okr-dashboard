import assert from "node:assert";
import { PrismaClient } from "@prisma/client";
import { isCeoUser, isCLevelUser } from "../controllers/auth.controller";

const prisma = new PrismaClient();

async function runTests() {
  console.log("Running C-Board and Context Switcher verification tests...");

  // 1. Verify C-Board detection logic
  const ceoUser = { role: "C_LEVEL", position: "Chief Executive Officer" };
  const ctoUser = { role: "C_LEVEL", position: "Chief Technology Officer" };
  const cboUser = { role: "C_LEVEL", position: "Chief Business Officer" };
  const managerUser = { role: "MANAGER", position: "Engineering Manager" };

  assert.strictEqual(isCeoUser(ceoUser), true, "CEO detection should return true for CEO");
  assert.strictEqual(isCeoUser(ctoUser), false, "CEO detection should return false for CTO");
  assert.strictEqual(isCLevelUser(ctoUser), true, "C-Level detection should return true for CTO");
  assert.strictEqual(isCLevelUser(cboUser), true, "C-Level detection should return true for CBO");
  assert.strictEqual(isCLevelUser(managerUser), false, "C-Level detection should return false for Manager");
  console.log("✓ C-Board user detection helpers passed");

  // 2. Test database Department c_level_id assignment
  const techDept = await prisma.department.findUnique({
    where: { value: "TECHDEV" },
  });
  assert(techDept, "TECHDEV department must exist");

  const ctoDbUser = await prisma.user.findFirst({
    where: { position: { contains: "Technology" } },
  });
  assert(ctoDbUser, "CTO user must exist");

  // Assign CTO as C-Board sponsor for TECHDEV
  await prisma.department.update({
    where: { id: techDept.id },
    data: { cLevelId: ctoDbUser.id },
  });

  const updatedDept = await prisma.department.findUnique({
    where: { id: techDept.id },
    include: { cLevel: true },
  });

  assert.strictEqual(updatedDept?.cLevelId, ctoDbUser.id, "cLevelId should match CTO id");
  assert.strictEqual(updatedDept?.cLevel?.id, ctoDbUser.id, "Relation cLevel should return CTO user");
  console.log("✓ Department C-Board relation and query passed");

  // Verify reverse relation: CTO's strategicDepartments
  const ctoWithDepts = await prisma.user.findUnique({
    where: { id: ctoDbUser.id },
    include: { strategicDepartments: true },
  });
  assert(
    ctoWithDepts?.strategicDepartments.some((d) => d.value === "TECHDEV"),
    "CTO user must list TECHDEV under strategicDepartments"
  );
  console.log("✓ User strategicDepartments relation query passed");

  console.log("All C-Board & Context verification tests passed successfully!");
}

runTests()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
