import { Router } from 'express';

import prisma from '../lib/prisma.js';
import { buildSiteWhere, resolveWriteSiteId, siteNotFound } from '../lib/siteScope.js';
import requireSiteIsolation from '../middleware/requireSiteIsolation.js';

const router = Router();

router.use(requireSiteIsolation({ modelType: 'per-site' }));

const SLIP_TYPES = ['ASLI', 'COPY', 'INISIAL', 'REVISI', 'LAINNYA'];
const DOCUMENT_CONFIDENTIALITY = ['RAHASIA', 'UMUM', 'LAINNYA'];
const GOODS_TYPES = ['ELEKTRONIK', 'MESIN', 'LAINNYA'];
const HANDLING_TYPES = ['JANGAN_DIBANTING', 'JANGAN_DITUMPUK', 'HINDARI_AIR', 'LAINNYA'];
const PURPOSES = ['INFORMASI', 'KUTIPAN', 'REKAMAN', 'LAPORAN', 'REFERENSI', 'TINJAUAN', 'PERSETUJUAN', 'LAINNYA'];
const CONFIRMATION_MODES = ['NO_RETURN', 'SIGN_AND_RETURN'];

const DEFAULT_SENDER_COMPANY = 'PT. Sankyu Indonesia International';
const DEFAULT_SENDER_ADDRESS =
	'Jl. Kawasan Industri Terpadu Indonesia China (KITIC) Kav No. 20, Nagasari, Kec. Serang Baru, Kabupaten Bekasi, Jawa Barat 17330, Indonesia';
const DEFAULT_CONFIRMATION_EMAIL = 'yadimulyadi@sankyu.co.id; rifki@sankyu.co.id';

const MIN_ITEM_ROWS = 5;

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

function badRequest(message) {
	return Object.assign(new Error(message), { statusCode: 400 });
}

function normalizeString(value = '') {
	return String(value).trim().replace(/\s+/g, ' ');
}

function normalizeMultilineString(value = '') {
	return String(value).replace(/\r\n/g, '\n').trim();
}

function normalizeOptional(value, maxLength = 255) {
	const normalized = normalizeString(value ?? '');
	if (!normalized) {
		return null;
	}
	return normalized.slice(0, maxLength);
}

