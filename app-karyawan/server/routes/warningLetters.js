import { Router } from 'express';

import prisma from '../lib/prisma.js';

const router = Router();
const WARNING_LEVELS = [1, 2, 3];
const SUPERIOR_JOB_LEVEL = 'Department Manager';
const DEFAULT_WARNING_LEVEL = 1;

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

	return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function addSixMonths(value) {
	const parsed = toDateOnly(value);

	if (!parsed) {
		return null;
	}

	const sourceDay = parsed.getUTCDate();
	const target = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + 6, 1, 12));
	const lastDayOfTargetMonth = new Date(
		Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12),
	).getUTCDate();

	target.setUTCDate(Math.min(sourceDay, lastDayOfTargetMonth));
	return target;
}

function mapWarningLetter(record) {
	return {
		id: record.id,
		employeeId: record.employeeId,
		employeeName: record.employee.fullName,
		employeeNo: record.employee.employeeNo,
		warningLevel: record.warningLevel,
		letterNumber: record.letterNumber,
		letterDate: formatDateForClient(record.letterDate),
		violation: record.violation,
		masterDokPkbId: record.masterDokPkbId,
		articleLabel: record.articleLabel,
		articleContent: record.articleContent,
		superiorEmployeeId: record.superiorEmployeeId,
		superiorName: record.superiorEmployee.fullName,
		superiorJobLevelName: record.superiorEmployee.jobLevel.name,
	};
}

async function getEmployeeOrThrow(id) {
	const employee = await prisma.employee.findUnique({
		where: { id },
		include: {
			jobLevel: true,
		},
	});

	if (!employee) {
		throw Object.assign(new Error('Karyawan tidak ditemukan.'), { statusCode: 400 });
	}

	return employee;
}

async function getMasterDokPkbOrThrow(id) {
	const document = await prisma.masterDokPkb.findUnique({
		where: { id },
	});

	if (!document) {
		throw Object.assign(new Error('Pasal PKB tidak ditemukan.'), { statusCode: 400 });
	}

	return document;
}

async function getWarningLetterOrThrow(id) {
	const record = await prisma.warningLetter.findUnique({
		where: { id },
		include: {
			employee: true,
			superiorEmployee: {
				include: {
					jobLevel: true,
				},
			},
		},
	});

	if (!record) {
		throw Object.assign(new Error('Data surat peringatan tidak ditemukan.'), { statusCode: 404 });
	}

	return record;
}

async function getActiveWarningRule({ employeeId, referenceDate, excludeId }) {
	const warningLetters = await prisma.warningLetter.findMany({
		where: {
			employeeId,
			...(excludeId ? { id: { not: excludeId } } : {}),
		},
		orderBy: { letterDate: 'desc' },
	});

	const comparableReferenceDate = referenceDate?.getTime();
	const activeLetters = warningLetters.filter((row) => {
		const startDate = toDateOnly(row.letterDate)?.getTime();
		const endDate = addSixMonths(row.letterDate)?.getTime();

		if (!startDate || !endDate || !comparableReferenceDate) {
			return false;
		}

		return comparableReferenceDate >= startDate && comparableReferenceDate <= endDate;
	});

	const highestActiveLevel = activeLetters.reduce(
		(highestLevel, row) => Math.max(highestLevel, Number(row.warningLevel) || 0),
		0,
	);

	return {
		activeLetters,
		highestActiveLevel,
		recommendedLevel:
			highestActiveLevel <= 0 ? DEFAULT_WARNING_LEVEL : Math.min(highestActiveLevel + 1, 3),
	};
}

