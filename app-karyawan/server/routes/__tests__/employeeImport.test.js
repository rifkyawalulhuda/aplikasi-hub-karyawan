/* eslint-disable import/first, import/extensions */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ExcelJS from 'exceljs';

/**
 * Unit tests for employee import (POST /import)
 * Tests: all-or-nothing behavior, site isolation, error reporting
 */

vi.mock('../../lib/prisma.js', () => ({
	default: {
		department: { findFirst: vi.fn(), findUnique: vi.fn() },
		masterSite: { findFirst: vi.fn(), findUnique: vi.fn() },
		masterGroupShift: { findFirst: vi.fn(), findUnique: vi.fn() },
		workLocation: { findFirst: vi.fn(), findUnique: vi.fn() },
		jobRole: { findFirst: vi.fn(), findUnique: vi.fn() },
		jobLevel: { findFirst: vi.fn(), findUnique: vi.fn() },
		employee: { findFirst: vi.fn(), create: vi.fn(), findUnique: vi.fn() },
		$transaction: vi.fn(),
	},
}));

vi.mock('../../lib/password.js', () => ({
	hashPassword: vi.fn((pw) => `hashed_${pw}`),
}));

vi.mock('../../lib/warningLetterEscalation.js', () => ({
	isWarningLetterActive: vi.fn(() => false),
}));

vi.mock('../../middleware/requireSiteIsolation.js', () => ({
	default: () => (req, res, next) => next(),
}));

vi.mock('fs/promises', async (importOriginal) => {
	const actual = await importOriginal();
	return { default: actual };
});

import prisma from '../../lib/prisma.js';
import router from '../employees.js';

