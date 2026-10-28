/* eslint-disable import/first, import/extensions */
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Neraca Limbah B3 (format KLHK) — perhitungan A/B/C/D dan isolasi site.
 */

vi.mock('../../lib/prisma.js', () => {
	const createModel = () => ({
		findMany: vi.fn().mockResolvedValue([]),
		findFirst: vi.fn().mockResolvedValue(null),
		findUnique: vi.fn().mockResolvedValue(null),
		create: vi.fn(),
		update: vi.fn(),
		upsert: vi.fn(),
		delete: vi.fn(),
		count: vi.fn().mockResolvedValue(0),
		aggregate: vi.fn().mockResolvedValue({ _sum: {} }),
	});

	const prisma = {
		b3WasteRecord: createModel(),
		b3WasteOutRecord: createModel(),
		b3WasteType: createModel(),
		b3WasteNeracaPeriod: createModel(),
		siteProfile: createModel(),
	};

	return { default: prisma };
});

import prisma from '../../lib/prisma.js';
import b3RecordsRouter from '../b3WasteRecords.js';

function getRouteHandler(method, path) {
	const layer = b3RecordsRouter.stack.find((l) => l.route && l.route.path === path && l.route.methods[method]);
	if (!layer) throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
	const handlers = layer.route.stack.map((s) => s.handle);
	const wrappedHandler = handlers[handlers.length - 1];

	return async (req, res) => {
		let caughtError = null;
		const next = (err) => {
			caughtError = err;
		};
		wrappedHandler(req, res, next);
		await new Promise((resolve) => {
			setImmediate(resolve);
		});
		if (caughtError) throw caughtError;
	};
}

function createMockReq(overrides = {}) {
	return {
		admin: { id: 1, role: 'admin', employeeId: 1, siteId: 7 },
		query: {},
		params: {},
		body: {},
		...overrides,
	};
}

function createMockRes() {
	return {
		statusCode: 200,
		jsonData: null,
		status: vi.fn(function status(code) {
			this.statusCode = code;
			return this;
		}),
		json: vi.fn(function json(data) {
			this.jsonData = data;
			return this;
		}),
		send: vi.fn(),
	};
}

