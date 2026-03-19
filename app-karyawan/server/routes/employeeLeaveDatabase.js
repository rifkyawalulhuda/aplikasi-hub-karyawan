import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import ExcelJS from 'exceljs';
import { Router } from 'express';
import multer from 'multer';

import {
	createLeaveDatabaseEntry,
	getLeaveDatabaseDetailOrThrow,
	listLeaveDatabase,
	mapLeaveDatabaseRow,
	updateLeaveDatabaseEntry,
} from '../lib/leaveDatabase.js';
import prisma from '../lib/prisma.js';
import { normalizeString, toDateOnly } from '../lib/leaveWorkflow.js';

const router = Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024,
	},
});
const TEMPLATE_MAX_ROWS = 500;
const IMPORT_HEADERS = [
	'NO',
	'Nama Karyawan',
	'NIK',
	'Jenis Cuti',
	'Jumlah Cuti',
	'Periode Dari',
	'Periode Sampai',
	'Sisa Cuti',
	'Catatan',
];
const REQUIRED_IMPORT_HEADERS = IMPORT_HEADERS.filter((header) => header !== 'NO' && header !== 'Catatan');
const ERROR_REPORT_DIR = path.resolve(process.cwd(), 'tmp', 'import-results');

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

function buildCompositeKey(payload) {
	return [payload.employeeId, payload.masterCutiKaryawanId, payload.year].join(':');
}

function getLeaveYear(periodStart, periodEnd) {
	if (!periodStart || !periodEnd) {
		return null;
	}

	const startYear = periodStart.getUTCFullYear();
	const endYear = periodEnd.getUTCFullYear();

	if (startYear !== endYear) {
		throw Object.assign(new Error('Periode Dari dan Periode Sampai harus berada pada tahun yang sama.'), {
			statusCode: 400,
		});
	}

	return startYear;
}