function normalizeOptionalMultiline(value, maxLength = 2000) {
	const normalized = normalizeMultilineString(value ?? '');
	if (!normalized) {
		return null;
	}
	return normalized.slice(0, maxLength);
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

function normalizeOptionList(value, allowed, label) {
	if (value == null) {
		return [];
	}

	if (!Array.isArray(value)) {
		throw badRequest(`${label} tidak valid.`);
	}

	const normalized = [...new Set(value.map((item) => normalizeString(item).toUpperCase()).filter(Boolean))];
	const unknown = normalized.filter((item) => !allowed.includes(item));

	if (unknown.length > 0) {
		throw badRequest(`${label} berisi pilihan yang tidak dikenal: ${unknown.join(', ')}.`);
	}

	return normalized;
}

function normalizeSingleOption(value, allowed, label) {
	const normalized = normalizeString(value ?? '').toUpperCase();

	if (!normalized) {
		return null;
	}

	if (!allowed.includes(normalized)) {
		throw badRequest(`${label} tidak valid.`);
	}

	return normalized;
}

function requireOtherText(options, otherText, label) {
	if (options.includes('LAINNYA') && !otherText) {
		throw badRequest(`${label}: keterangan "Lain-lain" wajib diisi.`);
	}

	return options.includes('LAINNYA') ? otherText : null;
}

function normalizeItems(value) {
	if (value == null) {
		return [];
	}

	if (!Array.isArray(value)) {
		throw badRequest('Daftar barang/dokumen tidak valid.');
	}

	return value
		.map((item, index) => ({
			sortOrder: index,
			description: normalizeOptionalMultiline(item?.description, 1000),
			note: normalizeOptionalMultiline(item?.note, 1000),
		}))
		.filter((item) => item.description || item.note);
}

async function resolveSiteProfile(siteId) {
	const profile = await prisma.siteProfile.findUnique({ where: { siteId } });
	return {
		companyName: profile?.companyName || DEFAULT_SENDER_COMPANY,
		address: profile?.address || DEFAULT_SENDER_ADDRESS,
	};
}

async function resolveSenderEmployee(senderEmployeeId, siteId) {
	if (senderEmployeeId == null || senderEmployeeId === '') {
		return null;
	}

	const employeeId = Number(senderEmployeeId);

	if (!Number.isInteger(employeeId)) {
		throw badRequest('Pengirim tidak valid.');
	}

	const employee = await prisma.employee.findFirst({
		where: { id: employeeId, siteId },
		include: { jobLevel: true },
	});

	if (!employee) {
		throw badRequest('Karyawan pengirim tidak ditemukan pada site ini.');
	}

	return employee;
}

async function validatePayload(payload, siteId, currentId = null) {
	const slipNumber = normalizeString(payload.slipNumber ?? '').slice(0, 100);
	const slipDate = toDateOnly(payload.slipDate);
	const recipientName = normalizeOptional(payload.recipientName, 255);
	const senderNameInput = normalizeOptional(payload.senderName, 255);
	const receiverName = normalizeOptional(payload.receiverName, 255);
	const receiverPosition = normalizeOptional(payload.receiverPosition, 255);
	const receiverDate = toDateOnly(payload.receiverDate);
	const senderDate = toDateOnly(payload.senderDate);

	if (!slipNumber) {
		throw badRequest('Nomor lembar pengiriman wajib diisi.');
	}

	if (!slipDate) {
		throw badRequest('Tanggal lembar pengiriman wajib diisi.');
	}

	if (!recipientName) {
		throw badRequest('Tujuan pengiriman (Untuk) wajib diisi.');
	}

	const duplicate = await prisma.deliverySlip.findFirst({
		where: {
			siteId,
			slipNumber,
			...(currentId ? { id: { not: currentId } } : {}),
		},
		select: { id: true },
	});

	if (duplicate) {
		throw Object.assign(new Error(`Nomor lembar "${slipNumber}" sudah dipakai pada site ini.`), {
			statusCode: 409,
		});
	}

	const senderEmployee = await resolveSenderEmployee(payload.senderEmployeeId, siteId);
	const siteProfile = await resolveSiteProfile(siteId);

	const senderName = senderEmployee ? senderEmployee.fullName : senderNameInput;

	if (!senderName) {
		throw badRequest('Pengirim wajib dipilih.');
	}

	const senderPosition = senderEmployee
		? normalizeOptional(senderEmployee.jobLevel?.name, 255)
		: normalizeOptional(payload.senderPosition, 255);

	const slipTypes = normalizeOptionList(payload.slipTypes, SLIP_TYPES, 'Jenis lembar pengiriman');
	const documentConfidentiality = normalizeSingleOption(
		payload.documentConfidentiality,
		DOCUMENT_CONFIDENTIALITY,
		'Jenis dokumen',
	);
	const goodsTypes = normalizeOptionList(payload.goodsTypes, GOODS_TYPES, 'Jenis barang');
	const handlingTypes = normalizeOptionList(payload.handlingTypes, HANDLING_TYPES, 'Informasi penanganan');
	const purposes = normalizeOptionList(payload.purposes, PURPOSES, 'Dikirimkan untuk');
	const confirmationMode = normalizeSingleOption(
		payload.confirmationMode,
		CONFIRMATION_MODES,
		'Konfirmasi pengiriman',
	);

	const documentConfidentialityOther = normalizeOptional(payload.documentConfidentialityOther, 255);

	if (documentConfidentiality === 'LAINNYA' && !documentConfidentialityOther) {
		throw badRequest('Jenis dokumen: keterangan "Lain-lain" wajib diisi.');
	}

	return {
		data: {
			slipNumber,
			slipDate,
			recipientName,
			recipientAddress: normalizeOptionalMultiline(payload.recipientAddress, 1000),
			recipientAttention: normalizeOptional(payload.recipientAttention, 255),
			recipientPosition: normalizeOptional(payload.recipientPosition, 255),
			senderCompany: normalizeOptional(payload.senderCompany, 255) || siteProfile.companyName,
			senderName,
			senderPosition,
			senderAddress: normalizeOptionalMultiline(payload.senderAddress, 1000) || siteProfile.address,
			senderEmployeeId: senderEmployee ? senderEmployee.id : null,
			slipTypes,
			slipTypeOther: requireOtherText(
				slipTypes,
				normalizeOptional(payload.slipTypeOther, 255),
				'Jenis lembar pengiriman',
			),
			documentConfidentiality,
			documentConfidentialityOther: documentConfidentiality === 'LAINNYA' ? documentConfidentialityOther : null,
			goodsTypes,
			goodsTypeOther: requireOtherText(
				goodsTypes,
				normalizeOptional(payload.goodsTypeOther, 255),
				'Jenis barang',
			),
			handlingTypes,
			handlingTypeOther: requireOtherText(
				handlingTypes,
				normalizeOptional(payload.handlingTypeOther, 255),
				'Informasi penanganan',
			),
			purposes,
			purposeOther: requireOtherText(purposes, normalizeOptional(payload.purposeOther, 255), 'Dikirimkan untuk'),
			confirmationMode,
			confirmationEmail: normalizeOptionalMultiline(payload.confirmationEmail, 500) || DEFAULT_CONFIRMATION_EMAIL,
			returnAddress: normalizeOptionalMultiline(payload.returnAddress, 1000) || DEFAULT_SENDER_ADDRESS,
			senderDate,
			receiverName,
			receiverPosition,
			receiverDate,
		},
		items: normalizeItems(payload.items),
	};
}

function mapSlip(record) {
	const items = [...(record.items || [])].sort((a, b) => a.sortOrder - b.sortOrder);
	const mappedItems = items.map((item, index) => ({
		id: item.id,
		sortOrder: item.sortOrder,
		number: index + 1,
		description: item.description || '',
		note: item.note || '',
	}));

	while (mappedItems.length < MIN_ITEM_ROWS) {
		mappedItems.push({
			id: null,
			sortOrder: mappedItems.length,
			number: mappedItems.length + 1,
			description: '',
			note: '',
		});
	}

	return {
		id: record.id,
		siteId: record.siteId,
		slipNumber: record.slipNumber,
		slipDate: formatDateForClient(record.slipDate),
		recipientName: record.recipientName,
		recipientAddress: record.recipientAddress || '',
		recipientAttention: record.recipientAttention || '',
		recipientPosition: record.recipientPosition || '',
		senderCompany: record.senderCompany || '',
		senderName: record.senderName,
		senderPosition: record.senderPosition || '',
		senderAddress: record.senderAddress || '',
		senderEmployeeId: record.senderEmployeeId,
		slipTypes: record.slipTypes || [],
		slipTypeOther: record.slipTypeOther || '',
		documentConfidentiality: record.documentConfidentiality || '',
		documentConfidentialityOther: record.documentConfidentialityOther || '',
		goodsTypes: record.goodsTypes || [],
		goodsTypeOther: record.goodsTypeOther || '',
		handlingTypes: record.handlingTypes || [],
		handlingTypeOther: record.handlingTypeOther || '',
		purposes: record.purposes || [],
		purposeOther: record.purposeOther || '',
		confirmationMode: record.confirmationMode || '',
		confirmationEmail: record.confirmationEmail || '',
		returnAddress: record.returnAddress || '',
		senderDate: formatDateForClient(record.senderDate),
		receiverName: record.receiverName || '',
		receiverPosition: record.receiverPosition || '',
		receiverDate: formatDateForClient(record.receiverDate),
		status: record.receiverDate ? 'DITERIMA' : 'DRAFT',
		items: mappedItems,
		createdAt: record.createdAt,
		updatedAt: record.updatedAt,
	};
}

const includeItems = { items: { orderBy: { sortOrder: 'asc' } } };

async function getSlipOrThrow(id, siteWhere) {
	const record = await prisma.deliverySlip.findFirst({
		where: { id, ...siteWhere },
		include: includeItems,
	});

	if (!record) {
		throw Object.assign(new Error('Lembar pengiriman tidak ditemukan.'), { statusCode: 404 });
	}

	return record;
}

router.get(
	'/',
	withAsync(async (req, res) => {
		const records = await prisma.deliverySlip.findMany({
			where: { ...buildSiteWhere(req) },
			include: includeItems,
			orderBy: [{ slipDate: 'desc' }, { id: 'desc' }],
		});

		return res.json(records.map(mapSlip));
	}),
);

router.get(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const record = await getSlipOrThrow(id, buildSiteWhere(req)).catch(() => null);

		if (!record) {
			return siteNotFound(res);
		}

		return res.json(mapSlip(record));
	}),
);

