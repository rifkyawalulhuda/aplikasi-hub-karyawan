import { describe, expect, it, vi } from 'vitest';

import requireSiteIsolation from './requireSiteIsolation';

function createMockReqResNext(adminOverrides = {}) {
	const req = {
		admin: {
			id: 1,
			role: 'admin',
			employeeId: 10,
			siteId: 5,
			...adminOverrides,
		},
	};
	const res = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
	};
	const next = vi.fn();
	return { req, res, next };
}

describe('requireSiteIsolation middleware', () => {
	describe('shared modelType', () => {
		const middleware = requireSiteIsolation({ modelType: 'shared' });

		it('sets req.siteFilter to empty object and calls next for any role', () => {
			const { req, res, next } = createMockReqResNext({ role: 'admin', siteId: 5 });
			middleware(req, res, next);

			expect(req.siteFilter).toEqual({});
			expect(next).toHaveBeenCalled();
			expect(res.status).not.toHaveBeenCalled();
		});

		it('passes through for super_admin without setting isSuperAdmin', () => {
			const { req, res, next } = createMockReqResNext({ role: 'super_admin', siteId: null });
			middleware(req, res, next);

			expect(req.siteFilter).toEqual({});
			expect(next).toHaveBeenCalled();
			expect(req.isSuperAdmin).toBeUndefined();
		});

		it('passes through for admin with null siteId (shared data is accessible)', () => {
			const { req, res, next } = createMockReqResNext({ role: 'admin', siteId: null });
			middleware(req, res, next);

			expect(req.siteFilter).toEqual({});
			expect(next).toHaveBeenCalled();
			expect(res.status).not.toHaveBeenCalled();
		});
	});

	describe('per-site modelType (default)', () => {
		const middleware = requireSiteIsolation({ modelType: 'per-site' });

		it('sets empty siteFilter and isSuperAdmin=true for super_admin', () => {
			const { req, res, next } = createMockReqResNext({ role: 'super_admin', siteId: null });
			middleware(req, res, next);

			expect(req.siteFilter).toEqual({});
			expect(req.isSuperAdmin).toBe(true);
			expect(next).toHaveBeenCalled();
			expect(res.status).not.toHaveBeenCalled();
		});

		it('sets siteFilter with siteId and isSuperAdmin=false for admin with valid siteId', () => {
			const { req, res, next } = createMockReqResNext({ role: 'admin', siteId: 7 });
			middleware(req, res, next);

			expect(req.siteFilter).toEqual({ siteId: 7 });
			expect(req.isSuperAdmin).toBe(false);
			expect(next).toHaveBeenCalled();
			expect(res.status).not.toHaveBeenCalled();
		});

		it('sets siteFilter with siteId and isSuperAdmin=false for user with valid siteId', () => {
			const { req, res, next } = createMockReqResNext({ role: 'user', siteId: 3 });
			middleware(req, res, next);

			expect(req.siteFilter).toEqual({ siteId: 3 });
			expect(req.isSuperAdmin).toBe(false);
			expect(next).toHaveBeenCalled();
		});

		it('returns 403 for admin with null siteId', () => {
			const { req, res, next } = createMockReqResNext({ role: 'admin', siteId: null });
			middleware(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Akses ditolak. Admin belum memiliki site yang ditugaskan.',
			});
			expect(next).not.toHaveBeenCalled();
		});

		it('returns 403 for user with undefined siteId', () => {
			const { req, res, next } = createMockReqResNext({ role: 'user', siteId: undefined });
			middleware(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Akses ditolak. Admin belum memiliki site yang ditugaskan.',
			});
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe('default options', () => {
		it('defaults to per-site modelType when no options provided', () => {
			const middleware = requireSiteIsolation();
			const { req, res, next } = createMockReqResNext({ role: 'admin', siteId: 2 });
			middleware(req, res, next);

			expect(req.siteFilter).toEqual({ siteId: 2 });
			expect(req.isSuperAdmin).toBe(false);
			expect(next).toHaveBeenCalled();
		});
	});
});
