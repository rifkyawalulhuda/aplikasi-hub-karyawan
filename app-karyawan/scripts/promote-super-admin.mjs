/**
 * Explicitly promote an existing MasterAdmin to the global super_admin role.
 *
 * Usage:
 *   node scripts/promote-super-admin.mjs <NIK>
 *
 * The tenancy migration used to promote whichever admin row had the lowest id;
 * this script replaces that implicit choice with a named, auditable operator
 * action. It also bumps tokenVersion so previous sessions cannot keep the new
 * authority.
 */
import 'dotenv/config';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	const nik = String(process.argv[2] || '').trim();

	if (!nik) {
		console.error('Usage: node scripts/promote-super-admin.mjs <NIK>');
		process.exitCode = 1;
		return;
	}

	const employee = await prisma.employee.findFirst({
		where: { employeeNo: { equals: nik, mode: 'insensitive' } },
		select: { id: true, employeeNo: true, fullName: true, siteId: true },
	});

	if (!employee) {
		console.error(`Employee dengan NIK "${nik}" tidak ditemukan.`);
		process.exitCode = 1;
		return;
	}

	const admin = await prisma.masterAdmin.findUnique({
		where: { employeeId: employee.id },
		select: { id: true, role: true, siteId: true },
	});

	if (!admin) {
		console.error(`Employee "${employee.employeeNo}" tidak memiliki akun Master Admin.`);
		process.exitCode = 1;
		return;
	}

	if (admin.role === 'super_admin' && admin.siteId === null) {
		console.log(`${employee.employeeNo} sudah super_admin.`);
		return;
	}

	await prisma.masterAdmin.update({
		where: { id: admin.id },
		data: {
			role: 'super_admin',
			siteId: null,
			tokenVersion: { increment: 1 },
		},
	});

	console.log(
		`${employee.employeeNo} (${employee.fullName}) dipromosikan: ${admin.role}/site ${admin.siteId} -> super_admin/site null. Sesi lama dicabut.`,
	);
}

main()
	.catch((error) => {
		console.error(error.message);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