function setupNeracaMocks() {
	prisma.siteProfile.findUnique.mockResolvedValue({
		companyName: 'PT Contoh',
		businessField: 'Logistik',
		address: null,
		phoneNumber: null,
		responsibleName: null,
	});

	prisma.b3WasteType.findMany.mockResolvedValue([
		{ id: 1, kode: 'A001', nama: 'Oli Bekas', hasEnvironmentalApproval: true },
		{ id: 2, kode: 'B002', nama: 'Sludge', hasEnvironmentalApproval: false },
	]);

	prisma.b3WasteRecord.findMany
		// Bagian I: limbah masuk periode
		.mockResolvedValueOnce([
			{ jenisLimbahId: 1, jumlahMasuk: '500' },
			{ jenisLimbahId: 2, jumlahMasuk: '300' },
		])
		// Skala waktu penataan
		.mockResolvedValueOnce([{ jenisLimbahId: 1, maksimalPenyimpanan: 90 }])
		// D: record yang melewati batas simpan
		.mockResolvedValueOnce([{ jumlahMasuk: '200', outRecords: [{ jumlahKeluar: '50' }] }]);

	prisma.b3WasteOutRecord.findMany.mockResolvedValue([
		{ jumlahKeluar: '100', perlakuan: 'DIOLAH', wasteRecord: { jenisLimbahId: 1 } },
		{ jumlahKeluar: '50', perlakuan: 'DISIMPAN', wasteRecord: { jenisLimbahId: 2 } },
	]);

	prisma.b3WasteNeracaPeriod.findUnique.mockResolvedValue({ residu: '0.5', catatan: 'Catatan QA' });
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('GET /neraca-klhk', () => {
	it('menghitung A, B, C, D, dan kinerja sesuai rumus dokumen', async () => {
		setupNeracaMocks();
		const handler = getRouteHandler('get', '/neraca-klhk');
		const res = createMockRes();

		await handler(createMockReq({ query: { tahun: '2026', triwulan: '2' } }), res);

		expect(res.statusCode).toBe(200);

		const body = res.jsonData;
		// A = 800 kg = 0.8 ton
		expect(body.totalATon).toBe(0.8);
		expect(body.sectionA).toHaveLength(2);

		// B = 150 kg = 0.15 ton, dipisah per perlakuan
		expect(body.totalBTon).toBe(0.15);
		expect(body.sectionB.map((group) => group.perlakuan)).toEqual(['DISIMPAN', 'DIOLAH']);

		// C = 0.5 ton (input periode), D = 150 kg = 0.15 ton
		expect(body.residuTon).toBe(0.5);
		expect(body.belumTerkelolaTon).toBe(0.15);
		expect(body.totalTersisaTon).toBe(0.65);

		// Kinerja = (0.8 - 0.65) / 0.8 * 100 = 18.75
		expect(body.kinerjaPercent).toBe(18.75);

		// Persetujuan lingkungan per jenis limbah
		const allItems = body.sectionB.flatMap((group) => group.items);
		expect(allItems.find((item) => item.jenisLimbahId === 1).hasEnvironmentalApproval).toBe(true);
		expect(allItems.find((item) => item.jenisLimbahId === 2).hasEnvironmentalApproval).toBe(false);

		expect(body.catatan).toBe('Catatan QA');
		expect(body.profil.companyName).toBe('PT Contoh');
	});

	it('membatasi semua query ke site admin', async () => {
		setupNeracaMocks();
		const handler = getRouteHandler('get', '/neraca-klhk');
		const res = createMockRes();

		await handler(createMockReq({ query: { tahun: '2026', triwulan: '2' } }), res);

		expect(prisma.b3WasteType.findMany.mock.calls[0][0].where.siteId).toBe(7);
		expect(prisma.b3WasteRecord.findMany.mock.calls[0][0].where.siteId).toBe(7);
		expect(prisma.b3WasteOutRecord.findMany.mock.calls[0][0].where.siteId).toBe(7);
		expect(prisma.b3WasteNeracaPeriod.findUnique.mock.calls[0][0].where.siteId_tahun_triwulan.siteId).toBe(7);
	});

	it('super_admin memakai siteId dari query', async () => {
		setupNeracaMocks();
		const handler = getRouteHandler('get', '/neraca-klhk');
		const res = createMockRes();

		await handler(
			createMockReq({
				isSuperAdmin: true,
				admin: { id: 1, role: 'super_admin', employeeId: 1, siteId: null },
				query: { tahun: '2026', triwulan: '2', siteId: '2' },
			}),
			res,
		);

		expect(prisma.b3WasteRecord.findMany.mock.calls[0][0].where.siteId).toBe(2);
	});

	it('menolak admin tanpa site', async () => {
		setupNeracaMocks();
		const handler = getRouteHandler('get', '/neraca-klhk');
		const res = createMockRes();

		await handler(
			createMockReq({
				admin: { id: 1, role: 'admin', employeeId: 1, siteId: null },
				query: { tahun: '2026', triwulan: '2' },
			}),
			res,
		);

		expect(res.statusCode).toBe(403);
	});
});

describe('PUT /neraca-klhk/period', () => {
	it('menyimpan residu dan catatan untuk site admin', async () => {
		prisma.b3WasteNeracaPeriod.upsert.mockResolvedValue({
			id: 1,
			siteId: 7,
			tahun: 2026,
			triwulan: 2,
			residu: '1.25',
			catatan: 'Catatan baru',
		});

		const handler = getRouteHandler('put', '/neraca-klhk/period');
		const res = createMockRes();

		await handler(
			createMockReq({ body: { tahun: 2026, triwulan: 2, residu: 1.25, catatan: 'Catatan baru' } }),
			res,
		);

		expect(res.statusCode).toBe(200);
		expect(prisma.b3WasteNeracaPeriod.upsert.mock.calls[0][0].where.siteId_tahun_triwulan.siteId).toBe(7);
		expect(prisma.b3WasteNeracaPeriod.upsert.mock.calls[0][0].create.residu).toBe(1.25);
		expect(res.jsonData.residu).toBe(1.25);
	});

	it('menolak residu negatif', async () => {
		const handler = getRouteHandler('put', '/neraca-klhk/period');
		const res = createMockRes();

		await handler(createMockReq({ body: { tahun: 2026, triwulan: 2, residu: -1 } }), res);

		expect(res.statusCode).toBe(400);
		expect(prisma.b3WasteNeracaPeriod.upsert).not.toHaveBeenCalled();
	});
});