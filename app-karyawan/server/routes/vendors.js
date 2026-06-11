import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import ExcelJS from 'exceljs';
import { Router } from 'express';
import multer from 'multer';

import prisma from '../lib/prisma.js';
import requireSiteIsolation from '../middleware/requireSiteIsolation.js';

const router = Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024,
	},
});
const ERROR_REPORT_DIR = path.resolve(process.cwd(), 'tmp', 'import-results');
const IMPORT_HEADERS = [
	'Nama Vendor',
	'Jenis Vendor',
	'Alamat',
	'Nama PIC',
	'Nomor Telepon',
	'Email',
	'Detail Lainnya',
];
const VENDOR_TYPE_OPTIONS = ['Consumable', 'Building', 'Trucking', 'Jasa', 'Warehousing', 'Disposable'];

// Apply site isolation middleware to all routes
router.use(requireSiteIsolation({ modelType: 'per-site' }));

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

function normalizeString(value = '') {
	return String(value).trim().replace(/\s+/g, ' ');
}

async function validatePayload(payload = {}, currentId = null) {
	const vendorName = normalizeString(payload.vendorName);
	const vendorType = normalizeString(payload.vendorType);
	const address = normalizeString(payload.address);
	const picName = normalizeString(payload.picName);
	const phoneNumber = normalizeString(payload.phoneNumber || '');
	const email = normalizeString(payload.email || '');
	const detailLainnya = normalizeString(payload.detailLainnya || '');

	if (!vendorName) {
		throw Object.assign(new Error('Nama Vendor wajib diisi.'), { statusCode: 400 });
	}

	if (!vendorType) {
		throw Object.assign(new Error('Jenis Vendor wajib diisi.'), { statusCode: 400 });
	}

	if (!address) {
		throw Object.assign(new Error('Alamat wajib diisi.'), { statusCode: 400 });
	}

	if (!picName) {
		throw Object.assign(new Error('Nama PIC wajib diisi.'), { statusCode: 400 });
	}

	if (phoneNumber && !/^[0-9+\-() ]{6,20}$/.test(phoneNumber)) {
		throw Object.assign(new Error('Nomor Telepon harus berisi 6-20 karakter angka yang valid.'), {
			statusCode: 400,
		});
	}

	if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(email)) {
		throw Object.assign(new Error('Email harus menggunakan format alamat email yang valid.'), {
			statusCode: 400,
		});
	}

	const duplicate = await prisma.masterVendor.findFirst({
		where: {
			vendorName: {
				equals: vendorName,
				mode: 'insensitive',
			},
			...(currentId ? { NOT: { id: currentId } } : {}),
		},
	});

	if (duplicate) {
		throw Object.assign(new Error(`Nama Vendor "${vendorName}" sudah ada.`), { statusCode: 409 });
	}

	return {
		vendorName,
		vendorType,
		address,
		picName,
		phoneNumber,
		email,
		detailLainnya,
	};
}

async function resolveSiteId(req) {
	if (req.isSuperAdmin) {
		const siteId = req.body.siteId != null ? Number(req.body.siteId) : null;

		if (!siteId || !Number.isInteger(siteId)) {
			throw Object.assign(new Error('siteId wajib diisi.'), { statusCode: 400 });
		}

		const site = await prisma.masterSite.findUnique({ where: { id: siteId } });

		if (!site) {
			throw Object.assign(new Error('Site tidak valid.'), { statusCode: 400 });
		}

		return siteId;
	}

	return req.admin.siteId;
}

function verifyOwnership(req, record) {
	if (!req.isSuperAdmin && record.siteId !== req.admin.siteId) {
		throw Object.assign(new Error('Akses ditolak. Data tidak termasuk dalam site Anda.'), {
			statusCode: 403,
		});
	}
}

// LIST
router.get(
	'/',
	withAsync(async (req, res) => {
		const items = await prisma.masterVendor.findMany({
			where: { ...req.siteFilter },
			orderBy: { id: 'asc' },
		});

		return res.json(items);
	}),
);

// CREATE
router.post(
	'/',
	withAsync(async (req, res) => {
		const siteId = await resolveSiteId(req);
		const data = await validatePayload(req.body);

		const item = await prisma.masterVendor.create({
			data: { ...data, siteId },
		});

		return res.status(201).json(item);
	}),
);

// UPDATE
router.put(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const existing = await prisma.masterVendor.findUnique({ where: { id } });

		if (!existing) {
			return res.status(404).json({ message: 'Master Vendor tidak ditemukan.' });
		}

		verifyOwnership(req, existing);

		const { siteId: _ignored, ...bodyWithoutSiteId } = req.body;
		const data = await validatePayload(bodyWithoutSiteId, id);

		const item = await prisma.masterVendor.update({
			where: { id },
			data,
		});

		return res.json(item);
	}),
);

