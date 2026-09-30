import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log("Running Team-Department-User Foreign Key relation tests...");

  // 1. Verify Team foreign key to Department
  const teamsWithDept = await prisma.team.findMany({
    where: { departmentId: { not: null } },
    include: { departmentRel: true },
  });
  console.log(`✓ Found ${teamsWithDept.length} teams linked via departmentId`);
  if (teamsWithDept.length === 0) {
    throw new Error("Expected at least one team with departmentId FK");
  }
  for (const t of teamsWithDept) {
    if (!t.departmentRel) {
      throw new Error(`Team ${t.id} has departmentId but departmentRel is missing`);
    }
  }
  console.log("✓ Team -> Department relation integrity verified");

  // 2. Verify Department reverse relation to Teams
  const sampleTeam = teamsWithDept[0];
  const deptWithTeams = await prisma.department.findUnique({
    where: { id: sampleTeam.departmentId! },
    include: { teams: true, users: true },
  });
  if (!deptWithTeams) {
    throw new Error("Sample department not found");
  }
  const hasSampleTeam = deptWithTeams.teams.some((t) => t.id === sampleTeam.id);
  if (!hasSampleTeam) {
    throw new Error("Department.teams reverse relation does not contain linked team");
  }
  console.log("✓ Department -> Teams reverse relation integrity verified");

  // 3. Verify Operational User team department derivation
  const operationalUser = await prisma.user.findFirst({
    where: { role: "TEAM", teamId: { not: null } },
    include: {
      departmentRel: true,
      team: { include: { departmentRel: true } },
    },
  });
  if (operationalUser && operationalUser.team?.departmentRel) {
    console.log(
      `✓ Operational user '${operationalUser.name}' linked to team '${operationalUser.team.name}' with department '${operationalUser.team.departmentRel.value}'`
    );
  }

  // 4. Verify Management User direct department linking
  const managerUser = await prisma.user.findFirst({
    where: { role: { in: ["MANAGER", "C_LEVEL"] }, departmentId: { not: null } },
    include: { departmentRel: true },
  });
  if (managerUser) {
    if (!managerUser.departmentRel) {
      throw new Error("Manager user has departmentId but departmentRel is null");
    }
    console.log(
      `✓ Management user '${managerUser.name}' (${managerUser.role}) directly linked to department '${managerUser.departmentRel.name}'`
    );
  }

  // ponytail: keeping legacy team.department & user.department string columns populated for backwards compatibility; remove columns when all API consumers migrate
  console.log("ALL TEAM-DEPARTMENT-USER FK INTEGRITY TESTS PASSED!");
}

run()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
