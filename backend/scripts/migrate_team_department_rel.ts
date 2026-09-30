import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log("Starting migration for team & user department foreign keys...");

  // 1. Add department_id column to team if not exists
  const teamCols: any = await prisma.$queryRawUnsafe("DESCRIBE `team`");
  const hasTeamDeptId = teamCols.some((c: any) => c.Field === "department_id");
  if (!hasTeamDeptId) {
    console.log("Adding department_id to `team` table...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`team\` 
      ADD COLUMN \`department_id\` VARCHAR(191) NULL AFTER \`leader_id\`,
      ADD INDEX \`Team_departmentId_idx\` (\`department_id\`);
    `);
  } else {
    console.log("Column `team.department_id` already exists.");
  }

  // 2. Add department_id column to user if not exists
  const userCols: any = await prisma.$queryRawUnsafe("DESCRIBE `user`");
  const hasUserDeptId = userCols.some((c: any) => c.Field === "department_id");
  if (!hasUserDeptId) {
    console.log("Adding department_id to `user` table...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`user\` 
      ADD COLUMN \`department_id\` VARCHAR(191) NULL AFTER \`team_id\`,
      ADD INDEX \`User_departmentId_idx\` (\`department_id\`);
    `);
  } else {
    console.log("Column `user.department_id` already exists.");
  }

  // 3. Backfill team.department_id from department table matching department.value
  console.log("Backfilling `team.department_id`...");
  const teamUpdateCount = await prisma.$executeRawUnsafe(`
    UPDATE \`team\` t
    JOIN \`department\` d ON t.\`department\` = d.\`value\`
    SET t.\`department_id\` = d.\`id\`
    WHERE t.\`department_id\` IS NULL;
  `);
  console.log(`Updated ${teamUpdateCount} teams with department_id.`);

  // 4. Backfill user.department_id from department table matching department.value
  console.log("Backfilling `user.department_id`...");
  const userUpdateCount = await prisma.$executeRawUnsafe(`
    UPDATE \`user\` u
    JOIN \`department\` d ON u.\`department\` = d.\`value\`
    SET u.\`department_id\` = d.\`id\`
    WHERE u.\`department_id\` IS NULL;
  `);
  console.log(`Updated ${userUpdateCount} users with direct department_id.`);

  // 5. Add Foreign Key constraints if not already present
  try {
    console.log("Adding FK constraint `Team_departmentId_fkey`...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`team\`
      ADD CONSTRAINT \`Team_departmentId_fkey\`
      FOREIGN KEY (\`department_id\`) REFERENCES \`department\`(\`id\`)
      ON DELETE SET NULL ON UPDATE CASCADE;
    `);
    console.log("FK `Team_departmentId_fkey` added.");
  } catch (err: any) {
    if (err.message?.includes("already exists") || err.message?.includes("Duplicate key")) {
      console.log("FK `Team_departmentId_fkey` already exists, skipping.");
    } else {
      console.warn("Notice on Team FK:", err.message);
    }
  }

  try {
    console.log("Adding FK constraint `User_departmentId_fkey`...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`user\`
      ADD CONSTRAINT \`User_departmentId_fkey\`
      FOREIGN KEY (\`department_id\`) REFERENCES \`department\`(\`id\`)
      ON DELETE SET NULL ON UPDATE CASCADE;
    `);
    console.log("FK `User_departmentId_fkey` added.");
  } catch (err: any) {
    if (err.message?.includes("already exists") || err.message?.includes("Duplicate key")) {
      console.log("FK `User_departmentId_fkey` already exists, skipping.");
    } else {
      console.warn("Notice on User FK:", err.message);
    }
  }

  console.log("Migration finished successfully.");
}

run()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