async function validatePayload(payload, currentId) {
	const employeeId = Number(payload.employeeId);
	const superiorEmployeeId = Number(payload.superiorEmployeeId);
	const masterDokPkbId = Number(payload.masterDokPkbId);
	const warningLevel = Number(payload.warningLevel);
	const letterNumber = normalizeString(payload.letterNumber);
	const letterDate = toDateOnly(payload.letterDate);
	const violation = normalizeMultilineString(payload.violation);

	if (!Number.isInteger(employeeId)) {
		throw Object.assign(new Error('Nama wajib dipilih.'), { statusCode: 400 });
	}

	if (!WARNING_LEVELS.includes(warningLevel)) {
		throw Object.assign(new Error('Surat Peringatan ke harus dipilih.'), { statusCode: 400 });
	}

	if (!letterNumber) {
		throw Object.assign(new Error('Nomor Surat wajib diisi.'), { statusCode: 400 });
	}

	if (letterNumber.length > 25) {
		throw Object.assign(new Error('Nomor Surat maksimal 25 karakter.'), { statusCode: 400 });
	}

	if (!letterDate) {
		throw Object.assign(new Error('Tanggal Surat Peringatan wajib diisi.'), { statusCode: 400 });
	}

	if (!violation) {
		throw Object.assign(new Error('Pelanggaran wajib diisi.'), { statusCode: 400 });
	}

	if (!Number.isInteger(masterDokPkbId)) {
		throw Object.assign(new Error('Pasal PKB wajib dipilih.'), { statusCode: 400 });
	}

	if (!Number.isInteger(superiorEmployeeId)) {
		throw Object.assign(new Error('Superior wajib dipilih.'), { statusCode: 400 });
	}

	const [employee, superiorEmployee, masterDokPkb] = await Promise.all([
		getEmployeeOrThrow(employeeId),
		getEmployeeOrThrow(superiorEmployeeId),
		getMasterDokPkbOrThrow(masterDokPkbId),
	]);

	const warningRule = await getActiveWarningRule({
		employeeId: employee.id,
		referenceDate: letterDate,
		excludeId: currentId,
	});

	if (normalizeString(superiorEmployee.jobLevel?.name).toLowerCase() !== SUPERIOR_JOB_LEVEL.toLowerCase()) {
		throw Object.assign(new Error('Superior harus memiliki Job Level Department Manager.'), { statusCode: 400 });
	}

	if (warningLevel < warningRule.recommendedLevel) {
		throw Object.assign(
			new Error(
				`Karyawan ini masih memiliki Surat Peringatan aktif. Level minimal yang dapat dipilih adalah Surat Peringatan ke ${warningRule.recommendedLevel}.`,
			),
			{ statusCode: 400 },
		);
	}

	return {
		employeeId: employee.id,
		superiorEmployeeId: superiorEmployee.id,
		masterDokPkbId: masterDokPkb.id,
		warningLevel,
		letterNumber,
		letterDate,
		violation,
		articleLabel: masterDokPkb.article,
		articleContent: masterDokPkb.content,
	};
}

router.get(
	'/',
	withAsync(async (req, res) => {
		const records = await prisma.warningLetter.findMany({
			include: {
				employee: true,
				superiorEmployee: {
					include: {
						jobLevel: true,
					},
				},
			},
			orderBy: { id: 'desc' },
		});

		return res.json(records.map(mapWarningLetter));
	}),
);

router.get(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const record = await getWarningLetterOrThrow(id);
		return res.json(mapWarningLetter(record));
	}),
);

router.post(
	'/',
	withAsync(async (req, res) => {
		const data = await validatePayload(req.body);
		const record = await prisma.warningLetter.create({
			data,
			include: {
				employee: true,
				superiorEmployee: {
					include: {
						jobLevel: true,
					},
				},
			},
		});

		return res.status(201).json(mapWarningLetter(record));
	}),
);

router.put(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		await getWarningLetterOrThrow(id);

		const data = await validatePayload(req.body, id);
		const record = await prisma.warningLetter.update({
			where: { id },
			data,
			include: {
				employee: true,
				superiorEmployee: {
					include: {
						jobLevel: true,
					},
				},
			},
		});

		return res.json(mapWarningLetter(record));
	}),
);

router.delete(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		await getWarningLetterOrThrow(id);
		await prisma.warningLetter.delete({ where: { id } });

		return res.status(204).send();
	}),
);

export default router;
