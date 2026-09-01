import { PrismaClient } from '@prisma/client';

for (const pw of ['postgres', 'postgres123']) {
  const url = 'postgresql://postgres:' + pw + '@localhost:5434/hub_karyawan?schema=public';
  const p = new PrismaClient({ datasources: { db: { url } } });
  try {
    await p.$connect();
    console.log(pw + ' => OK');
    await p.$disconnect();
  } catch (e) {
    console.log(pw + ' => FAIL: ' + e.message.split('\n')[0]);
  }
}