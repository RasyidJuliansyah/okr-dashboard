import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.user.deleteMany({});
  await prisma.team.deleteMany({});

  console.log('Seeding database...');

  // Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('password123', saltRounds);

  // Create Team first (managerId will be updated later)
  const team = await prisma.team.create({
    data: {
      name: 'Product & Tech',
    },
  });

  // Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@company.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Jane Manager',
      email: 'manager@company.com',
      password: hashedPassword,
      role: 'MANAGER',
      teamId: team.id,
    },
  });

  // Update team with managerId
  await prisma.team.update({
    where: { id: team.id },
    data: { managerId: manager.id },
  });

  const clevel = await prisma.user.create({
    data: {
      name: 'Alice CEO',
      email: 'clevel@company.com',
      password: hashedPassword,
      role: 'C_LEVEL',
    },
  });

  const employee = await prisma.user.create({
    data: {
      name: 'John Employee',
      email: 'employee@company.com',
      password: hashedPassword,
      role: 'EMPLOYEE',
      teamId: team.id,
    },
  });

  console.log('Seeding finished successfully:');
  console.log({
    admin: admin.email,
    manager: manager.email,
    clevel: clevel.email,
    employee: employee.email,
    team: team.name,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
