import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import ExcelJS from 'exceljs';
import { Router } from 'express';
import multer from 'multer';

import prisma from '../lib/prisma.js';
import requireSiteIsolation from '../middleware/requireSiteIsolation.js';

const router = Router();
router.use(requireSiteIsolation({ modelType: 'per-site' }));
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024,
	},
});

const TEMPLATE_MAX_ROWS = 500;
const IMPORT_HEADERS = [
	'Jenis Pelatihan',
	'Nama Peserta',
	'Materi Pelatihan',
	'Lembaga Trainer',
	'Nama Trainer',
	'Dari Tanggal',
	'Sampai Tanggal',
	'Jumlah Hari',
	'Alamat Pelatihan',
	'Keterangan',
];
const REQUIRED_IMPORT_HEADERS = IMPORT_HEADERS.filter((header) => header !== 'Jumlah Hari');
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

function normalizeEnumValue(value = '') {
	return normalizeString(value).toUpperCase().replace(/\s+/g, '_');
}

function toDateOnly(value) {
	if (!value) {
		return null;
	}

	if (value instanceof Date) {
		return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 12));
	}

	if (typeof value === 'object' && value?.result) {
		return toDateOnly(value.result);
	}

	if (typeof value === 'number') {
		const excelEpoch = new Date(Date.UTC(1899, 11, 30));
		const parsed = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	}

	if (typeof value === 'string') {
		const raw = normalizeString(value);
		const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

		if (isoMatch) {
			const [, year, month, day] = isoMatch;
			const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
			return Number.isNaN(parsed.getTime()) ? null : parsed;
		}

		const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

		if (slashMatch) {
			const [, day, month, year] = slashMatch;
			const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
			return Number.isNaN(parsed.getTime()) ? null : parsed;
		}
	}

	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateForClient(value) {
	if (!value) {
		return null;
	}

	return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(
		value.getUTCDate(),
	).padStart(2, '0')}`;
}

function calculateInclusiveDayCount(startDate, endDate) {
	if (!startDate || !endDate) {
		return null;
	}

	const startTime = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
	const endTime = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());

	return Math.floor((endTime - startTime) / (24 * 60 * 60 * 1000)) + 1;
}

function getCellImportValue(cell) {
	const { value, text } = cell;

	if (typeof text === 'string' && text.trim()) {
		return text;
	}

	if (value && typeof value === 'object') {
		if (
			Object.prototype.hasOwnProperty.call(value, 'formula') ||
			Object.prototype.hasOwnProperty.call(value, 'sharedFormula')
		) {
			return typeof value.result !== 'undefined' && value.result !== null ? value.result : text || '';
		}

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

function normalizeParticipantNames(rawValue) {
	if (Array.isArray(rawValue)) {
		return rawValue.map((item) => normalizeString(item)).filter(Boolean);
	}

	if (typeof rawValue === 'string') {
		return rawValue
			.split(';')
			.map((item) => normalizeString(item))
			.filter(Boolean);
	}

	return [];
}

function extractEmployeeSearchTerms(rawParticipantName) {
	const normalizedParticipantName = normalizeString(rawParticipantName);

	if (!normalizedParticipantName) {
		return [];
	}

	const nikMatch = normalizedParticipantName.match(/\(([^)]+)\)\s*$/);
	const searchTerms = [normalizedParticipantName];

	if (nikMatch?.[1]) {
		searchTerms.unshift(normalizeString(nikMatch[1]));
	}

	return [...new Set(searchTerms.filter(Boolean))];
}

function formatEmployeeLabel(employee) {
	if (!employee) {
		return '';
	}

	return `${employee.fullName} (${employee.employeeNo})`;
}

function formatTrainingTypeLabel(value = '') {
	const normalizedValue = normalizeEnumValue(value);

	if (normalizedValue === 'INTERNAL') {
		return 'Internal';
	}

	if (normalizedValue === 'EXTERNAL') {
		return 'External';
	}

	return normalizeString(value);
}

function buildParticipantSummary(participantNames = []) {
	if (!participantNames.length) {
		return '-';
	}

	if (participantNames.length === 1) {
		return participantNames[0];
	}

	return `${participantNames[0]} + ${participantNames.length - 1} lainnya`;
}

function mapTrainingRecord(record) {
	const participants = (record.participants || []).map((item) => ({
		id: item.id,
		employeeId: item.employeeId || null,
		employeeName: item.employee?.fullName || '',
		employeeNo: item.employee?.employeeNo || '',
		participantName: item.participantName || '',
		displayLabel: item.employee ? formatEmployeeLabel(item.employee) : item.participantName || '',
	}));
	const participantDisplayNames = participants.map((item) => item.displayLabel).filter(Boolean);
	const participantEmployeeIds = participants.map((item) => item.employeeId).filter(Boolean);

	return {
		id: record.id,
		trainingType: formatTrainingTypeLabel(record.trainingType),
		participants,
		participantNames: participantDisplayNames,
		participantEmployeeIds,
		participantCount: participants.length,
		participantSummary: buildParticipantSummary(participantDisplayNames),
		material: record.material || '',
		trainerInstitution: record.trainerInstitution || '',
		trainerName: record.trainerName || '',
		startDate: formatDateForClient(record.startDate),
		endDate: formatDateForClient(record.endDate),
		dayCount: record.dayCount,
		address: record.address || '',
		notes: record.notes || '',
	};
}

async function getTrainingRecordOrThrow(db, id) {
	const record = await db.employeeTraining.findUnique({
		where: { id },
		include: {
			participants: {
				include: {
					employee: true,
				},
				orderBy: { id: 'asc' },
			},
		},
	});

	if (!record) {
		throw Object.assign(new Error('Data pelatihan karyawan tidak ditemukan.'), { statusCode: 404 });
	}

	return record;
}

function validatePayload(payload = {}) {
	const trainingType = normalizeEnumValue(payload.trainingType);
	const participantEmployeeIds = (
		Array.isArray(payload.participantEmployeeIds)
			? payload.participantEmployeeIds
			: Array.isArray(payload.participants)
			? payload.participants
			: []
	)
		.map((item) => Number(item?.employeeId ?? item))
		.filter((item) => Number.isInteger(item) && item > 0);
	const participantNames = normalizeParticipantNames(payload.participantNames ?? payload.participants);
	const material = normalizeMultilineString(payload.material || payload.materiPelatihan || '');
	const trainerInstitution = normalizeString(payload.trainerInstitution || payload.lembagaTrainer || '');
	const trainerName = normalizeString(payload.trainerName || payload.namaTrainer || '');
	const startDate = toDateOnly(payload.startDate || payload.dariTanggal);
	const endDate = toDateOnly(payload.endDate || payload.sampaiTanggal);
	const address = normalizeMultilineString(payload.address || payload.alamatPelatihan || '');
	const notes = normalizeMultilineString(payload.notes || payload.keterangan || '');

	if (!['INTERNAL', 'EXTERNAL'].includes(trainingType)) {
		throw Object.assign(new Error('Jenis Pelatihan wajib dipilih.'), { statusCode: 400 });
	}

	if (participantEmployeeIds.length === 0 && participantNames.length === 0) {
		throw Object.assign(new Error('Minimal 1 peserta wajib diisi.'), { statusCode: 400 });
	}

	if (new Set(participantEmployeeIds).size !== participantEmployeeIds.length) {
		throw Object.assign(new Error('Peserta tidak boleh duplikat.'), { statusCode: 400 });
	}

	if (!material) {
		throw Object.assign(new Error('Materi Pelatihan wajib diisi.'), { statusCode: 400 });
	}

	if (!trainerInstitution) {
		throw Object.assign(new Error('Trainer -> Lembaga wajib diisi.'), { statusCode: 400 });
	}

	if (!trainerName) {
		throw Object.assign(new Error('Trainer -> Nama wajib diisi.'), { statusCode: 400 });
	}

	if (!startDate) {
		throw Object.assign(new Error('Dari Tanggal wajib diisi.'), { statusCode: 400 });
	}

	if (!endDate) {
		throw Object.assign(new Error('Sampai Tanggal wajib diisi.'), { statusCode: 400 });
	}

	if (endDate.getTime() < startDate.getTime()) {
		throw Object.assign(new Error('Sampai Tanggal tidak boleh lebih kecil dari Dari Tanggal.'), {
			statusCode: 400,
		});
	}

	const dayCount = calculateInclusiveDayCount(startDate, endDate);

	return {
		trainingType,
		participantEmployeeIds,
		participantNames,
		material,
		trainerInstitution,
		trainerName,
		startDate,
		endDate,
		dayCount,
		address: address || null,
		notes: notes || null,
	};
}

async function saveParticipants(tx, employeeTrainingId, participantEmployeeIds, participantNames = []) {
	await tx.employeeTrainingParticipant.deleteMany({
		where: { employeeTrainingId },
	});

	if (participantEmployeeIds.length > 0) {
		const employees = await tx.employee.findMany({
			where: {
				id: {
					in: participantEmployeeIds,
				},
			},
			select: {
				id: true,
				fullName: true,
				employeeNo: true,
			},
		});

		const employeeLookup = new Map(employees.map((employee) => [employee.id, employee]));

		await tx.employeeTrainingParticipant.createMany({
			data: participantEmployeeIds.map((employeeId) => {
				const employee = employeeLookup.get(employeeId);

				if (!employee) {
					throw Object.assign(new Error(`Karyawan dengan ID ${employeeId} tidak ditemukan.`), {
						statusCode: 400,
					});
				}

				return {
					employeeTrainingId,
					employeeId,
					participantName: formatEmployeeLabel(employee),
				};
			}),
		});

		return;
	}

	await tx.employeeTrainingParticipant.createMany({
		data: participantNames.map((participantName) => ({
			employeeTrainingId,
			participantName,
		})),
	});
}

async function saveTrainingRecord(db, id, payload) {
	return db.$transaction(async (tx) => {
		if (id) {
			await tx.employeeTraining.update({
				where: { id },
				data: {
					trainingType: payload.trainingType,
					material: payload.material,
					trainerInstitution: payload.trainerInstitution,
					trainerName: payload.trainerName,
					startDate: payload.startDate,
					endDate: payload.endDate,
					dayCount: payload.dayCount,
					address: payload.address,
					notes: payload.notes,
				},
			});

			await saveParticipants(tx, id, payload.participantEmployeeIds, payload.participantNames);

			return getTrainingRecordOrThrow(tx, id);
		}

		const createData = {
			trainingType: payload.trainingType,
			material: payload.material,
			trainerInstitution: payload.trainerInstitution,
			trainerName: payload.trainerName,
			startDate: payload.startDate,
			endDate: payload.endDate,
			dayCount: payload.dayCount,
			address: payload.address,
			notes: payload.notes,
		};

		if (payload.siteId) {
			createData.siteId = payload.siteId;
		}

		const created = await tx.employeeTraining.create({
			data: createData,
		});

		await saveParticipants(tx, created.id, payload.participantEmployeeIds, payload.participantNames);
		return getTrainingRecordOrThrow(tx, created.id);
	});
}

function createErrorReport(rows) {
	return (async () => {
		await fs.mkdir(ERROR_REPORT_DIR, { recursive: true });

		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Import Errors');
		worksheet.addRow(['Baris Excel', ...IMPORT_HEADERS, 'Error Message']);

		rows.forEach((row) => {
			worksheet.addRow([
				row.rowNumber,
				row.raw['Jenis Pelatihan'] || '',
				row.raw['Nama Peserta'] || '',
				row.raw['Materi Pelatihan'] || '',
				row.raw['Lembaga Trainer'] || '',
				row.raw['Nama Trainer'] || '',
				row.raw['Dari Tanggal'] || '',
				row.raw['Sampai Tanggal'] || '',
				row.raw['Jumlah Hari'] || '',
				row.raw['Alamat Pelatihan'] || '',
				row.raw.Keterangan || '',
				row.error,
			]);
		});

		const headerRow = worksheet.getRow(1);
		headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
		headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB71C1C' } };
		worksheet.columns.forEach((column) => {
			column.width = 24;
		});

		const fileName = `pelatihan-karyawan-import-errors-${randomUUID()}.xlsx`;
		const filePath = path.join(ERROR_REPORT_DIR, fileName);
		await workbook.xlsx.writeFile(filePath);

		return fileName;
	})();
}

async function buildImportPayload(rawPayload) {
	const participantNames = normalizeParticipantNames(rawPayload['Nama Peserta']);
	const participantEmployeeIds = [];

	for (const participantName of participantNames) {
		const searchTerms = extractEmployeeSearchTerms(participantName);
		let matchedEmployee = null;

		for (const searchTerm of searchTerms) {
			matchedEmployee = await prisma.employee.findFirst({
				where: {
					OR: [
						{
							fullName: {
								equals: searchTerm,
								mode: 'insensitive',
							},
						},
						{
							employeeNo: {
								equals: searchTerm,
								mode: 'insensitive',
							},
						},
					],
				},
				select: {
					id: true,
					fullName: true,
					employeeNo: true,
				},
			});

			if (matchedEmployee) {
				break;
			}
		}

		if (!matchedEmployee) {
			throw Object.assign(
				new Error(`Nama Peserta "${participantName}" tidak ditemukan di Data Master Karyawan.`),
				{ statusCode: 400 },
			);
		}

		participantEmployeeIds.push(matchedEmployee.id);
	}

	return {
		trainingType: rawPayload['Jenis Pelatihan'],
		participantNames,
		participantEmployeeIds,
		material: rawPayload['Materi Pelatihan'],
		trainerInstitution: rawPayload['Lembaga Trainer'],
		trainerName: rawPayload['Nama Trainer'],
		startDate: parseExcelDate(rawPayload['Dari Tanggal']),
		endDate: parseExcelDate(rawPayload['Sampai Tanggal']),
		address: rawPayload['Alamat Pelatihan'],
		notes: rawPayload.Keterangan,
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

router.get(
	'/import-template',
	withAsync(async (_req, res) => {
		const workbook = new ExcelJS.Workbook();
		const dataSheet = workbook.addWorksheet('Data Import');
		const guideSheet = workbook.addWorksheet('Petunjuk');

		dataSheet.columns = [
			{ header: 'Jenis Pelatihan', key: 'trainingType', width: 20 },
			{ header: 'Nama Peserta', key: 'participantNames', width: 34 },
			{ header: 'Materi Pelatihan', key: 'material', width: 30 },
			{ header: 'Lembaga Trainer', key: 'trainerInstitution', width: 24 },
			{ header: 'Nama Trainer', key: 'trainerName', width: 24 },
			{ header: 'Dari Tanggal', key: 'startDate', width: 16 },
			{ header: 'Sampai Tanggal', key: 'endDate', width: 16 },
			{ header: 'Jumlah Hari', key: 'dayCount', width: 14 },
			{ header: 'Alamat Pelatihan', key: 'address', width: 34 },
			{ header: 'Keterangan', key: 'notes', width: 34 },
		];

		const headerRow = dataSheet.getRow(1);
		headerRow.values = IMPORT_HEADERS;
		headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
		headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
		headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
		dataSheet.getRow(2).values = [
			'Pilih Internal atau External',
			'Boleh isi banyak nama peserta dengan pemisah ;',
			'Wajib diisi',
			'Wajib diisi',
			'Wajib diisi',
			'Format tanggal DD/MM/YYYY',
			'Format tanggal DD/MM/YYYY',
			'Otomatis dari rentang tanggal',
			'Opsional',
			'Opsional',
		];
		dataSheet.getRow(2).font = { italic: true, color: { argb: 'FF546E7A' } };
		dataSheet.getRow(2).alignment = { vertical: 'top', wrapText: true };
		dataSheet.views = [{ state: 'frozen', ySplit: 2 }];
		dataSheet.autoFilter = {
			from: 'A1',
			to: 'J1',
		};

		for (let rowNumber = 3; rowNumber <= TEMPLATE_MAX_ROWS + 2; rowNumber += 1) {
			dataSheet.getCell(`A${rowNumber}`).dataValidation = {
				type: 'list',
				allowBlank: false,
				showErrorMessage: true,
				errorTitle: 'Jenis Pelatihan tidak valid',
				error: 'Pilih Internal atau External.',
				formulae: ['"Internal,External"'],
			};

			dataSheet.getCell(`F${rowNumber}`).dataValidation = {
				type: 'date',
				operator: 'greaterThanOrEqual',
				showErrorMessage: true,
				errorTitle: 'Tanggal tidak valid',
				error: 'Gunakan format tanggal yang benar.',
				formulae: [new Date(1960, 0, 1)],
			};
			dataSheet.getCell(`G${rowNumber}`).dataValidation = {
				type: 'date',
				operator: 'greaterThanOrEqual',
				showErrorMessage: true,
				errorTitle: 'Tanggal tidak valid',
				error: 'Gunakan format tanggal yang benar.',
				formulae: [new Date(1960, 0, 1)],
			};
			dataSheet.getCell(`F${rowNumber}`).numFmt = 'dd/mm/yyyy';
			dataSheet.getCell(`G${rowNumber}`).numFmt = 'dd/mm/yyyy';
			dataSheet.getCell(`H${rowNumber}`).value = {
				formula: `IF(OR(F${rowNumber}="",G${rowNumber}=""),"",G${rowNumber}-F${rowNumber}+1)`,
			};
			dataSheet.getCell(`H${rowNumber}`).fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFF5F7FA' },
			};
			dataSheet.getCell(`H${rowNumber}`).font = {
				italic: true,
				color: { argb: 'FF455A64' },
			};
		}

		guideSheet.columns = [{ width: 120 }];
		[
			'Template ini dipakai untuk import data Pelatihan Karyawan.',
			'Isi data mulai dari baris 3 pada sheet "Data Import".',
			'Kolom "Nama Peserta" menerima banyak nama dalam satu sel dengan pemisah titik koma (;).',
			'Kolom "Jumlah Hari" dihitung otomatis dari Dari Tanggal dan Sampai Tanggal.',
			'Jika ada baris gagal saat import, sistem akan mengunduh file error report.',
		].forEach((text) => guideSheet.addRow([text]));

		guideSheet.getCell('A1').font = { bold: true };
		guideSheet.eachRow((row) => {
			row.alignment = { vertical: 'top', wrapText: true };
		});

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', 'attachment; filename="pelatihan-karyawan-import-template.xlsx"');

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

		let siteId;

		if (req.isSuperAdmin) {
			siteId = req.body.siteId ? Number(req.body.siteId) : null;

			if (!siteId) {
				return res.status(400).json({ message: 'siteId wajib diisi.' });
			}

			const site = await prisma.masterSite.findUnique({ where: { id: siteId } });

			if (!site) {
				return res.status(400).json({ message: 'Site tidak valid.' });
			}
		} else {
			siteId = req.admin.siteId;
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

		for (let rowNumber = 3; rowNumber <= worksheet.rowCount; rowNumber += 1) {
			const row = worksheet.getRow(rowNumber);
			const raw = worksheetRowToPayload(row, headerMap);
			const isEmpty = IMPORT_HEADERS.every((header) => !normalizeString(raw[header] || ''));

			if (isEmpty) {
				continue;
			}

			try {
				const payload = validatePayload(await buildImportPayload(raw));
				const record = await saveTrainingRecord(prisma, null, { ...payload, siteId });
				importedRows.push(mapTrainingRecord(record));
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
				errorReportUrl: `/data-karyawan/pelatihan-karyawan/import-errors/${fileName}`,
			});
		}

		return res.json({
			message: 'Import Pelatihan Karyawan berhasil.',
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
		const records = await prisma.employeeTraining.findMany({
			where: { ...req.siteFilter },
			include: {
				participants: {
					orderBy: { id: 'asc' },
				},
			},
			orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
		});

		return res.json(records.map(mapTrainingRecord));
	}),
);

router.get(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const record = await getTrainingRecordOrThrow(prisma, id);

		if (!req.isSuperAdmin && record.siteId !== req.admin.siteId) {
			return res.status(403).json({
				message: 'Akses ditolak. Data tidak termasuk dalam site Anda.',
			});
		}

		return res.json(mapTrainingRecord(record));
	}),
);

router.post(
	'/',
	withAsync(async (req, res) => {
		let siteId;

		if (req.isSuperAdmin) {
			siteId = req.body.siteId;

			if (!siteId) {
				return res.status(400).json({ message: 'siteId wajib diisi.' });
			}

			const site = await prisma.masterSite.findUnique({ where: { id: siteId } });

			if (!site) {
				return res.status(400).json({ message: 'Site tidak valid.' });
			}
		} else {
			siteId = req.admin.siteId;
		}

		const payload = validatePayload(req.body);
		const record = await saveTrainingRecord(prisma, null, { ...payload, siteId });

		return res.status(201).json(mapTrainingRecord(record));
	}),
);

router.put(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const existing = await getTrainingRecordOrThrow(prisma, id);

		if (!req.isSuperAdmin && existing.siteId !== req.admin.siteId) {
			return res.status(403).json({
				message: 'Akses ditolak. Data tidak termasuk dalam site Anda.',
			});
		}

		const { siteId: _ignored, ...body } = req.body;
		const payload = validatePayload(body);
		const record = await saveTrainingRecord(prisma, id, payload);

		return res.json(mapTrainingRecord(record));
	}),
);

router.delete(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const existing = await getTrainingRecordOrThrow(prisma, id);

		if (!req.isSuperAdmin && existing.siteId !== req.admin.siteId) {
			return res.status(403).json({
				message: 'Akses ditolak. Data tidak termasuk dalam site Anda.',
			});
		}

		await prisma.employeeTraining.delete({
			where: { id },
		});

		return res.status(204).send();
	}),
);

export default router;
