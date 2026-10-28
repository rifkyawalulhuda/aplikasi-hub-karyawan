import { Router } from 'express';

import prisma from '../lib/prisma.js';
import { buildSiteWhere, resolveWriteSiteId, siteNotFound } from '../lib/siteScope.js';
import requireSiteIsolation from '../middleware/requireSiteIsolation.js';

const router = Router();

router.use(requireSiteIsolation({ modelType: 'per-site' }));

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

async function getEmployeeOrThrow(employeeId, siteId) {
	const employee = await prisma.employee.findFirst({
		where: { id: employeeId, siteId },
	});

	if (!employee) {
		throw Object.assign(new Error('Karyawan tidak ditemukan.'), { statusCode: 400 });
	}

	return employee;
}

async function validatePayload(payload = {}, currentId = null, siteId) {
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

	await getEmployeeOrThrow(employeeId, siteId);

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
	withAsync(async (req, res) => {
		const rows = await prisma.employeeLeaveBalanceSeed.findMany({
			where: { ...buildSiteWhere(req) },
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
		const siteId = resolveWriteSiteId(req, req.body.siteId);
		const data = await validatePayload(req.body, null, siteId);
		const record = await prisma.employeeLeaveBalanceSeed.create({
			data: { ...data, siteId },
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

		const existing = await prisma.employeeLeaveBalanceSeed.findFirst({
			where: { id, ...buildSiteWhere(req) },
		});

		if (!existing) {
			return siteNotFound(res);
		}

		const data = await validatePayload(req.body, id, existing.siteId);
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

		const existing = await prisma.employeeLeaveBalanceSeed.findFirst({
			where: { id, ...buildSiteWhere(req) },
		});

		if (!existing) {
			return siteNotFound(res);
		}

		await prisma.employeeLeaveBalanceSeed.delete({
			where: { id },
		});

		return res.status(204).send();
	}),
);

export default router;
