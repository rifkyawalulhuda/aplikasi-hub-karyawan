import { Router } from 'express';

// eslint-disable-next-line import/extensions
import prisma from '../lib/prisma.js';

const router = Router();

function requireSuperAdmin(req, res, next) {
	if (req.admin.role !== 'super_admin') {
		return res.status(403).json({
			message: 'Akses ditolak. Hanya Super Admin yang dapat mengelola konfigurasi approval.',
		});
	}
	return next();
}

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

/**
 * Validate approvalRank: must be null/undefined or a positive integer (>= 1).
 * Returns true if valid, false otherwise.
 */
function isValidApprovalRank(value) {
	if (value === null || value === undefined || value === '') return true;
	const num = Number(value);
	return Number.isInteger(num) && num >= 1;
}

/**
 * Validate maxApprovalRank: must be a positive integer (>= 1).
 * Returns true if valid, false otherwise.
 */
function isValidMaxApprovalRank(value) {
	if (value === null || value === undefined || value === '') return false;
	const num = Number(value);
	return Number.isInteger(num) && num >= 1;
}

router.use(requireSuperAdmin);

// GET / — list configs for a site (query param siteId), include associated JobLevel name
router.get(
	'/',
	withAsync(async (req, res) => {
		const { siteId } = req.query;

		const where = {};
		if (siteId) {
			where.siteId = Number(siteId);
		}

		const configs = await prisma.siteApprovalConfig.findMany({
			where,
			include: {
				jobLevel: { select: { id: true, name: true } },
			},
			orderBy: { approvalRank: 'asc' },
		});

		return res.json(configs);
	}),
);

// PUT /bulk — replace all configs for a site (transactional)
// MUST be defined BEFORE PUT /:id to avoid route conflicts
router.put(
	'/bulk',
	withAsync(async (req, res) => {
		const { siteId, entries } = req.body;

		// Validate siteId exists
		const site = await prisma.masterSite.findUnique({ where: { id: Number(siteId) } });
		if (!site) {
			return res.status(400).json({ message: 'Site tidak ditemukan.' });
		}

		// Check for duplicate jobLevelId values in entries
		if (Array.isArray(entries) && entries.length > 0) {
			const jobLevelIds = entries.map((e) => e.jobLevelId);
			const uniqueIds = new Set(jobLevelIds);
			if (uniqueIds.size !== jobLevelIds.length) {
				return res.status(400).json({ message: 'Terdapat duplikasi Job Level dalam konfigurasi.' });
			}
		}

		// Validate each entry's approvalRank and maxApprovalRank
		if (Array.isArray(entries)) {
			for (let i = 0; i < entries.length; i += 1) {
				const entry = entries[i];
				if (!isValidApprovalRank(entry.approvalRank)) {
					return res.status(400).json({
						message: 'approvalRank harus berupa bilangan bulat positif atau kosong.',
					});
				}
				if (!isValidMaxApprovalRank(entry.maxApprovalRank)) {
					return res.status(400).json({
						message: 'maxApprovalRank harus berupa bilangan bulat positif.',
					});
				}
			}
		}

		// Execute within a transaction: delete existing, create new
		const result = await prisma.$transaction(async (tx) => {
			await tx.siteApprovalConfig.deleteMany({
				where: { siteId: Number(siteId) },
			});

			if (Array.isArray(entries) && entries.length > 0) {
				await tx.siteApprovalConfig.createMany({
					data: entries.map((entry) => ({
						siteId: Number(siteId),
						jobLevelId: Number(entry.jobLevelId),
						approvalRank:
							entry.approvalRank === null || entry.approvalRank === undefined || entry.approvalRank === ''
								? null
								: Number(entry.approvalRank),
						maxApprovalRank: Number(entry.maxApprovalRank),
					})),
				});
			}

			// Return the complete list of new configs for the site
			return tx.siteApprovalConfig.findMany({
				where: { siteId: Number(siteId) },
				include: {
					jobLevel: { select: { id: true, name: true } },
				},
				orderBy: { approvalRank: 'asc' },
			});
		});

		return res.json(result);
	}),
);

