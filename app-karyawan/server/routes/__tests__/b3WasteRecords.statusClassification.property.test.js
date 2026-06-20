/* eslint-disable import/first, import/extensions */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';

/**
 * Property-Based Test: Storage Status Classification
 *
 * Feature: b3-waste-recording, Property 5: Storage Status Classification
 *
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.6**
 *
 * For any waste record, given a reference date:
 * - If sisaLimbah <= 0, the status SHALL be "normal" regardless of sisaHari
 * - If sisaLimbah > 0 and sisaHari > 14, the status SHALL be "normal"
 * - If sisaLimbah > 0 and 1 <= sisaHari <= 14, the status SHALL be "warning"
 * - If sisaLimbah > 0 and sisaHari <= 0, the status SHALL be "overdue"
 *
 * Where sisaHari = tanggalBatas - today (in days)
 */

// Mock prisma before importing the router (vitest hoists vi.mock)
vi.mock('../../lib/prisma.js', () => ({
	default: {
		b3WasteRecord: {
			findMany: vi.fn(),
			count: vi.fn(),
		},
	},
}));

import prisma from '../../lib/prisma.js';
import router from '../b3WasteRecords.js';

// Helper to extract route handlers from the Express router
function getRouteHandler(method, path) {
	const layer = router.stack.find((l) => l.route && l.route.path === path && l.route.methods[method]);
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

function createMockRes() {
	const res = {
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
		send: vi.fn(function send() {
			return this;
		}),
	};
	return res;
}

/**
 * Helper to create a tanggalBatas that produces a specific sisaHari value
 * relative to today. sisaHari = Math.ceil((tanggalBatas - today) / msPerDay)
 */
function createTanggalBatas(desiredSisaHari) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const target = new Date(today);
	target.setDate(target.getDate() + desiredSisaHari);
	return target;
}

