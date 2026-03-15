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

function normalizeGradeLabel(value = '') {
	const raw = normalizeString(value);
	const enumMatch = raw.match(/^RANK_(\d+)$/i);

	if (enumMatch) {
		return `Rank ${enumMatch[1]}`;
	}

	const labelMatch = raw.match(/^Rank\s+(\d+)$/i);
	if (labelMatch) {
		return `Rank ${labelMatch[1]}`;
	}

	return raw;
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

	return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function mapGuidanceRecord(record) {
	return {
		id: record.id,
		employeeId: record.employeeId,
		employeeName: record.employee.fullName,
		employeeNo: record.employee.employeeNo,
		departmentName: record.employee.department.name,
		positionName: record.employee.jobLevel.name,
		rank: normalizeGradeLabel(record.employee.grade),
		meetingNumber: record.meetingNumber,
		meetingDate: formatDateForClient(record.meetingDate),
		meetingTime: record.meetingTime,
		location: record.location,
		problemFaced: record.problemFaced,
		problemCause: record.problemCause,
		problemSolving: record.problemSolving,
	};
}

async function getEmployeeOrThrow(employeeId) {
	const employee = await prisma.employee.findUnique({
		where: { id: employeeId },
		include: {
			department: true,
			jobLevel: true,
		},
	});

	if (!employee) {
		throw Object.assign(new Error('Karyawan tidak ditemukan.'), { statusCode: 400 });
	}

	return employee;
}

async function getGuidanceRecordOrThrow(id) {
	const record = await prisma.guidanceRecord.findUnique({
		where: { id },
		include: {
			employee: {
				include: {
					department: true,
					jobLevel: true,
				},
			},
		},
	});

	if (!record) {
		throw Object.assign(new Error('Data bimbingan tidak ditemukan.'), { statusCode: 404 });
	}

	return record;
}

async function validatePayload(payload) {
	const employeeId = Number(payload.employeeId);
	const meetingNumber = Number(payload.meetingNumber);
	const meetingDate = toDateOnly(payload.meetingDate);
	const meetingTime = normalizeString(payload.meetingTime);
	const location = normalizeString(payload.location);
	const problemFaced = normalizeMultilineString(payload.problemFaced);
	const problemCause = normalizeMultilineString(payload.problemCause);
	const problemSolving = normalizeMultilineString(payload.problemSolving);

	if (!Number.isInteger(employeeId)) {
		throw Object.assign(new Error('Nama karyawan wajib dipilih.'), { statusCode: 400 });
	}

	if (!Number.isInteger(meetingNumber) || meetingNumber < 1 || meetingNumber > 4) {
		throw Object.assign(new Error('Pertemuan ke harus bernilai 1 sampai 4.'), { statusCode: 400 });
	}

	if (!meetingDate) {
		throw Object.assign(new Error('Tanggal wajib diisi.'), { statusCode: 400 });
	}

	if (!meetingTime) {
		throw Object.assign(new Error('Jam wajib diisi.'), { statusCode: 400 });
	}

	if (!location) {
		throw Object.assign(new Error('Tempat wajib diisi.'), { statusCode: 400 });
	}

	if (!problemFaced) {
		throw Object.assign(new Error('Permasalahan yang dihadapi wajib diisi.'), { statusCode: 400 });
	}

	if (!problemCause) {
		throw Object.assign(new Error('Penyebab masalah wajib diisi.'), { statusCode: 400 });
	}

	if (!problemSolving) {
		throw Object.assign(new Error('Pemecahan masalah wajib diisi.'), { statusCode: 400 });
	}

	await getEmployeeOrThrow(employeeId);

	return {
		employeeId,
		meetingNumber,
		meetingDate,
		meetingTime,
		location,
		problemFaced,
		problemCause,
		problemSolving,
	};
}

router.get(
	'/',
	withAsync(async (req, res) => {
		const records = await prisma.guidanceRecord.findMany({
			include: {
				employee: {
					include: {
						department: true,
						jobLevel: true,
					},
				},
			},
			orderBy: { id: 'desc' },
		});

		return res.json(records.map(mapGuidanceRecord));
	}),
);

router.get(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const record = await getGuidanceRecordOrThrow(id);
		return res.json(mapGuidanceRecord(record));
	}),
);

router.post(
	'/',
	withAsync(async (req, res) => {
		const data = await validatePayload(req.body);
		const record = await prisma.guidanceRecord.create({
			data,
			include: {
				employee: {
					include: {
						department: true,
						jobLevel: true,
					},
				},
			},
		});

		return res.status(201).json(mapGuidanceRecord(record));
	}),
);

router.put(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		await getGuidanceRecordOrThrow(id);

		const data = await validatePayload(req.body);
		const record = await prisma.guidanceRecord.update({
			where: { id },
			data,
			include: {
				employee: {
					include: {
						department: true,
						jobLevel: true,
					},
				},
			},
		});

		return res.json(mapGuidanceRecord(record));
	}),
);

router.delete(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		await getGuidanceRecordOrThrow(id);
		await prisma.guidanceRecord.delete({ where: { id } });
		return res.status(204).send();
	}),
);

export default router;
