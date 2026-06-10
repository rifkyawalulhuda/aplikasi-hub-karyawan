/* eslint-disable import/first, import/extensions */
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Unit tests for server/routes/siteApprovalConfigs.js
 *
 * We mock the Prisma client and test each route handler by extracting
 * handlers from the Express router stack and calling them with mock req/res.
 */

// Mock prisma before importing the router (vitest hoists vi.mock)
vi.mock('../../lib/prisma.js', () => ({
	default: {
		siteApprovalConfig: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
			createMany: vi.fn(),
		},
		masterSite: {
			findUnique: vi.fn(),
		},
		jobLevel: {
			findUnique: vi.fn(),
		},
		$transaction: vi.fn(),
	},
}));

import prisma from '../../lib/prisma.js';
import router from '../siteApprovalConfigs.js';

// Helper to extract route handlers from the Express router
// The route uses withAsync which wraps the handler in a non-async function.
// We extract the inner async handler directly to await it properly.
function getRouteHandler(method, path) {
	const layer = router.stack.find((l) => l.route && l.route.path === path && l.route.methods[method]);
	if (!layer) throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
	const handlers = layer.route.stack.map((s) => s.handle);
	const wrappedHandler = handlers[handlers.length - 1];

	// Return an async function that invokes the wrapper and captures the inner promise
	return async (req, res) => {
		let caughtError = null;
		const next = (err) => {
			caughtError = err;
		};
		// withAsync returns (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
		// We need to await the internal promise. Since withAsync doesn't return it,
		// we call the wrapper and then flush microtasks.
		wrappedHandler(req, res, next);
		// Flush all pending microtasks
		await new Promise((resolve) => {
			setImmediate(resolve);
		});
		if (caughtError) throw caughtError;
	};
}

