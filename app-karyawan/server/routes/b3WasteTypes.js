import { Router } from 'express';
import * as yup from 'yup';

import prisma from '../lib/prisma.js';
import requireSiteIsolation from '../middleware/requireSiteIsolation.js';

const router = Router();

router.use(requireSiteIsolation({ modelType: 'per-site' }));

function getSiteId(req) {
	if (req.isSuperAdmin) {
		const querySiteId = parseInt(req.query.siteId);
		return isNaN(querySiteId) ? null : querySiteId;
	}
	return req.admin?.siteId || null;
}

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

const createSchema = yup.object().shape({
	kode: yup.string().trim().required('Kode limbah wajib diisi').max(20, 'Kode limbah maksimal 20 karakter'),
	nama: yup.string().trim().required('Jenis limbah B3 wajib diisi').max(200, 'Jenis limbah B3 maksimal 200 karakter'),
});

const updateSchema = yup.object().shape({
	nama: yup.string().trim().required('Jenis limbah B3 wajib diisi').max(200, 'Jenis limbah B3 maksimal 200 karakter'),
});

// GET / — daftar jenis limbah B3 dengan pagination
router.get(
	'/',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);
		const page = parseInt(req.query.page) || 0;
		const pageSize = parseInt(req.query.pageSize) || 25;

		const [data, total] = await Promise.all([
			prisma.b3WasteType.findMany({
				where: { siteId },
				skip: page * pageSize,
				take: pageSize,
				orderBy: { createdAt: 'desc' },
			}),
			prisma.b3WasteType.count({ where: { siteId } }),
		]);

		res.json({ data, total, page, pageSize });
	}),
);

// POST / — tambah jenis limbah baru
router.post(
	'/',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);

		let body;
		try {
			body = await createSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
		} catch (err) {
			return res.status(400).json({ message: err.errors?.[0] || 'Data tidak valid' });
		}

		try {
			const record = await prisma.b3WasteType.create({
				data: {
					siteId,
					kode: body.kode,
					nama: body.nama,
				},
			});

			res.status(201).json(record);
		} catch (err) {
			if (err.code === 'P2002') {
				return res.status(409).json({ message: 'Kode limbah sudah terdaftar' });
			}
			throw err;
		}
	}),
);

// PUT /:id — edit jenis limbah (kode immutable)
router.put(
	'/:id',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);
		const id = parseInt(req.params.id);

		if (isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid' });
		}

		const existing = await prisma.b3WasteType.findFirst({
			where: { id, siteId },
		});

		if (!existing) {
			return res.status(404).json({ message: 'Data tidak ditemukan' });
		}

		let body;
		try {
			body = await updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
		} catch (err) {
			return res.status(400).json({ message: err.errors?.[0] || 'Data tidak valid' });
		}

		try {
			const updated = await prisma.b3WasteType.update({
				where: { id },
				data: {
					nama: body.nama,
				},
			});

			res.json(updated);
		} catch (err) {
			if (err.code === 'P2002') {
				return res.status(409).json({ message: 'Kode limbah sudah terdaftar' });
			}
			throw err;
		}
	}),
);

// DELETE /:id — hapus jenis limbah (tolak jika masih digunakan)
router.delete(
	'/:id',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);
		const id = parseInt(req.params.id);

		if (isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid' });
		}

		const existing = await prisma.b3WasteType.findFirst({
			where: { id, siteId },
		});

		if (!existing) {
			return res.status(404).json({ message: 'Data tidak ditemukan' });
		}

		// Pre-check: apakah masih digunakan oleh B3WasteRecord
		const usageCount = await prisma.b3WasteRecord.count({
			where: { jenisLimbahId: id },
		});

		if (usageCount > 0) {
			return res.status(409).json({ message: 'Data tidak dapat dihapus karena masih digunakan' });
		}

		await prisma.b3WasteType.delete({ where: { id } });

		res.status(204).send();
	}),
);

export default router;
