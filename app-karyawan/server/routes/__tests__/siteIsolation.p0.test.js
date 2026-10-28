/* eslint-disable import/first, import/extensions */
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Regression tests for cross-site data leakage (P0 endpoints).
 *
 * Every admin router must:
 * - filter list queries by the admin's site
 * - return 404 for records that belong to another site
 * - stamp created records with the admin's site
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
	});

	const prisma = {
		warningLetter: createModel(),
		guidanceRecord: createModel(),
		employeeLicenseCertification: createModel(),
		unitLicenseCertification: createModel(),
		employeeLeaveDatabase: createModel(),
		employeeLeaveBalanceSeed: createModel(),
		emailWorkflowFailureLog: createModel(),
		employee: createModel(),
		masterDokPkb: createModel(),
		masterDokKaryawan: createModel(),
		masterUnit: createModel(),
		masterVendor: createModel(),
		masterCutiKaryawan: createModel(),
		employeeLeave: createModel(),
		employeeLeaveApproval: createModel(),
	};

	prisma.$transaction = vi.fn(async (callback) => callback(prisma));

	return { default: prisma };
});

import prisma from '../../lib/prisma.js';
import emailWorkflowFailuresRouter from '../emailWorkflowFailures.js';
import employeeLeaveBalanceSeedsRouter from '../employeeLeaveBalanceSeeds.js';
import employeeLeaveDatabaseRouter from '../employeeLeaveDatabase.js';
import guidanceRecordsRouter from '../guidanceRecords.js';
import licenseCertificationsRouter from '../licenseCertifications.js';
import unitLicenseCertificationsRouter from '../unitLicenseCertifications.js';
import warningLettersRouter from '../warningLetters.js';

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

function createMockReq(overrides = {}) {
	return {
		admin: { id: 1, role: 'admin', employeeId: 99, siteId: 7 },
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
		send: vi.fn(function send() {
			return this;
		}),
	};
}

