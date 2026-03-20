import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.employee.findMany({
    where: {
      phoneNumber: { in: ['081227121323', '089630574477'] }
    },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      employeeNo: true
    }
  });
  console.log("Users:", users);

  const ekandana = await prisma.employee.findFirst({
    where: { fullName: { contains: 'EKANDANA' } }
  });
  console.log("Ekandana details:", ekandana?.id, ekandana?.fullName, ekandana?.phoneNumber);
}

run().catch(console.error).finally(() => prisma.$disconnect());
