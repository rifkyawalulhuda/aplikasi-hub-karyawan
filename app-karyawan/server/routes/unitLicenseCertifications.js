import { Router } from 'express';

import prisma from '../lib/prisma.js';

const router = Router();
const EXPIRING_SOON_DAYS = 25;

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

function getTodayComparableValue() {
	const today = new Date();
	return Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
}

function getComparableValue(value) {
	const parsed = toDateOnly(value);

	if (!parsed) {
		return null;
	}

	return Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}

function getStatusLabel(expiryDate) {
	const comparableExpiryDate = getComparableValue(expiryDate);

	if (!comparableExpiryDate) {
		return 'Expired';
	}

	const differenceInDays = Math.floor((comparableExpiryDate - getTodayComparableValue()) / (24 * 60 * 60 * 1000));

	if (differenceInDays < 0) {
		return 'Expired';
	}

	if (differenceInDays <= EXPIRING_SOON_DAYS) {
		return 'Akan Expired';
	}

	return 'Aktif';
}

function mapUnitCertification(record) {
	return {
		id: record.id,
		masterUnitId: record.masterUnitId,
		unitName: record.masterUnit.unitName,
		assetNo: record.assetNo,
		unitType: record.masterUnit.unitType,
		capacity: record.masterUnit.capacity,
		unitSerialNumber: record.masterUnit.unitSerialNumber,
		documentNumber: record.documentNumber,
		issuedBy: record.issuedBy,
		vendorId: record.vendorId,
		vendorName: record.vendor.vendorName,
		expiryDate: formatDateForClient(record.expiryDate),
		status: getStatusLabel(record.expiryDate),
		notes: record.notes || '',
	};
}

async function getMasterUnitOrThrow(id) {
	const unit = await prisma.masterUnit.findUnique({
		where: { id },
	});

	if (!unit) {
		throw Object.assign(new Error('Unit tidak ditemukan.'), { statusCode: 400 });
	}

	return unit;
}

async function getVendorOrThrow(id) {
	const vendor = await prisma.masterVendor.findUnique({
		where: { id },
	});

	if (!vendor) {
		throw Object.assign(new Error('Vendor tidak ditemukan.'), { statusCode: 400 });
	}

	return vendor;
}

async function getUnitCertificationOrThrow(id) {
	const record = await prisma.unitLicenseCertification.findUnique({
		where: { id },
		include: {
			masterUnit: true,
			vendor: true,
		},
	});

	if (!record) {
		throw Object.assign(new Error('Data lisensi & sertifikasi unit tidak ditemukan.'), { statusCode: 404 });
	}

	return record;
}

async function validatePayload(payload = {}) {
	const masterUnitId = Number(payload.masterUnitId);
	const vendorId = Number(payload.vendorId);
	const assetNo = normalizeString(payload.assetNo);
	const documentNumber = normalizeString(payload.documentNumber);
	const issuedBy = normalizeString(payload.issuedBy);
	const expiryDate = toDateOnly(payload.expiryDate);
	const notes = normalizeMultilineString(payload.notes);

	if (!Number.isInteger(masterUnitId)) {
		throw Object.assign(new Error('Nama Unit wajib dipilih.'), { statusCode: 400 });
	}

	if (!assetNo) {
		throw Object.assign(new Error('Asset No wajib diisi.'), { statusCode: 400 });
	}

	if (!documentNumber) {
		throw Object.assign(new Error('No. Dokumen wajib diisi.'), { statusCode: 400 });
	}

	if (!issuedBy) {
		throw Object.assign(new Error('Diterbitkan wajib diisi.'), { statusCode: 400 });
	}

	if (!Number.isInteger(vendorId)) {
		throw Object.assign(new Error('Vendor Pengurus wajib dipilih.'), { statusCode: 400 });
	}

	if (!expiryDate) {
		throw Object.assign(new Error('Masa Berlaku wajib diisi.'), { statusCode: 400 });
	}

	const [unit, vendor] = await Promise.all([getMasterUnitOrThrow(masterUnitId), getVendorOrThrow(vendorId)]);

	return {
		masterUnitId: unit.id,
		assetNo,
		documentNumber,
		issuedBy,
		vendorId: vendor.id,
		expiryDate,
		notes: notes || null,
	};
}

router.get(
	'/',
	withAsync(async (_req, res) => {
		const records = await prisma.unitLicenseCertification.findMany({
			include: {
				masterUnit: true,
				vendor: true,
			},
			orderBy: { id: 'desc' },
		});

		return res.json(records.map(mapUnitCertification));
	}),
);

router.get(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const record = await getUnitCertificationOrThrow(id);
		return res.json(mapUnitCertification(record));
	}),
);

router.post(
	'/',
	withAsync(async (req, res) => {
		const data = await validatePayload(req.body);
		const record = await prisma.unitLicenseCertification.create({
			data,
			include: {
				masterUnit: true,
				vendor: true,
			},
		});

		return res.status(201).json(mapUnitCertification(record));
	}),
);

router.put(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		await getUnitCertificationOrThrow(id);

		const data = await validatePayload(req.body);
		const record = await prisma.unitLicenseCertification.update({
			where: { id },
			data,
			include: {
				masterUnit: true,
				vendor: true,
			},
		});

		return res.json(mapUnitCertification(record));
	}),
);

router.delete(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		await getUnitCertificationOrThrow(id);
		await prisma.unitLicenseCertification.delete({
			where: { id },
		});

		return res.status(204).send();
	}),
);

export default router;