// GET /:id — get single config with associated JobLevel and MasterSite names
router.get(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(404).json({ message: 'Konfigurasi approval tidak ditemukan.' });
		}

		const config = await prisma.siteApprovalConfig.findUnique({
			where: { id },
			include: {
				jobLevel: { select: { id: true, name: true } },
				site: { select: { id: true, name: true } },
			},
		});

		if (!config) {
			return res.status(404).json({ message: 'Konfigurasi approval tidak ditemukan.' });
		}

		return res.json(config);
	}),
);

// POST / — create single config
router.post(
	'/',
	withAsync(async (req, res) => {
		const { siteId, jobLevelId, approvalRank, maxApprovalRank } = req.body;

		// Validate approvalRank
		if (!isValidApprovalRank(approvalRank)) {
			return res.status(400).json({
				message: 'approvalRank harus berupa bilangan bulat positif atau kosong.',
			});
		}

		// Validate maxApprovalRank
		if (!isValidMaxApprovalRank(maxApprovalRank)) {
			return res.status(400).json({
				message: 'maxApprovalRank harus berupa bilangan bulat positif.',
			});
		}

		// Validate siteId exists
		const site = await prisma.masterSite.findUnique({ where: { id: Number(siteId) } });
		if (!site) {
			return res.status(400).json({ message: 'Site tidak ditemukan.' });
		}

		// Validate jobLevelId exists
		const jobLevel = await prisma.jobLevel.findUnique({ where: { id: Number(jobLevelId) } });
		if (!jobLevel) {
			return res.status(400).json({ message: 'Job Level tidak ditemukan.' });
		}

		// Check unique constraint on siteId + jobLevelId
		const existing = await prisma.siteApprovalConfig.findUnique({
			where: { siteId_jobLevelId: { siteId: Number(siteId), jobLevelId: Number(jobLevelId) } },
		});
		if (existing) {
			return res.status(409).json({
				message: 'Konfigurasi approval untuk site dan job level ini sudah ada.',
			});
		}

		// Create the record
		const config = await prisma.siteApprovalConfig.create({
			data: {
				siteId: Number(siteId),
				jobLevelId: Number(jobLevelId),
				approvalRank:
					approvalRank === null || approvalRank === undefined || approvalRank === ''
						? null
						: Number(approvalRank),
				maxApprovalRank: Number(maxApprovalRank),
			},
			include: {
				jobLevel: { select: { id: true, name: true } },
				site: { select: { id: true, name: true } },
			},
		});

		return res.status(201).json(config);
	}),
);

// PUT /:id — update single config
router.put(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(404).json({ message: 'Konfigurasi approval tidak ditemukan.' });
		}

		const { approvalRank, maxApprovalRank } = req.body;

		// Validate approvalRank
		if (!isValidApprovalRank(approvalRank)) {
			return res.status(400).json({
				message: 'approvalRank harus berupa bilangan bulat positif atau kosong.',
			});
		}

		// Validate maxApprovalRank
		if (!isValidMaxApprovalRank(maxApprovalRank)) {
			return res.status(400).json({
				message: 'maxApprovalRank harus berupa bilangan bulat positif.',
			});
		}

		// Check record exists
		const existing = await prisma.siteApprovalConfig.findUnique({ where: { id } });
		if (!existing) {
			return res.status(404).json({ message: 'Konfigurasi approval tidak ditemukan.' });
		}

		// Update the record
		const config = await prisma.siteApprovalConfig.update({
			where: { id },
			data: {
				approvalRank:
					approvalRank === null || approvalRank === undefined || approvalRank === ''
						? null
						: Number(approvalRank),
				maxApprovalRank: Number(maxApprovalRank),
			},
			include: {
				jobLevel: { select: { id: true, name: true } },
				site: { select: { id: true, name: true } },
			},
		});

		return res.json(config);
	}),
);

// DELETE /:id — delete single config
router.delete(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(404).json({ message: 'Konfigurasi approval tidak ditemukan.' });
		}

		const existing = await prisma.siteApprovalConfig.findUnique({ where: { id } });
		if (!existing) {
			return res.status(404).json({ message: 'Konfigurasi approval tidak ditemukan.' });
		}

		await prisma.siteApprovalConfig.delete({ where: { id } });

		return res.status(200).json({ message: 'Konfigurasi approval berhasil dihapus.' });
	}),
);

export default router;
