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

function mapLicenseCertification(record) {
	return {
		id: record.id,
		employeeId: record.employeeId,
		employeeName: record.employee.fullName,
		employeeNo: record.employee.employeeNo,
		masterDokKaryawanId: record.masterDokKaryawanId,
		documentName: record.masterDokKaryawan.documentName,
		documentType: record.masterDokKaryawan.documentType,
		type: record.type,
		documentNumber: record.documentNumber,
		issuer: record.issuerSnapshot,
		expiryDate: formatDateForClient(record.expiryDate),
		status: getStatusLabel(record.expiryDate),
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

async function getMasterDocumentOrThrow(id) {
	const document = await prisma.masterDokKaryawan.findUnique({
		where: { id },
	});

	if (!document) {
		throw Object.assign(new Error('Dokumen tidak ditemukan.'), { statusCode: 400 });
	}

	return document;
}

async function getLicenseCertificationOrThrow(id) {
	const record = await prisma.employeeLicenseCertification.findUnique({
		where: { id },
		include: {
			employee: true,
			masterDokKaryawan: true,
		},
	});

	if (!record) {
		throw Object.assign(new Error('Data lisensi & sertifikasi tidak ditemukan.'), { statusCode: 404 });
	}

	return record;
}

async function validatePayload(payload = {}) {
	const employeeId = Number(payload.employeeId);
	const masterDokKaryawanId = Number(payload.masterDokKaryawanId);
	const type = normalizeString(payload.type);
	const documentNumber = normalizeString(payload.documentNumber);
	const expiryDate = toDateOnly(payload.expiryDate);
	const notes = normalizeMultilineString(payload.notes);

	if (!Number.isInteger(employeeId)) {
		throw Object.assign(new Error('Nama wajib dipilih.'), { statusCode: 400 });
	}

	if (!Number.isInteger(masterDokKaryawanId)) {
		throw Object.assign(new Error('Dokumen wajib dipilih.'), { statusCode: 400 });
	}

	if (!type) {
		throw Object.assign(new Error('Type wajib diisi.'), { statusCode: 400 });
	}

	if (!documentNumber) {
		throw Object.assign(new Error('No. Dokumen wajib diisi.'), { statusCode: 400 });
	}

	if (!expiryDate) {
		throw Object.assign(new Error('Masa Berlaku wajib diisi.'), { statusCode: 400 });
	}

	const [employee, document] = await Promise.all([
		getEmployeeOrThrow(employeeId),
		getMasterDocumentOrThrow(masterDokKaryawanId),
	]);

	return {
		employeeId: employee.id,
		masterDokKaryawanId: document.id,
		type,
		documentNumber,
		issuerSnapshot: document.issuer,
		expiryDate,
		notes: notes || null,
	};
}

router.get(
	'/',
	withAsync(async (_req, res) => {
		const records = await prisma.employeeLicenseCertification.findMany({
			include: {
				employee: true,
				masterDokKaryawan: true,
			},
			orderBy: { id: 'desc' },
		});

		return res.json(records.map(mapLicenseCertification));
	}),
);

router.get(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const record = await getLicenseCertificationOrThrow(id);
		return res.json(mapLicenseCertification(record));
	}),
);

router.post(
	'/',
	withAsync(async (req, res) => {
		const data = await validatePayload(req.body);
		const record = await prisma.employeeLicenseCertification.create({
			data,
			include: {
				employee: true,
				masterDokKaryawan: true,
			},
		});

		return res.status(201).json(mapLicenseCertification(record));
	}),
);

router.put(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		await getLicenseCertificationOrThrow(id);

		const data = await validatePayload(req.body);
		const record = await prisma.employeeLicenseCertification.update({
			where: { id },
			data,
			include: {
				employee: true,
				masterDokKaryawan: true,
			},
		});

		return res.json(mapLicenseCertification(record));
	}),
);

router.delete(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		await getLicenseCertificationOrThrow(id);
		await prisma.employeeLicenseCertification.delete({
			where: { id },
		});

		return res.status(204).send();
	}),
);

export default router;
