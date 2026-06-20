/* eslint-disable import/first, import/extensions */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';

/**
 * Property 10: Sorting Correctness
 *
 * For any list of waste records and a valid sort field (tanggalMasuk or tanggalBatas)
 * with direction (asc/desc), the returned records SHALL be ordered such that for
 * consecutive records `a[i]` and `a[i+1]`, the sort field value of `a[i]` is ≤
 * (ascending) or ≥ (descending) `a[i+1]`.
 *
 * **Validates: Requirements 5.3**
 *
 * Feature: b3-waste-recording, Property 10: Sorting Correctness
 */

// Mock prisma before importing the router
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

// Helper to extract route handlers from Express router
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
	};
	return res;
}

function createMockReq(overrides = {}) {
	return {
		siteId: 1,
		query: {},
		params: {},
		body: {},
		...overrides,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('Feature: b3-waste-recording, Property 10: Sorting Correctness', () => {
	it('GET / passes correct orderBy to prisma for valid sortField and sortOrder combinations', async () => {
		const getHandler = getRouteHandler('get', '/');

		await fc.assert(
			fc.asyncProperty(
				fc.constantFrom('tanggalMasuk', 'tanggalBatas'),
				fc.constantFrom('asc', 'desc'),
				async (sortField, sortOrder) => {
					vi.clearAllMocks();

					prisma.b3WasteRecord.findMany.mockResolvedValue([]);
					prisma.b3WasteRecord.count.mockResolvedValue(0);
					prisma.b3WasteOutRecord.count.mockResolvedValue(0);

					const req = createMockReq({
						query: { sortField, sortOrder, page: '0', pageSize: '25' },
					});
					const res = createMockRes();

					await getHandler(req, res);

					// Verify prisma.findMany was called with correct orderBy
					expect(prisma.b3WasteRecord.findMany).toHaveBeenCalledTimes(1);
					const callArgs = prisma.b3WasteRecord.findMany.mock.calls[0][0];
					expect(callArgs.orderBy).toEqual({ [sortField]: sortOrder });
				},
			),
			{ numRuns: 100 },
		);
	});

	it('GET / defaults invalid sortField to tanggalMasuk', async () => {
		const getHandler = getRouteHandler('get', '/');

		await fc.assert(
			fc.asyncProperty(
				fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !['tanggalMasuk', 'tanggalBatas'].includes(s)),
				fc.constantFrom('asc', 'desc'),
				async (invalidSortField, sortOrder) => {
					vi.clearAllMocks();

					prisma.b3WasteRecord.findMany.mockResolvedValue([]);
					prisma.b3WasteRecord.count.mockResolvedValue(0);
					prisma.b3WasteOutRecord.count.mockResolvedValue(0);

					const req = createMockReq({
						query: { sortField: invalidSortField, sortOrder, page: '0', pageSize: '25' },
					});
					const res = createMockRes();

					await getHandler(req, res);

					expect(prisma.b3WasteRecord.findMany).toHaveBeenCalledTimes(1);
					const callArgs = prisma.b3WasteRecord.findMany.mock.calls[0][0];
					// Invalid sortField should default to 'tanggalMasuk'
					expect(callArgs.orderBy).toEqual({ tanggalMasuk: sortOrder });
				},
			),
			{ numRuns: 100 },
		);
	});

	it('GET / defaults invalid sortOrder to desc', async () => {
		const getHandler = getRouteHandler('get', '/');

		await fc.assert(
			fc.asyncProperty(
				fc.constantFrom('tanggalMasuk', 'tanggalBatas'),
				fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s !== 'asc' && s !== 'desc'),
				async (sortField, invalidSortOrder) => {
					vi.clearAllMocks();

					prisma.b3WasteRecord.findMany.mockResolvedValue([]);
					prisma.b3WasteRecord.count.mockResolvedValue(0);
					prisma.b3WasteOutRecord.count.mockResolvedValue(0);

					const req = createMockReq({
						query: { sortField, sortOrder: invalidSortOrder, page: '0', pageSize: '25' },
					});
					const res = createMockRes();

					await getHandler(req, res);

					expect(prisma.b3WasteRecord.findMany).toHaveBeenCalledTimes(1);
					const callArgs = prisma.b3WasteRecord.findMany.mock.calls[0][0];
					// Invalid sortOrder should default to 'desc'
					expect(callArgs.orderBy).toEqual({ [sortField]: 'desc' });
				},
			),
			{ numRuns: 100 },
		);
	});

	it('GET / returns records in the order returned by prisma (verifying sort passthrough)', async () => {
		const getHandler = getRouteHandler('get', '/');

		await fc.assert(
			fc.asyncProperty(
				fc.constantFrom('tanggalMasuk', 'tanggalBatas'),
				fc.constantFrom('asc', 'desc'),
				fc.array(
					fc
						.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
						.filter((d) => !isNaN(d.getTime())),
					{ minLength: 2, maxLength: 20 },
				),
				async (sortField, sortOrder, dates) => {
					vi.clearAllMocks();

					// Sort the dates as prisma would
					const sortedDates = [...dates].sort((a, b) =>
						sortOrder === 'asc' ? a.getTime() - b.getTime() : b.getTime() - a.getTime(),
					);

					// Create mock records pre-sorted (simulating what Prisma returns)
					const mockRecords = sortedDates.map((date, idx) => ({
						id: idx + 1,
						siteId: 1,
						jenisLimbahId: 1,
						tanggalMasuk: sortField === 'tanggalMasuk' ? date : new Date('2024-01-01'),
						tanggalBatas: sortField === 'tanggalBatas' ? date : new Date('2024-04-01'),
						sumberLimbah: 'Test Source',
						jumlahMasuk: 100,
						maksimalPenyimpanan: 90,
						petugasPenanggungJawab: 'Tester',
						jenisLimbah: { id: 1, kode: 'A001', nama: 'Test' },
						outRecords: [],
					}));

					prisma.b3WasteRecord.findMany.mockResolvedValue(mockRecords);
					prisma.b3WasteRecord.count.mockResolvedValue(mockRecords.length);
					prisma.b3WasteOutRecord.count.mockResolvedValue(0);

					const req = createMockReq({
						query: { sortField, sortOrder, page: '0', pageSize: '25' },
					});
					const res = createMockRes();

					await getHandler(req, res);

					expect(res.json).toHaveBeenCalled();
					const responseData = res.jsonData.data;

					// Verify that consecutive records maintain sort order
					for (let i = 0; i < responseData.length - 1; i++) {
						const currentDate = new Date(responseData[i][sortField]).getTime();
						const nextDate = new Date(responseData[i + 1][sortField]).getTime();

						if (sortOrder === 'asc') {
							expect(currentDate).toBeLessThanOrEqual(nextDate);
						} else {
							expect(currentDate).toBeGreaterThanOrEqual(nextDate);
						}
					}
				},
			),
			{ numRuns: 100 },
		);
	});
});
