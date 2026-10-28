import { describe, expect, it, vi } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
	default: {
		employee: {
			findUnique: vi.fn(),
		},
	},
}));

import prisma from '../lib/prisma.js';
import { createEmployeeAccessToken } from '../lib/employeeSession.js';
import requireEmployeeAuth from './requireEmployeeAuth.js';

function createRes() {
	return {
		statusCode: 200,
		body: null,
		status: vi.fn(function status(code) {
			this.statusCode = code;
			return this;
		}),
		json: vi.fn(function json(data) {
			this.body = data;
			return this;
		}),
	};
}

describe('employee session revocation', () => {
	it('embeds the employee tokenVersion in the access token', () => {
		const { token } = createEmployeeAccessToken({ id: 5, employeeNo: 'E5', tokenVersion: 3 });
		const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));

		expect(payload.tv).toBe(3);
		expect(payload.type).toBe('employee-access');
	});

	it('rejects a token whose tokenVersion no longer matches the stored employee', async () => {
		const { token } = createEmployeeAccessToken({ id: 5, employeeNo: 'E5', tokenVersion: 1 });
		prisma.employee.findUnique.mockResolvedValue({
			id: 5,
			employeeNo: 'E5',
			tokenVersion: 2,
			department: null,
			site: null,
			workLocation: null,
			jobRole: null,
			jobLevel: null,
		});

		const req = { headers: { authorization: `Bearer ${token}` } };
		const res = createRes();
		const next = vi.fn();

		await requireEmployeeAuth(req, res, next);

		expect(res.statusCode).toBe(401);
		expect(next).not.toHaveBeenCalled();
	});

	it('accepts a token whose tokenVersion matches', async () => {
		const { token } = createEmployeeAccessToken({ id: 5, employeeNo: 'E5', tokenVersion: 2 });
		const employee = {
			id: 5,
			employeeNo: 'E5',
			tokenVersion: 2,
			department: null,
			site: null,
			workLocation: null,
			jobRole: null,
			jobLevel: null,
		};
		prisma.employee.findUnique.mockResolvedValue(employee);

		const req = { headers: { authorization: `Bearer ${token}` } };
		const res = createRes();
		const next = vi.fn();

		await requireEmployeeAuth(req, res, next);

		expect(next).toHaveBeenCalledOnce();
		expect(req.employee).toBe(employee);
	});
});