describe('Feature: b3-waste-recording, Property 5: Storage Status Classification', () => {
	let getHandler;

	beforeEach(() => {
		vi.clearAllMocks();
		getHandler = getRouteHandler('get', '/');
	});

	it('should classify status as "normal" when sisaLimbah <= 0, regardless of sisaHari', async () => {
		await fc.assert(
			fc.asyncProperty(
				// Generate jumlahMasuk between 0.01 and 1000
				fc.double({ min: 0.01, max: 1000, noNaN: true, noDefaultInfinity: true }),
				// Generate excess factor to make totalKeluar >= jumlahMasuk (sisaLimbah <= 0)
				fc.double({ min: 0, max: 500, noNaN: true, noDefaultInfinity: true }),
				// Generate any sisaHari value (-100 to +100) — should not matter
				fc.integer({ min: -100, max: 100 }),
				async (jumlahMasuk, excess, sisaHari) => {
					const roundedMasuk = parseFloat(jumlahMasuk.toFixed(2));
					if (roundedMasuk < 0.01) return;

					// totalKeluar >= jumlahMasuk → sisaLimbah <= 0
					const totalKeluar = parseFloat((roundedMasuk + excess).toFixed(2));
					if (totalKeluar < roundedMasuk) return;

					const tanggalBatas = createTanggalBatas(sisaHari);

					const mockRecord = {
						id: 1,
						siteId: 1,
						jenisLimbahId: 1,
						tanggalMasuk: new Date('2024-01-15'),
						sumberLimbah: 'Warehouse',
						jumlahMasuk: roundedMasuk,
						maksimalPenyimpanan: 90,
						tanggalBatas,
						petugasPenanggungJawab: 'Ahmad Fauzi',
						jenisLimbah: { id: 1, kode: 'A338-1', nama: 'Bahan kimia' },
						outRecords: [{ id: 1, jumlahKeluar: totalKeluar }],
					};

					prisma.b3WasteRecord.findMany.mockResolvedValue([mockRecord]);
					prisma.b3WasteRecord.count.mockResolvedValue(1);

					const req = {
						siteId: 1,
						query: {},
					};
					const res = createMockRes();

					await getHandler(req, res);

					expect(res.jsonData).not.toBeNull();
					expect(res.jsonData.data[0].statusPenyimpanan).toBe('normal');
				},
			),
			{ numRuns: 100 },
		);
	});

	it('should classify status as "normal" when sisaLimbah > 0 and sisaHari > 14', async () => {
		await fc.assert(
			fc.asyncProperty(
				// Generate jumlahMasuk
				fc.double({ min: 1, max: 1000, noNaN: true, noDefaultInfinity: true }),
				// Generate fraction of keluar (0 to 0.99 to ensure sisaLimbah > 0)
				fc.double({ min: 0, max: 0.99, noNaN: true, noDefaultInfinity: true }),
				// Generate sisaHari > 14
				fc.integer({ min: 15, max: 365 }),
				async (jumlahMasuk, keluarFraction, sisaHari) => {
					const roundedMasuk = parseFloat(jumlahMasuk.toFixed(2));
					if (roundedMasuk < 0.01) return;

					const totalKeluar = parseFloat((roundedMasuk * keluarFraction).toFixed(2));
					const sisaLimbah = parseFloat((roundedMasuk - totalKeluar).toFixed(2));
					if (sisaLimbah <= 0) return;

					const tanggalBatas = createTanggalBatas(sisaHari);

					const mockRecord = {
						id: 1,
						siteId: 1,
						jenisLimbahId: 1,
						tanggalMasuk: new Date('2024-01-15'),
						sumberLimbah: 'Warehouse',
						jumlahMasuk: roundedMasuk,
						maksimalPenyimpanan: 90,
						tanggalBatas,
						petugasPenanggungJawab: 'Ahmad Fauzi',
						jenisLimbah: { id: 1, kode: 'A338-1', nama: 'Bahan kimia' },
						outRecords: totalKeluar > 0 ? [{ id: 1, jumlahKeluar: totalKeluar }] : [],
					};

					prisma.b3WasteRecord.findMany.mockResolvedValue([mockRecord]);
					prisma.b3WasteRecord.count.mockResolvedValue(1);

					const req = {
						siteId: 1,
						query: {},
					};
					const res = createMockRes();

					await getHandler(req, res);

					expect(res.jsonData).not.toBeNull();
					expect(res.jsonData.data[0].sisaLimbah).toBeGreaterThan(0);
					expect(res.jsonData.data[0].sisaHari).toBeGreaterThan(14);
					expect(res.jsonData.data[0].statusPenyimpanan).toBe('normal');
				},
			),
			{ numRuns: 100 },
		);
	});

	it('should classify status as "warning" when sisaLimbah > 0 and 1 <= sisaHari <= 14', async () => {
		await fc.assert(
			fc.asyncProperty(
				// Generate jumlahMasuk
				fc.double({ min: 1, max: 1000, noNaN: true, noDefaultInfinity: true }),
				// Generate fraction of keluar (0 to 0.99 to ensure sisaLimbah > 0)
				fc.double({ min: 0, max: 0.99, noNaN: true, noDefaultInfinity: true }),
				// Generate sisaHari between 1 and 14
				fc.integer({ min: 1, max: 14 }),
				async (jumlahMasuk, keluarFraction, sisaHari) => {
					const roundedMasuk = parseFloat(jumlahMasuk.toFixed(2));
					if (roundedMasuk < 0.01) return;

					const totalKeluar = parseFloat((roundedMasuk * keluarFraction).toFixed(2));
					const sisaLimbah = parseFloat((roundedMasuk - totalKeluar).toFixed(2));
					if (sisaLimbah <= 0) return;

					const tanggalBatas = createTanggalBatas(sisaHari);

					const mockRecord = {
						id: 1,
						siteId: 1,
						jenisLimbahId: 1,
						tanggalMasuk: new Date('2024-01-15'),
						sumberLimbah: 'Warehouse',
						jumlahMasuk: roundedMasuk,
						maksimalPenyimpanan: 90,
						tanggalBatas,
						petugasPenanggungJawab: 'Ahmad Fauzi',
						jenisLimbah: { id: 1, kode: 'A338-1', nama: 'Bahan kimia' },
						outRecords: totalKeluar > 0 ? [{ id: 1, jumlahKeluar: totalKeluar }] : [],
					};

					prisma.b3WasteRecord.findMany.mockResolvedValue([mockRecord]);
					prisma.b3WasteRecord.count.mockResolvedValue(1);

					const req = {
						siteId: 1,
						query: {},
					};
					const res = createMockRes();

					await getHandler(req, res);

					expect(res.jsonData).not.toBeNull();
					expect(res.jsonData.data[0].sisaLimbah).toBeGreaterThan(0);
					expect(res.jsonData.data[0].sisaHari).toBeGreaterThanOrEqual(1);
					expect(res.jsonData.data[0].sisaHari).toBeLessThanOrEqual(14);
					expect(res.jsonData.data[0].statusPenyimpanan).toBe('warning');
				},
			),
			{ numRuns: 100 },
		);
	});

	it('should classify status as "overdue" when sisaLimbah > 0 and sisaHari <= 0', async () => {
		await fc.assert(
			fc.asyncProperty(
				// Generate jumlahMasuk
				fc.double({ min: 1, max: 1000, noNaN: true, noDefaultInfinity: true }),
				// Generate fraction of keluar (0 to 0.99 to ensure sisaLimbah > 0)
				fc.double({ min: 0, max: 0.99, noNaN: true, noDefaultInfinity: true }),
				// Generate sisaHari <= 0 (overdue)
				fc.integer({ min: -365, max: 0 }),
				async (jumlahMasuk, keluarFraction, sisaHari) => {
					const roundedMasuk = parseFloat(jumlahMasuk.toFixed(2));
					if (roundedMasuk < 0.01) return;

					const totalKeluar = parseFloat((roundedMasuk * keluarFraction).toFixed(2));
					const sisaLimbah = parseFloat((roundedMasuk - totalKeluar).toFixed(2));
					if (sisaLimbah <= 0) return;

					const tanggalBatas = createTanggalBatas(sisaHari);

					const mockRecord = {
						id: 1,
						siteId: 1,
						jenisLimbahId: 1,
						tanggalMasuk: new Date('2024-01-15'),
						sumberLimbah: 'Warehouse',
						jumlahMasuk: roundedMasuk,
						maksimalPenyimpanan: 90,
						tanggalBatas,
						petugasPenanggungJawab: 'Ahmad Fauzi',
						jenisLimbah: { id: 1, kode: 'A338-1', nama: 'Bahan kimia' },
						outRecords: totalKeluar > 0 ? [{ id: 1, jumlahKeluar: totalKeluar }] : [],
					};

					prisma.b3WasteRecord.findMany.mockResolvedValue([mockRecord]);
					prisma.b3WasteRecord.count.mockResolvedValue(1);

					const req = {
						siteId: 1,
						query: {},
					};
					const res = createMockRes();

					await getHandler(req, res);

					expect(res.jsonData).not.toBeNull();
					expect(res.jsonData.data[0].sisaLimbah).toBeGreaterThan(0);
					expect(res.jsonData.data[0].sisaHari).toBeLessThanOrEqual(0);
					expect(res.jsonData.data[0].statusPenyimpanan).toBe('overdue');
				},
			),
			{ numRuns: 100 },
		);
	});
});
