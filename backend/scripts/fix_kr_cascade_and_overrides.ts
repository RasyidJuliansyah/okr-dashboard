import { PrismaClient } from "@prisma/client";
import { cascadeInitiativeToMonthlyKr } from "../src/controllers/initiative.controller";

const prisma = new PrismaClient();

async function main() {
  console.log("=== SINKRONISASI KR & PERBAIKAN CASCADE ===");

  // 1. Perbaiki inisiatif dengan weight 0 menjadi 1.0
  const zeroWeightInits = await prisma.initiative.updateMany({
    where: { weight: 0 },
    data: { weight: 1.0 },
  });
  console.log(`Updated ${zeroWeightInits.count} inisiatif dengan weight = 0 -> weight = 1.0`);

  // 2. Cari semua KeyResult yang punya inisiatif aktif
  const krsWithInits = await prisma.keyResult.findMany({
    where: {
      isActive: true,
      initiatives: {
        some: { isActive: true },
      },
    },
    include: {
      initiatives: {
        where: { isActive: true },
        select: { id: true, title: true, currentValue: true, targetValue: true },
      },
    },
  });

  console.log(`Ditemukan ${krsWithInits.length} KeyResult aktif yang memiliki inisiatif aktif.`);

  for (const kr of krsWithInits) {
    const beforeVal = kr.currentValue;
    const beforeStatus = kr.status;
    const beforeOverride = kr.isManualOverride;

    // Reset override
    if (kr.isManualOverride) {
      await prisma.keyResult.update({
        where: { id: kr.id },
        data: { isManualOverride: false },
      });
    }

    // Trigger cascade
    await cascadeInitiativeToMonthlyKr(kr.id);

    // Ambil data terbaru
    const afterKr = await prisma.keyResult.findUnique({
      where: { id: kr.id },
    });

    console.log(`--------------------------------------------------`);
    console.log(`KR: [${kr.id}] ${kr.title}`);
    console.log(`  Target: ${kr.targetValue} ${kr.unit || "%"} (${kr.targetType})`);
    console.log(`  Sebelum: Val=${beforeVal}, Status=${beforeStatus}, Override=${beforeOverride}`);
    console.log(`  Sesudah: Val=${afterKr?.currentValue}, Status=${afterKr?.status}, Override=${afterKr?.isManualOverride}`);
    console.log(`  Inisiatif (${kr.initiatives.length}):`);
    for (const ini of kr.initiatives) {
      console.log(`    - ${ini.title} (Val: ${ini.currentValue}/${ini.targetValue})`);
    }
  }

  console.log("==================================================");
  console.log("Sinkronisasi selesai.");
}

main()
  .catch((e) => {
    console.error("Error running fix script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
