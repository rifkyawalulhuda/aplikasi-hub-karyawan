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

function normalizeString(value = '') {
	return String(value).trim().replace(/\s+/g, ' ');
}

function normalizeMultilineString(value = '') {
	return String(value).replace(/\r\n/g, '\n').trim();
}

function getFields(config) {
	return config?.fields?.length
		? config.fields
		: [
				{
					name: 'name',
					label: config.label,
					required: true,
					unique: true,
				},
		  ];
}

function normalizeFieldValue(fieldConfig, value) {
	if (fieldConfig.type === 'multiline') {
		return normalizeMultilineString(value);
	}

	return normalizeString(value);
}

async function buildPayload(config, body = {}, currentId = null) {
	const delegate = getDelegate(config.model);
	const fields = getFields(config);
	const payload = {};

	for (const fieldConfig of fields) {
		const value = normalizeFieldValue(fieldConfig, body?.[fieldConfig.name]);

		if (fieldConfig.required && !value) {
			throw Object.assign(new Error(`${fieldConfig.label} wajib diisi.`), { statusCode: 400 });
		}

		if (fieldConfig.unique && value) {
			const duplicate = await delegate.findFirst({
				where: {
					[fieldConfig.name]: {
						equals: value,
						mode: 'insensitive',
					},
					...(currentId ? { NOT: { id: currentId } } : {}),
				},
			});

			if (duplicate) {
				throw Object.assign(new Error(`${fieldConfig.label} sudah ada.`), { statusCode: 409 });
			}
		}

		payload[fieldConfig.name] = value;
	}

	return payload;
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
	const data = await buildPayload(config, req.body);

	const item = await getDelegate(config.model).create({
		data,
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

	const existing = await getDelegate(config.model).findUnique({
		where: {
			id,
		},
	});

	if (!existing) {
		return res.status(404).json({ message: `${config.label} tidak ditemukan.` });
	}
	const data = await buildPayload(config, req.body, id);

	const item = await getDelegate(config.model).update({
		where: {
			id,
		},
		data,
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
