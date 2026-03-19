import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import ExcelJS from 'exceljs';
import { Router } from 'express';
import multer from 'multer';

import prisma from '../lib/prisma.js';

const router = Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024,
	},
});

const EMPLOYMENT_TYPES = ['PERMANENT', 'CONTRACT'];
const GENDERS = ['MALE', 'FEMALE'];
const EDUCATION_LEVELS = ['SMA', 'D3', 'S1', 'S2'];
const GRADE_RANKS = ['RANK_1', 'RANK_2', 'RANK_3', 'RANK_4', 'RANK_5', 'RANK_6', 'RANK_7', 'RANK_8', 'RANK_9'];
const IMPORT_HEADERS = [
	'Employee No',
	'Password',
	'Fullname',
	'Employment Type',
	'Site / Div',
	'Department',
	'Group Shift',
	'Length Of Service',
	'Age',
	'Birth Date',
	'Gender',
	'Work Location',
	'Job Role',
	'Job Level',
	'Education Level',
	'Grade',
	'Join Date',
	'Phone Number',
	'Email',
];
const REQUIRED_IMPORT_HEADERS = IMPORT_HEADERS.filter((header) => header !== 'Group Shift');
const ERROR_REPORT_DIR = path.resolve(process.cwd(), 'tmp', 'import-results');

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

function normalizeString(value = '') {
	return String(value).trim().replace(/\s+/g, ' ');
}

function normalizeExcelEnum(value = '') {
	return normalizeString(value).toUpperCase().replace(/\s+/g, '_');
}

function normalizeEmploymentTypeValue(value = '') {
	return normalizeExcelEnum(value);
}

function formatEmploymentTypeLabel(value = '') {
	const normalizedEmploymentType = normalizeEmploymentTypeValue(value);

	if (normalizedEmploymentType === 'PERMANENT') {
		return 'Permanent';
	}

	if (normalizedEmploymentType === 'CONTRACT') {
		return 'Contract';
	}

	return normalizeString(value);
}

function normalizeGradeValue(value = '') {
	return normalizeExcelEnum(value);
}

function formatGradeLabel(value = '') {
	const normalizedGrade = normalizeGradeValue(value);

	if (!GRADE_RANKS.includes(normalizedGrade)) {
		return normalizeString(value);
	}

	return `Rank ${normalizedGrade.replace('RANK_', '')}`;
}

function toDateOnly(value) {
	if (!value) {
		return null;
	}

	if (value instanceof Date) {
		return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 12));
	}

	if (typeof value === 'string') {
		const raw = normalizeString(value);
		const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

		if (isoMatch) {
			const [, year, month, day] = isoMatch;
			return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
		}
	}

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

function parseExcelDate(value) {
	if (!value) {
		return null;
	}

	if (value instanceof Date) {
		return value;
	}

	if (typeof value === 'object' && value?.result) {
		return parseExcelDate(value.result);
	}

	if (typeof value === 'number') {
		const excelEpoch = new Date(Date.UTC(1899, 11, 30));
		const parsed = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	}

	if (typeof value === 'string') {
		const raw = normalizeString(value);
		const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

		if (slashMatch) {
			const [, day, month, year] = slashMatch;
			const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
			return Number.isNaN(parsed.getTime()) ? null : parsed;
		}

		return toDateOnly(raw);
	}

	return null;
}

function diffYears(fromDate, toDate = new Date()) {
	let years = toDate.getFullYear() - fromDate.getFullYear();
	const monthDiff = toDate.getMonth() - fromDate.getMonth();

	if (monthDiff < 0 || (monthDiff === 0 && toDate.getDate() < fromDate.getDate())) {
		years -= 1;
	}

	return years;
}

