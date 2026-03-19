import { Router } from 'express';

import prisma from '../lib/prisma.js';

const router = Router();

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

function normalizeInt(value) {
	const parsed = Number(value);
	return Number.isInteger(parsed) ? parsed : null;
}

function mapSeed(record) {
	return {
		id: record.id,
		employeeId: record.employeeId,
		employeeName: record.employee.fullName,
		employeeNo: record.employee.employeeNo,
		year: record.year,
		openingBalance: record.openingBalance,
		currentBalance: record.currentBalance,
	};
}

async function getEmployeeOrThrow(employeeId) {
	const employee = await prisma.employee.findUnique({
		where: { id: employeeId },
	});

	if (!employee) {
		throw Object.assign(new Error('Karyawan tidak ditemukan.'), { statusCode: 400 });
	}

	return employee;
}

async function validatePayload(payload = {}, currentId = null) {
	const employeeId = normalizeInt(payload.employeeId);
	const year = normalizeInt(payload.year);
	const openingBalance = normalizeInt(payload.openingBalance);
	const currentBalance = normalizeInt(payload.currentBalance);

	if (!employeeId) {
		throw Object.assign(new Error('Karyawan wajib dipilih.'), { statusCode: 400 });
	}

	if (!year || year < 2000 || year > 2100) {
		throw Object.assign(new Error('Tahun saldo cuti tidak valid.'), { statusCode: 400 });
	}

	if (openingBalance == null || openingBalance < 0) {
		throw Object.assign(new Error('Saldo awal tahunan wajib diisi dengan angka 0 atau lebih.'), {
			statusCode: 400,
		});
	}

	if (currentBalance == null || currentBalance < 0) {
		throw Object.assign(new Error('Saldo saat ini wajib diisi dengan angka 0 atau lebih.'), {
			statusCode: 400,
		});
	}

	if (currentBalance > openingBalance) {
		throw Object.assign(new Error('Saldo saat ini tidak boleh lebih besar dari saldo awal.'), {
			statusCode: 400,
		});
	}

	await getEmployeeOrThrow(employeeId);

	const duplicate = await prisma.employeeLeaveBalanceSeed.findFirst({
		where: {
			employeeId,
			year,
			...(currentId ? { NOT: { id: currentId } } : {}),
		},
	});

	if (duplicate) {
		throw Object.assign(new Error('Saldo cuti tahunan untuk karyawan dan tahun tersebut sudah ada.'), {
			statusCode: 409,
		});
	}

	return {
		employeeId,
		year,
		openingBalance,
		currentBalance,
	};
}

router.get(
	'/',
	withAsync(async (_req, res) => {
		const rows = await prisma.employeeLeaveBalanceSeed.findMany({
			include: {
				employee: true,
			},
			orderBy: [{ year: 'desc' }, { id: 'desc' }],
		});

		return res.json(
			rows
				.map(mapSeed)
				.sort((left, right) => right.year - left.year || left.employeeName.localeCompare(right.employeeName)),
		);
	}),
);

router.post(
	'/',
	withAsync(async (req, res) => {
		const data = await validatePayload(req.body);
		const record = await prisma.employeeLeaveBalanceSeed.create({
			data,
			include: {
				employee: true,
			},
		});

		return res.status(201).json(mapSeed(record));
	}),
);

router.put(
	'/:id',
	withAsync(async (req, res) => {
		const id = normalizeInt(req.params.id);

		if (!id) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const existing = await prisma.employeeLeaveBalanceSeed.findUnique({
			where: { id },
		});

		if (!existing) {
			return res.status(404).json({ message: 'Saldo cuti tahunan tidak ditemukan.' });
		}

		const data = await validatePayload(req.body, id);
		const record = await prisma.employeeLeaveBalanceSeed.update({
			where: { id },
			data,
			include: {
				employee: true,
			},
		});

		return res.json(mapSeed(record));
	}),
);

router.delete(
	'/:id',
	withAsync(async (req, res) => {
		const id = normalizeInt(req.params.id);

		if (!id) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const existing = await prisma.employeeLeaveBalanceSeed.findUnique({
			where: { id },
		});

		if (!existing) {
			return res.status(404).json({ message: 'Saldo cuti tahunan tidak ditemukan.' });
		}

		await prisma.employeeLeaveBalanceSeed.delete({
			where: { id },
		});

		return res.status(204).send();
	}),
);

export default router;
