import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEPARTMENTS = [
  { value: 'STRATEGIC', name: 'Strategic' },
  { value: 'FINANCE', name: 'Finance' },
  { value: 'BUSINESS', name: 'Business' },
  { value: 'B2S', name: 'B2S' },
  { value: 'B2B_EXPANSION', name: 'B2B Expansion' },
  { value: 'B2B_CORPORATION', name: 'B2B Corporation' },
  { value: 'B2C', name: 'B2C' },
  { value: 'PRODUCT_SERVICE', name: 'Product Service' },
  { value: 'SERVICE_ACCOUNT', name: 'Service Account' },
  { value: 'TECHDEV', name: 'Techdev' },
  { value: 'TECHOPS', name: 'TechOps' },
  { value: 'EDUCATION', name: 'Education' },
  { value: 'SSC', name: 'Shared Service Center' },
  { value: 'DESIGN', name: 'Design' },
  { value: 'DATA', name: 'Data' },
  { value: 'HR', name: 'HR' },
];

async function main() {
  console.log('Seeding departments...');
  for (const dept of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { value: dept.value },
      update: {},
      create: dept,
    });
  }
  console.log('Departments seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
