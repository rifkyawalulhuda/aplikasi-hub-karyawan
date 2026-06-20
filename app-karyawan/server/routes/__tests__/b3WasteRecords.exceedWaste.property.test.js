/* eslint-disable import/first, import/extensions */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';

/**
 * Property-Based Test: Cannot Exceed Remaining Waste
 *
 * Feature: b3-waste-recording, Property 4: Cannot Exceed Remaining Waste
 *
 * **Validates: Requirements 2.6**
 *
 * For any waste record, if a new outgoing record is submitted with jumlahKeluar
 * exceeding the current sisaLimbah (jumlahMasuk minus sum of all existing out-records),
 * the system SHALL reject the operation and no out-record SHALL be persisted.
 */

// Mock prisma before importing the router (vitest hoists vi.mock)
vi.mock('../../lib/prisma.js', () => ({
	default: {
		b3WasteRecord: {
			findFirst: vi.fn(),
		},
		b3WasteOutRecord: {
			create: vi.fn(),
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

describe('Feature: b3-waste-recording, Property 4: Cannot Exceed Remaining Waste', () => {
	let postOutHandler;

	beforeEach(() => {
		vi.clearAllMocks();
		postOutHandler = getRouteHandler('post', '/:id/out');
	});

	it('should reject outgoing record when jumlahKeluar exceeds sisaLimbah (no existing out-records)', async () => {
		await fc.assert(
			fc.asyncProperty(
				// Generate jumlahMasuk: valid range 0.01 to 999999.99
				fc.double({ min: 0.01, max: 999999.99, noNaN: true, noDefaultInfinity: true }),
				// Generate excess factor > 1 (to ensure jumlahKeluar > sisaLimbah)
				fc.double({ min: 0.01, max: 500000, noNaN: true, noDefaultInfinity: true }),
				async (jumlahMasuk, excess) => {
					// Round jumlahMasuk to 2 decimal places
					const roundedMasuk = parseFloat(jumlahMasuk.toFixed(2));
					if (roundedMasuk < 0.01) return; // skip degenerate cases

					// jumlahKeluar exceeds sisaLimbah (which equals jumlahMasuk with no existing out-records)
					const jumlahKeluar = parseFloat((roundedMasuk + excess).toFixed(2));
					if (jumlahKeluar <= roundedMasuk) return; // skip if rounding made it equal

					// Mock parent record with no existing out-records
					prisma.b3WasteRecord.findFirst.mockResolvedValue({
						id: 1,
						siteId: 1,
						jumlahMasuk: roundedMasuk,
						tanggalMasuk: new Date('2024-01-15'),
						outRecords: [],
					});

					const req = {
						siteId: 1,
						params: { id: '1' },
						body: {
							tanggalKeluar: '2024-02-01',
							jumlahKeluar,
							tujuanPenyerahan: 'Pengolahan',
							nomorDokumen: 'MNF/2024/001',
							petugasPenanggungJawab: 'Ahmad Fauzi',
						},
					};
					const res = createMockRes();

					await postOutHandler(req, res);

					expect(res.statusCode).toBe(400);
					expect(res.jsonData).toHaveProperty('message');
					expect(res.jsonData.message).toBe('Jumlah limbah keluar tidak boleh melebihi sisa limbah di TPS');
					expect(prisma.b3WasteOutRecord.create).not.toHaveBeenCalled();
				},
			),
			{ numRuns: 100 },
		);
	});

	it('should reject outgoing record when jumlahKeluar exceeds sisaLimbah (with existing out-records)', async () => {
		await fc.assert(
			fc.asyncProperty(
				// Generate jumlahMasuk: valid range 10 to 999999.99
				fc.double({ min: 10, max: 999999.99, noNaN: true, noDefaultInfinity: true }),
				// Generate 1-5 existing out-records as fractions of jumlahMasuk
				fc.array(fc.double({ min: 0.01, max: 0.15, noNaN: true, noDefaultInfinity: true }), {
					minLength: 1,
					maxLength: 5,
				}),
				// Generate excess amount to add above the remaining
				fc.double({ min: 0.01, max: 100, noNaN: true, noDefaultInfinity: true }),
				async (jumlahMasuk, outFractions, excess) => {
					const roundedMasuk = parseFloat(jumlahMasuk.toFixed(2));
					if (roundedMasuk < 1) return;

					// Create out-records whose sum is less than jumlahMasuk
					const existingOutRecords = outFractions.map((fraction) => ({
						jumlahKeluar: parseFloat((roundedMasuk * fraction).toFixed(2)),
					}));

					const totalKeluar = existingOutRecords.reduce((sum, out) => sum + parseFloat(out.jumlahKeluar), 0);
					const sisaLimbah = parseFloat((roundedMasuk - totalKeluar).toFixed(2));

					// Skip if total out-records already exceed or equal jumlahMasuk
					if (sisaLimbah <= 0) return;

					// jumlahKeluar exceeds remaining
					const jumlahKeluar = parseFloat((sisaLimbah + excess).toFixed(2));
					if (jumlahKeluar <= sisaLimbah) return; // skip if rounding nullified excess

					// Mock parent record with existing out-records
					prisma.b3WasteRecord.findFirst.mockResolvedValue({
						id: 1,
						siteId: 1,
						jumlahMasuk: roundedMasuk,
						tanggalMasuk: new Date('2024-01-15'),
						outRecords: existingOutRecords,
					});

					const req = {
						siteId: 1,
						params: { id: '1' },
						body: {
							tanggalKeluar: '2024-02-01',
							jumlahKeluar,
							tujuanPenyerahan: 'Pengolahan',
							nomorDokumen: 'MNF/2024/001',
							petugasPenanggungJawab: 'Ahmad Fauzi',
						},
					};
					const res = createMockRes();

					await postOutHandler(req, res);

					expect(res.statusCode).toBe(400);
					expect(res.jsonData).toHaveProperty('message');
					expect(res.jsonData.message).toBe('Jumlah limbah keluar tidak boleh melebihi sisa limbah di TPS');
					expect(prisma.b3WasteOutRecord.create).not.toHaveBeenCalled();
				},
			),
			{ numRuns: 100 },
		);
	});
});
