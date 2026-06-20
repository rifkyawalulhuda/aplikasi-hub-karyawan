/* eslint-disable import/first, import/extensions */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';

/**
 * Property-Based Test: Remaining Waste Accounting Invariant
 *
 * Feature: b3-waste-recording, Property 3: Remaining Waste Accounting Invariant
 *
 * **Validates: Requirements 2.7, 3.1**
 *
 * For any waste record with a set of associated out-records, the computed sisaLimbah
 * SHALL always equal jumlahMasuk - SUM(outRecords.jumlahKeluar) with 2 decimal precision.
 */

// Mock prisma before importing the router (vitest hoists vi.mock)
vi.mock('../../lib/prisma.js', () => ({
	default: {
		b3WasteRecord: {
			findMany: vi.fn(),
			count: vi.fn(),
		},
		b3WasteOutRecord: {
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
 * Generates a jumlahMasuk value with exactly 2 decimal places in range [0.01, 999999.99]
 */
function arbJumlahMasuk() {
	return fc.integer({ min: 1, max: 99999999 }).map((n) => parseFloat((n / 100).toFixed(2)));
}

/**
 * Generates an array of out-record jumlahKeluar values (2 decimal places each)
 * ensuring their sum does not exceed jumlahMasuk.
 */
function arbOutRecords(jumlahMasuk) {
	return fc.integer({ min: 0, max: 10 }).chain((count) => {
		if (count === 0) return fc.constant([]);
		// Generate fractions that sum to at most 1.0
		return fc.array(fc.integer({ min: 1, max: 10000 }), { minLength: count, maxLength: count }).map((rawValues) => {
			const total = rawValues.reduce((a, b) => a + b, 0);
			// Scale fractions so total keluar <= jumlahMasuk
			// Use 0.99 factor to ensure we stay strictly within bounds even after rounding
			return rawValues.map((val) => {
				const keluar = parseFloat(((val / total) * jumlahMasuk * 0.99).toFixed(2));
				return Math.max(0.01, keluar); // ensure at least 0.01
			});
		});
	});
}

describe('Feature: b3-waste-recording, Property 3: Remaining Waste Accounting Invariant', () => {
	let getHandler;

	beforeEach(() => {
		vi.clearAllMocks();
		getHandler = getRouteHandler('get', '/');
	});

	it('sisaLimbah SHALL equal jumlahMasuk - SUM(outRecords.jumlahKeluar) with 2 decimal precision', async () => {
		await fc.assert(
			fc.asyncProperty(arbJumlahMasuk(), async (jumlahMasuk) => {
				// Generate out-records for this jumlahMasuk
				const outRecordsValues = await fc.sample(arbOutRecords(jumlahMasuk), 1)[0];

				// Build mock outRecords array
				const outRecords = (outRecordsValues || []).map((keluar, idx) => ({
					id: idx + 1,
					tanggalKeluar: new Date('2024-02-01'),
					jumlahKeluar: keluar,
					tujuanPenyerahan: 'Pengolahan',
					nomorDokumen: `MNF/2024/${String(idx + 1).padStart(3, '0')}`,
					petugasPenanggungJawab: 'Ahmad Fauzi',
				}));

				// Mock record returned by findMany
				const mockRecord = {
					id: 1,
					siteId: 1,
					jenisLimbahId: 1,
					tanggalMasuk: new Date('2024-01-15'),
					sumberLimbah: 'Warehouse',
					jumlahMasuk,
					maksimalPenyimpanan: 90,
					tanggalBatas: new Date('2024-04-14'),
					petugasPenanggungJawab: 'Ahmad Fauzi',
					jenisLimbah: { id: 1, kode: 'A338-1', nama: 'Bahan kimia kedaluwarsa' },
					outRecords,
				};

				prisma.b3WasteRecord.findMany.mockResolvedValue([mockRecord]);
				prisma.b3WasteRecord.count.mockResolvedValue(1);

				const req = {
					siteId: 1,
					query: {},
				};
				const res = createMockRes();

				await getHandler(req, res);

				expect(res.statusCode).toBe(200);
				expect(res.jsonData).toHaveProperty('data');
				expect(res.jsonData.data).toHaveLength(1);

				const record = res.jsonData.data[0];

				// Compute expected sisaLimbah
				const totalKeluar = outRecords.reduce((sum, out) => sum + parseFloat(out.jumlahKeluar), 0);
				const expectedSisaLimbah = parseFloat((jumlahMasuk - totalKeluar).toFixed(2));

				expect(record.sisaLimbah).toBe(expectedSisaLimbah);
			}),
			{ numRuns: 100 },
		);
	});

	it('sisaLimbah SHALL be exactly jumlahMasuk when there are zero out-records', async () => {
		await fc.assert(
			fc.asyncProperty(arbJumlahMasuk(), async (jumlahMasuk) => {
				const mockRecord = {
					id: 1,
					siteId: 1,
					jenisLimbahId: 1,
					tanggalMasuk: new Date('2024-01-15'),
					sumberLimbah: 'Warehouse',
					jumlahMasuk,
					maksimalPenyimpanan: 180,
					tanggalBatas: new Date('2024-07-13'),
					petugasPenanggungJawab: 'Ahmad Fauzi',
					jenisLimbah: { id: 1, kode: 'B104', nama: 'Oli bekas' },
					outRecords: [],
				};

				prisma.b3WasteRecord.findMany.mockResolvedValue([mockRecord]);
				prisma.b3WasteRecord.count.mockResolvedValue(1);

				const req = {
					siteId: 1,
					query: {},
				};
				const res = createMockRes();

				await getHandler(req, res);

				expect(res.statusCode).toBe(200);
				const record = res.jsonData.data[0];

				// With no out-records, sisaLimbah should equal jumlahMasuk
				expect(record.sisaLimbah).toBe(jumlahMasuk);
			}),
			{ numRuns: 100 },
		);
	});

	it('sisaLimbah SHALL maintain 2 decimal precision across multiple out-records', async () => {
		await fc.assert(
			fc.asyncProperty(
				// Generate jumlahMasuk
				arbJumlahMasuk(),
				// Generate 2-10 out-record amounts as integers (cents)
				fc.array(fc.integer({ min: 1, max: 5000 }), { minLength: 2, maxLength: 10 }),
				async (jumlahMasuk, outCents) => {
					// Convert cents to decimal values and ensure sum doesn't exceed jumlahMasuk
					const jumlahMasukCents = Math.round(jumlahMasuk * 100);
					const totalOutCents = outCents.reduce((a, b) => a + b, 0);

					// Scale down out amounts if they exceed jumlahMasuk
					let scaledOutCents = outCents;
					if (totalOutCents >= jumlahMasukCents) {
						const scale = (jumlahMasukCents - 1) / totalOutCents;
						scaledOutCents = outCents.map((c) => Math.max(1, Math.floor(c * scale)));
					}

					const outRecords = scaledOutCents.map((cents, idx) => ({
						id: idx + 1,
						tanggalKeluar: new Date('2024-02-01'),
						jumlahKeluar: parseFloat((cents / 100).toFixed(2)),
						tujuanPenyerahan: 'Pengolahan',
						nomorDokumen: `MNF/2024/${String(idx + 1).padStart(3, '0')}`,
						petugasPenanggungJawab: 'Ahmad Fauzi',
					}));

					const mockRecord = {
						id: 1,
						siteId: 1,
						jenisLimbahId: 1,
						tanggalMasuk: new Date('2024-01-15'),
						sumberLimbah: 'Warehouse',
						jumlahMasuk,
						maksimalPenyimpanan: 90,
						tanggalBatas: new Date('2024-04-14'),
						petugasPenanggungJawab: 'Ahmad Fauzi',
						jenisLimbah: { id: 1, kode: 'A338-1', nama: 'Bahan kimia kedaluwarsa' },
						outRecords,
					};

					prisma.b3WasteRecord.findMany.mockResolvedValue([mockRecord]);
					prisma.b3WasteRecord.count.mockResolvedValue(1);

					const req = {
						siteId: 1,
						query: {},
					};
					const res = createMockRes();

					await getHandler(req, res);

					expect(res.statusCode).toBe(200);
					const record = res.jsonData.data[0];

					// Verify 2 decimal precision
					const sisaStr = record.sisaLimbah.toString();
					const decimalPart = sisaStr.split('.')[1];
					if (decimalPart) {
						expect(decimalPart.length).toBeLessThanOrEqual(2);
					}

					// Verify accounting equation holds
					const totalKeluar = outRecords.reduce((sum, out) => sum + parseFloat(out.jumlahKeluar), 0);
					const expectedSisaLimbah = parseFloat((jumlahMasuk - totalKeluar).toFixed(2));
					expect(record.sisaLimbah).toBe(expectedSisaLimbah);
				},
			),
			{ numRuns: 100 },
		);
	});
});