router.post(
	'/',
	withAsync(async (req, res) => {
		const siteId = resolveWriteSiteId(req, req.body.siteId);
		const { data, items } = await validatePayload(req.body, siteId);

		const record = await prisma.deliverySlip.create({
			data: {
				...data,
				siteId,
				items: items.length > 0 ? { create: items } : undefined,
			},
			include: includeItems,
		});

		return res.status(201).json(mapSlip(record));
	}),
);

router.put(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const existing = await getSlipOrThrow(id, buildSiteWhere(req)).catch(() => null);

		if (!existing) {
			return siteNotFound(res);
		}

		const { data, items } = await validatePayload(req.body, existing.siteId, id);

		const record = await prisma.$transaction(async (tx) => {
			await tx.deliverySlipItem.deleteMany({ where: { deliverySlipId: id } });

			return tx.deliverySlip.update({
				where: { id },
				data: {
					...data,
					items: items.length > 0 ? { create: items } : undefined,
				},
				include: includeItems,
			});
		});

		return res.json(mapSlip(record));
	}),
);

router.delete(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const existing = await getSlipOrThrow(id, buildSiteWhere(req)).catch(() => null);

		if (!existing) {
			return siteNotFound(res);
		}

		await prisma.deliverySlip.delete({ where: { id } });
		return res.status(204).send();
	}),
);

export default router;
