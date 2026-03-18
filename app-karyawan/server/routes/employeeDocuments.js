import { Router } from 'express';

import prisma from '../lib/prisma.js';

const router = Router();

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

function normalizeString(value = '') {
	return String(value).trim().replace(/\s+/g, ' ');
}

function mapDocument(record) {
	return {
		id: record.id,
		documentName: record.documentName,
		documentType: record.documentType,
		issuer: record.issuer,
	};
}

function buildPayload(body = {}) {
	const documentName = normalizeString(body.documentName);
	const documentType = normalizeString(body.documentType);
	const issuer = normalizeString(body.issuer);

	if (!documentName) {
		throw Object.assign(new Error('Nama Dokumen wajib diisi.'), { statusCode: 400 });
	}

	if (!documentType) {
		throw Object.assign(new Error('Jenis Dokumen wajib diisi.'), { statusCode: 400 });
	}

	if (!issuer) {
		throw Object.assign(new Error('Penerbit wajib diisi.'), { statusCode: 400 });
	}

	return {
		documentName,
		documentType,
		issuer,
	};
}

router.get(
	'/',
	withAsync(async (req, res) => {
		const records = await prisma.masterDokKaryawan.findMany({
			orderBy: { id: 'asc' },
		});

		return res.json(records.map(mapDocument));
	}),
);

router.post(
	'/',
	withAsync(async (req, res) => {
		const data = buildPayload(req.body);
		const record = await prisma.masterDokKaryawan.create({
			data,
		});

		return res.status(201).json(mapDocument(record));
	}),
);

router.put(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const existing = await prisma.masterDokKaryawan.findUnique({
			where: { id },
		});

		if (!existing) {
			return res.status(404).json({ message: 'Master Dok Karyawan tidak ditemukan.' });
		}

		const data = buildPayload(req.body);
		const record = await prisma.masterDokKaryawan.update({
			where: { id },
			data,
		});

		return res.json(mapDocument(record));
	}),
);

router.delete(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const existing = await prisma.masterDokKaryawan.findUnique({
			where: { id },
		});

		if (!existing) {
			return res.status(404).json({ message: 'Master Dok Karyawan tidak ditemukan.' });
		}

		await prisma.masterDokKaryawan.delete({
			where: { id },
		});

		return res.status(204).send();
	}),
);

export default router;
