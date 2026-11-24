/* eslint-disable import/first, import/extensions */
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Regression test for GET /:id/summary — recentTrainingRecords.
 *
 * The employee detail page ("Detail Karyawan" → Kompetensi → Pelatihan Karyawan)
 * renders the "Master Training" column from `record.masterTrainingName`. The
 * summary endpoint must therefore expose it, exactly like the training records
 * module does (see employeeTrainings.js `mapTrainingRecord`).
 */

vi.mock('../../lib/prisma.js', () => ({
	default: {
		employee: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn() },
		guidanceRecord: { findMany: vi.fn(), count: vi.fn() },
		warningLetter: { findMany: vi.fn(), count: vi.fn() },
		employeeLicenseCertification: { findMany: vi.fn() },
		employeeLeaveDatabase: { findMany: vi.fn() },
		employeeLeave: { findMany: vi.fn(), count: vi.fn() },
		employeeTraining: { findMany: vi.fn(), count: vi.fn() },
		jobRequirementProfile: { findUnique: vi.fn() },
		employeeSkillAssessment: { findMany: vi.fn() },
		employeeTrainingParticipant: { findMany: vi.fn() },
		skillAssessmentPeriod: { findFirst: vi.fn() },
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

import prisma from '../../lib/prisma.js';
import router from '../employees.js';

function getRouteHandler(method, path) {
	const layer = router.stack.find((l) => l.route && l.route.path === path && l.route.methods[method]);
	if (!layer) throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
	const handlers = layer.route.stack.map((s) => s.handle);
	const wrappedHandler = handlers[handlers.length - 1];

	return (req, res) =>
		new Promise((resolve, reject) => {
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

const employee = {
	id: 7,
	siteId: 1,
	employeeNo: 'EMP-007',
	fullName: 'Budi Santoso',
	grade: 'RANK_3',
	department: { departmentName: 'Produksi' },
	groupShift: null,
	workLocation: { workLocationName: 'Plant 1' },
	jobRole: { jobRoleName: 'Operator' },
	jobLevel: { jobLevelName: 'Staff' },
	site: null,
	joinDate: new Date('2020-01-15'),
	birthDate: new Date('1995-05-10'),
	employmentType: 'PERMANENT',
	gender: 'MALE',
	educationLevel: 'S1',
	phoneNumber: '',
	email: '',
};

beforeEach(() => {
	vi.clearAllMocks();

	prisma.employee.findUnique.mockResolvedValue(employee);
	prisma.guidanceRecord.findMany.mockResolvedValue([]);
	prisma.guidanceRecord.count.mockResolvedValue(0);
	prisma.warningLetter.findMany.mockResolvedValue([]);
	prisma.warningLetter.count.mockResolvedValue(0);
	prisma.employeeLicenseCertification.findMany.mockResolvedValue([]);
	prisma.employeeLeaveDatabase.findMany.mockResolvedValue([]);
	prisma.employeeLeave.findMany.mockResolvedValue([]);
	prisma.employeeLeave.count.mockResolvedValue(0);
	prisma.employeeTraining.count.mockResolvedValue(1);
	prisma.jobRequirementProfile.findUnique.mockResolvedValue(null);
	prisma.employeeSkillAssessment.findMany.mockResolvedValue([]);
	prisma.employeeTrainingParticipant.findMany.mockResolvedValue([]);
	prisma.skillAssessmentPeriod.findFirst.mockResolvedValue(null);

	prisma.employeeTraining.findMany.mockResolvedValue([
		{
			id: 31,
			trainingType: 'INTERNAL',
			material: 'Pelatihan K3 Dasar',
			trainerInstitution: 'Internal HSE',
			trainerName: 'Andi',
			startDate: new Date('2026-02-01'),
			endDate: new Date('2026-02-03'),
			dayCount: 3,
			masterTraining: { id: 5, name: 'K3 Dasar' },
			participants: [{ id: 1, employeeId: 7, employee: { id: 7, fullName: 'Budi Santoso', employeeNo: 'EMP-007' } }],
		},
	]);
});

describe('GET /:id/summary — recentTrainingRecords', () => {
	it('exposes masterTrainingName so the detail table is not always "-"', async () => {
		const handler = getRouteHandler('get', '/:id/summary');
		const req = { params: { id: '7' }, isSuperAdmin: false, admin: { siteId: 1 } };
		const res = createMockRes();

		await handler(req, res);

		expect(res.statusCode).toBe(200);
		expect(res.jsonData.recentTrainingRecords).toHaveLength(1);
		expect(res.jsonData.recentTrainingRecords[0].masterTrainingName).toBe('K3 Dasar');
	});

	it('asks Prisma for the master training relation', async () => {
		const handler = getRouteHandler('get', '/:id/summary');
		const req = { params: { id: '7' }, isSuperAdmin: false, admin: { siteId: 1 } };
		const res = createMockRes();

		await handler(req, res);

		const call = prisma.employeeTraining.findMany.mock.calls[0][0];
		expect(call.include?.masterTraining).toBeTruthy();
	});
});
