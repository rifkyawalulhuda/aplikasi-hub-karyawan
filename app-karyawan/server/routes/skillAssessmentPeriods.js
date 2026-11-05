import { Router } from 'express';

import prisma from '../lib/prisma.js';
import requireSiteIsolation from '../middleware/requireSiteIsolation.js';
import requireSuperAdminWrite from '../middleware/requireSuperAdminWrite.js';

const router = Router();

router.use(requireSiteIsolation({ modelType: 'shared' }));

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

function normalizeString(value = '') {
	// `String(null)` yields the truthy string "null", which would silently store a
	// literal "null" instead of an absent value.
	if (value == null) {
		return '';
	}

	return String(value).trim().replace(/\s+/g, ' ');
}

function parseId(value) {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseDate(value) {
	if (!value) {
		return null;
	}

	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function serializePeriod(period) {
	return {
		id: period.id,
		name: period.name,
		startDate: period.startDate,
		endDate: period.endDate,
		isActive: period.isActive,
		notes: period.notes,
		assessmentCount: period._count?.assessments ?? undefined,
	};
}

async function getActivePeriod() {
	return prisma.skillAssessmentPeriod.findFirst({
		where: { isActive: true },
		orderBy: { startDate: 'desc' },
	});
}

router.get(
	'/',
	withAsync(async (_req, res) => {
		const periods = await prisma.skillAssessmentPeriod.findMany({
			orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
			include: { _count: { select: { assessments: true } } },
		});

		return res.json(periods.map(serializePeriod));
	}),
);

router.get(
	'/active',
	withAsync(async (_req, res) => {
		const period = await getActivePeriod();

		if (!period) {
			return res.status(404).json({ message: 'Belum ada periode asesmen yang aktif.' });
		}

		return res.json(serializePeriod(period));
	}),
);

router.post(
	'/',
	requireSuperAdminWrite,
	withAsync(async (req, res) => {
		const name = normalizeString(req.body?.name);
		const startDate = parseDate(req.body?.startDate);
		const endDate = parseDate(req.body?.endDate);
		const isActive = Boolean(req.body?.isActive);
		const notes = normalizeString(req.body?.notes) || null;

		if (!name) {
			return res.status(400).json({ message: 'Nama periode wajib diisi.' });
		}

		if (!startDate || !endDate) {
			return res.status(400).json({ message: 'Tanggal mulai dan selesai wajib diisi.' });
		}

		if (endDate < startDate) {
			return res.status(400).json({ message: 'Tanggal selesai tidak boleh sebelum tanggal mulai.' });
		}

		const existing = await prisma.skillAssessmentPeriod.findUnique({ where: { name } });

		if (existing) {
			return res.status(409).json({ message: 'Nama periode sudah dipakai.' });
		}

		const period = await prisma.$transaction(async (tx) => {
			if (isActive) {
				await tx.skillAssessmentPeriod.updateMany({
					where: { isActive: true },
					data: { isActive: false },
				});
			}

			return tx.skillAssessmentPeriod.create({
				data: { name, startDate, endDate, isActive, notes },
			});
		});

		return res.status(201).json(serializePeriod(period));
	}),
);

router.put(
	'/:id',
	requireSuperAdminWrite,
	withAsync(async (req, res) => {
		const id = parseId(req.params.id);

		if (!id) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const existing = await prisma.skillAssessmentPeriod.findUnique({ where: { id } });

		if (!existing) {
			return res.status(404).json({ message: 'Periode tidak ditemukan.' });
		}

		const name = req.body?.name == null ? existing.name : normalizeString(req.body.name);
		const startDate = req.body?.startDate == null ? existing.startDate : parseDate(req.body.startDate);
		const endDate = req.body?.endDate == null ? existing.endDate : parseDate(req.body.endDate);
		const isActive = req.body?.isActive == null ? existing.isActive : Boolean(req.body.isActive);
		const notes = req.body?.notes === undefined ? existing.notes : normalizeString(req.body.notes) || null;

		if (!name) {
			return res.status(400).json({ message: 'Nama periode wajib diisi.' });
		}

		if (!startDate || !endDate) {
			return res.status(400).json({ message: 'Tanggal mulai dan selesai wajib diisi.' });
		}

		if (endDate < startDate) {
			return res.status(400).json({ message: 'Tanggal selesai tidak boleh sebelum tanggal mulai.' });
		}

		if (name !== existing.name) {
			const duplicate = await prisma.skillAssessmentPeriod.findUnique({ where: { name } });

			if (duplicate) {
				return res.status(409).json({ message: 'Nama periode sudah dipakai.' });
			}
		}

		const period = await prisma.$transaction(async (tx) => {
			if (isActive && !existing.isActive) {
				await tx.skillAssessmentPeriod.updateMany({
					where: { isActive: true, NOT: { id } },
					data: { isActive: false },
				});
			}

			return tx.skillAssessmentPeriod.update({
				where: { id },
				data: { name, startDate, endDate, isActive, notes },
			});
		});

		return res.json(serializePeriod(period));
	}),
);

router.delete(
	'/:id',
	requireSuperAdminWrite,
	withAsync(async (req, res) => {
		const id = parseId(req.params.id);

		if (!id) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const period = await prisma.skillAssessmentPeriod.findUnique({
			where: { id },
			include: { _count: { select: { assessments: true } } },
		});

		if (!period) {
			return res.status(404).json({ message: 'Periode tidak ditemukan.' });
		}

		if (period._count.assessments > 0) {
			return res.status(409).json({
				message: `Periode tidak bisa dihapus karena menyimpan ${period._count.assessments} asesmen. Arsipkan dengan menonaktifkan periode.`,
			});
		}

		await prisma.skillAssessmentPeriod.delete({ where: { id } });

		return res.status(204).send();
	}),
);

export default router;
