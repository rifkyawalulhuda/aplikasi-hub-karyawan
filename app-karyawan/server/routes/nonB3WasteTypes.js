import { Router } from 'express';
import * as yup from 'yup';

import prisma from '../lib/prisma.js';
import requireSiteIsolation from '../middleware/requireSiteIsolation.js';
import { parsePage, parsePageSize } from '../lib/pagination.js';

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
	nama: yup
		.string()
		.trim()
		.required('Jenis limbah non-B3 wajib diisi')
		.max(200, 'Jenis limbah non-B3 maksimal 200 karakter'),
});

const updateSchema = yup.object().shape({
	nama: yup
		.string()
		.trim()
		.required('Jenis limbah non-B3 wajib diisi')
		.max(200, 'Jenis limbah non-B3 maksimal 200 karakter'),
});

router.get(
	'/',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);
		const page = parsePage(req.query.page);
		const pageSize = parsePageSize(req.query.pageSize);

		const [data, total] = await Promise.all([
			prisma.nonB3WasteType.findMany({
				where: { siteId },
				skip: page * pageSize,
				take: pageSize,
				orderBy: { kode: 'asc' },
			}),
			prisma.nonB3WasteType.count({ where: { siteId } }),
		]);

		res.json({ data, total, page, pageSize });
	}),
);

router.post(
	'/',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);

		if (!siteId) {
			return res.status(403).json({ message: 'Akses ditolak. Site belum dipilih.' });
		}

		let body;
		try {
			body = await createSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
		} catch (err) {
			return res.status(400).json({ message: err.errors?.[0] || 'Data tidak valid' });
		}

		try {
			const record = await prisma.nonB3WasteType.create({
				data: { siteId, kode: body.kode, nama: body.nama },
			});

			return res.status(201).json(record);
		} catch (err) {
			if (err.code === 'P2002') {
				return res.status(409).json({ message: 'Kode limbah sudah terdaftar' });
			}
			throw err;
		}
	}),
);

router.put(
	'/:id',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);
		const id = parseInt(req.params.id);

		if (isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid' });
		}

		const existing = await prisma.nonB3WasteType.findFirst({ where: { id, siteId } });

		if (!existing) {
			return res.status(404).json({ message: 'Data tidak ditemukan' });
		}

		let body;
		try {
			body = await updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
		} catch (err) {
			return res.status(400).json({ message: err.errors?.[0] || 'Data tidak valid' });
		}

		const updated = await prisma.nonB3WasteType.update({ where: { id }, data: { nama: body.nama } });

		return res.json(updated);
	}),
);

router.delete(
	'/:id',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);
		const id = parseInt(req.params.id);

		if (isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid' });
		}

		const existing = await prisma.nonB3WasteType.findFirst({ where: { id, siteId } });

		if (!existing) {
			return res.status(404).json({ message: 'Data tidak ditemukan' });
		}

		const usageCount = await prisma.nonB3WasteRecord.count({ where: { jenisLimbahId: id } });

		if (usageCount > 0) {
			return res.status(409).json({ message: 'Data tidak dapat dihapus karena masih digunakan' });
		}

		await prisma.nonB3WasteType.delete({ where: { id } });

		return res.status(204).send();
	}),
);

export default router;
