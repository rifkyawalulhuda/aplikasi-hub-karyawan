import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import ExcelJS from 'exceljs';
import { Router } from 'express';
import multer from 'multer';

import prisma from '../lib/prisma.js';
import MASTER_DATA_CONFIG from '../config/masterDataConfig.js';
import requireSiteIsolation from '../middleware/requireSiteIsolation.js';

const router = Router();

const PER_SITE_RESOURCES = new Set(['master-units', 'master-vendors']);

function isPerSiteResource(resource) {
	return PER_SITE_RESOURCES.has(resource);
}

// Dynamic site isolation middleware: applies per-site filtering for per-site resources,
// shared (no filtering) for all other resources.
router.use('/:resource', (req, res, next) => {
	const modelType = isPerSiteResource(req.params.resource) ? 'per-site' : 'shared';
	return requireSiteIsolation({ modelType })(req, res, next);
});
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024,
	},
});
const ERROR_REPORT_DIR = path.resolve(process.cwd(), 'tmp', 'import-results');

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

function getConfig(resource) {
	return MASTER_DATA_CONFIG[resource];
}

function getDelegate(model) {
	return prisma[model];
}

function normalizeString(value = '') {
	return String(value).trim().replace(/\s+/g, ' ');
}

function normalizeMultilineString(value = '') {
	return String(value).replace(/\r\n/g, '\n').trim();
}

const INVALID_FIELD_VALUE = Symbol('invalid-field-value');

function createUtcDate(year, month, day) {
	const date = new Date(Date.UTC(year, month - 1, day));

	if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
		return null;
	}

	return date;
}

function parseExcelDateValue(value) {
	if (value instanceof Date) {
		return createUtcDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
	}

	if (typeof value === 'number' && Number.isFinite(value)) {
		const excelEpochUtc = Date.UTC(1899, 11, 30);
		const parsedDate = new Date(excelEpochUtc + Math.round(value * 24 * 60 * 60 * 1000));

		return createUtcDate(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth() + 1, parsedDate.getUTCDate());
	}

	const normalizedValue = normalizeString(value);

	if (!normalizedValue) {
		return null;
	}

	if (/^\d{5,}$/.test(normalizedValue)) {
		return parseExcelDateValue(Number(normalizedValue));
	}

	let match = normalizedValue.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);

	if (match) {
		return createUtcDate(Number(match[1]), Number(match[2]), Number(match[3]));
	}

	match = normalizedValue.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);

	if (match) {
		return createUtcDate(Number(match[3]), Number(match[2]), Number(match[1]));
	}

	const fallbackDate = new Date(normalizedValue);

	if (Number.isNaN(fallbackDate.getTime())) {
		return null;
	}

	return createUtcDate(fallbackDate.getUTCFullYear(), fallbackDate.getUTCMonth() + 1, fallbackDate.getUTCDate());
}

function formatDateId(value) {
	const parsedDate = parseExcelDateValue(value);

	if (!parsedDate) {
		return '-';
	}

	const day = String(parsedDate.getUTCDate()).padStart(2, '0');
	const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0');
	const year = parsedDate.getUTCFullYear();

	return `${day}/${month}/${year}`;
}

function getFields(config) {
	return config?.fields?.length
		? config.fields
		: [
				{
					name: 'name',
					label: config.label,
					required: true,
					unique: true,
				},
		  ];
}

function getFieldImportHeader(fieldConfig) {
	return fieldConfig?.importHeader || fieldConfig?.label;
}

function normalizeFieldValue(fieldConfig, value) {
	if (value === undefined || value === null) {
		return null;
	}

	if (typeof value === 'string' && normalizeString(value) === '') {
		return fieldConfig.allowEmptyString ? '' : null;
	}

	if (fieldConfig.type === 'number') {
		if (typeof value === 'number') {
			return Number.isFinite(value) ? value : INVALID_FIELD_VALUE;
		}

		const parsedNumber = Number(normalizeString(value));
		return Number.isFinite(parsedNumber) ? parsedNumber : INVALID_FIELD_VALUE;
	}

	if (fieldConfig.type === 'date') {
		return parseExcelDateValue(value) || INVALID_FIELD_VALUE;
	}

	if (fieldConfig.type === 'multiline') {
		return normalizeMultilineString(value);
	}

	return normalizeString(value);
}

