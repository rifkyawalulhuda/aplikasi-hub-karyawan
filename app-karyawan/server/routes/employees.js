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
const TEMPLATE_MAX_ROWS = 500;

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

router.get(
	'/import-template',
	withAsync(async (_req, res) => {
		const [departments, groupShifts, workLocations, jobRoles, jobLevels] = await Promise.all([
			prisma.department.findMany({
				select: { name: true },
				orderBy: { name: 'asc' },
			}),
			prisma.masterGroupShift.findMany({
				select: { groupShiftName: true },
				orderBy: { groupShiftName: 'asc' },
			}),
			prisma.workLocation.findMany({
				select: { name: true },
				orderBy: { name: 'asc' },
			}),
			prisma.jobRole.findMany({
				select: { name: true },
				orderBy: { name: 'asc' },
			}),
			prisma.jobLevel.findMany({
				select: { name: true },
				orderBy: { name: 'asc' },
			}),
		]);

		const workbook = new ExcelJS.Workbook();
		const dataSheet = workbook.addWorksheet('Data Import');
		const guideSheet = workbook.addWorksheet('Petunjuk');
		const referenceSheet = workbook.addWorksheet('Referensi');
		referenceSheet.state = 'veryHidden';

		dataSheet.columns = [
			{ header: 'Employee No', key: 'employeeNo', width: 18 },
			{ header: 'Password', key: 'password', width: 18 },
			{ header: 'Fullname', key: 'fullName', width: 28 },
			{ header: 'Employment Type', key: 'employmentType', width: 18 },
			{ header: 'Site / Div', key: 'siteDiv', width: 16 },
			{ header: 'Department', key: 'department', width: 22 },
			{ header: 'Group Shift', key: 'groupShift', width: 22 },
			{ header: 'Length Of Service', key: 'lengthOfService', width: 20 },
			{ header: 'Age', key: 'age', width: 12 },
			{ header: 'Birth Date', key: 'birthDate', width: 16 },
			{ header: 'Gender', key: 'gender', width: 14 },
			{ header: 'Work Location', key: 'workLocation', width: 22 },
			{ header: 'Job Role', key: 'jobRole', width: 20 },
			{ header: 'Job Level', key: 'jobLevel', width: 20 },
			{ header: 'Education Level', key: 'educationLevel', width: 18 },
			{ header: 'Grade', key: 'grade', width: 14 },
			{ header: 'Join Date', key: 'joinDate', width: 16 },
			{ header: 'Phone Number', key: 'phoneNumber', width: 18 },
			{ header: 'Email', key: 'email', width: 28 },
		];

		const instructions = [
			'ID Karyawan unik',
			'Isi password awal karyawan',
			'Nama lengkap karyawan',
			'Pilih Permanent atau Contract',
			'Default CLC jika tidak ada nilai lain',
			'Harus sesuai Master Department',
			'Harus sesuai Master Group Shift',
			'Otomatis dari Join Date',
			'Otomatis dari Birth Date',
			'Format tanggal DD/MM/YYYY',
			'Pilih Male atau Female',
			'Harus sesuai Master Work Location',
			'Harus sesuai Master Job Role',
			'Harus sesuai Master Job Level',
			'Pilih SMA, D3, S1, atau S2',
			'Pilih Rank 1 sampai Rank 9',
			'Format tanggal DD/MM/YYYY',
			'Nomor telepon',
			'Email aktif karyawan',
		];

		const headerRow = dataSheet.getRow(1);
		headerRow.values = IMPORT_HEADERS;
		headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
		headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
		headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
		dataSheet.getRow(2).values = instructions;
		dataSheet.getRow(2).font = { italic: true, color: { argb: 'FF546E7A' } };
		dataSheet.getRow(2).alignment = { vertical: 'top', wrapText: true };
		dataSheet.views = [{ state: 'frozen', ySplit: 2 }];
		dataSheet.autoFilter = {
			from: 'A1',
			to: 'S1',
		};

		const referenceColumns = [
			{ header: 'Employment Type', key: 'employmentType', values: ['Permanent', 'Contract'], column: 'A' },
			{ header: 'Gender', key: 'gender', values: ['MALE', 'FEMALE'], column: 'B' },
			{ header: 'Education Level', key: 'educationLevel', values: ['SMA', 'D3', 'S1', 'S2'], column: 'C' },
			{
				header: 'Grade',
				key: 'grade',
				values: ['Rank 1', 'Rank 2', 'Rank 3', 'Rank 4', 'Rank 5', 'Rank 6', 'Rank 7', 'Rank 8', 'Rank 9'],
				column: 'D',
			},
			{ header: 'Work Location', key: 'workLocation', values: workLocations.map((item) => item.name), column: 'E' },
			{ header: 'Department', key: 'department', values: departments.map((item) => item.name), column: 'F' },
			{ header: 'Group Shift', key: 'groupShift', values: groupShifts.map((item) => item.groupShiftName), column: 'G' },
			{ header: 'Job Role', key: 'jobRole', values: jobRoles.map((item) => item.name), column: 'H' },
			{ header: 'Job Level', key: 'jobLevel', values: jobLevels.map((item) => item.name), column: 'I' },
		];

		referenceColumns.forEach(({ header, values, column }) => {
			referenceSheet.getCell(`${column}1`).value = header;
			const normalizedValues = values.length > 0 ? values : [''];
			normalizedValues.forEach((value, index) => {
				referenceSheet.getCell(`${column}${index + 2}`).value = value;
			});
		});

		for (let rowNumber = 3; rowNumber <= TEMPLATE_MAX_ROWS + 2; rowNumber += 1) {
			dataSheet.getCell(`E${rowNumber}`).value = 'CLC';
			dataSheet.getCell(`H${rowNumber}`).value = {
				formula: `IF(Q${rowNumber}="","",DATEDIF(Q${rowNumber},TODAY(),"Y")&" tahun "&DATEDIF(Q${rowNumber},TODAY(),"YM")&" bulan")`,
			};
			dataSheet.getCell(`I${rowNumber}`).value = {
				formula: `IF(J${rowNumber}="","",DATEDIF(J${rowNumber},TODAY(),"Y"))`,
			};
			dataSheet.getCell(`H${rowNumber}`).fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFF5F7FA' },
			};
			dataSheet.getCell(`I${rowNumber}`).fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFF5F7FA' },
			};

			[
				['D', 'Referensi!$A$2:$A$3', 'Employment Type tidak valid', 'Pilih Employment Type dari dropdown yang tersedia.'],
				['F', `Referensi!$F$2:$F$${Math.max(departments.length + 1, 2)}`, 'Department tidak valid', 'Pilih Department dari dropdown yang tersedia.'],
				['G', `Referensi!$G$2:$G$${Math.max(groupShifts.length + 1, 2)}`, 'Group Shift tidak valid', 'Pilih Group Shift dari dropdown yang tersedia.'],
				['K', 'Referensi!$B$2:$B$3', 'Gender tidak valid', 'Pilih Gender dari dropdown yang tersedia.'],
				['L', `Referensi!$E$2:$E$${Math.max(workLocations.length + 1, 2)}`, 'Work Location tidak valid', 'Pilih Work Location dari dropdown yang tersedia.'],
				['M', `Referensi!$H$2:$H$${Math.max(jobRoles.length + 1, 2)}`, 'Job Role tidak valid', 'Pilih Job Role dari dropdown yang tersedia.'],
				['N', `Referensi!$I$2:$I$${Math.max(jobLevels.length + 1, 2)}`, 'Job Level tidak valid', 'Pilih Job Level dari dropdown yang tersedia.'],
				['O', 'Referensi!$C$2:$C$5', 'Education Level tidak valid', 'Pilih Education Level dari dropdown yang tersedia.'],
				['P', 'Referensi!$D$2:$D$10', 'Grade tidak valid', 'Pilih Grade dari dropdown yang tersedia.'],
			].forEach(([column, formulae, errorTitle, error]) => {
				dataSheet.getCell(`${column}${rowNumber}`).dataValidation = {
					type: 'list',
					allowBlank: column === 'G',
					showErrorMessage: true,
					errorTitle,
					error,
					formulae: [formulae],
				};
			});

			['J', 'Q'].forEach((column) => {
				dataSheet.getCell(`${column}${rowNumber}`).dataValidation = {
					type: 'date',
					operator: 'greaterThanOrEqual',
					showErrorMessage: true,
					errorTitle: 'Tanggal tidak valid',
					error: 'Gunakan format tanggal yang benar.',
					formulae: [new Date(1960, 0, 1)],
				};
				dataSheet.getCell(`${column}${rowNumber}`).numFmt = 'dd/mm/yyyy';
			});

			dataSheet.getCell(`S${rowNumber}`).dataValidation = {
				type: 'custom',
				allowBlank: true,
				showErrorMessage: true,
				errorTitle: 'Email tidak valid',
				error: 'Masukkan email yang valid atau kosongkan kolom email.',
				formulae: [`OR(S${rowNumber}="",ISNUMBER(SEARCH("@",S${rowNumber})))`],
			};
		}

		guideSheet.columns = [{ width: 120 }];
		[
			'Template resmi ini dibuat otomatis dari data master terbaru.',
			'Isi data mulai dari baris 3 pada sheet "Data Import".',
			'Baris 2 hanya berisi petunjuk dan tidak perlu diubah.',
			'Kolom dropdown seperti Department, Group Shift, Work Location, Job Role, dan Job Level selalu mengikuti data master terbaru saat template diunduh.',
			'Kolom Group Shift boleh dikosongkan jika belum ada group shift untuk karyawan tersebut.',
			'Kolom Length Of Service dan Age dihitung otomatis dari Join Date dan Birth Date.',
			'Kolom tanggal gunakan format dd/mm/yyyy.',
			'Jika ada baris gagal saat import, sistem akan mengunduh file error report.',
		].forEach((text) => guideSheet.addRow([text]));

		guideSheet.getCell('A1').font = { bold: true };
		guideSheet.eachRow((row) => {
			row.alignment = { vertical: 'top', wrapText: true };
		});

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', 'attachment; filename=\"master-karyawan-import-template.xlsx\"');

		await workbook.xlsx.write(res);
		return res.end();
	}),
);

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
	'/:id/summary',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);
		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const employee = await prisma.employee.findUnique({
			where: { id },
			include: { department: true, groupShift: true, workLocation: true, jobRole: true, jobLevel: true },
		});

		if (!employee) {
			return res.status(404).json({ message: 'Karyawan tidak ditemukan.' });
		}

		const today = new Date();
		const soonThreshold = new Date(today);
		soonThreshold.setDate(soonThreshold.getDate() + 25);

		const [
			guidanceRecords,
			warningLetters,
			licenseCertifications,
			leaveDatabases,
			leaveFlows,
		] = await Promise.all([
			prisma.guidanceRecord.findMany({
				where: { employeeId: id },
				orderBy: { meetingDate: 'desc' },
				take: 5,
			}),
			prisma.warningLetter.findMany({
				where: { employeeId: id },
				orderBy: { letterDate: 'desc' },
				take: 5,
			}),
			prisma.employeeLicenseCertification.findMany({
				where: { employeeId: id },
				include: { masterDokKaryawan: true },
				orderBy: { expiryDate: 'asc' },
			}),
			prisma.employeeLeaveDatabase.findMany({
				where: { employeeId: id },
				include: { masterCutiKaryawan: true },
				orderBy: { year: 'desc' },
			}),
			prisma.employeeLeave.findMany({
				where: { employeeId: id },
				include: { masterCutiKaryawan: true },
				orderBy: { createdAt: 'desc' },
				take: 5,
			}),
		]);

		const licenseExpiredCount = licenseCertifications.filter(
			(l) => l.expiryDate && new Date(l.expiryDate) < today,
		).length;
		const licenseSoonCount = licenseCertifications.filter(
			(l) => l.expiryDate && new Date(l.expiryDate) >= today && new Date(l.expiryDate) <= soonThreshold,
		).length;

		const activeWarningLetters = warningLetters.filter((w) => {
			if (!w.letterDate) return false;
			const sixMonthsAgo = new Date(today);
			sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
			return new Date(w.letterDate) >= sixMonthsAgo;
		});

		return res.json({
			profile: mapEmployee(employee),
			summary: {
				guidanceCount: await prisma.guidanceRecord.count({ where: { employeeId: id } }),
				warningLetterCount: await prisma.warningLetter.count({ where: { employeeId: id } }),
				activeWarningLetterCount: activeWarningLetters.length,
				licenseCount: licenseCertifications.length,
				licenseExpiredCount,
				licenseSoonCount,
				leaveBalanceCount: leaveDatabases.length,
				leaveFlowCount: await prisma.employeeLeave.count({ where: { employeeId: id } }),
			},
			recentGuidanceRecords: guidanceRecords.map((r) => ({
				id: r.id,
				category: r.category,
				meetingDate: r.meetingDate ? r.meetingDate.toISOString().slice(0, 10) : null,
				meetingNumber: r.meetingNumber,
				location: r.location || '',
			})),
			recentWarningLetters: warningLetters.map((w) => ({
				id: w.id,
				category: w.category,
				warningLevel: w.warningLevel,
				letterDate: w.letterDate ? w.letterDate.toISOString().slice(0, 10) : null,
				violation: w.violation || '',
				letterNumber: w.letterNumber || '',
			})),
			licenseCertifications: licenseCertifications.slice(0, 5).map((l) => ({
				id: l.id,
				documentName: l.masterDokKaryawan?.documentName || '',
				documentType: l.masterDokKaryawan?.documentType || '',
				documentNumber: l.documentNumber || '',
				expiryDate: l.expiryDate ? l.expiryDate.toISOString().slice(0, 10) : null,
				status: l.expiryDate
					? new Date(l.expiryDate) < today
						? 'EXPIRED'
						: new Date(l.expiryDate) <= soonThreshold
							? 'SOON'
							: 'ACTIVE'
					: 'ACTIVE',
			})),
			leaveBalances: leaveDatabases.map((lb) => ({
				id: lb.id,
				leaveType: lb.masterCutiKaryawan.leaveType,
				year: lb.year,
				leaveDays: lb.leaveDays,
				remainingLeave: lb.remainingLeave,
			})),
			recentLeaveFlows: leaveFlows.map((lf) => ({
				id: lf.id,
				requestNumber: lf.requestNumber,
				leaveType: lf.masterCutiKaryawan.leaveType,
				status: lf.status,
				submittedAt: lf.submittedAt ? lf.submittedAt.toISOString().slice(0, 10) : null,
				periodStart: lf.periodStart ? lf.periodStart.toISOString().slice(0, 10) : null,
				periodEnd: lf.periodEnd ? lf.periodEnd.toISOString().slice(0, 10) : null,
				leaveDays: lf.leaveDays,
			})),
		});
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
