import { Router } from 'express';
import * as yup from 'yup';

import prisma from '../lib/prisma.js';
import requireSuperAdmin from '../middleware/requireSuperAdmin.js';

const router = Router();

const siteNameSchema = yup.object({
	name: yup
		.string()
		.trim()
		.min(1, 'Nama site wajib diisi.')
		.max(100, 'Nama site maksimal 100 karakter.')
		.required('Nama site wajib diisi.'),
});

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

// Apply requireSuperAdmin guard to all endpoints
router.use(requireSuperAdmin);

// GET /api/master/sites — return all sites with admin count and employee count
router.get(
	'/',
	withAsync(async (req, res) => {
		const sites = await prisma.masterSite.findMany({
			orderBy: { id: 'asc' },
			include: {
				_count: {
					select: {
						admins: true,
						employees: true,
					},
				},
			},
		});

		return res.json(sites);
	}),
);

// POST /api/master/sites — validate name, create MasterSite record
router.post(
	'/',
	withAsync(async (req, res) => {
		let validated;
		try {
			validated = await siteNameSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
		} catch (err) {
			return res.status(400).json({ message: err.errors?.[0] || 'Nama site wajib diisi.' });
		}

		try {
			const site = await prisma.masterSite.create({
				data: { name: validated.name },
			});

			return res.status(201).json(site);
		} catch (err) {
			if (err.code === 'P2002') {
				return res.status(409).json({ message: 'Nama site sudah digunakan.' });
			}
			throw err;
		}
	}),
);

// PUT /api/master/sites/:id — validate name, update site record
router.put(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(404).json({ message: 'Site tidak ditemukan.' });
		}

		const existing = await prisma.masterSite.findUnique({ where: { id } });

		if (!existing) {
			return res.status(404).json({ message: 'Site tidak ditemukan.' });
		}

		let validated;
		try {
			validated = await siteNameSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
		} catch (err) {
			return res.status(400).json({ message: err.errors?.[0] || 'Nama site wajib diisi.' });
		}

		try {
			const site = await prisma.masterSite.update({
				where: { id },
				data: { name: validated.name },
			});

			return res.json(site);
		} catch (err) {
			if (err.code === 'P2002') {
				return res.status(409).json({ message: 'Nama site sudah digunakan.' });
			}
			throw err;
		}
	}),
);

// DELETE /api/master/sites/:id — delete if no references; return 409 if referenced, 404 if not found
router.delete(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(404).json({ message: 'Site tidak ditemukan.' });
		}

		const existing = await prisma.masterSite.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						employees: true,
						admins: true,
						groupShifts: true,
						units: true,
						vendors: true,
						trainings: true,
					},
				},
			},
		});

		if (!existing) {
			return res.status(404).json({ message: 'Site tidak ditemukan.' });
		}

		const { _count } = existing;
		const hasReferences =
			_count.employees > 0 ||
			_count.admins > 0 ||
			_count.groupShifts > 0 ||
			_count.units > 0 ||
			_count.vendors > 0 ||
			_count.trainings > 0;

		if (hasReferences) {
			return res.status(409).json({ message: 'Site tidak dapat dihapus karena masih memiliki data terkait.' });
		}

		await prisma.masterSite.delete({ where: { id } });

		return res.status(204).send();
	}),
);

export default router;