async function buildPayload(config, body = {}, currentId = null, options = {}) {
	const delegate = getDelegate(config.model);
	const fields = getFields(config);
	const payload = {};
	const source = options.source || 'form';

	for (const fieldConfig of fields) {
		let value = normalizeFieldValue(fieldConfig, body?.[fieldConfig.name]);
		const fallbackValue =
			source === 'import' && fieldConfig.importDefaultValue !== undefined
				? fieldConfig.importDefaultValue
				: fieldConfig.defaultValue;

		if (value === null && fallbackValue !== undefined) {
			value = normalizeFieldValue(fieldConfig, fallbackValue);
		}

		if (value === INVALID_FIELD_VALUE) {
			throw Object.assign(new Error(fieldConfig.invalidMessage || `${fieldConfig.label} tidak valid.`), {
				statusCode: 400,
			});
		}

		if (fieldConfig.required && value === null) {
			throw Object.assign(new Error(`${fieldConfig.label} wajib diisi.`), { statusCode: 400 });
		}

		if (fieldConfig.type === 'number' && value !== null) {
			if (fieldConfig.integer && !Number.isInteger(value)) {
				throw Object.assign(
					new Error(fieldConfig.integerMessage || `${fieldConfig.label} harus berupa angka bulat.`),
					{
						statusCode: 400,
					},
				);
			}

			if (fieldConfig.min !== undefined && value < fieldConfig.min) {
				throw Object.assign(new Error(`${fieldConfig.label} minimal ${fieldConfig.min}.`), {
					statusCode: 400,
				});
			}

			if (fieldConfig.max !== undefined && value > fieldConfig.max) {
				throw Object.assign(new Error(`${fieldConfig.label} maksimal ${fieldConfig.max}.`), {
					statusCode: 400,
				});
			}
		}

		if (
			fieldConfig.options?.length &&
			value &&
			!fieldConfig.options.includes(value) &&
			!fieldConfig.allowCustomOption
		) {
			throw Object.assign(new Error(`${fieldConfig.label} tidak valid.`), { statusCode: 400 });
		}

		if (fieldConfig.unique && value) {
			const isString = typeof value === 'string';
			const duplicate = await delegate.findFirst({
				where: {
					[fieldConfig.name]: isString
						? {
								equals: value,
								mode: 'insensitive',
						  }
						: value,
					...(currentId ? { NOT: { id: currentId } } : {}),
				},
			});

			if (duplicate) {
				throw Object.assign(new Error(`${fieldConfig.label} sudah ada.`), { statusCode: 409 });
			}
		}

		payload[fieldConfig.name] = value;
	}

	if (typeof config.validatePayload === 'function') {
		await config.validatePayload({
			payload,
			currentId,
			delegate,
			prisma,
			helpers: {
				normalizeString,
				formatDateId,
			},
		});
	}

	return payload;
}

function worksheetRowToPayload(row, headerMap) {
	const payload = {};

	headerMap.forEach((columnNumber, header) => {
		const cellValue = row.getCell(columnNumber).value;
		payload[header] = typeof cellValue === 'object' && cellValue?.text ? cellValue.text : cellValue;
	});

	return payload;
}

function isInstructionRow(config, importHeaders, raw) {
	const instructionRowValues = config.import?.instructionRowValues;

	if (!instructionRowValues) {
		return false;
	}

	return importHeaders.every((header) => {
		const expectedValue = instructionRowValues[header];

		if (!expectedValue) {
			return false;
		}

		return normalizeString(raw[header] || '') === normalizeString(expectedValue);
	});
}

async function createErrorReport(config, rows) {
	await fs.mkdir(ERROR_REPORT_DIR, { recursive: true });

	const workbook = new ExcelJS.Workbook();
	const worksheet = workbook.addWorksheet('Import Errors');
	const importHeaders = config.import.headers || [];

	worksheet.addRow([...importHeaders, 'Error Message']);

	rows.forEach((row) => {
		worksheet.addRow([...importHeaders.map((header) => row.raw[header] || ''), row.error]);
	});

	const headerRow = worksheet.getRow(1);
	headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB71C1C' } };
	worksheet.columns.forEach((column) => {
		column.width = 28;
	});

	const fileName = `${config.import.errorFilePrefix || 'master-data-import-errors'}-${randomUUID()}.xlsx`;
	const filePath = path.join(ERROR_REPORT_DIR, fileName);
	await workbook.xlsx.writeFile(filePath);

	return fileName;
}

