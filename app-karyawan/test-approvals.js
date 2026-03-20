import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function check() {
  const kipli = await prisma.employee.findFirst({
    where: { fullName: { contains: 'KIPLI' } }
  });
  
  const approvalsForKipli = await prisma.employeeLeaveApproval.findMany({
    where: { approverEmployeeId: kipli.id, status: 'PENDING' },
    include: {
      employeeLeave: true
    }
  });

  fs.writeFileSync('test-out-3.json', JSON.stringify({
    kipli,
    approvalsForKipli
  }, null, 2), 'utf-8');
}

check().catch(console.error).finally(() => prisma.$disconnect());