function diffService(fromDate, toDate = new Date()) {
	let years = toDate.getFullYear() - fromDate.getFullYear();
	let months = toDate.getMonth() - fromDate.getMonth();

	if (toDate.getDate() < fromDate.getDate()) {
		months -= 1;
	}

	if (months < 0) {
		years -= 1;
		months += 12;
	}

	return `${Math.max(years, 0)} tahun ${Math.max(months, 0)} bulan`;
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

function mapEmployee(employee) {
	return {
		id: employee.id,
		employeeNo: employee.employeeNo,
		password: employee.password,
		fullName: employee.fullName,
		employmentType: formatEmploymentTypeLabel(employee.employmentType),
		siteDiv: employee.siteDiv,
		departmentId: employee.departmentId,
		departmentName: employee.department.name,
		groupShiftId: employee.groupShiftId,
		groupShiftName: employee.groupShift?.groupShiftName || '',
		lengthOfService: diffService(employee.joinDate),
		age: diffYears(employee.birthDate),
		birthDate: formatDateForClient(employee.birthDate),
		gender: employee.gender,
		workLocationId: employee.workLocationId,
		workLocationName: employee.workLocation.name,
		jobRoleId: employee.jobRoleId,
		jobRoleName: employee.jobRole.name,
		jobLevelId: employee.jobLevelId,
		jobLevelName: employee.jobLevel.name,
		educationLevel: employee.educationLevel,
		grade: formatGradeLabel(employee.grade),
		joinDate: formatDateForClient(employee.joinDate),
		phoneNumber: employee.phoneNumber,
		email: employee.email,
	};
}

async function ensureLookupExists(model, id, label) {
	const item = await prisma[model].findUnique({ where: { id } });

	if (!item) {
		throw Object.assign(new Error(`${label} tidak ditemukan.`), { statusCode: 400 });
	}
}

async function getLookupByName(model, label, value) {
	const name = normalizeString(value);

	if (!name) {
		throw Object.assign(new Error(`${label} wajib diisi.`), { statusCode: 400 });
	}

	const item = await prisma[model].findFirst({
		where: {
			name: {
				equals: name,
				mode: 'insensitive',
			},
		},
	});

	if (!item) {
		throw Object.assign(new Error(`${label} "${name}" tidak ditemukan di master data.`), { statusCode: 400 });
	}

	return item;
}

async function getLookupByField(model, field, label, value) {
	const normalizedValue = normalizeString(value);

	if (!normalizedValue) {
		throw Object.assign(new Error(`${label} wajib diisi.`), { statusCode: 400 });
	}

	const item = await prisma[model].findFirst({
		where: {
			[field]: {
				equals: normalizedValue,
				mode: 'insensitive',
			},
		},
	});

	if (!item) {
		throw Object.assign(new Error(`${label} "${normalizedValue}" tidak ditemukan di master data.`), {
			statusCode: 400,
		});
	}

	return item;
}

async function validatePayload(payload, currentEmployeeId = null) {
	const employeeNo = normalizeString(payload.employeeNo);
	const password = normalizeString(payload.password);
	const fullName = normalizeString(payload.fullName);
	const siteDiv = normalizeString(payload.siteDiv || 'CLC');
	const phoneNumber = normalizeString(payload.phoneNumber);
	const email = normalizeString(payload.email || '');
	const departmentId = Number(payload.departmentId);
	const groupShiftId =
		payload.groupShiftId === '' || payload.groupShiftId === null || typeof payload.groupShiftId === 'undefined'
			? null
			: Number(payload.groupShiftId);
	const workLocationId = Number(payload.workLocationId);
	const jobRoleId = Number(payload.jobRoleId);
	const jobLevelId = Number(payload.jobLevelId);
	const birthDate = toDateOnly(payload.birthDate);
	const joinDate = toDateOnly(payload.joinDate);
	const employmentType = normalizeEmploymentTypeValue(payload.employmentType);
	const grade = normalizeGradeValue(payload.grade);

	if (!employeeNo) throw Object.assign(new Error('Employee No wajib diisi.'), { statusCode: 400 });
	if (!password) throw Object.assign(new Error('Password wajib diisi.'), { statusCode: 400 });
	if (!fullName) throw Object.assign(new Error('Fullname wajib diisi.'), { statusCode: 400 });
	if (!EMPLOYMENT_TYPES.includes(employmentType)) {
		throw Object.assign(new Error('Employment Type tidak valid.'), { statusCode: 400 });
	}
	if (!siteDiv) throw Object.assign(new Error('Site / Div wajib diisi.'), { statusCode: 400 });
	if (!Number.isInteger(departmentId)) {
		throw Object.assign(new Error('Department wajib dipilih.'), { statusCode: 400 });
	}
	if (groupShiftId !== null && !Number.isInteger(groupShiftId)) {
		throw Object.assign(new Error('Group Shift tidak valid.'), { statusCode: 400 });
	}
	if (!birthDate) throw Object.assign(new Error('Birth Date wajib diisi.'), { statusCode: 400 });
	if (!GENDERS.includes(payload.gender)) throw Object.assign(new Error('Gender tidak valid.'), { statusCode: 400 });
	if (!Number.isInteger(workLocationId)) {
		throw Object.assign(new Error('Work Location wajib dipilih.'), { statusCode: 400 });
	}
	if (!Number.isInteger(jobRoleId)) throw Object.assign(new Error('Job Role wajib dipilih.'), { statusCode: 400 });
	if (!Number.isInteger(jobLevelId)) throw Object.assign(new Error('Job Level wajib dipilih.'), { statusCode: 400 });
	if (!EDUCATION_LEVELS.includes(payload.educationLevel)) {
		throw Object.assign(new Error('Education Level tidak valid.'), { statusCode: 400 });
	}
	if (!GRADE_RANKS.includes(grade)) throw Object.assign(new Error('Grade tidak valid.'), { statusCode: 400 });
	if (!joinDate) throw Object.assign(new Error('Join Date wajib diisi.'), { statusCode: 400 });
	if (!phoneNumber) throw Object.assign(new Error('Phone Number wajib diisi.'), { statusCode: 400 });

	const duplicate = await prisma.employee.findFirst({
		where: {
			employeeNo: { equals: employeeNo, mode: 'insensitive' },
			...(currentEmployeeId ? { NOT: { id: currentEmployeeId } } : {}),
		},
	});

	if (duplicate) {
		throw Object.assign(new Error('Employee No sudah ada.'), { statusCode: 409 });
	}

	await Promise.all([
		ensureLookupExists('department', departmentId, 'Department'),
		...(groupShiftId !== null ? [ensureLookupExists('masterGroupShift', groupShiftId, 'Group Shift')] : []),
		ensureLookupExists('workLocation', workLocationId, 'Work Location'),
		ensureLookupExists('jobRole', jobRoleId, 'Job Role'),
		ensureLookupExists('jobLevel', jobLevelId, 'Job Level'),
	]);

	return {
		employeeNo,
		password,
		fullName,
		employmentType,
		siteDiv,
		departmentId,
		groupShiftId,
		birthDate,
		gender: payload.gender,
		workLocationId,
		jobRoleId,
		jobLevelId,
		educationLevel: payload.educationLevel,
		grade,
		joinDate,
		phoneNumber,
		email: email || null,
	};
}

async function getEmployeeOrThrow(id) {
	const employee = await prisma.employee.findUnique({
		where: { id },
		include: { department: true, groupShift: true, workLocation: true, jobRole: true, jobLevel: true },
	});

	if (!employee) {
		throw Object.assign(new Error('Master Karyawan tidak ditemukan.'), { statusCode: 404 });
	}

	return employee;
}

function worksheetRowToPayload(row, headerMap) {
	const payload = {};

	headerMap.forEach((columnNumber, header) => {
		const cellValue = row.getCell(columnNumber).value;
		payload[header] = typeof cellValue === 'object' && cellValue?.text ? cellValue.text : cellValue;
	});

	return payload;
}

async function buildImportPayload(rawPayload) {
	const department = await getLookupByName('department', 'Department', rawPayload.Department);
	const groupShift = normalizeString(rawPayload['Group Shift'] || '')
		? await getLookupByField('masterGroupShift', 'groupShiftName', 'Group Shift', rawPayload['Group Shift'])
		: null;
	const workLocation = await getLookupByName('workLocation', 'Work Location', rawPayload['Work Location']);
	const jobRole = await getLookupByName('jobRole', 'Job Role', rawPayload['Job Role']);
	const jobLevel = await getLookupByName('jobLevel', 'Job Level', rawPayload['Job Level']);

	return {
		employeeNo: normalizeString(rawPayload['Employee No']),
		password: normalizeString(rawPayload.Password),
		fullName: normalizeString(rawPayload.Fullname),
		employmentType: normalizeString(rawPayload['Employment Type']),
		siteDiv: normalizeString(rawPayload['Site / Div'] || 'CLC') || 'CLC',
		departmentId: department.id,
		groupShiftId: groupShift?.id ?? null,
		birthDate: parseExcelDate(rawPayload['Birth Date']),
		gender: normalizeExcelEnum(rawPayload.Gender),
		workLocationId: workLocation.id,
		jobRoleId: jobRole.id,
		jobLevelId: jobLevel.id,
		educationLevel: normalizeExcelEnum(rawPayload['Education Level']),
		grade: normalizeString(rawPayload.Grade),
		joinDate: parseExcelDate(rawPayload['Join Date']),
		phoneNumber: normalizeString(rawPayload['Phone Number']),
		email: normalizeString(rawPayload.Email || ''),
	};
}

async function createErrorReport(rows) {
	await fs.mkdir(ERROR_REPORT_DIR, { recursive: true });

	const workbook = new ExcelJS.Workbook();
	const worksheet = workbook.addWorksheet('Import Errors');
	worksheet.addRow([...IMPORT_HEADERS, 'Error Message']);

	rows.forEach((row) => {
		worksheet.addRow([
			row.raw['Employee No'] || '',
			row.raw.Password || '',
			row.raw.Fullname || '',
			row.raw['Employment Type'] || '',
			row.raw['Site / Div'] || '',
			row.raw.Department || '',
			row.raw['Group Shift'] || '',
			row.raw['Length Of Service'] || '',
			row.raw.Age || '',
			row.raw['Birth Date'] || '',
			row.raw.Gender || '',
			row.raw['Work Location'] || '',
			row.raw['Job Role'] || '',
			row.raw['Job Level'] || '',
			row.raw['Education Level'] || '',
			row.raw.Grade || '',
			row.raw['Join Date'] || '',
			row.raw['Phone Number'] || '',
			row.raw.Email || '',
			row.error,
		]);
	});

	const headerRow = worksheet.getRow(1);
	headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB71C1C' } };
	worksheet.columns.forEach((column) => {
		column.width = 20;
	});

	const fileName = `master-karyawan-import-errors-${randomUUID()}.xlsx`;
	const filePath = path.join(ERROR_REPORT_DIR, fileName);
	await workbook.xlsx.writeFile(filePath);

	return fileName;
}

router.post(
	'/import',
	upload.single('file'),
	withAsync(async (req, res) => {
		if (!req.file) {
			return res.status(400).json({ message: 'File Excel wajib dipilih.' });
		}

		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(req.file.buffer);
		const worksheet = workbook.getWorksheet('Data Import') || workbook.worksheets[0];

		if (!worksheet) {
			return res.status(400).json({ message: 'Sheet Excel tidak ditemukan.' });
		}

		const headerMap = new Map();
		worksheet.getRow(1).eachCell((cell, colNumber) => {
			headerMap.set(normalizeString(cell.value), colNumber);
		});

		const missingHeaders = REQUIRED_IMPORT_HEADERS.filter((header) => !headerMap.has(header));
		if (missingHeaders.length > 0) {
			return res.status(400).json({
				message: `Template Excel tidak valid. Header tidak ditemukan: ${missingHeaders.join(', ')}`,
			});
		}

		const importedRows = [];
		const errorRows = [];
		const seenEmployeeNos = new Set();

		for (let rowNumber = 3; rowNumber <= worksheet.rowCount; rowNumber += 1) {
			const row = worksheet.getRow(rowNumber);
			const raw = worksheetRowToPayload(row, headerMap);
			const isEmpty = IMPORT_HEADERS.every((header) => !normalizeString(raw[header] || ''));

			if (isEmpty) {
				continue;
			}

			try {
				const payload = await buildImportPayload(raw);
				const employeeKey = payload.employeeNo.toLowerCase();

				if (seenEmployeeNos.has(employeeKey)) {
					throw new Error('Employee No duplikat pada file import.');
				}

				seenEmployeeNos.add(employeeKey);
				const validatedPayload = await validatePayload(payload);
				const employee = await prisma.employee.create({
					data: validatedPayload,
					include: { department: true, groupShift: true, workLocation: true, jobRole: true, jobLevel: true },
				});

				importedRows.push(mapEmployee(employee));
			} catch (error) {
				errorRows.push({
					rowNumber,
					raw,
					error: error.message || 'Terjadi kesalahan saat memproses baris.',
				});
			}
		}

		if (errorRows.length > 0) {
			const fileName = await createErrorReport(errorRows);

			return res.json({
				message:
					importedRows.length > 0
						? 'Import selesai sebagian. Beberapa baris gagal diproses.'
						: 'Import gagal. Periksa file hasil error.',
				importedCount: importedRows.length,
				failedCount: errorRows.length,
				rows: importedRows,
				errorReportUrl: `/master/employees/import-errors/${fileName}`,
			});
		}

		return res.json({
			message: 'Import Master Karyawan berhasil.',
			importedCount: importedRows.length,
			failedCount: 0,
			rows: importedRows,
			errorReportUrl: null,
		});
	}),
);

router.get(
	'/import-errors/:fileName',
	withAsync(async (req, res) => {
		const safeFileName = path.basename(req.params.fileName);
		const filePath = path.join(ERROR_REPORT_DIR, safeFileName);

		try {
			await fs.access(filePath);
		} catch {
			return res.status(404).json({ message: 'File error report tidak ditemukan.' });
		}

		return res.download(filePath, safeFileName);
	}),
);

router.get(
	'/',
	withAsync(async (req, res) => {
		const employees = await prisma.employee.findMany({
			include: { department: true, groupShift: true, workLocation: true, jobRole: true, jobLevel: true },
			orderBy: { id: 'asc' },
		});

		return res.json(employees.map(mapEmployee));
	}),
);

router.post(
	'/',
	withAsync(async (req, res) => {
		const data = await validatePayload(req.body);
		const employee = await prisma.employee.create({
			data,
			include: { department: true, groupShift: true, workLocation: true, jobRole: true, jobLevel: true },
		});

		return res.status(201).json(mapEmployee(employee));
	}),
);

router.put(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);
		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		await getEmployeeOrThrow(id);
		const data = await validatePayload(req.body, id);
		const employee = await prisma.employee.update({
			where: { id },
			data,
			include: { department: true, groupShift: true, workLocation: true, jobRole: true, jobLevel: true },
		});

		return res.json(mapEmployee(employee));
	}),
);

router.delete(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);
		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		await getEmployeeOrThrow(id);
		await prisma.employee.delete({ where: { id } });
		return res.status(204).send();
	}),
);

export default router;
