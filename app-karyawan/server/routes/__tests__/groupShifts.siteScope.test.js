import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/prisma.js', () => ({
	default: {
		masterGroupShift: {
			findFirst: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			findMany: vi.fn(),
			delete: vi.fn(),
		},
		employee: {
			findMany: vi.fn(),
			updateMany: vi.fn(),
		},
		masterSite: {
			findUnique: vi.fn(),
		},
		$transaction: vi.fn(),
	},
}));

import prisma from '../../lib/prisma.js';
import router from '../groupShifts.js';

function getRouteHandler(method, path) {
	const layer = router.stack.find((l) => l.route && l.route.path === path && l.route.methods[method]);
	if (!layer) throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
	const handlers = layer.route.stack.map((s) => s.handle);
	return handlers[handlers.length - 1];
}

function createMockReq(overrides = {}) {
	return {
		admin: { id: 1, role: 'admin', employeeId: 1, siteId: 7 },
		isSuperAdmin: false,
		siteFilter: { siteId: 7 },
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
	};
}

async function invoke(handler, req, res) {
	let caughtError = null;
	handler(req, res, (err) => {
		caughtError = err;
	});
	await new Promise((resolve) => setImmediate(resolve));
	return caughtError;
}

beforeEach(() => {
	vi.resetAllMocks();
	prisma.masterGroupShift.findFirst.mockResolvedValue(null);
	prisma.masterGroupShift.findMany.mockResolvedValue([]);
	prisma.$transaction.mockImplementation(async (callback) => callback(prisma));
});

describe('POST /master/group-shifts site scoping', () => {
	it('scopes the employee lookup to the admin site and rejects a foreign employee id', async () => {
		prisma.employee.findMany.mockResolvedValue([
			{ id: 1, fullName: 'Foreman A', employeeNo: 'A1', jobLevel: { name: 'Foreman' } },
		]);

		const handler = getRouteHandler('post', '/');
		const req = createMockReq({
			body: { groupShiftName: 'Shift A', foremanIds: [1], employeeIds: [999] },
		});

		const error = await invoke(handler, req, createMockRes());

		expect(prisma.employee.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ siteId: 7, id: { in: [1, 999] } }),
			}),
		);
		expect(prisma.masterGroupShift.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: expect.objectContaining({ siteId: 7 }) }),
		);
		expect(error).toMatchObject({ statusCode: 400 });
		expect(prisma.masterGroupShift.create).not.toHaveBeenCalled();
		expect(prisma.employee.updateMany).not.toHaveBeenCalled();
	});

	it('rejects a foreign foreman id even when it exists globally', async () => {
		prisma.employee.findMany.mockResolvedValue([]);

		const handler = getRouteHandler('post', '/');
		const req = createMockReq({
			body: { groupShiftName: 'Shift B', foremanIds: [42], employeeIds: [] },
		});

		const error = await invoke(handler, req, createMockRes());

		expect(prisma.employee.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: expect.objectContaining({ siteId: 7 }) }),
		);
		expect(error).toMatchObject({ statusCode: 400 });
		expect(prisma.masterGroupShift.create).not.toHaveBeenCalled();
	});
});
