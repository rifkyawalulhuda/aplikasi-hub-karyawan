/* eslint-disable import/first, import/extensions */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';

/**
 * Property-Based Test: Referential Integrity Prevents Deletion
 *
 * Feature: b3-waste-recording, Property 8: Referential Integrity Prevents Deletion
 *
 * **Validates: Requirements 6.6, 7.7**
 *
 * For any B3WasteRecord that has one or more associated B3WasteOutRecord entries,
 * deletion SHALL be rejected. Similarly, for any B3WasteType that is referenced by
 * one or more B3WasteRecord entries, deletion SHALL be rejected.
 */

// Mock prisma before importing routers
vi.mock('../../lib/prisma.js', () => ({
	default: {
		b3WasteRecord: {
			findFirst: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
		},
		b3WasteOutRecord: {
			count: vi.fn(),
		},
		b3WasteType: {
			findFirst: vi.fn(),
			delete: vi.fn(),
		},
	},
}));

import prisma from '../../lib/prisma.js';
import wasteRecordsRouter from '../b3WasteRecords.js';
import wasteTypesRouter from '../b3WasteTypes.js';

// Helper to extract route handlers from an Express router
function getRouteHandler(router, method, path) {
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
		body: null,
		status(code) {
			res.statusCode = code;
			return res;
		},
		json(data) {
			res.body = data;
			return res;
		},
		send() {
			return res;
		},
	};
	return res;
}

describe('Feature: b3-waste-recording, Property 8: Referential Integrity Prevents Deletion', () => {
	let deleteRecordHandler;
	let deleteTypeHandler;

	beforeEach(() => {
		vi.clearAllMocks();
		deleteRecordHandler = getRouteHandler(wasteRecordsRouter, 'delete', '/:id');
		deleteTypeHandler = getRouteHandler(wasteTypesRouter, 'delete', '/:id');
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should reject deletion of waste record that has associated out-records', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.integer({ min: 1, max: 10000 }),
				fc.integer({ min: 1, max: 10000 }),
				fc.integer({ min: 1, max: 10 }),
				async (recordId, siteId, outRecordCount) => {
					vi.clearAllMocks();

					// Mock existing record found
					prisma.b3WasteRecord.findFirst.mockResolvedValueOnce({
						id: recordId,
						siteId,
						jenisLimbahId: 1,
						tanggalMasuk: new Date('2024-01-15'),
						sumberLimbah: 'Warehouse',
						jumlahMasuk: 100,
						maksimalPenyimpanan: 90,
						tanggalBatas: new Date('2024-04-14'),
						petugasPenanggungJawab: 'Test User',
						createdAt: new Date(),
						updatedAt: new Date(),
					});

					// Mock non-zero out-record count (referential integrity constraint)
					prisma.b3WasteOutRecord.count.mockResolvedValueOnce(outRecordCount);

					const req = { siteId, params: { id: String(recordId) } };
					const res = createMockRes();
					await deleteRecordHandler(req, res);

					// Should be rejected with 409
					expect(res.statusCode).toBe(409);
					expect(res.body).toEqual({
						message: 'Data tidak dapat dihapus karena masih memiliki catatan limbah keluar',
					});

					// delete should NOT be called
					expect(prisma.b3WasteRecord.delete).not.toHaveBeenCalled();
				},
			),
			{ numRuns: 100 },
		);
	});

	it('should reject deletion of waste type that has associated waste records', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.integer({ min: 1, max: 10000 }),
				fc.integer({ min: 1, max: 10000 }),
				fc.integer({ min: 1, max: 10 }),
				async (typeId, siteId, wasteRecordCount) => {
					vi.clearAllMocks();

					// Mock existing type found
					prisma.b3WasteType.findFirst.mockResolvedValueOnce({
						id: typeId,
						siteId,
						kode: 'A338-1',
						nama: 'Bahan kimia kedaluwarsa',
						createdAt: new Date(),
						updatedAt: new Date(),
					});

					// Mock non-zero waste record count (referential integrity constraint)
					prisma.b3WasteRecord.count.mockResolvedValueOnce(wasteRecordCount);

					const req = { siteId, params: { id: String(typeId) } };
					const res = createMockRes();
					await deleteTypeHandler(req, res);

					// Should be rejected with 409
					expect(res.statusCode).toBe(409);
					expect(res.body).toEqual({
						message: 'Data tidak dapat dihapus karena masih digunakan',
					});

					// delete should NOT be called
					expect(prisma.b3WasteType.delete).not.toHaveBeenCalled();
				},
			),
			{ numRuns: 100 },
		);
	});
});
