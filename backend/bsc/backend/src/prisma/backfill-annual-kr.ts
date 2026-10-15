import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Starting Backfill: Monthly KR to Annual KR ===');
  
  // 1. Fetch all objectives and ensure their year is set (fallback to "2026")
  const objectives = await prisma.objective.findMany();
  console.log(`Found ${objectives.length} Objectives.`);
  
  for (const objective of objectives) {
    if (!objective.year) {
      await prisma.objective.update({
        where: { id: objective.id },
        data: { year: '2026' },
      });
    }
  }

  // 2. Fetch all key results
  const keyResults = await prisma.keyResult.findMany({
    include: { objective: true },
  });
  console.log(`Found ${keyResults.length} KeyResults.`);

  let backfilledCount = 0;
  for (const kr of keyResults) {
    // Set default month to current month if not set
    const currentMonth = kr.month || '2026-08';
    
    let annualKrId = kr.annualKeyResultId;

    if (!annualKrId) {
      const year = kr.objective?.year || '2026';
      const perspective = kr.bscPerspective;

      // Try to find an existing AnnualKeyResult for this objective and perspective
      let annualKr = await prisma.annualKeyResult.findFirst({
        where: {
          objectiveId: kr.objectiveId,
          bscPerspective: perspective,
          year: year,
        },
      });

      if (!annualKr) {
        // Create a new AnnualKeyResult
        const title = `BSC Tahunan - ${perspective} - ${kr.objective?.title || 'Objective'}`;
        console.log(`Creating AnnualKeyResult: "${title}"`);
        annualKr = await prisma.annualKeyResult.create({
          data: {
            objectiveId: kr.objectiveId,
            title: title,
            targetValue: kr.targetValue,
            unit: kr.unit,
            bscPerspective: perspective,
            year: year,
            status: kr.status || 'ON_TRACK',
          },
        });
      }

      annualKrId = annualKr.id;
    }

    // Update the KeyResult with month, monthWeight, and annualKeyResultId
    await prisma.keyResult.update({
      where: { id: kr.id },
      data: {
        annualKeyResultId: annualKrId,
        month: currentMonth,
        monthWeight: kr.monthWeight || 1.0,
      },
    });
    backfilledCount++;
  }

  console.log(`Successfully backfilled ${backfilledCount} KeyResults.`);
}

main()
  .catch((e) => {
    console.error('Error during backfill:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
