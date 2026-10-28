/* eslint-disable import/first, import/extensions */
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Edit limbah masuk & limbah keluar setelah limbah keluar tercatat.
 */

vi.mock('../../lib/prisma.js', () => {
	const createModel = () => ({
		findMany: vi.fn().mockResolvedValue([]),
		findFirst: vi.fn().mockResolvedValue(null),
		findUnique: vi.fn().mockResolvedValue(null),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		count: vi.fn().mockResolvedValue(0),
		aggregate: vi.fn().mockResolvedValue({ _sum: {} }),
	});

	const prisma = {
		b3WasteRecord: createModel(),
		b3WasteOutRecord: createModel(),
		b3WasteType: {
		...createModel(),
		findFirst: vi.fn(async ({ where }) => ({ id: where.id })),
	},
		masterVendor: {
			...createModel(),
			findFirst: vi.fn(async ({ where }) => ({ id: where.id })),
		},
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

const validParentBody = {
	jenisLimbahId: 1,
	tanggalMasuk: '2026-02-28',
	sumberLimbah: 'Warehouse',
	jumlahMasuk: 500,
	maksimalPenyimpanan: 90,
	petugasPenanggungJawab: 'Budi',
};

function setupParent(outRecords = []) {
	prisma.b3WasteRecord.findFirst.mockResolvedValue({
		id: 9,
		siteId: 7,
		jenisLimbahId: 1,
		outRecords,
	});
	prisma.b3WasteRecord.update.mockImplementation(async ({ data }) => ({ id: 9, ...data }));
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('PUT /b3-waste/records/:id (limbah masuk)', () => {
	it('menolak jumlah masuk lebih kecil dari total keluar', async () => {
		setupParent([{ tanggalKeluar: new Date('2026-03-10T12:00:00.000Z'), jumlahKeluar: '100' }]);
		const handler = getRouteHandler('put', '/:id');
		const res = createMockRes();

		await handler(
			createMockReq({ params: { id: '9' }, body: { ...validParentBody, jumlahMasuk: 50 } }),
			res,
		);

		expect(res.statusCode).toBe(400);
		expect(res.jsonData.message).toMatch(/total limbah keluar/i);
		expect(prisma.b3WasteRecord.update).not.toHaveBeenCalled();
	});

	it('menolak perubahan jenis limbah jika sudah ada limbah keluar', async () => {
		setupParent([{ tanggalKeluar: new Date('2026-03-10T12:00:00.000Z'), jumlahKeluar: '100' }]);
		const handler = getRouteHandler('put', '/:id');
		const res = createMockRes();

		await handler(
			createMockReq({ params: { id: '9' }, body: { ...validParentBody, jenisLimbahId: 2 } }),
			res,
		);

		expect(res.statusCode).toBe(400);
		expect(res.jsonData.message).toMatch(/jenis limbah tidak dapat diubah/i);
	});

	it('menolak tanggal masuk melebihi tanggal keluar', async () => {
		setupParent([{ tanggalKeluar: new Date('2026-03-10T12:00:00.000Z'), jumlahKeluar: '100' }]);
		const handler = getRouteHandler('put', '/:id');
		const res = createMockRes();

		await handler(
			createMockReq({ params: { id: '9' }, body: { ...validParentBody, tanggalMasuk: '2026-03-15' } }),
			res,
		);

		expect(res.statusCode).toBe(400);
		expect(res.jsonData.message).toMatch(/tanggal masuk tidak boleh melebihi/i);
	});

	it('mengizinkan edit tanggal masuk, jumlah, dan petugas yang konsisten', async () => {
		setupParent([{ tanggalKeluar: new Date('2026-03-10T12:00:00.000Z'), jumlahKeluar: '100' }]);
		const handler = getRouteHandler('put', '/:id');
		const res = createMockRes();

		await handler(
			createMockReq({
				params: { id: '9' },
				body: { ...validParentBody, tanggalMasuk: '2026-02-20', jumlahMasuk: 400, petugasPenanggungJawab: 'Budi Baru' },
			}),
			res,
		);

		expect(res.statusCode).toBe(200);
		const data = prisma.b3WasteRecord.update.mock.calls[0][0].data;
		expect(data.petugasPenanggungJawab).toBe('Budi Baru');
		expect(data.jumlahMasuk).toBe(400);
		expect(data.tanggalMasuk.getUTCDate()).toBe(20);
	});
});

describe('PUT /b3-waste/records/out-records/:id (limbah keluar)', () => {
	function setupOut() {
		prisma.b3WasteOutRecord.findFirst.mockResolvedValue({ id: 5, siteId: 7, wasteRecordId: 9 });
		prisma.b3WasteRecord.findFirst.mockResolvedValue({
			id: 9,
			siteId: 7,
			jumlahMasuk: '500',
			tanggalMasuk: new Date('2026-02-28T12:00:00.000Z'),
			outRecords: [
				{ id: 5, jumlahKeluar: '100' },
				{ id: 6, jumlahKeluar: '50' },
			],
		});
		prisma.b3WasteOutRecord.update.mockImplementation(async ({ data }) => ({ id: 5, ...data }));
	}

	const validOutBody = {
		tanggalKeluar: '2026-03-10',
		jumlahKeluar: 100,
		tujuanPenyerahan: 'PENGOLAHAN LIMBAH B3',
		perlakuan: 'DIOLAH',
		nomorDokumen: 'DOC-1',
		vendorId: null,
		petugasPenanggungJawab: 'Siti',
	};

	it('mengizinkan edit petugas, perlakuan, dan pengelola', async () => {
		setupOut();
		const handler = getRouteHandler('put', '/out-records/:id');
		const res = createMockRes();

		await handler(createMockReq({ params: { id: '5' }, body: validOutBody }), res);

		expect(res.statusCode).toBe(200);
		const data = prisma.b3WasteOutRecord.update.mock.calls[0][0].data;
		expect(data.petugasPenanggungJawab).toBe('Siti');
		expect(data.perlakuan).toBe('DIOLAH');
		expect(data.vendorId).toBeNull();
	});

	it('menolak jumlah keluar melebihi sisa di luar record yang diedit', async () => {
		setupOut();
		const handler = getRouteHandler('put', '/out-records/:id');
		const res = createMockRes();

		await handler(
			createMockReq({ params: { id: '5' }, body: { ...validOutBody, jumlahKeluar: 500 } }),
			res,
		);

		expect(res.statusCode).toBe(400);
		expect(res.jsonData.message).toMatch(/melebihi sisa limbah/i);
	});

	it('menolak tanggal keluar sebelum tanggal masuk', async () => {
		setupOut();
		const handler = getRouteHandler('put', '/out-records/:id');
		const res = createMockRes();

		await handler(
			createMockReq({ params: { id: '5' }, body: { ...validOutBody, tanggalKeluar: '2026-02-01' } }),
			res,
		);

		expect(res.statusCode).toBe(400);
		expect(res.jsonData.message).toMatch(/sebelum tanggal masuk/i);
	});
});

describe('GET /b3-waste/records/:id/out', () => {
	it('mengembalikan daftar limbah keluar milik site', async () => {
		prisma.b3WasteRecord.findFirst.mockResolvedValue({ id: 9 });
		prisma.b3WasteOutRecord.findMany.mockResolvedValue([{ id: 5, perlakuan: 'DIOLAH' }]);

		const handler = getRouteHandler('get', '/:id/out');
		const res = createMockRes();

		await handler(createMockReq({ params: { id: '9' } }), res);

		expect(res.statusCode).toBe(200);
		expect(res.jsonData).toHaveLength(1);
		expect(prisma.b3WasteOutRecord.findMany.mock.calls[0][0].where).toMatchObject({
			siteId: 7,
			wasteRecordId: 9,
		});
	});

	it('404 untuk record site lain', async () => {
		prisma.b3WasteRecord.findFirst.mockResolvedValue(null);

		const handler = getRouteHandler('get', '/:id/out');
		const res = createMockRes();

		await handler(createMockReq({ params: { id: '9' } }), res);

		expect(res.statusCode).toBe(404);
		expect(prisma.b3WasteOutRecord.findMany).not.toHaveBeenCalled();
	});
});
describe('B3 cross-site master references', () => {
	it('menolak jenis limbah milik site lain saat menambah limbah masuk', async () => {
		prisma.b3WasteType.findFirst.mockResolvedValue(null);

		const handler = getRouteHandler('post', '/');
		const res = createMockRes();

		await expect(handler(createMockReq({ body: validParentBody }), res)).rejects.toMatchObject({
			statusCode: 400,
		});

		expect(prisma.b3WasteType.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({ where: expect.objectContaining({ siteId: 7 }) }),
		);
		expect(prisma.b3WasteRecord.create).not.toHaveBeenCalled();
	});

	it('menolak vendor milik site lain saat menambah limbah keluar', async () => {
		setupParent([]);
		prisma.b3WasteOutRecord.findFirst.mockResolvedValue(null);
		prisma.masterVendor.findFirst.mockResolvedValue(null);

		const handler = getRouteHandler('post', '/:id/out');
		const res = createMockRes();

		await expect(
			handler(
				createMockReq({
					params: { id: '9' },
body: {
						tanggalKeluar: '2026-03-10',
						jumlahKeluar: 10,
						tujuanPenyerahan: 'Pihak ketiga',
						nomorDokumen: 'DOC-1',
						vendorId: 55,
						petugasPenanggungJawab: 'Budi',
					},
				}),
				res,
			),
		).rejects.toMatchObject({ statusCode: 400 });

		expect(prisma.masterVendor.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({ where: expect.objectContaining({ siteId: 7 }) }),
		);
		expect(prisma.b3WasteOutRecord.create).not.toHaveBeenCalled();
	});
});