function validatePayload(payload = {}) {
	const employeeId = Number(payload.employeeId);
	const masterCutiKaryawanId = Number(payload.masterCutiKaryawanId);
	const leaveDays = Number(payload.leaveDays);
	const remainingLeave = Number(payload.remainingLeave);
	const periodStart = toDateOnly(payload.periodStart);
	const periodEnd = toDateOnly(payload.periodEnd);
	const notes = normalizeString(payload.notes || '');

	if (!Number.isInteger(employeeId)) {
		throw Object.assign(new Error('Nama Karyawan wajib dipilih.'), { statusCode: 400 });
	}

	if (!Number.isInteger(masterCutiKaryawanId)) {
		throw Object.assign(new Error('Jenis Cuti wajib dipilih.'), { statusCode: 400 });
	}

	if (!Number.isInteger(leaveDays) || leaveDays <= 0) {
		throw Object.assign(new Error('Jumlah Cuti wajib diisi dengan angka yang valid.'), { statusCode: 400 });
	}

	if (!Number.isInteger(remainingLeave) || remainingLeave < 0) {
		throw Object.assign(new Error('Sisa Cuti wajib diisi dengan angka 0 atau lebih.'), { statusCode: 400 });
	}

	if (!periodStart || !periodEnd) {
		throw Object.assign(new Error('Periode cuti wajib diisi lengkap.'), { statusCode: 400 });
	}

	if (periodEnd.getTime() < periodStart.getTime()) {
		throw Object.assign(new Error('Periode cuti sampai tidak boleh lebih kecil dari periode cuti dari.'), {
			statusCode: 400,
		});
	}

	return {
		employeeId,
		masterCutiKaryawanId,
		year: getLeaveYear(periodStart, periodEnd),
		leaveDays,
		periodStart,
		periodEnd,
		remainingLeave,
		notes: notes || null,
	};
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

function getCellImportValue(cell) {
	const { value, text } = cell;

	if (typeof text === 'string' && text.trim()) {
		return text;
	}

	if (value && typeof value === 'object') {
		if (typeof value.result !== 'undefined' && value.result !== null) {
			return value.result;
		}

		if (Array.isArray(value.richText)) {
			return value.richText.map((item) => item.text || '').join('');
		}

		if (typeof value.text === 'string' && value.text.trim()) {
			return value.text;
		}
	}

	return value;
}

function worksheetRowToPayload(row, headerMap) {
	const payload = {};

	headerMap.forEach((columnNumber, header) => {
		payload[header] = getCellImportValue(row.getCell(columnNumber));
	});

	return payload;
}

async function getLeaveTypeByName(leaveType) {
	const normalizedLeaveType = normalizeString(leaveType);

	if (!normalizedLeaveType) {
		throw Object.assign(new Error('Jenis Cuti wajib diisi.'), { statusCode: 400 });
	}

	const masterLeaveType = await prisma.masterCutiKaryawan.findFirst({
		where: {
			leaveType: {
				equals: normalizedLeaveType,
				mode: 'insensitive',
			},
		},
	});

	if (!masterLeaveType) {
		throw Object.assign(new Error(`Jenis Cuti "${normalizedLeaveType}" tidak ditemukan di Data Master Cuti.`), {
			statusCode: 400,
		});
	}

	return masterLeaveType;
}

async function resolveEmployeeFromImport(employeeName, employeeNo) {
	const normalizedEmployeeName = normalizeString(employeeName);
	const normalizedEmployeeNo = normalizeString(employeeNo);

	if (!normalizedEmployeeName) {
		throw Object.assign(new Error('Nama Karyawan wajib dipilih.'), { statusCode: 400 });
	}

	if (normalizedEmployeeNo) {
		const employeeByNo = await prisma.employee.findFirst({
			where: {
				employeeNo: {
					equals: normalizedEmployeeNo,
					mode: 'insensitive',
				},
			},
		});

		if (!employeeByNo) {
			throw Object.assign(new Error(`NIK "${normalizedEmployeeNo}" tidak ditemukan di Data Master Karyawan.`), {
				statusCode: 400,
			});
		}

		if (normalizeString(employeeByNo.fullName).toLowerCase() !== normalizedEmployeeName.toLowerCase()) {
			throw Object.assign(
				new Error(`NIK ${employeeByNo.employeeNo} tidak sesuai dengan Nama Karyawan "${normalizedEmployeeName}".`),
				{ statusCode: 400 },
			);
		}

		return employeeByNo;
	}

	const employeesByName = await prisma.employee.findMany({
		where: {
			fullName: {
				equals: normalizedEmployeeName,
				mode: 'insensitive',
			},
		},
		orderBy: [{ employeeNo: 'asc' }],
	});

	if (employeesByName.length === 0) {
		throw Object.assign(
			new Error(`Nama Karyawan "${normalizedEmployeeName}" tidak ditemukan di Data Master Karyawan.`),
			{ statusCode: 400 },
		);
	}

	if (employeesByName.length > 1) {
		throw Object.assign(
			new Error(
				`Nama Karyawan "${normalizedEmployeeName}" terduplikasi di master. Pastikan kolom NIK terisi otomatis lalu import ulang.`,
			),
			{ statusCode: 400 },
		);
	}

	return employeesByName[0];
}

async function buildImportPayload(rawPayload) {
	const recordIdRaw = normalizeString(rawPayload.NO || '');
	const employeeName = normalizeString(rawPayload['Nama Karyawan'] || '');
	const employee = await resolveEmployeeFromImport(employeeName, rawPayload.NIK);
	const masterLeaveType = await getLeaveTypeByName(rawPayload['Jenis Cuti']);

	const payload = {
		employeeId: employee.id,
		masterCutiKaryawanId: masterLeaveType.id,
		leaveDays: Number(rawPayload['Jumlah Cuti']),
		periodStart: parseExcelDate(rawPayload['Periode Dari']),
		periodEnd: parseExcelDate(rawPayload['Periode Sampai']),
		remainingLeave: Number(rawPayload['Sisa Cuti']),
		notes: normalizeString(rawPayload.Catatan || ''),
	};

	if (!recordIdRaw) {
		return { recordId: null, payload };
	}

	const recordId = Number(recordIdRaw);

	if (!Number.isInteger(recordId) || recordId <= 0) {
		throw Object.assign(new Error('Kolom NO harus berupa angka bulat positif atau dikosongkan.'), {
			statusCode: 400,
		});
	}

	return { recordId, payload };
}

async function createErrorReport(rows) {
	await fs.mkdir(ERROR_REPORT_DIR, { recursive: true });

	const workbook = new ExcelJS.Workbook();
	const worksheet = workbook.addWorksheet('Import Errors');
	worksheet.addRow([...IMPORT_HEADERS, 'Error Message']);

	rows.forEach((row) => {
		worksheet.addRow([
			row.raw.NO || '',
			row.raw['Nama Karyawan'] || '',
			row.raw.NIK || '',
			row.raw['Jenis Cuti'] || '',
			row.raw['Jumlah Cuti'] || '',
			row.raw['Periode Dari'] || '',
			row.raw['Periode Sampai'] || '',
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

	const fileName = `database-cuti-karyawan-import-errors-${randomUUID()}.xlsx`;
	const filePath = path.join(ERROR_REPORT_DIR, fileName);
	await workbook.xlsx.writeFile(filePath);

	return fileName;
}

async function findLeaveDatabaseByComposite(tx, payload) {
	return tx.employeeLeaveDatabase.findUnique({
		where: {
			employeeId_masterCutiKaryawanId_year: {
				employeeId: payload.employeeId,
				masterCutiKaryawanId: payload.masterCutiKaryawanId,
				year: payload.year,
			},
		},
	});
}

async function ensureCreatePayloadAvailable(tx, payload) {
	const existing = await findLeaveDatabaseByComposite(tx, payload);

	if (existing) {
		throw Object.assign(
			new Error('Data Cuti Karyawan untuk kombinasi karyawan, jenis cuti, dan tahun ini sudah tersedia.'),
			{ statusCode: 409 },
		);
	}
}

async function ensureUpdatePayloadAvailable(tx, id, payload) {
	const conflict = await findLeaveDatabaseByComposite(tx, payload);

	if (conflict && conflict.id !== id) {
		throw Object.assign(
			new Error('Data Cuti Karyawan untuk kombinasi karyawan, jenis cuti, dan tahun ini sudah digunakan row lain.'),
			{ statusCode: 409 },
		);
	}
}

async function saveImportedRow(recordId, payload) {
	return prisma.$transaction(async (tx) => {
		if (recordId) {
			const existing = await tx.employeeLeaveDatabase.findUnique({
				where: { id: recordId },
			});

			if (!existing) {
				throw Object.assign(new Error(`Data cuti dengan NO ${recordId} tidak ditemukan.`), { statusCode: 404 });
			}

			await ensureUpdatePayloadAvailable(tx, recordId, payload);

			return updateLeaveDatabaseEntry(tx, recordId, payload, {
				sourceType: 'ADMIN_IMPORT',
			});
		}

		const existingByComposite = await findLeaveDatabaseByComposite(tx, payload);

		if (existingByComposite) {
			return updateLeaveDatabaseEntry(tx, existingByComposite.id, payload, {
				sourceType: 'ADMIN_IMPORT',
			});
		}

		return createLeaveDatabaseEntry(tx, payload, {
			sourceType: 'ADMIN_IMPORT',
		});
	});
}

router.get(
	'/import-template',
	withAsync(async (_req, res) => {
		const [employees, leaveTypes] = await Promise.all([
			prisma.employee.findMany({
				select: {
					employeeNo: true,
					fullName: true,
				},
				orderBy: [{ fullName: 'asc' }, { employeeNo: 'asc' }],
			}),
			prisma.masterCutiKaryawan.findMany({
				select: { leaveType: true },
				orderBy: { leaveType: 'asc' },
			}),
		]);

		const workbook = new ExcelJS.Workbook();
		const dataSheet = workbook.addWorksheet('Data Import');
		const guideSheet = workbook.addWorksheet('Petunjuk');
		const employeeReferenceSheet = workbook.addWorksheet('Referensi Karyawan');
		const leaveTypeReferenceSheet = workbook.addWorksheet('Referensi Jenis Cuti');
		employeeReferenceSheet.state = 'veryHidden';
		leaveTypeReferenceSheet.state = 'veryHidden';
		const employeeLastRow = Math.max(employees.length + 1, 2);
		const leaveTypeLastRow = Math.max(leaveTypes.length + 1, 2);

		dataSheet.columns = [
			{ header: 'NO', key: 'id', width: 12 },
			{ header: 'Nama Karyawan', key: 'employeeName', width: 30 },
			{ header: 'NIK', key: 'employeeNo', width: 18 },
			{ header: 'Jenis Cuti', key: 'leaveType', width: 24 },
			{ header: 'Jumlah Cuti', key: 'leaveDays', width: 16 },
			{ header: 'Periode Dari', key: 'periodStart', width: 16 },
			{ header: 'Periode Sampai', key: 'periodEnd', width: 16 },
			{ header: 'Sisa Cuti', key: 'remainingLeave', width: 14 },
			{ header: 'Catatan', key: 'notes', width: 36 },
		];

		const instructions = [
			'Kosongkan untuk data baru, isi NO jika ingin update data existing',
			'Pilih dari dropdown Data Master Karyawan terbaru',
			'Terisi otomatis dari Nama Karyawan yang dipilih',
			'Pilih dari dropdown Data Master Cuti Karyawan terbaru',
			'Isi kuota cuti tahunan utama',
			'Format tanggal DD/MM/YYYY dan harus dalam tahun yang sama',
			'Format tanggal DD/MM/YYYY dan harus dalam tahun yang sama',
			'Isi saldo berjalan saat ini',
			'Opsional',
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
			to: 'I1',
		};

		employeeReferenceSheet.getCell('A1').value = 'Nama Karyawan';
		employeeReferenceSheet.getCell('B1').value = 'NIK';
		leaveTypeReferenceSheet.getCell('A1').value = 'Jenis Cuti';

		employees.forEach((item, index) => {
			employeeReferenceSheet.getCell(`A${index + 2}`).value = item.fullName;
			employeeReferenceSheet.getCell(`B${index + 2}`).value = item.employeeNo;
		});

		leaveTypes.forEach((item, index) => {
			leaveTypeReferenceSheet.getCell(`A${index + 2}`).value = item.leaveType;
		});

		for (let rowNumber = 3; rowNumber <= TEMPLATE_MAX_ROWS + 2; rowNumber += 1) {
			dataSheet.getCell(`C${rowNumber}`).value = {
				formula: `IF(B${rowNumber}="","",IFERROR(VLOOKUP(B${rowNumber},'Referensi Karyawan'!$A$2:$B$${employeeLastRow},2,FALSE),""))`,
			};
			dataSheet.getCell(`C${rowNumber}`).fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFF5F7FA' },
			};
			dataSheet.getCell(`C${rowNumber}`).font = {
				italic: true,
				color: { argb: 'FF455A64' },
			};

			dataSheet.getCell(`D${rowNumber}`).dataValidation = {
				type: 'list',
				allowBlank: false,
				showErrorMessage: true,
				errorTitle: 'Jenis Cuti tidak valid',
				error: 'Pilih Jenis Cuti dari daftar yang tersedia.',
				formulae: [`'Referensi Jenis Cuti'!$A$2:$A$${leaveTypeLastRow}`],
			};

			dataSheet.getCell(`B${rowNumber}`).dataValidation = {
				type: 'list',
				allowBlank: false,
				showErrorMessage: true,
				errorTitle: 'Nama Karyawan tidak valid',
				error: 'Pilih Nama Karyawan dari daftar Data Master Karyawan.',
				formulae: [`'Referensi Karyawan'!$A$2:$A$${employeeLastRow}`],
			};

			['F', 'G'].forEach((column) => {
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

			['E', 'H'].forEach((column) => {
				dataSheet.getCell(`${column}${rowNumber}`).dataValidation = {
					type: 'whole',
					operator: 'greaterThanOrEqual',
					allowBlank: false,
					showErrorMessage: true,
					errorTitle: 'Angka tidak valid',
					error: 'Masukkan angka bulat 0 atau lebih.',
					formulae: [column === 'E' ? 1 : 0],
				};
			});

			dataSheet.getCell(`A${rowNumber}`).fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFF5F7FA' },
			};
		}

		guideSheet.columns = [{ width: 120 }];
		[
			'Template ini dipakai untuk import saldo utama Data Cuti Karyawan, bukan transaksi workflow approval.',
			'Isi data mulai dari baris 3 pada sheet "Data Import".',
			'Satu row utama hanya boleh ada untuk kombinasi Karyawan + Jenis Cuti + Tahun.',
			'Kolom NO boleh dikosongkan untuk tambah data baru atau update otomatis jika kombinasi yang sama sudah ada.',
			'Jika NO diisi dan ditemukan, sistem akan memperbarui row utama tersebut.',
			'Kolom Nama Karyawan adalah dropdown utama yang selalu dibentuk dari Data Master Karyawan saat template diunduh.',
			'Kolom NIK terisi otomatis mengikuti Nama Karyawan yang dipilih.',
			'Kolom Jenis Cuti adalah dropdown yang selalu dibentuk dari Data Master Cuti Karyawan saat template diunduh.',
			'Kolom Periode Dari dan Periode Sampai wajib berada di tahun yang sama karena row ini mewakili saldo utama tahunan.',
			'Kolom Jumlah Cuti adalah kuota tahunan awal, sedangkan Sisa Cuti adalah saldo berjalan saat ini.',
			'Jika ada baris gagal saat import, sistem akan mengunduh file error report.',
		].forEach((text) => guideSheet.addRow([text]));

		guideSheet.getCell('A1').font = { bold: true };
		guideSheet.eachRow((row) => {
			row.alignment = { vertical: 'top', wrapText: true };
		});

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', 'attachment; filename="database-cuti-karyawan-import-template.xlsx"');

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
		const seenRecordIds = new Set();
		const seenCompositeKeys = new Set();

		for (let rowNumber = 3; rowNumber <= worksheet.rowCount; rowNumber += 1) {
			const row = worksheet.getRow(rowNumber);
			const raw = worksheetRowToPayload(row, headerMap);
			const isEmpty = IMPORT_HEADERS.every((header) => !normalizeString(raw[header] || ''));

			if (isEmpty) {
				continue;
			}

			try {
				const { recordId, payload } = await buildImportPayload(raw);

				if (recordId && seenRecordIds.has(recordId)) {
					throw new Error('Kolom NO duplikat pada file import.');
				}

				const validatedPayload = validatePayload(payload);
				const compositeKey = buildCompositeKey(validatedPayload);

				if (seenCompositeKeys.has(compositeKey)) {
					throw new Error(
						'Kombinasi Nama Karyawan, Jenis Cuti, dan Tahun duplikat pada file import. Sisakan satu baris saja.',
					);
				}

				if (recordId) {
					seenRecordIds.add(recordId);
				}
				seenCompositeKeys.add(compositeKey);

				const record = await saveImportedRow(recordId, validatedPayload);
				importedRows.push(mapLeaveDatabaseRow(record));
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
				errorReportUrl: `/data-karyawan/employee-leave-database/import-errors/${fileName}`,
			});
		}

		return res.json({
			message: 'Import Database Cuti Karyawan berhasil.',
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
		const rows = await listLeaveDatabase(prisma);
		return res.json(rows);
	}),
);

router.get(
	'/:id/history',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const detail = await getLeaveDatabaseDetailOrThrow(prisma, id);
		return res.json(detail.histories);
	}),
);

router.get(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const detail = await getLeaveDatabaseDetailOrThrow(prisma, id);
		return res.json(detail);
	}),
);

router.post(
	'/',
	withAsync(async (req, res) => {
		const payload = validatePayload(req.body);

		const record = await prisma.$transaction(async (tx) => {
			await ensureCreatePayloadAvailable(tx, payload);
			return createLeaveDatabaseEntry(tx, payload, {
				sourceType: 'ADMIN_CREATE',
			});
		});

		return res.status(201).json(mapLeaveDatabaseRow(record));
	}),
);

router.put(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const payload = validatePayload(req.body);
		const record = await prisma.$transaction(async (tx) => {
			const existing = await tx.employeeLeaveDatabase.findUnique({
				where: { id },
			});

			if (!existing) {
				throw Object.assign(new Error('Data cuti karyawan tidak ditemukan.'), { statusCode: 404 });
			}

			await ensureUpdatePayloadAvailable(tx, id, payload);

			return updateLeaveDatabaseEntry(tx, id, payload, {
				sourceType: 'ADMIN_UPDATE',
			});
		});

		return res.json(mapLeaveDatabaseRow(record));
	}),
);

router.delete(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const existing = await prisma.employeeLeaveDatabase.findUnique({
			where: { id },
		});

		if (!existing) {
			return res.status(404).json({ message: 'Data cuti karyawan tidak ditemukan.' });
		}

		await prisma.employeeLeaveDatabase.delete({
			where: { id },
		});

		return res.status(204).send();
	}),
);

export default router;