// Helper to extract route handler
// withAsync wraps handlers as: (req, res, next) => { Promise.resolve(handler(req, res, next)).catch(next) }
// It does NOT return the promise. We detect completion by patching res.json before calling.
function getRouteHandler(method, path) {
	const layer = router.stack.find((l) => l.route && l.route.path === path && l.route.methods[method]);
	if (!layer) throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
	const handlers = layer.route.stack.map((s) => s.handle);
	// The last handler is the withAsync wrapper. We call it and catch errors via next.
	const wrappedHandler = handlers[handlers.length - 1];

	return (req, res) =>
		new Promise((resolve, reject) => {
			// Patch res.json BEFORE calling handler so it resolves the promise
			const originalJson = res.json;
			res.json = function patchedJson(data) {
				res.jsonData = data;
				originalJson.call(this, data);
				resolve();
				return this;
			};

			const next = (err) => {
				if (err) reject(err);
				else resolve();
			};

			wrappedHandler(req, res, next);
		});
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

async function buildExcelBuffer(rows) {
	const workbook = new ExcelJS.Workbook();
	const sheet = workbook.addWorksheet('Data Import');

	const headers = [
		'Employee No',
		'Password',
		'Fullname',
		'Employment Type',
		'Site / Div',
		'Department',
		'Group Shift',
		'Length Of Service',
		'Age',
		'Birth Date',
		'Gender',
		'Work Location',
		'Job Role',
		'Job Level',
		'Education Level',
		'Grade',
		'Join Date',
		'Phone Number',
		'Email',
	];

	sheet.addRow(headers);
	// Row 2: instructions (skipped during import)
	sheet.addRow(headers.map(() => ''));

	rows.forEach((row) => {
		sheet.addRow([
			row.employeeNo || '',
			row.password || '',
			row.fullName || '',
			row.employmentType || '',
			row.siteDiv || '',
			row.department || '',
			row.groupShift || '',
			'', // Length Of Service
			'', // Age
			row.birthDate || '',
			row.gender || '',
			row.workLocation || '',
			row.jobRole || '',
			row.jobLevel || '',
			row.educationLevel || '',
			row.grade || '',
			row.joinDate || '',
			row.phoneNumber || '',
			row.email || '',
		]);
	});

	return workbook.xlsx.writeBuffer();
}

function createMockReq(overrides = {}) {
	return {
		admin: { role: 'super_admin', siteId: 1 },
		isSuperAdmin: true,
		siteFilter: {},
		file: null,
		body: {},
		...overrides,
	};
}

function setupLookupMocks() {
	prisma.masterSite.findFirst.mockResolvedValue({ id: 1, name: 'CLC' });
	prisma.masterSite.findUnique.mockResolvedValue({ id: 1, name: 'CLC' });
	prisma.department.findFirst.mockResolvedValue({ id: 1, name: 'IT' });
	prisma.department.findUnique.mockResolvedValue({ id: 1, name: 'IT' });
	prisma.workLocation.findFirst.mockResolvedValue({ id: 1, name: 'Site CLC' });
	prisma.workLocation.findUnique.mockResolvedValue({ id: 1, name: 'Site CLC' });
	prisma.jobRole.findFirst.mockResolvedValue({ id: 1, name: 'System Administrator' });
	prisma.jobRole.findUnique.mockResolvedValue({ id: 1, name: 'System Administrator' });
	prisma.jobLevel.findFirst.mockResolvedValue({ id: 1, name: 'Staff' });
	prisma.jobLevel.findUnique.mockResolvedValue({ id: 1, name: 'Staff' });
	prisma.employee.findFirst.mockResolvedValue(null); // No duplicate
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('POST /import — Employee Import', () => {
	it('returns 400 when no file is provided', async () => {
		const handler = getRouteHandler('post', '/import');
		const req = createMockReq({ file: null });
		const res = createMockRes();

		await handler(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.jsonData.message).toBe('File Excel wajib dipilih.');
	});

	it('blocks all data when one row has validation error (all-or-nothing)', async () => {
		const handler = getRouteHandler('post', '/import');
		setupLookupMocks();

		const buffer = await buildExcelBuffer([
			{
				employeeNo: 'EMP001',
				password: 'pass123',
				fullName: 'John Doe',
				employmentType: 'Permanent',
				siteDiv: 'CLC',
				department: 'IT',
				groupShift: '',
				birthDate: '01/01/2000',
				gender: 'MALE',
				workLocation: 'Site CLC',
				jobRole: 'System Administrator',
				jobLevel: 'Staff',
				educationLevel: 'S1',
				grade: 'Rank 1',
				joinDate: '01/01/2024',
				phoneNumber: '08123456789',
				email: 'john@test.com',
			},
			{
				// Missing required fields — will cause error
				employeeNo: '',
				password: '',
				fullName: '',
				employmentType: '',
				siteDiv: 'CLC',
				department: 'IT',
				groupShift: '',
				birthDate: '',
				gender: '',
				workLocation: '',
				jobRole: '',
				jobLevel: '',
				educationLevel: '',
				grade: '',
				joinDate: '',
				phoneNumber: '',
				email: '',
			},
		]);

		const req = createMockReq({
			file: { buffer },
		});
		const res = createMockRes();

		await handler(req, res);

		// Should return 400 — all data blocked
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.jsonData.importedCount).toBe(0);
		expect(res.jsonData.failedCount).toBeGreaterThan(0);
		expect(res.jsonData.errors).toBeDefined();
		expect(res.jsonData.errors.length).toBeGreaterThan(0);
		expect(res.jsonData.errorReportUrl).toBeDefined();
		// No $transaction should have been called
		expect(prisma.$transaction).not.toHaveBeenCalled();
	});

	it('returns error details with row number, employee no, name, and error message', async () => {
		const handler = getRouteHandler('post', '/import');
		setupLookupMocks();
		// Make site lookup fail for second row
		prisma.masterSite.findFirst
			.mockResolvedValueOnce({ id: 1, name: 'CLC' }) // row 1
			.mockResolvedValueOnce(null); // row 2 — site not found

		const buffer = await buildExcelBuffer([
			{
				employeeNo: 'EMP001',
				password: 'pass123',
				fullName: 'John Doe',
				employmentType: 'Permanent',
				siteDiv: 'CLC',
				department: 'IT',
				groupShift: '',
				birthDate: '01/01/2000',
				gender: 'MALE',
				workLocation: 'Site CLC',
				jobRole: 'System Administrator',
				jobLevel: 'Staff',
				educationLevel: 'S1',
				grade: 'Rank 1',
				joinDate: '01/01/2024',
				phoneNumber: '08123456789',
				email: 'john@test.com',
			},
			{
				employeeNo: 'EMP002',
				password: 'pass456',
				fullName: 'Jane Smith',
				employmentType: 'Permanent',
				siteDiv: 'INVALID_SITE',
				department: 'IT',
				groupShift: '',
				birthDate: '15/06/1995',
				gender: 'FEMALE',
				workLocation: 'Site CLC',
				jobRole: 'System Administrator',
				jobLevel: 'Staff',
				educationLevel: 'S1',
				grade: 'Rank 2',
				joinDate: '01/03/2024',
				phoneNumber: '08198765432',
				email: 'jane@test.com',
			},
		]);

		const req = createMockReq({ file: { buffer } });
		const res = createMockRes();

		await handler(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.jsonData.errors).toBeDefined();
		// The error should reference the invalid site row
		const siteError = res.jsonData.errors.find((e) => e.error.includes('Site / Div'));
		expect(siteError).toBeDefined();
		expect(siteError.employeeNo).toBe('EMP002');
		expect(siteError.fullName).toBe('Jane Smith');
	});

	it('non-super_admin cannot import employees to a different site', async () => {
		const handler = getRouteHandler('post', '/import');
		setupLookupMocks();
		// Site lookup returns a different site (id: 2)
		prisma.masterSite.findFirst.mockResolvedValue({ id: 2, name: 'CLG' });

		const buffer = await buildExcelBuffer([
			{
				employeeNo: 'EMP001',
				password: 'pass123',
				fullName: 'John Doe',
				employmentType: 'Permanent',
				siteDiv: 'CLG',
				department: 'IT',
				groupShift: '',
				birthDate: '01/01/2000',
				gender: 'MALE',
				workLocation: 'Site CLC',
				jobRole: 'System Administrator',
				jobLevel: 'Staff',
				educationLevel: 'S1',
				grade: 'Rank 1',
				joinDate: '01/01/2024',
				phoneNumber: '08123456789',
				email: 'john@test.com',
			},
		]);

		const req = createMockReq({
			file: { buffer },
			admin: { role: 'admin', siteId: 1 },
			isSuperAdmin: false,
		});
		const res = createMockRes();

		await handler(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		const siteError = res.jsonData.errors.find((e) =>
			e.error.includes('Anda hanya dapat mengimport karyawan ke site Anda sendiri'),
		);
		expect(siteError).toBeDefined();
	});

	it('super_admin can import employees to any site', async () => {
		const handler = getRouteHandler('post', '/import');
		setupLookupMocks();
		prisma.masterSite.findFirst.mockResolvedValue({ id: 2, name: 'CLG' });
		prisma.masterSite.findUnique.mockResolvedValue({ id: 2, name: 'CLG' });

		const mockEmployee = {
			id: 1,
			employeeNo: 'EMP001',
			fullName: 'John Doe',
			employmentType: 'PERMANENT',
			siteId: 2,
			department: { name: 'IT' },
			groupShift: null,
			workLocation: { name: 'Site CLC' },
			jobRole: { name: 'System Administrator' },
			jobLevel: { name: 'Staff' },
			educationLevel: 'S1',
			grade: 'RANK_1',
			joinDate: new Date('2024-01-01'),
			birthDate: new Date('2000-01-01'),
			gender: 'MALE',
			phoneNumber: '08123456789',
			email: 'john@test.com',
		};

		prisma.$transaction.mockImplementation(async (fn) => {
			const tx = {
				employee: {
					create: vi.fn().mockResolvedValue(mockEmployee),
				},
			};
			return fn(tx);
		});

		const buffer = await buildExcelBuffer([
			{
				employeeNo: 'EMP001',
				password: 'pass123',
				fullName: 'John Doe',
				employmentType: 'Permanent',
				siteDiv: 'CLG',
				department: 'IT',
				groupShift: '',
				birthDate: '01/01/2000',
				gender: 'MALE',
				workLocation: 'Site CLC',
				jobRole: 'System Administrator',
				jobLevel: 'Staff',
				educationLevel: 'S1',
				grade: 'Rank 1',
				joinDate: '01/01/2024',
				phoneNumber: '08123456789',
				email: 'john@test.com',
			},
		]);

		const req = createMockReq({
			file: { buffer },
			admin: { role: 'super_admin', siteId: 1 },
			isSuperAdmin: true,
		});
		const res = createMockRes();

		await handler(req, res);

		// Should succeed — super admin can import to any site
		expect(res.status).not.toHaveBeenCalledWith(400);
		expect(res.jsonData.message).toContain('berhasil');
		expect(res.jsonData.importedCount).toBe(1);
		expect(prisma.$transaction).toHaveBeenCalled();
	});

	it('inserts all rows in a single transaction when all valid', async () => {
		const handler = getRouteHandler('post', '/import');
		setupLookupMocks();

		const mockEmployee1 = {
			id: 1,
			employeeNo: 'EMP001',
			fullName: 'John Doe',
			employmentType: 'PERMANENT',
			siteId: 1,
			department: { name: 'IT' },
			groupShift: null,
			workLocation: { name: 'Site CLC' },
			jobRole: { name: 'System Administrator' },
			jobLevel: { name: 'Staff' },
			educationLevel: 'S1',
			grade: 'RANK_1',
			joinDate: new Date('2024-01-01'),
			birthDate: new Date('2000-01-01'),
			gender: 'MALE',
			phoneNumber: '08123456789',
			email: 'john@test.com',
		};
		const mockEmployee2 = {
			...mockEmployee1,
			id: 2,
			employeeNo: 'EMP002',
			fullName: 'Jane Smith',
		};

		prisma.$transaction.mockImplementation(async (fn) => {
			const tx = {
				employee: {
					create: vi.fn().mockResolvedValueOnce(mockEmployee1).mockResolvedValueOnce(mockEmployee2),
				},
			};
			return fn(tx);
		});

		const buffer = await buildExcelBuffer([
			{
				employeeNo: 'EMP001',
				password: 'pass123',
				fullName: 'John Doe',
				employmentType: 'Permanent',
				siteDiv: 'CLC',
				department: 'IT',
				groupShift: '',
				birthDate: '01/01/2000',
				gender: 'MALE',
				workLocation: 'Site CLC',
				jobRole: 'System Administrator',
				jobLevel: 'Staff',
				educationLevel: 'S1',
				grade: 'Rank 1',
				joinDate: '01/01/2024',
				phoneNumber: '08123456789',
				email: 'john@test.com',
			},
			{
				employeeNo: 'EMP002',
				password: 'pass456',
				fullName: 'Jane Smith',
				employmentType: 'Contract',
				siteDiv: 'CLC',
				department: 'IT',
				groupShift: '',
				birthDate: '15/06/1995',
				gender: 'FEMALE',
				workLocation: 'Site CLC',
				jobRole: 'System Administrator',
				jobLevel: 'Staff',
				educationLevel: 'S1',
				grade: 'Rank 2',
				joinDate: '01/03/2024',
				phoneNumber: '08198765432',
				email: 'jane@test.com',
			},
		]);

		const req = createMockReq({ file: { buffer } });
		const res = createMockRes();

		await handler(req, res);

		expect(res.jsonData.message).toContain('berhasil');
		expect(res.jsonData.importedCount).toBe(2);
		expect(res.jsonData.failedCount).toBe(0);
		expect(prisma.$transaction).toHaveBeenCalledTimes(1);
	});

	it('detects duplicate Employee No within the same file', async () => {
		const handler = getRouteHandler('post', '/import');
		setupLookupMocks();

		const buffer = await buildExcelBuffer([
			{
				employeeNo: 'EMP001',
				password: 'pass123',
				fullName: 'John Doe',
				employmentType: 'Permanent',
				siteDiv: 'CLC',
				department: 'IT',
				groupShift: '',
				birthDate: '01/01/2000',
				gender: 'MALE',
				workLocation: 'Site CLC',
				jobRole: 'System Administrator',
				jobLevel: 'Staff',
				educationLevel: 'S1',
				grade: 'Rank 1',
				joinDate: '01/01/2024',
				phoneNumber: '08123456789',
				email: 'john@test.com',
			},
			{
				employeeNo: 'EMP001', // Duplicate!
				password: 'pass456',
				fullName: 'John Duplicate',
				employmentType: 'Permanent',
				siteDiv: 'CLC',
				department: 'IT',
				groupShift: '',
				birthDate: '01/01/2000',
				gender: 'MALE',
				workLocation: 'Site CLC',
				jobRole: 'System Administrator',
				jobLevel: 'Staff',
				educationLevel: 'S1',
				grade: 'Rank 1',
				joinDate: '01/01/2024',
				phoneNumber: '08111111111',
				email: 'dup@test.com',
			},
		]);

		const req = createMockReq({ file: { buffer } });
		const res = createMockRes();

		await handler(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		const dupError = res.jsonData.errors.find((e) => e.error.includes('duplikat'));
		expect(dupError).toBeDefined();
		expect(dupError.employeeNo).toBe('EMP001');
	});
});
