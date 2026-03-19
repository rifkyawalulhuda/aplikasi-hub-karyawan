import { Router } from 'express';

import prisma from '../lib/prisma.js';

const router = Router();

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

function normalizeString(value = '') {
	return String(value).trim().replace(/\s+/g, ' ');
}

function normalizeMultilineString(value = '') {
	return String(value).replace(/\r\n/g, '\n').trim();
}

function toDateOnly(value) {
	if (!value) {
		return null;
	}

	if (value instanceof Date) {
		return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 12));
	}

	const raw = normalizeString(value);
	const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

	if (isoMatch) {
		const [, year, month, day] = isoMatch;
		return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
	}

	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateForClient(value) {
	if (!value) {
		return null;
	}

	return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(
		2,
		'0',
	)}`;
}

function mapEmployeeLeave(record) {
	return {
		id: record.id,
		employeeId: record.employeeId,
		employeeName: record.employee.fullName,
		employeeNo: record.employee.employeeNo,
		masterCutiKaryawanId: record.masterCutiKaryawanId,
		leaveType: record.masterCutiKaryawan.leaveType,
		leaveDays: record.leaveDays,
		periodStart: formatDateForClient(record.periodStart),
		periodEnd: formatDateForClient(record.periodEnd),
		remainingLeave: record.remainingLeave,
		notes: record.notes || '',
	};
}

async function getEmployeeOrThrow(id) {
	const employee = await prisma.employee.findUnique({
		where: { id },
	});

	if (!employee) {
		throw Object.assign(new Error('Karyawan tidak ditemukan.'), { statusCode: 400 });
	}

	return employee;
}

async function getLeaveTypeOrThrow(id) {
	const leaveType = await prisma.masterCutiKaryawan.findUnique({
		where: { id },
	});

	if (!leaveType) {
		throw Object.assign(new Error('Jenis cuti tidak ditemukan.'), { statusCode: 400 });
	}

	return leaveType;
}

async function getEmployeeLeaveOrThrow(id) {
	const record = await prisma.employeeLeave.findUnique({
		where: { id },
		include: {
			employee: true,
			masterCutiKaryawan: true,
		},
	});

	if (!record) {
		throw Object.assign(new Error('Data cuti karyawan tidak ditemukan.'), { statusCode: 404 });
	}

	return record;
}

async function validatePayload(payload = {}) {
	const employeeId = Number(payload.employeeId);
	const masterCutiKaryawanId = Number(payload.masterCutiKaryawanId);
	const leaveDays = Number(payload.leaveDays);
	const periodStart = toDateOnly(payload.periodStart);
	const periodEnd = toDateOnly(payload.periodEnd);
	const remainingLeave = Number(payload.remainingLeave);
	const notes = normalizeMultilineString(payload.notes);

	if (!Number.isInteger(employeeId)) {
		throw Object.assign(new Error('Nama Karyawan wajib dipilih.'), { statusCode: 400 });
	}

	if (!Number.isInteger(masterCutiKaryawanId)) {
		throw Object.assign(new Error('Jenis Cuti wajib dipilih.'), { statusCode: 400 });
	}

	if (!Number.isFinite(leaveDays) || leaveDays <= 0) {
		throw Object.assign(new Error('Jumlah Cuti wajib diisi dengan angka yang valid.'), { statusCode: 400 });
	}

	if (!periodStart) {
		throw Object.assign(new Error('Periode Cuti Dari wajib diisi.'), { statusCode: 400 });
	}

	if (!periodEnd) {
		throw Object.assign(new Error('Periode Cuti Sampai wajib diisi.'), { statusCode: 400 });
	}

	if (periodEnd.getTime() < periodStart.getTime()) {
		throw Object.assign(new Error('Periode Cuti Sampai tidak boleh lebih kecil dari Periode Cuti Dari.'), {
			statusCode: 400,
		});
	}

	if (!Number.isFinite(remainingLeave) || remainingLeave < 0) {
		throw Object.assign(new Error('Sisa Cuti wajib diisi dengan angka yang valid.'), { statusCode: 400 });
	}

	const [employee, leaveType] = await Promise.all([
		getEmployeeOrThrow(employeeId),
		getLeaveTypeOrThrow(masterCutiKaryawanId),
	]);

	return {
		employeeId: employee.id,
		masterCutiKaryawanId: leaveType.id,
		leaveDays: Math.trunc(leaveDays),
		periodStart,
		periodEnd,
		remainingLeave: Math.trunc(remainingLeave),
		notes: notes || null,
	};
}

router.get(
	'/',
	withAsync(async (_req, res) => {
		const records = await prisma.employeeLeave.findMany({
			include: {
				employee: true,
				masterCutiKaryawan: true,
			},
			orderBy: { id: 'desc' },
		});

		return res.json(records.map(mapEmployeeLeave));
	}),
);

router.get(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const record = await getEmployeeLeaveOrThrow(id);
		return res.json(mapEmployeeLeave(record));
	}),
);

router.post(
	'/',
	withAsync(async (req, res) => {
		const data = await validatePayload(req.body);
		const record = await prisma.employeeLeave.create({
			data,
			include: {
				employee: true,
				masterCutiKaryawan: true,
			},
		});

		return res.status(201).json(mapEmployeeLeave(record));
	}),
);

router.put(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		await getEmployeeLeaveOrThrow(id);

		const data = await validatePayload(req.body);
		const record = await prisma.employeeLeave.update({
			where: { id },
			data,
			include: {
				employee: true,
				masterCutiKaryawan: true,
			},
		});

		return res.json(mapEmployeeLeave(record));
	}),
);

router.delete(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		await getEmployeeLeaveOrThrow(id);
		await prisma.employeeLeave.delete({
			where: { id },
		});

		return res.status(204).send();
	}),
);

export default router;
