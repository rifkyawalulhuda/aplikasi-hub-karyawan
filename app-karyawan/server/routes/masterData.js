import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import ExcelJS from 'exceljs';
import { Router } from 'express';
import multer from 'multer';

import prisma from '../lib/prisma.js';
import MASTER_DATA_CONFIG from '../config/masterDataConfig.js';

const router = Router();
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

function normalizeFieldValue(fieldConfig, value) {
	if (value === undefined || value === null || value === '') {
		return null;
	}

	if (fieldConfig.type === 'number') {
		return Number(value);
	}

	if (fieldConfig.type === 'date') {
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? null : date;
	}

	if (fieldConfig.type === 'multiline') {
		return normalizeMultilineString(value);
	}

	return normalizeString(value);
}

async function buildPayload(config, body = {}, currentId = null) {
	const delegate = getDelegate(config.model);
	const fields = getFields(config);
	const payload = {};

	for (const fieldConfig of fields) {
		const value = normalizeFieldValue(fieldConfig, body?.[fieldConfig.name]);

		if (fieldConfig.required && value === null) {
			throw Object.assign(new Error(`${fieldConfig.label} wajib diisi.`), { statusCode: 400 });
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
					accumulator[fieldConfig.name] = raw[fieldConfig.label];
					return accumulator;
				}, {});
				const data = await buildPayload(config, body);
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
			const fieldConfig = fields.find((f) => f.label === header);

			if (fieldConfig?.options?.length) {
				const colLetter = dataSheet.getColumn(colIndex + 1).letter;
				const { options } = fieldConfig;

				// Write options to Constants sheet
				options.forEach((option, index) => {
					constantsSheet.getCell(index + 1, constantColIndex).value = option;
				});

				const constantsColLetter = constantsSheet.getColumn(constantColIndex).letter;
				const range = `$${constantsColLetter}$1:$${constantsColLetter}$${options.length}`;

				// Apply validation to a large number of rows (e.g., 500)
				for (let i = 2; i <= 501; i += 1) {
					dataSheet.getCell(`${colLetter}${i}`).dataValidation = {
						type: 'list',
						allowBlank: true,
						formulae: [`Constants!${range}`],
						showErrorMessage: true,
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

		const items = await getDelegate(config.model).findMany({
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
		const data = await buildPayload(config, req.body, id);

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

		await getDelegate(config.model).delete({
			where: {
				id,
			},
		});

		return res.status(204).send();
	}),
);

export default router;
