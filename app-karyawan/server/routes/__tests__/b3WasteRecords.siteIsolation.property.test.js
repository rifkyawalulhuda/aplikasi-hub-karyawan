/* eslint-disable import/first, import/extensions */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';

/**
 * Property 7: Site Isolation Invariant
 *
 * For any API request with a given `siteId`:
 * - All records returned by read operations SHALL have `siteId` matching the requesting admin's active site
 * - All newly created records SHALL have `siteId` automatically set to the admin's active site
 * - Update and delete operations on records with a different `siteId` SHALL be rejected with an access denied error
 *
 * **Validates: Requirements 5.4, 10.1, 10.2, 10.3, 10.4**
 *
 * Feature: b3-waste-recording, Property 7: Site Isolation Invariant
 */

// Mock prisma before importing the router
vi.mock('../../lib/prisma.js', () => ({
	default: {
		b3WasteRecord: {
			findMany: vi.fn(),
			count: vi.fn(),
			create: vi.fn(),
			findFirst: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
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
		sentStatus: null,
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

describe('Feature: b3-waste-recording, Property 7: Site Isolation Invariant', () => {
	it('GET returns only records filtered by req.siteId', async () => {
		const getHandler = getRouteHandler('get', '/');

		await fc.assert(
			fc.asyncProperty(fc.integer({ min: 1, max: 10000 }), async (siteId) => {
				vi.clearAllMocks();

				// Mock findMany to return empty array — the important thing is that
				// the query uses the correct siteId filter
				prisma.b3WasteRecord.findMany.mockResolvedValue([]);
				prisma.b3WasteRecord.count.mockResolvedValue(0);

				const req = createMockReq({ siteId });
				const res = createMockRes();

				await getHandler(req, res);

				// Verify findMany was called with where: { siteId }
				expect(prisma.b3WasteRecord.findMany).toHaveBeenCalledTimes(1);
				const findManyCall = prisma.b3WasteRecord.findMany.mock.calls[0][0];
				expect(findManyCall.where.siteId).toBe(siteId);

				// Verify count was also scoped by siteId
				expect(prisma.b3WasteRecord.count).toHaveBeenCalledTimes(1);
				const countCall = prisma.b3WasteRecord.count.mock.calls[0][0];
				expect(countCall.where.siteId).toBe(siteId);

				// Verify successful response
				expect(res.statusCode).toBe(200);
			}),
			{ numRuns: 100 },
		);
	});

	it('POST creates records with siteId automatically set from req.siteId', async () => {
		const postHandler = getRouteHandler('post', '/');

		await fc.assert(
			fc.asyncProperty(fc.integer({ min: 1, max: 10000 }), async (siteId) => {
				vi.clearAllMocks();

				// Mock create to capture the data argument
				prisma.b3WasteRecord.create.mockImplementation(async ({ data }) => ({
					id: 1,
					...data,
					jenisLimbah: { id: data.jenisLimbahId, kode: 'TST', nama: 'Test' },
					outRecords: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				}));

				const req = createMockReq({
					siteId,
					body: {
						jenisLimbahId: 1,
						tanggalMasuk: '2024-06-15',
						sumberLimbah: 'Warehouse',
						jumlahMasuk: 100.5,
						maksimalPenyimpanan: 90,
						petugasPenanggungJawab: 'Ahmad Fauzi',
					},
				});
				const res = createMockRes();

				await postHandler(req, res);

				// Verify creation was successful
				expect(res.status).toHaveBeenCalledWith(201);

				// Verify prisma.create was called with siteId from req.siteId
				expect(prisma.b3WasteRecord.create).toHaveBeenCalledTimes(1);
				const createCall = prisma.b3WasteRecord.create.mock.calls[0][0];
				expect(createCall.data.siteId).toBe(siteId);
			}),
			{ numRuns: 100 },
		);
	});

	it('PUT on records with different siteId returns 404', async () => {
		const putHandler = getRouteHandler('put', '/:id');

		await fc.assert(
			fc.asyncProperty(
				fc.integer({ min: 1, max: 10000 }),
				fc.integer({ min: 1, max: 10000 }),
				fc.integer({ min: 1, max: 1000 }),
				async (reqSiteId, recordSiteId, recordId) => {
					// Ensure the two siteIds are different
					fc.pre(reqSiteId !== recordSiteId);

					vi.clearAllMocks();

					// findFirst returns null because record belongs to a different site
					prisma.b3WasteRecord.findFirst.mockResolvedValue(null);

					const req = createMockReq({
						siteId: reqSiteId,
						params: { id: String(recordId) },
						body: {
							jenisLimbahId: 1,
							tanggalMasuk: '2024-06-15',
							sumberLimbah: 'Warehouse',
							jumlahMasuk: 100.5,
							maksimalPenyimpanan: 90,
						},
					});
					const res = createMockRes();

					await putHandler(req, res);

					// Verify findFirst was called with the requesting siteId
					expect(prisma.b3WasteRecord.findFirst).toHaveBeenCalledTimes(1);
					const findCall = prisma.b3WasteRecord.findFirst.mock.calls[0][0];
					expect(findCall.where.siteId).toBe(reqSiteId);
					expect(findCall.where.id).toBe(recordId);

					// Verify 404 response (record not found for requesting site)
					expect(res.status).toHaveBeenCalledWith(404);
					expect(res.jsonData.message).toBe('Data tidak ditemukan');

					// Verify update was never called
					expect(prisma.b3WasteRecord.update).not.toHaveBeenCalled();
				},
			),
			{ numRuns: 100 },
		);
	});

	it('DELETE on records with different siteId returns 404', async () => {
		const deleteHandler = getRouteHandler('delete', '/:id');

		await fc.assert(
			fc.asyncProperty(
				fc.integer({ min: 1, max: 10000 }),
				fc.integer({ min: 1, max: 10000 }),
				fc.integer({ min: 1, max: 1000 }),
				async (reqSiteId, recordSiteId, recordId) => {
					// Ensure the two siteIds are different
					fc.pre(reqSiteId !== recordSiteId);

					vi.clearAllMocks();

					// findFirst returns null because record belongs to a different site
					prisma.b3WasteRecord.findFirst.mockResolvedValue(null);

					const req = createMockReq({
						siteId: reqSiteId,
						params: { id: String(recordId) },
					});
					const res = createMockRes();

					await deleteHandler(req, res);

					// Verify findFirst was called with the requesting siteId
					expect(prisma.b3WasteRecord.findFirst).toHaveBeenCalledTimes(1);
					const findCall = prisma.b3WasteRecord.findFirst.mock.calls[0][0];
					expect(findCall.where.siteId).toBe(reqSiteId);
					expect(findCall.where.id).toBe(recordId);

					// Verify 404 response (record not found for requesting site)
					expect(res.status).toHaveBeenCalledWith(404);
					expect(res.jsonData.message).toBe('Data tidak ditemukan');

					// Verify delete was never called
					expect(prisma.b3WasteRecord.delete).not.toHaveBeenCalled();
				},
			),
			{ numRuns: 100 },
		);
	});
});
