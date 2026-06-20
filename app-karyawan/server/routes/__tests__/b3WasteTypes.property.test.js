/* eslint-disable import/first, import/extensions */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';

/**
 * Property-Based Test: Unique Waste Type Code Per Site
 *
 * Feature: b3-waste-recording, Property 11: Unique Waste Type Code Per Site
 *
 * **Validates: Requirements 7.5**
 *
 * For any site, attempting to create a B3WasteType with a `kode` that already
 * exists for that same `siteId` SHALL be rejected. Codes in different sites
 * SHALL be allowed to coexist.
 */

// Mock prisma before importing the router
vi.mock('../../lib/prisma.js', () => ({
	default: {
		b3WasteType: {
			findMany: vi.fn(),
			count: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			findFirst: vi.fn(),
			delete: vi.fn(),
		},
		b3WasteRecord: {
			count: vi.fn(),
		},
	},
}));

import prisma from '../../lib/prisma.js';
import router from '../b3WasteTypes.js';

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

describe('Feature: b3-waste-recording, Property 11: Unique Waste Type Code Per Site', () => {
	let postHandler;

	beforeEach(() => {
		vi.clearAllMocks();
		postHandler = getRouteHandler('post', '/');
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should reject duplicate kode within the same siteId with 409', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
				fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
				fc.integer({ min: 1, max: 10000 }),
				async (kode, nama, siteId) => {
					vi.clearAllMocks();

					// First creation succeeds
					prisma.b3WasteType.create.mockResolvedValueOnce({
						id: 1,
						siteId,
						kode: kode.trim(),
						nama: nama.trim(),
						createdAt: new Date(),
						updatedAt: new Date(),
					});

					const req1 = { siteId, body: { kode, nama } };
					const res1 = createMockRes();
					await postHandler(req1, res1);
					expect(res1.statusCode).toBe(201);

					// Second creation with same kode+siteId → Prisma throws P2002
					const prismaError = new Error('Unique constraint failed');
					prismaError.code = 'P2002';
					prisma.b3WasteType.create.mockRejectedValueOnce(prismaError);

					const req2 = { siteId, body: { kode, nama: 'Another name' } };
					const res2 = createMockRes();
					await postHandler(req2, res2);

					// Should be rejected with 409
					expect(res2.statusCode).toBe(409);
					expect(res2.body).toEqual({ message: 'Kode limbah sudah terdaftar' });
				},
			),
			{ numRuns: 100 },
		);
	});

	it('should allow same kode in different sites', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
				fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
				fc.integer({ min: 1, max: 5000 }),
				fc.integer({ min: 5001, max: 10000 }),
				async (kode, nama, siteIdA, siteIdB) => {
					vi.clearAllMocks();

					// Creation in site A succeeds
					prisma.b3WasteType.create.mockResolvedValueOnce({
						id: 1,
						siteId: siteIdA,
						kode: kode.trim(),
						nama: nama.trim(),
						createdAt: new Date(),
						updatedAt: new Date(),
					});

					const reqA = { siteId: siteIdA, body: { kode, nama } };
					const resA = createMockRes();
					await postHandler(reqA, resA);
					expect(resA.statusCode).toBe(201);

					// Creation in site B with same kode succeeds (no P2002 error)
					prisma.b3WasteType.create.mockResolvedValueOnce({
						id: 2,
						siteId: siteIdB,
						kode: kode.trim(),
						nama: nama.trim(),
						createdAt: new Date(),
						updatedAt: new Date(),
					});

					const reqB = { siteId: siteIdB, body: { kode, nama } };
					const resB = createMockRes();
					await postHandler(reqB, resB);

					// Should succeed with 201
					expect(resB.statusCode).toBe(201);
					expect(resB.body.kode).toBe(kode.trim());
					expect(resB.body.siteId).toBe(siteIdB);
				},
			),
			{ numRuns: 100 },
		);
	});
});
