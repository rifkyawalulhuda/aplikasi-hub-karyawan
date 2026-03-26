import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ensureMasterData() {
  const workLocation = await prisma.workLocation.upsert({
    where: { name: 'Site CLC' },
    update: {},
    create: { name: 'Site CLC' },
  });

  const department = await prisma.department.upsert({
    where: { name: 'IT' },
    update: {},
    create: { name: 'IT' },
  });

  const jobRole = await prisma.jobRole.upsert({
    where: { name: 'System Administrator' },
    update: {},
    create: { name: 'System Administrator' },
  });

  const jobLevel = await prisma.jobLevel.upsert({
    where: { name: 'Staff' },
    update: {},
    create: { name: 'Staff' },
  });

  return { workLocation, department, jobRole, jobLevel };
}

async function upsertEmployee({ employeeNo, password, fullName, email }, refs) {
  return prisma.employee.upsert({
    where: { employeeNo },
    update: {
      password,
      fullName,
      email,
      departmentId: refs.department.id,
      workLocationId: refs.workLocation.id,
      jobRoleId: refs.jobRole.id,
      jobLevelId: refs.jobLevel.id,
    },
    create: {
      employeeNo,
      password,
      fullName,
      employmentType: 'PERMANENT',
      siteDiv: 'CLC',
      departmentId: refs.department.id,
      birthDate: new Date('1995-01-10T00:00:00.000Z'),
      gender: 'MALE',
      workLocationId: refs.workLocation.id,
      jobRoleId: refs.jobRole.id,
      jobLevelId: refs.jobLevel.id,
      educationLevel: 'S1',
      grade: 'RANK_3',
      joinDate: new Date('2024-01-01T00:00:00.000Z'),
      phoneNumber: '081234567890',
      email,
    },
  });
}

async function main() {
  const refs = await ensureMasterData();

  const adminEmployee = await upsertEmployee(
    {
      employeeNo: 'EMP-ADMIN-001',
      password: 'admin123',
      fullName: 'Admin Dummy',
      email: 'admin.dummy@local.test',
    },
    refs,
  );

  await upsertEmployee(
    {
      employeeNo: 'EMP-USER-001',
      password: 'user123',
      fullName: 'User Dummy',
      email: 'user.dummy@local.test',
    },
    refs,
  );

  await prisma.masterAdmin.upsert({
    where: { employeeId: adminEmployee.id },
    update: {
      password: 'admin123',
      role: 'admin',
    },
    create: {
      employeeId: adminEmployee.id,
      password: 'admin123',
      role: 'admin',
    },
  });

  console.log('Seed login berhasil dibuat.');
  console.log('Admin login: NIK EMP-ADMIN-001 | Password admin123');
  console.log('Employee login: NIK EMP-USER-001 | Password user123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
