import { Router } from 'express';

import prisma from '../lib/prisma.js';

const router = Router();
const ALLOWED_ROLES = ['admin', 'user'];

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

function normalizeString(value = '') {
	return String(value).trim().replace(/\s+/g, ' ');
}

function mapAdmin(record) {
	return {
		id: record.id,
		employeeId: record.employeeId,
		employeeName: record.employee.fullName,
		employeeNo: record.employee.employeeNo,
		password: record.password,
		role: record.role,
	};
}

async function getEmployeeOrThrow(employeeId) {
	const employee = await prisma.employee.findUnique({
		where: { id: employeeId },
	});

	if (!employee) {
		throw Object.assign(new Error('Nama wajib dipilih.'), { statusCode: 400 });
	}

	return employee;
}

async function validatePayload(body, currentId = null) {
	const employeeId = Number(body.employeeId);
	const password = normalizeString(body.password);
	const role = normalizeString(body.role).toLowerCase();

	if (!Number.isInteger(employeeId)) {
		throw Object.assign(new Error('Nama wajib dipilih.'), { statusCode: 400 });
	}

	if (!password) {
		throw Object.assign(new Error('Password wajib diisi.'), { statusCode: 400 });
	}

	if (!ALLOWED_ROLES.includes(role)) {
		throw Object.assign(new Error('Role harus dipilih.'), { statusCode: 400 });
	}

	await getEmployeeOrThrow(employeeId);

	const duplicate = await prisma.masterAdmin.findFirst({
		where: {
			employeeId,
			...(currentId ? { NOT: { id: currentId } } : {}),
		},
	});

	if (duplicate) {
		throw Object.assign(new Error('Nama sudah terdaftar sebagai Master Admin.'), { statusCode: 409 });
	}

	return {
		employeeId,
		password,
		role,
	};
}

router.get(
	'/',
	withAsync(async (req, res) => {
		const records = await prisma.masterAdmin.findMany({
			include: {
				employee: true,
			},
			orderBy: { id: 'asc' },
		});

		return res.json(records.map(mapAdmin));
	}),
);

router.post(
	'/',
	withAsync(async (req, res) => {
		const data = await validatePayload(req.body);
		const record = await prisma.masterAdmin.create({
			data,
			include: {
				employee: true,
			},
		});

		return res.status(201).json(mapAdmin(record));
	}),
);

router.put(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const existing = await prisma.masterAdmin.findUnique({
			where: { id },
		});

		if (!existing) {
			return res.status(404).json({ message: 'Master Admin tidak ditemukan.' });
		}

		const data = await validatePayload(req.body, id);
		const record = await prisma.masterAdmin.update({
			where: { id },
			data,
			include: {
				employee: true,
			},
		});

		return res.json(mapAdmin(record));
	}),
);

router.delete(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const existing = await prisma.masterAdmin.findUnique({
			where: { id },
		});

		if (!existing) {
			return res.status(404).json({ message: 'Master Admin tidak ditemukan.' });
		}

		await prisma.masterAdmin.delete({
			where: { id },
		});

		return res.status(204).send();
	}),
);

export default router;