function expectSiteFiltered(mockFn) {
	const where = mockFn.mock.calls[0][0].where;
	expect(where.siteId).toBe(7);
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('warning letters site isolation', () => {
	it('GET / filters records by the admin site', async () => {
		const handler = getRouteHandler(warningLettersRouter, 'get', '/');
		const res = createMockRes();

		await handler(createMockReq(), res);

		expectSiteFiltered(prisma.warningLetter.findMany);
		expect(res.statusCode).toBe(200);
	});

	it('GET / returns every site for super_admin', async () => {
		const handler = getRouteHandler(warningLettersRouter, 'get', '/');
		const res = createMockRes();

		await handler(createMockReq({ admin: { id: 1, role: 'super_admin', employeeId: 99, siteId: null } }), res);

		expect(prisma.warningLetter.findMany.mock.calls[0][0].where.siteId).toBeUndefined();
	});

	it('GET /:id returns 404 for a record from another site', async () => {
		prisma.warningLetter.findFirst.mockResolvedValue(null);
		const handler = getRouteHandler(warningLettersRouter, 'get', '/:id');
		const res = createMockRes();

		await handler(createMockReq({ params: { id: '123' } }), res);

		expect(res.statusCode).toBe(404);
		expect(prisma.warningLetter.findFirst.mock.calls[0][0].where).toMatchObject({ id: 123, siteId: 7 });
	});

	it('DELETE /:id returns 404 for a record from another site', async () => {
		prisma.warningLetter.findFirst.mockResolvedValue(null);
		const handler = getRouteHandler(warningLettersRouter, 'delete', '/:id');
		const res = createMockRes();

		await handler(createMockReq({ params: { id: '123' } }), res);

		expect(res.statusCode).toBe(404);
		expect(prisma.warningLetter.delete).not.toHaveBeenCalled();
	});

	it('POST stamps the admin site and only accepts employees from that site', async () => {
		prisma.employee.findFirst.mockResolvedValue({
			id: 10,
			department: { name: 'IT' },
			jobRole: { name: 'Staff' },
			jobLevel: { name: 'Dept. Manager' },
		});
		prisma.warningLetter.create.mockImplementation(async ({ data }) => ({
			id: 1,
			...data,
			letterDate: new Date(),
			employee: {
				fullName: 'Budi',
				employeeNo: 'CLC-001',
				department: { name: 'IT' },
				jobRole: { name: 'Staff' },
				jobLevel: { name: 'Dept. Manager' },
			},
			superiorEmployee: { fullName: 'Siti', jobLevel: { name: 'Dept. Manager' } },
		}));

		const handler = getRouteHandler(warningLettersRouter, 'post', '/');
		const res = createMockRes();

		await handler(
			createMockReq({
				body: {
					category: 'REPRIMAND',
					employeeId: 10,
					superiorEmployeeId: 10,
					letterNumber: 'SP-01',
					letterDate: '2026-01-01',
					violation: 'Terlambat',
				},
			}),
			res,
		);

		expect(prisma.warningLetter.create.mock.calls[0][0].data.siteId).toBe(7);
		expect(prisma.employee.findFirst.mock.calls[0][0].where).toMatchObject({ id: 10, siteId: 7 });
	});
});

describe('guidance records site isolation', () => {
	it('GET / filters records by the admin site', async () => {
		const handler = getRouteHandler(guidanceRecordsRouter, 'get', '/');
		const res = createMockRes();

		await handler(createMockReq(), res);

		expectSiteFiltered(prisma.guidanceRecord.findMany);
	});

	it('GET /:id returns 404 for a record from another site', async () => {
		prisma.guidanceRecord.findFirst.mockResolvedValue(null);
		const handler = getRouteHandler(guidanceRecordsRouter, 'get', '/:id');
		const res = createMockRes();

		await handler(createMockReq({ params: { id: '55' } }), res);

		expect(res.statusCode).toBe(404);
	});

	it('POST stamps the admin site', async () => {
		prisma.employee.findFirst.mockResolvedValue({
			id: 10,
			department: { name: 'IT' },
			jobLevel: { name: 'Staff' },
		});
		prisma.guidanceRecord.create.mockImplementation(async ({ data }) => ({
			id: 1,
			...data,
			meetingDate: new Date(),
			employee: {
				fullName: 'Budi',
				employeeNo: 'CLC-001',
				department: { name: 'IT' },
				jobLevel: { name: 'Staff' },
			},
		}));

		const handler = getRouteHandler(guidanceRecordsRouter, 'post', '/');
		const res = createMockRes();

		await handler(
			createMockReq({
				body: {
					category: 'GUIDANCE',
					employeeId: 10,
					meetingNumber: 1,
					meetingDate: '2026-01-01',
					meetingTime: '09:00',
					location: 'Meeting Room',
					problemFaced: 'A',
					problemCause: 'B',
					problemSolving: 'C',
				},
			}),
			res,
		);

		expect(prisma.guidanceRecord.create.mock.calls[0][0].data.siteId).toBe(7);
	});
});

describe('employee license certifications site isolation', () => {
	it('GET / filters records by the admin site', async () => {
		const handler = getRouteHandler(licenseCertificationsRouter, 'get', '/');
		const res = createMockRes();

		await handler(createMockReq(), res);

		expectSiteFiltered(prisma.employeeLicenseCertification.findMany);
	});

	it('GET /:id returns 404 for a record from another site', async () => {
		prisma.employeeLicenseCertification.findFirst.mockResolvedValue(null);
		const handler = getRouteHandler(licenseCertificationsRouter, 'get', '/:id');
		const res = createMockRes();

		await handler(createMockReq({ params: { id: '77' } }), res);

		expect(res.statusCode).toBe(404);
	});

	it('POST stamps the admin site and validates the employee site', async () => {
		prisma.employee.findFirst.mockResolvedValue({ id: 10 });
		prisma.masterDokKaryawan.findUnique.mockResolvedValue({ id: 2, issuer: 'Disnaker' });
		prisma.employeeLicenseCertification.create.mockImplementation(async ({ data }) => ({
			id: 1,
			...data,
			expiryDate: new Date(),
			employee: { fullName: 'Budi', employeeNo: 'CLC-001' },
			masterDokKaryawan: { documentName: 'SIO' },
		}));

		const handler = getRouteHandler(licenseCertificationsRouter, 'post', '/');
		const res = createMockRes();

		await handler(
			createMockReq({
				body: {
					employeeId: 10,
					masterDokKaryawanId: 2,
					type: 'SIO',
					documentNumber: '123',
					expiryDate: '2027-01-01',
				},
			}),
			res,
		);

		expect(prisma.employeeLicenseCertification.create.mock.calls[0][0].data.siteId).toBe(7);
		expect(prisma.employee.findFirst.mock.calls[0][0].where).toMatchObject({ id: 10, siteId: 7 });
	});
});

describe('unit license certifications site isolation', () => {
	it('GET / filters records by the admin site', async () => {
		const handler = getRouteHandler(unitLicenseCertificationsRouter, 'get', '/');
		const res = createMockRes();

		await handler(createMockReq(), res);

		expectSiteFiltered(prisma.unitLicenseCertification.findMany);
	});

	it('GET /:id returns 404 for a record from another site', async () => {
		prisma.unitLicenseCertification.findFirst.mockResolvedValue(null);
		const handler = getRouteHandler(unitLicenseCertificationsRouter, 'get', '/:id');
		const res = createMockRes();

		await handler(createMockReq({ params: { id: '88' } }), res);

		expect(res.statusCode).toBe(404);
	});

	it('POST stamps the admin site and validates unit + vendor site', async () => {
		prisma.masterUnit.findFirst.mockResolvedValue({ id: 3 });
		prisma.masterVendor.findFirst.mockResolvedValue({ id: 4 });
		prisma.unitLicenseCertification.create.mockImplementation(async ({ data }) => ({
			id: 1,
			...data,
			expiryDate: new Date(),
			masterUnit: { unitName: 'Forklift' },
			vendor: { vendorName: 'Vendor A' },
		}));

		const handler = getRouteHandler(unitLicenseCertificationsRouter, 'post', '/');
		const res = createMockRes();

		await handler(
			createMockReq({
				body: {
					masterUnitId: 3,
					vendorId: 4,
					assetNo: 'A-1',
					documentNumber: 'DOC-1',
					issuedBy: 'Disnaker',
					expiryDate: '2027-01-01',
				},
			}),
			res,
		);

		expect(prisma.unitLicenseCertification.create.mock.calls[0][0].data.siteId).toBe(7);
		expect(prisma.masterUnit.findFirst.mock.calls[0][0].where).toMatchObject({ id: 3, siteId: 7 });
		expect(prisma.masterVendor.findFirst.mock.calls[0][0].where).toMatchObject({ id: 4, siteId: 7 });
	});
});

describe('employee leave balance seeds site isolation', () => {
	it('GET / filters records by the admin site', async () => {
		const handler = getRouteHandler(employeeLeaveBalanceSeedsRouter, 'get', '/');
		const res = createMockRes();

		await handler(createMockReq(), res);

		expectSiteFiltered(prisma.employeeLeaveBalanceSeed.findMany);
	});

	it('PUT /:id returns 404 for a record from another site', async () => {
		prisma.employeeLeaveBalanceSeed.findFirst.mockResolvedValue(null);
		const handler = getRouteHandler(employeeLeaveBalanceSeedsRouter, 'put', '/:id');
		const res = createMockRes();

		await handler(createMockReq({ params: { id: '9' }, body: {} }), res);

		expect(res.statusCode).toBe(404);
	});
});

describe('employee leave database site isolation', () => {
	it('GET / filters records by the admin site', async () => {
		const handler = getRouteHandler(employeeLeaveDatabaseRouter, 'get', '/');
		const res = createMockRes();

		await handler(createMockReq(), res);

		expectSiteFiltered(prisma.employeeLeaveDatabase.findMany);
	});

	it('GET /export filters records by the admin site', async () => {
		const handler = getRouteHandler(employeeLeaveDatabaseRouter, 'get', '/export');
		const res = createMockRes();
		res.setHeader = vi.fn();
		res.end = vi.fn();
		res.download = vi.fn();

		await handler(createMockReq(), res);

		const call = prisma.employeeLeaveDatabase.findMany.mock.calls[0][0];
		expect(call.where.siteId).toBe(7);
	});

	it('DELETE /:id returns 404 for a record from another site', async () => {
		prisma.employeeLeaveDatabase.findFirst.mockResolvedValue(null);
		const handler = getRouteHandler(employeeLeaveDatabaseRouter, 'delete', '/:id');
		const res = createMockRes();

		await handler(createMockReq({ params: { id: '12' } }), res);

		expect(res.statusCode).toBe(404);
		expect(prisma.employeeLeaveDatabase.delete).not.toHaveBeenCalled();
	});
});

describe('email workflow failures site isolation', () => {
	it('GET / filters records by the admin site', async () => {
		const handler = getRouteHandler(emailWorkflowFailuresRouter, 'get', '/');
		const res = createMockRes();

		await handler(createMockReq(), res);

		expectSiteFiltered(prisma.emailWorkflowFailureLog.findMany);
	});

	it('POST /:id/resolve returns 404 for a log from another site', async () => {
		prisma.emailWorkflowFailureLog.findFirst.mockResolvedValue(null);
		const handler = getRouteHandler(emailWorkflowFailuresRouter, 'post', '/:id/resolve');
		const res = createMockRes();

		await handler(createMockReq({ params: { id: '3' }, body: { note: 'ok' } }), res);

		expect(res.statusCode).toBe(404);
		expect(prisma.emailWorkflowFailureLog.update).not.toHaveBeenCalled();
	});
});