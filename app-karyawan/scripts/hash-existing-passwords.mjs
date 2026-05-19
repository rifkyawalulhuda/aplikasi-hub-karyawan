import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

import { hashPassword, needsPasswordHash } from '../server/lib/password.js';

const prisma = new PrismaClient();

async function hashModelPasswords({ modelName, label }) {
	const records = await prisma[modelName].findMany({
		select: {
			id: true,
			password: true,
		},
	});
	let updatedCount = 0;

	for (const record of records) {
		if (!needsPasswordHash(record.password)) {
			continue;
		}

		await prisma[modelName].update({
			where: { id: record.id },
			data: {
				password: await hashPassword(record.password),
			},
		});
		updatedCount += 1;
	}

	console.log(`${label}: ${updatedCount} password di-hash dari ${records.length} record.`);
}

async function main() {
	await hashModelPasswords({ modelName: 'employee', label: 'Employee' });
	await hashModelPasswords({ modelName: 'masterAdmin', label: 'Master Admin' });
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
