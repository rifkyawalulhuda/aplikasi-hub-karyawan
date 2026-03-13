import { Router } from 'express';

import prisma from '../lib/prisma.js';
import MASTER_DATA_CONFIG from '../config/masterDataConfig.js';

const router = Router();

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

function getConfig(resource) {
	return MASTER_DATA_CONFIG[resource];
}

function getDelegate(model) {
	return prisma[model];
}

function normalizeName(name = '') {
	return name.trim().replace(/\s+/g, ' ');
}

router.get(
	'/:resource',
	withAsync(async (req, res) => {
	const config = getConfig(req.params.resource);

	if (!config) {
		return res.status(404).json({ message: 'Master data resource not found.' });
	}

	const items = await getDelegate(config.model).findMany({
		orderBy: {
			id: 'asc',
		},
	});

	return res.json(items);
	}),
);

router.post(
	'/:resource',
	withAsync(async (req, res) => {
	const config = getConfig(req.params.resource);

	if (!config) {
		return res.status(404).json({ message: 'Master data resource not found.' });
	}

	const name = normalizeName(req.body?.name);

	if (!name) {
		return res.status(400).json({ message: `${config.label} wajib diisi.` });
	}

	const duplicate = await getDelegate(config.model).findFirst({
		where: {
			name: {
				equals: name,
				mode: 'insensitive',
			},
		},
	});

	if (duplicate) {
		return res.status(409).json({ message: `${config.label} sudah ada.` });
	}

	const item = await getDelegate(config.model).create({
		data: {
			name,
		},
	});

	return res.status(201).json(item);
	}),
);

router.put(
	'/:resource/:id',
	withAsync(async (req, res) => {
	const config = getConfig(req.params.resource);
	const id = Number(req.params.id);

	if (!config) {
		return res.status(404).json({ message: 'Master data resource not found.' });
	}

	if (Number.isNaN(id)) {
		return res.status(400).json({ message: 'ID tidak valid.' });
	}

	const name = normalizeName(req.body?.name);

	if (!name) {
		return res.status(400).json({ message: `${config.label} wajib diisi.` });
	}

	const existing = await getDelegate(config.model).findUnique({
		where: {
			id,
		},
	});

	if (!existing) {
		return res.status(404).json({ message: `${config.label} tidak ditemukan.` });
	}

	const duplicate = await getDelegate(config.model).findFirst({
		where: {
			name: {
				equals: name,
				mode: 'insensitive',
			},
			NOT: {
				id,
			},
		},
	});

	if (duplicate) {
		return res.status(409).json({ message: `${config.label} sudah ada.` });
	}

	const item = await getDelegate(config.model).update({
		where: {
			id,
		},
		data: {
			name,
		},
	});

	return res.json(item);
	}),
);

router.delete(
	'/:resource/:id',
	withAsync(async (req, res) => {
	const config = getConfig(req.params.resource);
	const id = Number(req.params.id);

	if (!config) {
		return res.status(404).json({ message: 'Master data resource not found.' });
	}

	if (Number.isNaN(id)) {
		return res.status(400).json({ message: 'ID tidak valid.' });
	}

	const existing = await getDelegate(config.model).findUnique({
		where: {
			id,
		},
	});

	if (!existing) {
		return res.status(404).json({ message: `${config.label} tidak ditemukan.` });
	}

	await getDelegate(config.model).delete({
		where: {
			id,
		},
	});

	return res.status(204).send();
	}),
);

export default router;