// Helper to get the requireSuperAdmin middleware (first use() in router.stack that has no route)
function getSuperAdminMiddleware() {
	const layer = router.stack.find((l) => !l.route && l.name !== 'router');
	if (!layer) throw new Error('requireSuperAdmin middleware not found');
	return layer.handle;
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
		admin: { role: 'super_admin' },
		query: {},
		params: {},
		body: {},
		...overrides,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('siteApprovalConfigs routes', () => {
	describe('requireSuperAdmin middleware', () => {
		it('returns 403 for non-super_admin role', () => {
			const middleware = getSuperAdminMiddleware();
			const req = createMockReq({ admin: { role: 'admin' } });
			const res = createMockRes();
			const next = vi.fn();

			middleware(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Akses ditolak. Hanya Super Admin yang dapat mengelola konfigurasi approval.',
			});
			expect(next).not.toHaveBeenCalled();
		});

		it('calls next for super_admin role', () => {
			const middleware = getSuperAdminMiddleware();
			const req = createMockReq({ admin: { role: 'super_admin' } });
			const res = createMockRes();
			const next = vi.fn();

			middleware(req, res, next);

			expect(next).toHaveBeenCalled();
			expect(res.status).not.toHaveBeenCalled();
		});
	});

	describe('GET / — list configs by site', () => {
		it('returns configs list filtered by siteId', async () => {
			const handler = getRouteHandler('get', '/');
			const mockConfigs = [
				{
					id: 1,
					siteId: 1,
					jobLevelId: 1,
					approvalRank: 1,
					maxApprovalRank: 5,
					jobLevel: { id: 1, name: 'Foreman' },
				},
				{
					id: 2,
					siteId: 1,
					jobLevelId: 2,
					approvalRank: 2,
					maxApprovalRank: 5,
					jobLevel: { id: 2, name: 'General Foreman' },
				},
			];
			prisma.siteApprovalConfig.findMany.mockResolvedValue(mockConfigs);

			const req = createMockReq({ query: { siteId: '1' } });
			const res = createMockRes();

			await handler(req, res);

			expect(prisma.siteApprovalConfig.findMany).toHaveBeenCalledWith({
				where: { siteId: 1 },
				include: { jobLevel: { select: { id: true, name: true } } },
				orderBy: { approvalRank: 'asc' },
			});
			expect(res.json).toHaveBeenCalledWith(mockConfigs);
		});

		it('returns all configs when no siteId provided', async () => {
			const handler = getRouteHandler('get', '/');
			prisma.siteApprovalConfig.findMany.mockResolvedValue([]);

			const req = createMockReq({ query: {} });
			const res = createMockRes();

			await handler(req, res);

			expect(prisma.siteApprovalConfig.findMany).toHaveBeenCalledWith({
				where: {},
				include: { jobLevel: { select: { id: true, name: true } } },
				orderBy: { approvalRank: 'asc' },
			});
			expect(res.json).toHaveBeenCalledWith([]);
		});
	});

	describe('GET /:id — get single config', () => {
		it('returns config with relations for valid id', async () => {
			const handler = getRouteHandler('get', '/:id');
			const mockConfig = {
				id: 1,
				siteId: 1,
				jobLevelId: 1,
				approvalRank: 1,
				maxApprovalRank: 5,
				jobLevel: { id: 1, name: 'Foreman' },
				site: { id: 1, name: 'Site A' },
			};
			prisma.siteApprovalConfig.findUnique.mockResolvedValue(mockConfig);

			const req = createMockReq({ params: { id: '1' } });
			const res = createMockRes();

			await handler(req, res);

			expect(prisma.siteApprovalConfig.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				include: {
					jobLevel: { select: { id: true, name: true } },
					site: { select: { id: true, name: true } },
				},
			});
			expect(res.json).toHaveBeenCalledWith(mockConfig);
		});

		it('returns 404 for non-existent id', async () => {
			const handler = getRouteHandler('get', '/:id');
			prisma.siteApprovalConfig.findUnique.mockResolvedValue(null);

			const req = createMockReq({ params: { id: '999' } });
			const res = createMockRes();

			await handler(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Konfigurasi approval tidak ditemukan.',
			});
		});

		it('returns 404 for invalid (NaN) id', async () => {
			const handler = getRouteHandler('get', '/:id');

			const req = createMockReq({ params: { id: 'abc' } });
			const res = createMockRes();

			await handler(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Konfigurasi approval tidak ditemukan.',
			});
		});
	});

	describe('POST / — create single config', () => {
		it('creates and returns config with valid data (201)', async () => {
			const handler = getRouteHandler('post', '/');
			prisma.masterSite.findUnique.mockResolvedValue({ id: 1, name: 'Site A' });
			prisma.jobLevel.findUnique.mockResolvedValue({ id: 1, name: 'Foreman' });
			prisma.siteApprovalConfig.findUnique.mockResolvedValue(null);
			const created = {
				id: 1,
				siteId: 1,
				jobLevelId: 1,
				approvalRank: 2,
				maxApprovalRank: 5,
				jobLevel: { id: 1, name: 'Foreman' },
				site: { id: 1, name: 'Site A' },
			};
			prisma.siteApprovalConfig.create.mockResolvedValue(created);

			const req = createMockReq({
				body: { siteId: 1, jobLevelId: 1, approvalRank: 2, maxApprovalRank: 5 },
			});
			const res = createMockRes();

			await handler(req, res);

			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(created);
		});

		it('returns 400 for invalid approvalRank (zero)', async () => {
			const handler = getRouteHandler('post', '/');

			const req = createMockReq({
				body: { siteId: 1, jobLevelId: 1, approvalRank: 0, maxApprovalRank: 5 },
			});
			const res = createMockRes();

			await handler(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				message: 'approvalRank harus berupa bilangan bulat positif atau kosong.',
			});
		});

		it('returns 400 for invalid approvalRank (negative)', async () => {
			const handler = getRouteHandler('post', '/');

			const req = createMockReq({
				body: { siteId: 1, jobLevelId: 1, approvalRank: -1, maxApprovalRank: 5 },
			});
			const res = createMockRes();

			await handler(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				message: 'approvalRank harus berupa bilangan bulat positif atau kosong.',
			});
		});

		it('returns 400 for invalid maxApprovalRank (zero)', async () => {
			const handler = getRouteHandler('post', '/');

			const req = createMockReq({
				body: { siteId: 1, jobLevelId: 1, approvalRank: 1, maxApprovalRank: 0 },
			});
			const res = createMockRes();

			await handler(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				message: 'maxApprovalRank harus berupa bilangan bulat positif.',
			});
		});

		it('returns 400 for missing maxApprovalRank', async () => {
			const handler = getRouteHandler('post', '/');

			const req = createMockReq({
				body: { siteId: 1, jobLevelId: 1, approvalRank: 1 },
			});
			const res = createMockRes();

			await handler(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				message: 'maxApprovalRank harus berupa bilangan bulat positif.',
			});
		});

		it('returns 400 for non-existent siteId', async () => {
			const handler = getRouteHandler('post', '/');
			prisma.masterSite.findUnique.mockResolvedValue(null);

			const req = createMockReq({
				body: { siteId: 999, jobLevelId: 1, approvalRank: 1, maxApprovalRank: 5 },
			});
			const res = createMockRes();

			await handler(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ message: 'Site tidak ditemukan.' });
		});

		it('returns 400 for non-existent jobLevelId', async () => {
			const handler = getRouteHandler('post', '/');
			prisma.masterSite.findUnique.mockResolvedValue({ id: 1, name: 'Site A' });
			prisma.jobLevel.findUnique.mockResolvedValue(null);

			const req = createMockReq({
				body: { siteId: 1, jobLevelId: 999, approvalRank: 1, maxApprovalRank: 5 },
			});
			const res = createMockRes();

			await handler(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ message: 'Job Level tidak ditemukan.' });
		});

		it('returns 409 for duplicate siteId + jobLevelId', async () => {
			const handler = getRouteHandler('post', '/');
			prisma.masterSite.findUnique.mockResolvedValue({ id: 1, name: 'Site A' });
			prisma.jobLevel.findUnique.mockResolvedValue({ id: 1, name: 'Foreman' });
			prisma.siteApprovalConfig.findUnique.mockResolvedValue({ id: 1 });

			const req = createMockReq({
				body: { siteId: 1, jobLevelId: 1, approvalRank: 1, maxApprovalRank: 5 },
			});
			const res = createMockRes();

			await handler(req, res);

			expect(res.status).toHaveBeenCalledWith(409);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Konfigurasi approval untuk site dan job level ini sudah ada.',
			});
		});

		it('allows null approvalRank (creates successfully)', async () => {
			const handler = getRouteHandler('post', '/');
			prisma.masterSite.findUnique.mockResolvedValue({ id: 1, name: 'Site A' });
			prisma.jobLevel.findUnique.mockResolvedValue({ id: 1, name: 'Staff' });
			prisma.siteApprovalConfig.findUnique.mockResolvedValue(null);
			const created = {
				id: 1,
				siteId: 1,
				jobLevelId: 1,
				approvalRank: null,
				maxApprovalRank: 5,
				jobLevel: { id: 1, name: 'Staff' },
				site: { id: 1, name: 'Site A' },
			};
			prisma.siteApprovalConfig.create.mockResolvedValue(created);

			const req = createMockReq({
				body: { siteId: 1, jobLevelId: 1, approvalRank: null, maxApprovalRank: 5 },
			});
			const res = createMockRes();

			await handler(req, res);

			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(created);
		});
	});

	describe('PUT /:id — update single config', () => {
		it('updates and returns config with valid data', async () => {
			const handler = getRouteHandler('put', '/:id');
			prisma.siteApprovalConfig.findUnique.mockResolvedValue({ id: 1 });
			const updated = {
				id: 1,
				siteId: 1,
				jobLevelId: 1,
				approvalRank: 3,
				maxApprovalRank: 6,
				jobLevel: { id: 1, name: 'Foreman' },
				site: { id: 1, name: 'Site A' },
			};
			prisma.siteApprovalConfig.update.mockResolvedValue(updated);

			const req = createMockReq({
				params: { id: '1' },
				body: { approvalRank: 3, maxApprovalRank: 6 },
			});
			const res = createMockRes();

			await handler(req, res);

			expect(res.json).toHaveBeenCalledWith(updated);
			expect(res.status).not.toHaveBeenCalled();
		});

		it('returns 404 for non-existent id', async () => {
			const handler = getRouteHandler('put', '/:id');
			prisma.siteApprovalConfig.findUnique.mockResolvedValue(null);

			const req = createMockReq({
				params: { id: '999' },
				body: { approvalRank: 1, maxApprovalRank: 5 },
			});
			const res = createMockRes();

			await handler(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Konfigurasi approval tidak ditemukan.',
			});
		});

		it('returns 400 for invalid approvalRank', async () => {
			const handler = getRouteHandler('put', '/:id');

			const req = createMockReq({
				params: { id: '1' },
				body: { approvalRank: -5, maxApprovalRank: 5 },
			});
			const res = createMockRes();

			await handler(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				message: 'approvalRank harus berupa bilangan bulat positif atau kosong.',
			});
		});

		it('returns 400 for invalid maxApprovalRank', async () => {
			const handler = getRouteHandler('put', '/:id');

			const req = createMockReq({
				params: { id: '1' },
				body: { approvalRank: 1, maxApprovalRank: -1 },
			});
			const res = createMockRes();

			await handler(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				message: 'maxApprovalRank harus berupa bilangan bulat positif.',
			});
		});
	});

	describe('DELETE /:id — delete single config', () => {
		it('deletes and returns success message', async () => {
			const handler = getRouteHandler('delete', '/:id');
			prisma.siteApprovalConfig.findUnique.mockResolvedValue({ id: 1 });
			prisma.siteApprovalConfig.delete.mockResolvedValue({ id: 1 });

			const req = createMockReq({ params: { id: '1' } });
			const res = createMockRes();

			await handler(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Konfigurasi approval berhasil dihapus.',
			});
		});

		it('returns 404 for non-existent id', async () => {
			const handler = getRouteHandler('delete', '/:id');
			prisma.siteApprovalConfig.findUnique.mockResolvedValue(null);

			const req = createMockReq({ params: { id: '999' } });
			const res = createMockRes();

			await handler(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Konfigurasi approval tidak ditemukan.',
			});
		});

		it('returns 404 for invalid (NaN) id', async () => {
			const handler = getRouteHandler('delete', '/:id');

			const req = createMockReq({ params: { id: 'xyz' } });
			const res = createMockRes();

			await handler(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Konfigurasi approval tidak ditemukan.',
			});
		});
	});

	describe('PUT /bulk — replace all configs for a site', () => {
		it('replaces configs and returns new list on success', async () => {
			const handler = getRouteHandler('put', '/bulk');
			prisma.masterSite.findUnique.mockResolvedValue({ id: 1, name: 'Site A' });
			const resultConfigs = [
				{
					id: 10,
					siteId: 1,
					jobLevelId: 1,
					approvalRank: 1,
					maxApprovalRank: 5,
					jobLevel: { id: 1, name: 'Foreman' },
				},
				{
					id: 11,
					siteId: 1,
					jobLevelId: 2,
					approvalRank: 2,
					maxApprovalRank: 5,
					jobLevel: { id: 2, name: 'General Foreman' },
				},
			];
			prisma.$transaction.mockImplementation(async (fn) => {
				const tx = {
					siteApprovalConfig: {
						deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
						createMany: vi.fn().mockResolvedValue({ count: 2 }),
						findMany: vi.fn().mockResolvedValue(resultConfigs),
					},
				};
				return fn(tx);
			});

			const req = createMockReq({
				body: {
					siteId: 1,
					entries: [
						{ jobLevelId: 1, approvalRank: 1, maxApprovalRank: 5 },
						{ jobLevelId: 2, approvalRank: 2, maxApprovalRank: 5 },
					],
				},
			});
			const res = createMockRes();

			await handler(req, res);

			expect(res.json).toHaveBeenCalledWith(resultConfigs);
		});

		it('returns 400 for non-existent siteId', async () => {
			const handler = getRouteHandler('put', '/bulk');
			prisma.masterSite.findUnique.mockResolvedValue(null);

			const req = createMockReq({
				body: { siteId: 999, entries: [] },
			});
			const res = createMockRes();

			await handler(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ message: 'Site tidak ditemukan.' });
		});

		it('returns 400 for duplicate jobLevelIds in entries', async () => {
			const handler = getRouteHandler('put', '/bulk');
			prisma.masterSite.findUnique.mockResolvedValue({ id: 1, name: 'Site A' });

			const req = createMockReq({
				body: {
					siteId: 1,
					entries: [
						{ jobLevelId: 1, approvalRank: 1, maxApprovalRank: 5 },
						{ jobLevelId: 1, approvalRank: 2, maxApprovalRank: 5 },
					],
				},
			});
			const res = createMockRes();

			await handler(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Terdapat duplikasi Job Level dalam konfigurasi.',
			});
		});

		it('returns 400 for invalid approvalRank in entries', async () => {
			const handler = getRouteHandler('put', '/bulk');
			prisma.masterSite.findUnique.mockResolvedValue({ id: 1, name: 'Site A' });

			const req = createMockReq({
				body: {
					siteId: 1,
					entries: [{ jobLevelId: 1, approvalRank: -1, maxApprovalRank: 5 }],
				},
			});
			const res = createMockRes();

			await handler(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				message: 'approvalRank harus berupa bilangan bulat positif atau kosong.',
			});
		});

		it('returns 400 for invalid maxApprovalRank in entries', async () => {
			const handler = getRouteHandler('put', '/bulk');
			prisma.masterSite.findUnique.mockResolvedValue({ id: 1, name: 'Site A' });

			const req = createMockReq({
				body: {
					siteId: 1,
					entries: [{ jobLevelId: 1, approvalRank: 1, maxApprovalRank: 0 }],
				},
			});
			const res = createMockRes();

			await handler(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				message: 'maxApprovalRank harus berupa bilangan bulat positif.',
			});
		});

		it('handles empty entries array (clears all configs)', async () => {
			const handler = getRouteHandler('put', '/bulk');
			prisma.masterSite.findUnique.mockResolvedValue({ id: 1, name: 'Site A' });
			prisma.$transaction.mockImplementation(async (fn) => {
				const tx = {
					siteApprovalConfig: {
						deleteMany: vi.fn().mockResolvedValue({ count: 3 }),
						createMany: vi.fn().mockResolvedValue({ count: 0 }),
						findMany: vi.fn().mockResolvedValue([]),
					},
				};
				return fn(tx);
			});

			const req = createMockReq({
				body: { siteId: 1, entries: [] },
			});
			const res = createMockRes();

			await handler(req, res);

			expect(res.json).toHaveBeenCalledWith([]);
		});
	});
});
