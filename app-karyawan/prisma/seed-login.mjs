import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

import { hashPassword } from '../server/lib/password.js';

const prisma = new PrismaClient();

async function ensureMasterData() {
	const site = await prisma.masterSite.upsert({
		where: { name: 'CLC' },
		update: {},
		create: { name: 'CLC' },
	});

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

	return { site, workLocation, department, jobRole, jobLevel };
}

async function upsertEmployee({ employeeNo, password, fullName, email }, refs) {
	const passwordHash = await hashPassword(password);

	return prisma.employee.upsert({
		where: { employeeNo },
		update: {
			password: passwordHash,
			fullName,
			email,
		},
		create: {
			employeeNo,
			password: passwordHash,
			fullName,
			employmentType: 'PERMANENT',
			birthDate: new Date('1995-01-10T00:00:00.000Z'),
			gender: 'MALE',
			educationLevel: 'S1',
			grade: 'RANK_3',
			joinDate: new Date('2024-01-01T00:00:00.000Z'),
			phoneNumber: '081234567890',
			email,
			site: { connect: { id: refs.site.id } },
			department: { connect: { id: refs.department.id } },
			workLocation: { connect: { id: refs.workLocation.id } },
			jobRole: { connect: { id: refs.jobRole.id } },
			jobLevel: { connect: { id: refs.jobLevel.id } },
		},
	});
}

async function main() {
	const refs = await ensureMasterData();
	const adminPasswordHash = await hashPassword('admin123');

	const adminEmployee = await upsertEmployee(
		{
			employeeNo: 'CLC001',
			password: 'admin123',
			fullName: 'Admin Dummy',
			email: 'admin.dummy@local.test',
		},
		refs,
	);

	await upsertEmployee(
		{
			employeeNo: 'CLC002',
			password: 'user123',
			fullName: 'User Dummy',
			email: 'user.dummy@local.test',
		},
		refs,
	);

	await prisma.masterAdmin.upsert({
		where: { employeeId: adminEmployee.id },
		update: {
			password: adminPasswordHash,
			role: 'admin',
			siteId: refs.site.id,
		},
		create: {
			employeeId: adminEmployee.id,
			password: adminPasswordHash,
			role: 'admin',
			siteId: refs.site.id,
		},
	});

	const masterAdminEmployee = await upsertEmployee(
		{
			employeeNo: 'CLC000',
			password: 'masteradmin123',
			fullName: 'Master Admin',
			email: 'master.admin@local.test',
		},
		refs,
	);

	await prisma.masterAdmin.upsert({
		where: { employeeId: masterAdminEmployee.id },
		update: {
			password: await hashPassword('masteradmin123'),
			role: 'super_admin',
		},
		create: {
			employeeId: masterAdminEmployee.id,
			password: await hashPassword('masteradmin123'),
			role: 'super_admin',
		},
	});

	console.log('Seed login berhasil dibuat.');
	console.log('Master Admin login: NIK CLC000 | Password masteradmin123');
	console.log('Admin login: NIK CLC001 | Password admin123');
	console.log('Employee login: NIK CLC002 | Password user123');
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
