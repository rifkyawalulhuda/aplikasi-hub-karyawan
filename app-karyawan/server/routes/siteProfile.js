import { Router } from 'express';

import prisma from '../lib/prisma.js';
import {
	getAdminSiteId,
	isSuperAdmin,
	parseQuerySiteId,
	resolveWriteSiteId,
} from '../lib/siteScope.js';
import requireSiteIsolation from '../middleware/requireSiteIsolation.js';

const router = Router();

router.use(requireSiteIsolation({ modelType: 'per-site' }));

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

function normalizeOptional(value, maxLength) {
	if (value == null) {
		return null;
	}

	const normalized = String(value).trim();
	if (!normalized) {
		return null;
	}

	return normalized.slice(0, maxLength);
}

function resolveReadSiteId(req) {
	if (isSuperAdmin(req)) {
		return parseQuerySiteId(req);
	}

	return getAdminSiteId(req);
}

function mapProfile(record) {
	if (!record) {
		return null;
	}

	return {
		id: record.id,
		siteId: record.siteId,
		companyName: record.companyName,
		businessField: record.businessField,
		address: record.address || '',
		phoneNumber: record.phoneNumber || '',
		responsibleName: record.responsibleName || '',
	};
}

// GET / — profil perusahaan untuk site aktif
router.get(
	'/',
	withAsync(async (req, res) => {
		const siteId = resolveReadSiteId(req);

		if (!siteId) {
			return res.status(403).json({ message: 'Akses ditolak. Site belum dipilih.' });
		}

		const profile = await prisma.siteProfile.findUnique({ where: { siteId } });
		return res.json(mapProfile(profile));
	}),
);

// PUT / — simpan profil perusahaan site aktif
router.put(
	'/',
	withAsync(async (req, res) => {
		const siteId = resolveWriteSiteId(req, req.body.siteId);

		const companyName = String(req.body.companyName || '').trim();
		const businessField = String(req.body.businessField || '').trim();

		if (!companyName) {
			return res.status(400).json({ message: 'Nama perusahaan wajib diisi.' });
		}
		if (!businessField) {
			return res.status(400).json({ message: 'Bidang usaha wajib diisi.' });
		}

		const data = {
			companyName: companyName.slice(0, 255),
			businessField: businessField.slice(0, 255),
			address: normalizeOptional(req.body.address, 1000),
			phoneNumber: normalizeOptional(req.body.phoneNumber, 100),
			responsibleName: normalizeOptional(req.body.responsibleName, 255),
		};

		const saved = await prisma.siteProfile.upsert({
			where: { siteId },
			create: { siteId, ...data },
			update: data,
		});

		return res.json(mapProfile(saved));
	}),
);

export default router;