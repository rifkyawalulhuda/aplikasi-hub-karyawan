import { Router } from 'express';

import prisma from '../lib/prisma.js';
import { buildSiteWhere, resolveWriteSiteId, siteNotFound } from '../lib/siteScope.js';
import {
	WARNING_LEVEL_OPTIONS,
	getWarningLetterEscalationStateForEmployee,
	validateWarningLetterEscalation,
} from '../lib/warningLetterEscalation.js';
import requireSiteIsolation from '../middleware/requireSiteIsolation.js';

const router = Router();

router.use(requireSiteIsolation({ modelType: 'per-site' }));

const SUPERIOR_JOB_LEVEL = 'Dept. Manager';
const SUPERIOR_JOB_LEVEL_ALIASES = ['Dept. Manager', 'Department Manager'];
const NORMALIZED_SUPERIOR_JOB_LEVELS = SUPERIOR_JOB_LEVEL_ALIASES.map((value) => value.toLowerCase());
const DISCIPLINE_LETTER_CATEGORIES = {
	WARNING_LETTER: 'WARNING_LETTER',
	REPRIMAND: 'REPRIMAND',
	SUSPENSION: 'SUSPENSION',
};
const DISCIPLINE_LETTER_CATEGORY_ALIASES = {
	SKORSING: DISCIPLINE_LETTER_CATEGORIES.SUSPENSION,
	SUSPENSION: DISCIPLINE_LETTER_CATEGORIES.SUSPENSION,
};

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

function normalizeCategory(value = '') {
	const normalizedValue = normalizeString(value).toUpperCase();
	return (
		DISCIPLINE_LETTER_CATEGORIES[normalizedValue] ||
		DISCIPLINE_LETTER_CATEGORY_ALIASES[normalizedValue] ||
		DISCIPLINE_LETTER_CATEGORIES.WARNING_LETTER
	);
}

function shouldApplyWarningLevelRule(category) {
	return category === DISCIPLINE_LETTER_CATEGORIES.WARNING_LETTER;
}

function shouldRequireArticle(category) {
	return category !== DISCIPLINE_LETTER_CATEGORIES.REPRIMAND;
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

function mapWarningLetter(record) {
	return {
		id: record.id,
		category: record.category,
		employeeId: record.employeeId,
		employeeName: record.employee.fullName,
		employeeNo: record.employee.employeeNo,
		departmentName: record.departmentName || record.employee.department?.name || '',
		jobRoleName: record.employee.jobRole?.name || '',
		jobLevelName: record.jobLevelName || record.employee.jobLevel?.name || '',
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

async function getEmployeeOrThrow(id, siteId) {
	const employee = await prisma.employee.findFirst({
		where: { id, siteId },
		include: {
			department: true,
			jobRole: true,
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

async function getWarningLetterOrThrow(id, siteWhere) {
	const record = await prisma.warningLetter.findFirst({
		where: { id, ...siteWhere },
		include: {
			employee: {
				include: {
					department: true,
					jobRole: true,
					jobLevel: true,
				},
			},
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

async function validatePayload(payload, currentId, siteId) {
	const category = normalizeCategory(payload.category);
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

	if (!letterNumber) {
		throw Object.assign(new Error('Nomor Surat wajib diisi.'), { statusCode: 400 });
	}

	if (letterNumber.length > 25) {
		throw Object.assign(new Error('Nomor Surat maksimal 25 karakter.'), { statusCode: 400 });
	}

	if (!letterDate) {
		throw Object.assign(new Error('Tanggal Surat wajib diisi.'), { statusCode: 400 });
	}

	if (!violation) {
		throw Object.assign(new Error('Pelanggaran wajib diisi.'), { statusCode: 400 });
	}

	if (!Number.isInteger(superiorEmployeeId)) {
		throw Object.assign(new Error('Superior wajib dipilih.'), { statusCode: 400 });
	}

	if (shouldApplyWarningLevelRule(category) && !WARNING_LEVEL_OPTIONS.includes(warningLevel)) {
		throw Object.assign(new Error('Surat Peringatan ke harus dipilih.'), { statusCode: 400 });
	}

	if (shouldRequireArticle(category) && !Number.isInteger(masterDokPkbId)) {
		throw Object.assign(new Error('Pasal PKB wajib dipilih.'), { statusCode: 400 });
	}

	const [employee, superiorEmployee, masterDokPkb] = await Promise.all([
		getEmployeeOrThrow(employeeId, siteId),
		getEmployeeOrThrow(superiorEmployeeId, siteId),
		shouldRequireArticle(category) ? getMasterDokPkbOrThrow(masterDokPkbId) : Promise.resolve(null),
	]);

	const warningEscalationState = shouldApplyWarningLevelRule(category)
		? await getWarningLetterEscalationStateForEmployee(prisma, {
				employeeId: employee.id,
				referenceDate: letterDate,
				excludeId: currentId,
		  })
		: null;

	if (!NORMALIZED_SUPERIOR_JOB_LEVELS.includes(normalizeString(superiorEmployee.jobLevel?.name).toLowerCase())) {
		throw Object.assign(new Error(`Superior harus memiliki Job Level ${SUPERIOR_JOB_LEVEL}.`), { statusCode: 400 });
	}

	if (shouldApplyWarningLevelRule(category) && warningEscalationState) {
		const validationResult = validateWarningLetterEscalation({
			state: warningEscalationState,
			selectedLevel: warningLevel,
		});

		if (!validationResult.ok) {
			throw Object.assign(new Error(validationResult.message), { statusCode: 400 });
		}
	}

	return {
		category,
		employeeId: employee.id,
		superiorEmployeeId: superiorEmployee.id,
		masterDokPkbId: masterDokPkb?.id || null,
		warningLevel: shouldApplyWarningLevelRule(category) ? warningLevel : null,
		letterNumber,
		letterDate,
		departmentName: employee.department?.name || null,
		jobLevelName: employee.jobLevel?.name || null,
		violation,
		articleLabel: masterDokPkb?.article || null,
		articleContent: masterDokPkb?.content || null,
	};
}

router.get(
	'/',
	withAsync(async (req, res) => {
		const records = await prisma.warningLetter.findMany({
			where: { ...buildSiteWhere(req) },
			include: {
				employee: {
					include: {
						department: true,
						jobRole: true,
						jobLevel: true,
					},
				},
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

		const record = await getWarningLetterOrThrow(id, buildSiteWhere(req)).catch(() => null);

		if (!record) {
			return siteNotFound(res);
		}

		return res.json(mapWarningLetter(record));
	}),
);

router.post(
	'/',
	withAsync(async (req, res) => {
		const siteId = resolveWriteSiteId(req, req.body.siteId);
		const data = await validatePayload(req.body, null, siteId);
		const record = await prisma.warningLetter.create({
			data: { ...data, siteId },
			include: {
				employee: {
					include: {
						department: true,
						jobRole: true,
						jobLevel: true,
					},
				},
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

		const existing = await getWarningLetterOrThrow(id, buildSiteWhere(req)).catch(() => null);

		if (!existing) {
			return siteNotFound(res);
		}

		const data = await validatePayload(req.body, id, existing.siteId);
		const record = await prisma.warningLetter.update({
			where: { id },
			data,
			include: {
				employee: {
					include: {
						department: true,
						jobRole: true,
						jobLevel: true,
					},
				},
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

		const existing = await getWarningLetterOrThrow(id, buildSiteWhere(req)).catch(() => null);

		if (!existing) {
			return siteNotFound(res);
		}

		await prisma.warningLetter.delete({ where: { id } });

		return res.status(204).send();
	}),
);

export default router;