router.post(
	'/:resource/import',
	upload.single('file'),
	withAsync(async (req, res) => {
		const config = getConfig(req.params.resource);

		if (!config) {
			return res.status(404).json({ message: 'Master data resource not found.' });
		}

		if (!config.import) {
			return res.status(404).json({ message: 'Import Excel tidak tersedia untuk master data ini.' });
		}

		if (!req.file) {
			return res.status(400).json({ message: 'File Excel wajib dipilih.' });
		}

		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(req.file.buffer);
		const worksheet = workbook.getWorksheet(config.import.worksheetName || 'Data Import') || workbook.worksheets[0];

		if (!worksheet) {
			return res.status(400).json({ message: 'Sheet Excel tidak ditemukan.' });
		}

		const importHeaders = config.import.headers || [];
		const headerMap = new Map();
		worksheet.getRow(1).eachCell((cell, colNumber) => {
			headerMap.set(normalizeString(cell.value), colNumber);
		});

		const missingHeaders = importHeaders.filter((header) => !headerMap.has(header));
		if (missingHeaders.length > 0) {
			return res.status(400).json({
				message: `Template Excel tidak valid. Header tidak ditemukan: ${missingHeaders.join(', ')}`,
			});
		}

		const fields = getFields(config);
		const delegate = getDelegate(config.model);
		const importedRows = [];
		const errorRows = [];

		// Determine siteId for per-site resource imports
		let importSiteId = null;
		if (isPerSiteResource(req.params.resource)) {
			if (req.isSuperAdmin) {
				const siteId = req.body?.siteId || req.query?.siteId;
				if (!siteId) {
					return res.status(400).json({ message: 'siteId wajib diisi.' });
				}
				const site = await prisma.masterSite.findUnique({ where: { id: Number(siteId) } });
				if (!site) {
					return res.status(400).json({ message: 'Site tidak valid.' });
				}
				importSiteId = site.id;
			} else {
				importSiteId = req.admin.siteId;
			}
		}

		for (let rowNumber = config.import.dataStartRow || 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
			const row = worksheet.getRow(rowNumber);
			const raw = worksheetRowToPayload(row, headerMap);
			const isEmpty = importHeaders.every(
				(header) => !normalizeFieldValue({ type: 'string' }, raw[header] || ''),
			);

			if (isEmpty || isInstructionRow(config, importHeaders, raw)) {
				continue;
			}

			try {
				const body = fields.reduce((accumulator, fieldConfig) => {
					accumulator[fieldConfig.name] = raw[getFieldImportHeader(fieldConfig)];
					return accumulator;
				}, {});
				const data = await buildPayload(config, body, null, { source: 'import' });

				if (isPerSiteResource(req.params.resource)) {
					data.siteId = importSiteId;
				}

				const item = await delegate.create({ data });

				importedRows.push(item);
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
			const fileName = await createErrorReport(config, errorRows);

			return res.json({
				message:
					importedRows.length > 0
						? 'Import selesai sebagian. Beberapa baris gagal diproses.'
						: 'Import gagal. Periksa file hasil error.',
				importedCount: importedRows.length,
				failedCount: errorRows.length,
				rows: importedRows,
				errorReportUrl: `/master/${req.params.resource}/import-errors/${fileName}`,
			});
		}

		return res.json({
			message: `Import ${config.label} berhasil.`,
			importedCount: importedRows.length,
			failedCount: 0,
			rows: importedRows,
			errorReportUrl: null,
		});
	}),
);

router.get(
	'/:resource/import-errors/:fileName',
	withAsync(async (req, res) => {
		const config = getConfig(req.params.resource);

		if (!config || !config.import) {
			return res.status(404).json({ message: 'File error report tidak ditemukan.' });
		}

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
	'/:resource/template',
	withAsync(async (req, res) => {
		const config = getConfig(req.params.resource);

		if (!config) {
			return res.status(404).json({ message: 'Master data resource not found.' });
		}

		if (!config.import) {
			return res.status(404).json({ message: 'Import Excel tidak tersedia untuk master data ini.' });
		}

		const workbook = new ExcelJS.Workbook();
		const dataSheet = workbook.addWorksheet(config.import.worksheetName || 'Data Import');
		const constantsSheet = workbook.addWorksheet('Constants');

		// Hide constants sheet
		constantsSheet.state = 'hidden';

		const importHeaders = config.import.headers || [];
		const fields = getFields(config);
		const templateStartRow = config.import.dataStartRow || 2;
		const templateEndRow = config.import.templateEndRow || 501;

		// Add Header Row
		dataSheet.addRow(importHeaders);
		const headerRow = dataSheet.getRow(1);
		headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
		headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } };
		headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

		// Set column widths
		dataSheet.columns = importHeaders.map(() => ({ width: 30 }));

		// Setup dropdowns (lists)
		let constantColIndex = 1;
		importHeaders.forEach((header, colIndex) => {
			const fieldConfig = fields.find((f) => getFieldImportHeader(f) === header);
			const colLetter = dataSheet.getColumn(colIndex + 1).letter;

			if (fieldConfig?.excelNumberFormat) {
				for (let i = templateStartRow; i <= templateEndRow; i += 1) {
					dataSheet.getCell(`${colLetter}${i}`).numFmt = fieldConfig.excelNumberFormat;
				}
			}

			if (fieldConfig?.options?.length) {
				const options = fieldConfig.allowCustomOption
					? [...fieldConfig.options, fieldConfig.customOptionLabel].filter(Boolean)
					: fieldConfig.options;

				// Write options to Constants sheet
				options.forEach((option, index) => {
					constantsSheet.getCell(index + 1, constantColIndex).value = option;
				});

				const constantsColLetter = constantsSheet.getColumn(constantColIndex).letter;
				const range = `$${constantsColLetter}$1:$${constantsColLetter}$${options.length}`;

				// Apply validation to a large number of rows (e.g., 500)
				for (let i = templateStartRow; i <= templateEndRow; i += 1) {
					dataSheet.getCell(`${colLetter}${i}`).dataValidation = {
						type: 'list',
						allowBlank: true,
						formulae: [`Constants!${range}`],
						showErrorMessage: !fieldConfig.allowCustomOption,
						errorTitle: 'Input Tidak Valid',
						error: `Silakan pilih salah satu opsi yang tersedia untuk ${header}.`,
					};
				}

				constantColIndex += 1;
			}
		});

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', `attachment; filename=${req.params.resource}-import-template.xlsx`);

		await workbook.xlsx.write(res);
		res.end();
	}),
);

router.get(
	'/:resource',
	withAsync(async (req, res) => {
		const config = getConfig(req.params.resource);

		if (!config) {
			return res.status(404).json({ message: 'Master data resource not found.' });
		}

		const where = isPerSiteResource(req.params.resource) ? { ...req.siteFilter } : {};

		const items = await getDelegate(config.model).findMany({
			where,
			orderBy: {
				id: 'asc',
			},
		});

		return res.json(items);
	}),
);

router.post(
	'/:resource',
	withAsync(async (req, res) => {
		const config = getConfig(req.params.resource);

		if (!config) {
			return res.status(404).json({ message: 'Master data resource not found.' });
		}
		const data = await buildPayload(config, req.body);

		if (isPerSiteResource(req.params.resource)) {
			if (req.isSuperAdmin) {
				const { siteId } = req.body;
				if (!siteId) {
					return res.status(400).json({ message: 'siteId wajib diisi.' });
				}
				const site = await prisma.masterSite.findUnique({ where: { id: Number(siteId) } });
				if (!site) {
					return res.status(400).json({ message: 'Site tidak valid.' });
				}
				data.siteId = site.id;
			} else {
				data.siteId = req.admin.siteId;
			}
		}

		const item = await getDelegate(config.model).create({
			data,
		});

		return res.status(201).json(item);
	}),
);

router.put(
	'/:resource/:id',
	withAsync(async (req, res) => {
		const config = getConfig(req.params.resource);
		const id = Number(req.params.id);

		if (!config) {
			return res.status(404).json({ message: 'Master data resource not found.' });
		}

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const existing = await getDelegate(config.model).findUnique({
			where: {
				id,
			},
		});

		if (!existing) {
			return res.status(404).json({ message: `${config.label} tidak ditemukan.` });
		}

		if (isPerSiteResource(req.params.resource)) {
			if (!req.isSuperAdmin && existing.siteId !== req.admin.siteId) {
				return res.status(403).json({
					message: 'Akses ditolak. Data tidak termasuk dalam site Anda.',
				});
			}
		}

		const data = await buildPayload(config, req.body, id);

		// Preserve original siteId for per-site resources (strip from payload)
		if (isPerSiteResource(req.params.resource)) {
			delete data.siteId;
		}

		const item = await getDelegate(config.model).update({
			where: {
				id,
			},
			data,
		});

		return res.json(item);
	}),
);

router.delete(
	'/:resource/:id',
	withAsync(async (req, res) => {
		const config = getConfig(req.params.resource);
		const id = Number(req.params.id);

		if (!config) {
			return res.status(404).json({ message: 'Master data resource not found.' });
		}

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const existing = await getDelegate(config.model).findUnique({
			where: {
				id,
			},
		});

		if (!existing) {
			return res.status(404).json({ message: `${config.label} tidak ditemukan.` });
		}

		if (isPerSiteResource(req.params.resource)) {
			if (!req.isSuperAdmin && existing.siteId !== req.admin.siteId) {
				return res.status(403).json({
					message: 'Akses ditolak. Data tidak termasuk dalam site Anda.',
				});
			}
		}

		await getDelegate(config.model).delete({
			where: {
				id,
			},
		});

		return res.status(204).send();
	}),
);

export default router;