// DELETE
router.delete(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const existing = await prisma.masterVendor.findUnique({ where: { id } });

		if (!existing) {
			return res.status(404).json({ message: 'Master Vendor tidak ditemukan.' });
		}

		verifyOwnership(req, existing);

		await prisma.masterVendor.delete({ where: { id } });

		return res.status(204).send();
	}),
);

// IMPORT
router.post(
	'/import',
	upload.single('file'),
	withAsync(async (req, res) => {
		if (!req.file) {
			return res.status(400).json({ message: 'File Excel wajib dipilih.' });
		}

		const siteId = await resolveSiteId(req);

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
			const raw = {};

			headerMap.forEach((columnNumber, header) => {
				const cellValue = row.getCell(columnNumber).value;
				raw[header] = typeof cellValue === 'object' && cellValue?.text ? cellValue.text : cellValue;
			});

			const isEmpty = IMPORT_HEADERS.every((header) => !normalizeString(raw[header] || ''));

			if (isEmpty) {
				continue;
			}

			// Skip instruction row
			if (normalizeString(raw['Nama Vendor'] || '') === 'Contoh: PT. BSP') {
				continue;
			}

			try {
				const body = {
					vendorName: raw['Nama Vendor'],
					vendorType: raw['Jenis Vendor'],
					address: raw.Alamat,
					picName: raw['Nama PIC'],
					phoneNumber: raw['Nomor Telepon'],
					email: raw.Email,
					detailLainnya: raw['Detail Lainnya'],
				};
				const data = await validatePayload(body);
				const item = await prisma.masterVendor.create({ data: { ...data, siteId } });

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
			const fileName = await createErrorReport(errorRows);

			return res.json({
				message:
					importedRows.length > 0
						? 'Import selesai sebagian. Beberapa baris gagal diproses.'
						: 'Import gagal. Periksa file hasil error.',
				importedCount: importedRows.length,
				failedCount: errorRows.length,
				rows: importedRows,
				errorReportUrl: `/master/master-vendors/import-errors/${fileName}`,
			});
		}

		return res.json({
			message: 'Import Master Vendor berhasil.',
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
	'/template',
	withAsync(async (_req, res) => {
		const workbook = new ExcelJS.Workbook();
		const dataSheet = workbook.addWorksheet('Data Import');
		const constantsSheet = workbook.addWorksheet('Constants');
		constantsSheet.state = 'hidden';

		dataSheet.addRow(IMPORT_HEADERS);
		const headerRow = dataSheet.getRow(1);
		headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
		headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } };
		headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
		dataSheet.columns = IMPORT_HEADERS.map(() => ({ width: 30 }));

		// Add vendor type dropdown
		const vendorTypeOptions = [...VENDOR_TYPE_OPTIONS, 'Lainnya'];
		vendorTypeOptions.forEach((option, index) => {
			constantsSheet.getCell(index + 1, 1).value = option;
		});

		const constantsColLetter = constantsSheet.getColumn(1).letter;
		const range = `$${constantsColLetter}$1:$${constantsColLetter}$${vendorTypeOptions.length}`;

		for (let i = 2; i <= 501; i += 1) {
			dataSheet.getCell(`B${i}`).dataValidation = {
				type: 'list',
				allowBlank: true,
				formulae: [`Constants!${range}`],
				showErrorMessage: false,
				errorTitle: 'Input Tidak Valid',
				error: 'Silakan pilih salah satu opsi yang tersedia untuk Jenis Vendor.',
			};
		}

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', 'attachment; filename=master-vendors-import-template.xlsx');

		await workbook.xlsx.write(res);
		res.end();
	}),
);

async function createErrorReport(rows) {
	await fs.mkdir(ERROR_REPORT_DIR, { recursive: true });

	const workbook = new ExcelJS.Workbook();
	const worksheet = workbook.addWorksheet('Import Errors');
	worksheet.addRow([...IMPORT_HEADERS, 'Error Message']);

	rows.forEach((row) => {
		worksheet.addRow([
			row.raw['Nama Vendor'] || '',
			row.raw['Jenis Vendor'] || '',
			row.raw.Alamat || '',
			row.raw['Nama PIC'] || '',
			row.raw['Nomor Telepon'] || '',
			row.raw.Email || '',
			row.raw['Detail Lainnya'] || '',
			row.error,
		]);
	});

	const headerRow = worksheet.getRow(1);
	headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB71C1C' } };
	worksheet.columns.forEach((column) => {
		column.width = 28;
	});

	const fileName = `master-vendor-import-errors-${randomUUID()}.xlsx`;
	const filePath = path.join(ERROR_REPORT_DIR, fileName);
	await workbook.xlsx.writeFile(filePath);

	return fileName;
}

export default router;
