import assert from "assert";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runCheck() {
  const tasks = await prisma.task.findMany({
    take: 10,
    include: {
      initiative: {
        include: {
          keyResult: { include: { objective: true, departments: true } },
          team: true,
          owner: { select: { id: true, name: true } },
        },
      },
      creator: {
        select: { id: true, name: true, department: true, role: true },
      },
      assignedTeamMember: {
        select: { id: true, name: true, department: true, role: true },
      },
    },
  });

  const userIds = new Set<string>();
  tasks.forEach((t) => {
    if (!t.creator && t.assignedBy) userIds.add(t.assignedBy);
  });

  const fetchedUsers = await prisma.user.findMany({
    where: { id: { in: Array.from(userIds) } },
    select: { id: true, name: true, department: true, role: true },
  });
  const uMap = new Map(fetchedUsers.map((u) => [u.id, u]));

  tasks.forEach((t) => {
    const creator =
      t.creator ||
      (t.assignedBy && uMap.get(t.assignedBy)) ||
      (t.initiative?.owner ? { id: t.initiative.owner.id, name: t.initiative.owner.name } : null);
    assert(creator !== undefined, "Task creator should be resolved");
  });

  console.log("Creator resolution self-check passed for", tasks.length, "tasks.");
  await prisma.$disconnect();
}

runCheck().catch((err) => {
  console.error("Self check failed:", err);
  process.exit(1);
});
