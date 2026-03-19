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
const IMPORT_HEADERS = [
	'Nama Karyawan',
	'NIK',
	'Jenis Cuti',
	'Jumlah Cuti',
	'Periode Cuti Dari',
	'Periode Cuti Sampai',
	'Sisa Cuti',
	'Catatan',
];
const ERROR_REPORT_DIR = path.resolve(process.cwd(), 'tmp', 'import-results');

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
	}

	return toDateOnly(value);
}

function getExcelCellValue(value) {
	if (value == null) {
		return '';
	}

	if (value instanceof Date) {
		return value;
	}

	if (typeof value === 'object') {
		if (Array.isArray(value.richText)) {
			return value.richText.map((item) => item.text || '').join('');
		}

		if (typeof value.text === 'string') {
			return value.text;
		}

		if (value.result != null) {
			return getExcelCellValue(value.result);
		}

		if (value.formula) {
			return '';
		}

		if (value.hyperlink) {
			return value.text || value.hyperlink;
		}
	}

	return value;
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

async function getEmployeeByNoOrThrow(employeeNo) {
	const employee = await prisma.employee.findFirst({
		where: {
			employeeNo: {
				equals: normalizeString(employeeNo),
				mode: 'insensitive',
			},
		},
	});

	if (!employee) {
		throw Object.assign(new Error(`NIK "${employeeNo}" tidak ditemukan di Master Karyawan.`), {
			statusCode: 400,
		});
	}

	return employee;
}

async function getEmployeeByNameOrThrow(fullName) {
	const normalizedFullName = normalizeString(fullName);
	const employees = await prisma.employee.findMany({
		where: {
			fullName: {
				equals: normalizedFullName,
				mode: 'insensitive',
			},
		},
	});

	if (employees.length === 0) {
		throw Object.assign(new Error(`Nama Karyawan "${fullName}" tidak ditemukan di Master Karyawan.`), {
			statusCode: 400,
		});
	}

	if (employees.length > 1) {
		throw Object.assign(
			new Error(
				`Nama Karyawan "${fullName}" ditemukan lebih dari satu. Gunakan template resmi agar NIK terisi otomatis.`,
			),
			{
				statusCode: 400,
			},
		);
	}

	return employees[0];
}

async function getLeaveTypeByNameOrThrow(leaveType) {
	const record = await prisma.masterCutiKaryawan.findFirst({
		where: {
			leaveType: {
				equals: normalizeString(leaveType),
				mode: 'insensitive',
			},
		},
	});

	if (!record) {
		throw Object.assign(new Error(`Jenis Cuti "${leaveType}" tidak ditemukan di master data.`), {
			statusCode: 400,
		});
	}

	return record;
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

function worksheetRowToPayload(row, headerMap) {
	const payload = {};

	headerMap.forEach((columnNumber, header) => {
		const cellValue = row.getCell(columnNumber).value;
		payload[header] = getExcelCellValue(cellValue);
	});

	return payload;
}

async function buildImportPayload(rawPayload) {
	const employeeNo = normalizeString(rawPayload.NIK);
	const employeeName = normalizeString(rawPayload['Nama Karyawan']);
	let employee;

	if (employeeNo) {
		employee = await getEmployeeByNoOrThrow(employeeNo);
	} else if (employeeName) {
		employee = await getEmployeeByNameOrThrow(employeeName);
	} else {
		throw new Error('Nama Karyawan wajib dipilih dari template import.');
	}

	if (employeeName && normalizeString(employee.fullName).toLowerCase() !== employeeName.toLowerCase()) {
		throw new Error(`Nama Karyawan tidak cocok dengan NIK "${employeeNo}".`);
	}

	const leaveType = await getLeaveTypeByNameOrThrow(rawPayload['Jenis Cuti']);

	return {
		employeeId: employee.id,
		masterCutiKaryawanId: leaveType.id,
		leaveDays: Number(rawPayload['Jumlah Cuti']),
		periodStart: parseExcelDate(rawPayload['Periode Cuti Dari']),
		periodEnd: parseExcelDate(rawPayload['Periode Cuti Sampai']),
		remainingLeave: Number(rawPayload['Sisa Cuti']),
		notes: normalizeMultilineString(rawPayload.Catatan),
	};
}

async function createErrorReport(rows) {
	await fs.mkdir(ERROR_REPORT_DIR, { recursive: true });

	const workbook = new ExcelJS.Workbook();
	const worksheet = workbook.addWorksheet('Import Errors');
	worksheet.addRow([...IMPORT_HEADERS, 'Error Message']);

	rows.forEach((row) => {
		worksheet.addRow([
			row.raw['Nama Karyawan'] || '',
			row.raw.NIK || '',
			row.raw['Jenis Cuti'] || '',
			row.raw['Jumlah Cuti'] || '',
			row.raw['Periode Cuti Dari'] || '',
			row.raw['Periode Cuti Sampai'] || '',
			row.raw['Sisa Cuti'] || '',
			row.raw.Catatan || '',
			row.error,
		]);
	});

	const headerRow = worksheet.getRow(1);
	headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB71C1C' } };
	worksheet.columns.forEach((column) => {
		column.width = 24;
	});

	const fileName = `data-cuti-karyawan-import-errors-${randomUUID()}.xlsx`;
	const filePath = path.join(ERROR_REPORT_DIR, fileName);
	await workbook.xlsx.writeFile(filePath);

	return fileName;
}

router.get(
	'/import-template',
	withAsync(async (_req, res) => {
		const [employees, leaveTypes] = await Promise.all([
			prisma.employee.findMany({
				select: {
					fullName: true,
					employeeNo: true,
				},
				orderBy: {
					fullName: 'asc',
				},
			}),
			prisma.masterCutiKaryawan.findMany({
				select: {
					leaveType: true,
				},
				orderBy: {
					leaveType: 'asc',
				},
			}),
		]);

		const workbook = new ExcelJS.Workbook();
		const dataSheet = workbook.addWorksheet('Data Import');
		const guideSheet = workbook.addWorksheet('Petunjuk');
		const referenceSheet = workbook.addWorksheet('Referensi');
		referenceSheet.state = 'veryHidden';

		dataSheet.columns = [
			{ header: 'Nama Karyawan', key: 'employeeName', width: 28 },
			{ header: 'NIK', key: 'employeeNo', width: 18 },
			{ header: 'Jenis Cuti', key: 'leaveType', width: 24 },
			{ header: 'Jumlah Cuti', key: 'leaveDays', width: 16 },
			{ header: 'Periode Cuti Dari', key: 'periodStart', width: 18 },
			{ header: 'Periode Cuti Sampai', key: 'periodEnd', width: 18 },
			{ header: 'Sisa Cuti', key: 'remainingLeave', width: 16 },
			{ header: 'Catatan', key: 'notes', width: 36 },
		];

		const headerRow = dataSheet.getRow(1);
		headerRow.values = IMPORT_HEADERS;
		headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
		headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
		headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
		dataSheet.views = [{ state: 'frozen', ySplit: 1 }];
		dataSheet.autoFilter = {
			from: 'A1',
			to: 'H1',
		};

		referenceSheet.getCell('A1').value = 'Nama Karyawan';
		referenceSheet.getCell('B1').value = 'NIK';
		referenceSheet.getCell('D1').value = 'Jenis Cuti';

		const employeeReferenceRows = Math.max(employees.length, 1);
		for (let index = 0; index < employeeReferenceRows; index += 1) {
			const employee = employees[index];
			referenceSheet.getCell(`A${index + 2}`).value = employee?.fullName || '';
			referenceSheet.getCell(`B${index + 2}`).value = employee?.employeeNo || '';
		}

		const leaveTypeReferenceRows = Math.max(leaveTypes.length, 1);
		for (let index = 0; index < leaveTypeReferenceRows; index += 1) {
			const leaveType = leaveTypes[index];
			referenceSheet.getCell(`D${index + 2}`).value = leaveType?.leaveType || '';
		}

		const employeeLastRow = employeeReferenceRows + 1;
		const leaveTypeLastRow = leaveTypeReferenceRows + 1;

		for (let rowNumber = 2; rowNumber <= TEMPLATE_MAX_ROWS + 1; rowNumber += 1) {
			dataSheet.getCell(`A${rowNumber}`).dataValidation = {
				type: 'list',
				allowBlank: true,
				showErrorMessage: true,
				errorTitle: 'Nama Karyawan tidak valid',
				error: 'Pilih Nama Karyawan dari dropdown yang tersedia.',
				formulae: [`Referensi!$A$2:$A$${employeeLastRow}`],
			};

			dataSheet.getCell(`C${rowNumber}`).dataValidation = {
				type: 'list',
				allowBlank: true,
				showErrorMessage: true,
				errorTitle: 'Jenis Cuti tidak valid',
				error: 'Pilih Jenis Cuti dari dropdown yang tersedia.',
				formulae: [`Referensi!$D$2:$D$${leaveTypeLastRow}`],
			};

			dataSheet.getCell(`B${rowNumber}`).value = {
				formula: `IFERROR(VLOOKUP(A${rowNumber},Referensi!$A$2:$B$${employeeLastRow},2,FALSE),"")`,
			};
			dataSheet.getCell(`B${rowNumber}`).fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFF5F7FA' },
			};

			['D', 'G'].forEach((column) => {
				dataSheet.getCell(`${column}${rowNumber}`).dataValidation = {
					type: 'whole',
					operator: 'greaterThanOrEqual',
					showErrorMessage: true,
					errorTitle: 'Nilai tidak valid',
					error: 'Masukkan angka 0 atau lebih besar.',
					formulae: [0],
				};
			});

			['E', 'F'].forEach((column) => {
				dataSheet.getCell(`${column}${rowNumber}`).numFmt = 'dd/mm/yyyy';
			});
		}

		guideSheet.columns = [{ width: 120 }];
		[
			'Template resmi ini dibuat otomatis dari data master terbaru.',
			'Isi data mulai dari baris 2 pada sheet "Data Import".',
			'Kolom "Nama Karyawan" harus dipilih dari dropdown.',
			'Kolom "NIK" terisi otomatis setelah Nama Karyawan dipilih.',
			'Kolom "Jenis Cuti" harus dipilih dari dropdown Master Cuti Karyawan.',
			'Kolom "Jumlah Cuti" dan "Sisa Cuti" hanya menerima angka.',
			'Kolom tanggal gunakan format dd/mm/yyyy.',
			'Jika ada baris gagal saat import, sistem akan mengunduh file error report.',
		].forEach((text) => guideSheet.addRow([text]));

		guideSheet.getCell('A1').font = { bold: true };
		guideSheet.eachRow((row) => {
			row.alignment = { vertical: 'top', wrapText: true };
		});

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', 'attachment; filename="data-cuti-karyawan-import-template.xlsx"');

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

		const missingHeaders = IMPORT_HEADERS.filter((header) => !headerMap.has(header));

		if (missingHeaders.length > 0) {
			return res.status(400).json({
				message: `Template Excel tidak valid. Header tidak ditemukan: ${missingHeaders.join(', ')}`,
			});
		}

		const importedRows = [];
		const errorRows = [];

		for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
			const row = worksheet.getRow(rowNumber);
			const raw = worksheetRowToPayload(row, headerMap);
			const isEmpty = IMPORT_HEADERS.every((header) => !normalizeString(raw[header] || ''));

			if (isEmpty) {
				continue;
			}

			try {
				const payload = await buildImportPayload(raw);
				const validatedPayload = await validatePayload(payload);
				const record = await prisma.employeeLeave.create({
					data: validatedPayload,
					include: {
						employee: true,
						masterCutiKaryawan: true,
					},
				});

				importedRows.push(mapEmployeeLeave(record));
			} catch (error) {
				errorRows.push({
					rowNumber,
					raw,
					error: error.message || 'Terjadi kesalahan saat memproses baris.',
				});
			}
		}

		if (importedRows.length === 0 && errorRows.length === 0) {
			return res.status(400).json({
				message:
					'Tidak ada data yang terbaca dari file import. Isi data mulai dari baris setelah header template.',
			});
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
				errorReportUrl: `/data-karyawan/employee-leaves/import-errors/${fileName}`,
			});
		}

		return res.json({
			message: 'Import Data Cuti Karyawan berhasil.',
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
