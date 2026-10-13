import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log("=== Normalizing DB: Objectives, KeyResults, Initiatives, Tasks ===");

  const activeSprint = await prisma.sprint.findFirst({
    where: { status: "ACTIVE" },
  });

  if (!activeSprint) {
    throw new Error("Active sprint not found in database!");
  }

  console.log(`Active Sprint: "${activeSprint.name}" (${activeSprint.id})`);

  // 1. Objectives: Unify year to '2026'
  const updatedObjs = await prisma.objective.updateMany({
    where: {
      OR: [
        { year: "Q3-2026" },
        { year: { contains: "Q3" } },
      ],
    },
    data: {
      year: "2026",
      quarter: "Q3",
    },
  });
  console.log(`Updated Objectives year/quarter: ${updatedObjs.count} records`);

  // Ensure all objectives for 2026 have quarter set to Q3 if null
  await prisma.objective.updateMany({
    where: { year: "2026", quarter: null },
    data: { quarter: "Q3" },
  });

  // 2. Initiatives: Set sprintMonth to sprintId
  const allInits = await prisma.initiative.findMany();
  let initsUpdated = 0;
  for (const init of allInits) {
    const targetSprintId = init.sprintId || activeSprint.id;
    await prisma.initiative.update({
      where: { id: init.id },
      data: {
        sprintId: targetSprintId,
        sprintMonth: targetSprintId,
      },
    });
    initsUpdated++;
  }
  console.log(`Normalized Initiatives (sprintMonth = sprintId): ${initsUpdated} records`);

  // 3. Tasks: Set sprintMonth to sprintId
  const allTasks = await prisma.task.findMany();
  let tasksUpdated = 0;
  for (const t of allTasks) {
    const targetSprintId = t.sprintId || activeSprint.id;
    await prisma.task.update({
      where: { id: t.id },
      data: {
        sprintId: targetSprintId,
        sprintMonth: targetSprintId,
      },
    });
    tasksUpdated++;
  }
  console.log(`Normalized Tasks (sprintMonth = sprintId): ${tasksUpdated} records`);

  // 4. KeyResults: Normalize month to active sprint UUID
  const activeKrs = await prisma.keyResult.findMany({
    where: { isActive: true },
  });
  let krsUpdated = 0;
  for (const kr of activeKrs) {
    await prisma.keyResult.update({
      where: { id: kr.id },
      data: {
        month: activeSprint.id,
      },
    });
    krsUpdated++;
  }
  console.log(`Normalized active KeyResults (month = activeSprint.id): ${krsUpdated} records`);

  // 5. Verification checks
  const total2026Objs = await prisma.objective.count({ where: { year: "2026" } });
  const totalActiveKrs = await prisma.keyResult.count({
    where: { isActive: true, objective: { year: "2026" } },
  });
  const initsMatched = await prisma.initiative.count({
    where: { sprintMonth: activeSprint.id },
  });

  console.log("\n--- Verification Summary ---");
  console.log(`Objectives with year="2026": ${total2026Objs}`);
  console.log(`Active KRs under year="2026": ${totalActiveKrs}`);
  console.log(`Initiatives with sprintMonth = activeSprint.id: ${initsMatched}`);
  console.log("Database normalization complete!");
}

run()
  .catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
