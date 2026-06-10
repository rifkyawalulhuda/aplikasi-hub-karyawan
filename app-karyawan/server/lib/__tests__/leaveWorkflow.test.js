/* eslint-disable import/first, import/extensions */
import { describe, expect, it, vi } from 'vitest';

vi.mock('../prisma.js', () => ({ default: {} }));
vi.mock('../leaveDatabase.js', () => ({ getLeaveDatabaseBalance: vi.fn() }));

import { resolveApprovalStages } from '../leaveWorkflow.js';

/**
 * Unit tests for resolveApprovalStages
 * Validates: Requirements 5.1–5.3, 6.1–6.7, 7.1–7.3, 8.4, 11.1, 11.2
 */

// --- Helpers to build mock transaction objects ---

function createMockTx({ findUniqueConfig = null, findManyConfigs = [], findManyEmployees = [] } = {}) {
	return {
		siteApprovalConfig: {
			findUnique: vi.fn().mockResolvedValue(findUniqueConfig),
			findMany: vi.fn().mockResolvedValue(findManyConfigs),
		},
		employee: {
			findMany: vi.fn().mockResolvedValue(findManyEmployees),
		},
	};
}

function createRequester({
	id = 1,
	siteId = 10,
	departmentId = 100,
	jobLevelId = 1000,
	groupShiftId = null,
	groupShift = null,
} = {}) {
	return {
		id,
		siteId,
		departmentId,
		jobLevelId,
		groupShiftId,
		groupShift,
	};
}

function createEmployee({ id, fullName, jobLevel, departmentId = 100, siteId = 10 }) {
	return {
		id,
		fullName,
		siteId,
		departmentId,
		jobLevel,
		jobLevelId: jobLevel?.id,
	};
}

// --- Seeded config values matching the old hardcoded hierarchy ---
const SEEDED_JOB_LEVELS = {
	STAFF: { id: 1000, name: 'Staff' },
	FOREMAN: { id: 1001, name: 'Foreman' },
	GENERAL_FOREMAN: { id: 1002, name: 'General Foreman' },
	SECTION_CHIEF: { id: 1003, name: 'Section Chief' },
	DY_DEPT_MANAGER: { id: 1004, name: 'Dy. Dept. Manager' },
	DEPT_MANAGER: { id: 1005, name: 'Dept. Manager' },
	SITE_DIV_MANAGER: { id: 1006, name: 'Site/Div. Manager' },
};

describe('resolveApprovalStages', () => {
	describe('Config lookup failure (Req 5.2)', () => {
		it('throws 400 when no SiteApprovalConfig exists for requester site+jobLevel', async () => {
			const tx = createMockTx({ findUniqueConfig: null });
			const requester = createRequester();

			await expect(resolveApprovalStages(tx, requester)).rejects.toMatchObject({
				message: 'Konfigurasi approval belum diatur untuk site dan job level Anda. Hubungi administrator.',
				statusCode: 400,
			});

			expect(tx.siteApprovalConfig.findUnique).toHaveBeenCalledWith({
				where: {
					siteId_jobLevelId: {
						siteId: 10,
						jobLevelId: 1000,
					},
				},
			});
		});
	});

	describe('No approvers found (Req 6.6)', () => {
		it('throws 400 when config exists but no employees match rank criteria', async () => {
			const tx = createMockTx({
				findUniqueConfig: { approvalRank: null, maxApprovalRank: 5 },
				findManyConfigs: [{ approvalRank: 1, jobLevelId: 1001, jobLevel: SEEDED_JOB_LEVELS.FOREMAN }],
				findManyEmployees: [], // No employees found
			});
			const requester = createRequester({ groupShiftId: null });

			await expect(resolveApprovalStages(tx, requester)).rejects.toMatchObject({
				message: 'Tidak ada approver yang tersedia untuk site karyawan.',
				statusCode: 400,
			});
		});
	});

	describe('Basic approval chain — Staff requester (Req 6.1–6.3)', () => {
		it('resolves Foreman → General Foreman → Section Chief → Dy. Dept. Manager → Dept. Manager stages', async () => {
			const approverConfigs = [
				{ approvalRank: 1, jobLevelId: 1001, jobLevel: SEEDED_JOB_LEVELS.FOREMAN },
				{ approvalRank: 2, jobLevelId: 1002, jobLevel: SEEDED_JOB_LEVELS.GENERAL_FOREMAN },
				{ approvalRank: 3, jobLevelId: 1003, jobLevel: SEEDED_JOB_LEVELS.SECTION_CHIEF },
				{ approvalRank: 4, jobLevelId: 1004, jobLevel: SEEDED_JOB_LEVELS.DY_DEPT_MANAGER },
				{ approvalRank: 5, jobLevelId: 1005, jobLevel: SEEDED_JOB_LEVELS.DEPT_MANAGER },
			];

			const foremanEmp = createEmployee({ id: 2, fullName: 'Foreman A', jobLevel: SEEDED_JOB_LEVELS.FOREMAN });
			const gfEmp = createEmployee({ id: 3, fullName: 'GF A', jobLevel: SEEDED_JOB_LEVELS.GENERAL_FOREMAN });
			const scEmp = createEmployee({ id: 4, fullName: 'SC A', jobLevel: SEEDED_JOB_LEVELS.SECTION_CHIEF });
			const dyEmp = createEmployee({ id: 5, fullName: 'Dy A', jobLevel: SEEDED_JOB_LEVELS.DY_DEPT_MANAGER });
			const dmEmp = createEmployee({ id: 6, fullName: 'DM A', jobLevel: SEEDED_JOB_LEVELS.DEPT_MANAGER });

			const tx = {
				siteApprovalConfig: {
					findUnique: vi.fn().mockResolvedValue({ approvalRank: null, maxApprovalRank: 5 }),
					findMany: vi.fn().mockResolvedValue(approverConfigs),
				},
				employee: {
					findMany: vi
						.fn()
						.mockResolvedValueOnce([foremanEmp])
						.mockResolvedValueOnce([gfEmp])
						.mockResolvedValueOnce([scEmp])
						.mockResolvedValueOnce([dyEmp])
						.mockResolvedValueOnce([dmEmp]),
				},
			};

			const requester = createRequester({ jobLevelId: SEEDED_JOB_LEVELS.STAFF.id });
			const stages = await resolveApprovalStages(tx, requester);

			expect(stages).toHaveLength(5);
			expect(stages[0]).toMatchObject({ stageOrder: 1, stageType: 'FOREMAN' });
			expect(stages[1]).toMatchObject({ stageOrder: 2, stageType: 'GENERAL_FOREMAN' });
			expect(stages[2]).toMatchObject({ stageOrder: 3, stageType: 'SECTION_CHIEF' });
			expect(stages[3]).toMatchObject({ stageOrder: 4, stageType: 'DY_DEPT_MANAGER' });
			expect(stages[4]).toMatchObject({ stageOrder: 5, stageType: 'DEPT_MANAGER' });
		});
	});

	describe('Foreman Group Shift logic (Req 6.7, 7.3)', () => {
		it('adds FOREMAN_GROUP_SHIFT as first stage when requester has null approvalRank and a group shift', async () => {
			const groupShiftForeman = createEmployee({
				id: 20,
				fullName: 'GS Foreman',
				jobLevel: SEEDED_JOB_LEVELS.FOREMAN,
			});

			const approverConfigs = [
				{ approvalRank: 1, jobLevelId: 1001, jobLevel: SEEDED_JOB_LEVELS.FOREMAN },
				{ approvalRank: 2, jobLevelId: 1002, jobLevel: SEEDED_JOB_LEVELS.GENERAL_FOREMAN },
			];

			const foremanEmp = createEmployee({ id: 21, fullName: 'Foreman B', jobLevel: SEEDED_JOB_LEVELS.FOREMAN });
			const gfEmp = createEmployee({ id: 22, fullName: 'GF B', jobLevel: SEEDED_JOB_LEVELS.GENERAL_FOREMAN });

			const tx = {
				siteApprovalConfig: {
					findUnique: vi.fn().mockResolvedValue({ approvalRank: null, maxApprovalRank: 5 }),
					findMany: vi.fn().mockResolvedValue(approverConfigs),
				},
				employee: {
					findMany: vi.fn().mockResolvedValueOnce([foremanEmp]).mockResolvedValueOnce([gfEmp]),
				},
			};

			const requester = createRequester({
				id: 1,
				jobLevelId: SEEDED_JOB_LEVELS.STAFF.id,
				groupShiftId: 5,
				groupShift: {
					foremen: [{ employee: groupShiftForeman }],
				},
			});

			const stages = await resolveApprovalStages(tx, requester);

			expect(stages[0]).toMatchObject({
				stageOrder: 1,
				stageType: 'FOREMAN_GROUP_SHIFT',
			});
			expect(stages[0].approvers).toHaveLength(1);
			expect(stages[0].approvers[0].id).toBe(20);
			// Subsequent stages follow
			expect(stages[1]).toMatchObject({ stageOrder: 2, stageType: 'FOREMAN' });
			expect(stages[2]).toMatchObject({ stageOrder: 3, stageType: 'GENERAL_FOREMAN' });
		});

		it('does NOT add FOREMAN_GROUP_SHIFT when requester has non-null approvalRank', async () => {
			const approverConfigs = [
				{ approvalRank: 2, jobLevelId: 1002, jobLevel: SEEDED_JOB_LEVELS.GENERAL_FOREMAN },
			];

			const gfEmp = createEmployee({ id: 30, fullName: 'GF C', jobLevel: SEEDED_JOB_LEVELS.GENERAL_FOREMAN });

			const tx = {
				siteApprovalConfig: {
					findUnique: vi.fn().mockResolvedValue({ approvalRank: 1, maxApprovalRank: 5 }),
					findMany: vi.fn().mockResolvedValue(approverConfigs),
				},
				employee: {
					findMany: vi.fn().mockResolvedValueOnce([gfEmp]),
				},
			};

			const requester = createRequester({
				jobLevelId: SEEDED_JOB_LEVELS.FOREMAN.id,
				groupShiftId: 5,
				groupShift: {
					foremen: [
						{
							employee: createEmployee({
								id: 31,
								fullName: 'GS Foreman 2',
								jobLevel: SEEDED_JOB_LEVELS.FOREMAN,
							}),
						},
					],
				},
			});

			const stages = await resolveApprovalStages(tx, requester);

			expect(stages[0].stageType).not.toBe('FOREMAN_GROUP_SHIFT');
			expect(stages[0]).toMatchObject({ stageOrder: 1, stageType: 'GENERAL_FOREMAN' });
		});

		it('does NOT add FOREMAN_GROUP_SHIFT when requester has no group shift', async () => {
			const approverConfigs = [{ approvalRank: 1, jobLevelId: 1001, jobLevel: SEEDED_JOB_LEVELS.FOREMAN }];

			const foremanEmp = createEmployee({ id: 40, fullName: 'Foreman D', jobLevel: SEEDED_JOB_LEVELS.FOREMAN });

			const tx = {
				siteApprovalConfig: {
					findUnique: vi.fn().mockResolvedValue({ approvalRank: null, maxApprovalRank: 5 }),
					findMany: vi.fn().mockResolvedValue(approverConfigs),
				},
				employee: {
					findMany: vi.fn().mockResolvedValueOnce([foremanEmp]),
				},
			};

			const requester = createRequester({
				jobLevelId: SEEDED_JOB_LEVELS.STAFF.id,
				groupShiftId: null,
				groupShift: null,
			});

			const stages = await resolveApprovalStages(tx, requester);

			expect(stages[0]).toMatchObject({ stageOrder: 1, stageType: 'FOREMAN' });
		});
	});

	describe('Higher-level requester (Req 6.1–6.2)', () => {
		it('Dept. Manager (rank 5, max 6) only gets Site/Div. Manager stage', async () => {
			const approverConfigs = [
				{ approvalRank: 6, jobLevelId: 1006, jobLevel: SEEDED_JOB_LEVELS.SITE_DIV_MANAGER },
			];

			const sdmEmp = createEmployee({ id: 50, fullName: 'SDM A', jobLevel: SEEDED_JOB_LEVELS.SITE_DIV_MANAGER });

			const tx = {
				siteApprovalConfig: {
					findUnique: vi.fn().mockResolvedValue({ approvalRank: 5, maxApprovalRank: 6 }),
					findMany: vi.fn().mockResolvedValue(approverConfigs),
				},
				employee: {
					findMany: vi.fn().mockResolvedValueOnce([sdmEmp]),
				},
			};

			const requester = createRequester({ jobLevelId: SEEDED_JOB_LEVELS.DEPT_MANAGER.id });
			const stages = await resolveApprovalStages(tx, requester);

			expect(stages).toHaveLength(1);
			expect(stages[0]).toMatchObject({
				stageOrder: 1,
				stageType: 'SITE_DIV_MANAGER',
			});
			expect(stages[0].approvers[0].id).toBe(50);
		});
	});

	describe('Stage type assignment (Req 7.1–7.2)', () => {
		it('assigns correct stageType based on job level name for each stage', async () => {
			const approverConfigs = [
				{ approvalRank: 3, jobLevelId: 1003, jobLevel: SEEDED_JOB_LEVELS.SECTION_CHIEF },
				{ approvalRank: 4, jobLevelId: 1004, jobLevel: SEEDED_JOB_LEVELS.DY_DEPT_MANAGER },
			];

			const scEmp = createEmployee({ id: 60, fullName: 'SC X', jobLevel: SEEDED_JOB_LEVELS.SECTION_CHIEF });
			const dyEmp = createEmployee({ id: 61, fullName: 'Dy X', jobLevel: SEEDED_JOB_LEVELS.DY_DEPT_MANAGER });

			const tx = {
				siteApprovalConfig: {
					findUnique: vi.fn().mockResolvedValue({ approvalRank: 2, maxApprovalRank: 5 }),
					findMany: vi.fn().mockResolvedValue(approverConfigs),
				},
				employee: {
					findMany: vi.fn().mockResolvedValueOnce([scEmp]).mockResolvedValueOnce([dyEmp]),
				},
			};

			const requester = createRequester({ jobLevelId: SEEDED_JOB_LEVELS.GENERAL_FOREMAN.id });
			const stages = await resolveApprovalStages(tx, requester);

			expect(stages[0].stageType).toBe('SECTION_CHIEF');
			expect(stages[1].stageType).toBe('DY_DEPT_MANAGER');
		});

		it('uses fallback stage type for unknown job level names', async () => {
			const customJobLevel = { id: 9999, name: 'Senior Engineer' };
			const approverConfigs = [{ approvalRank: 2, jobLevelId: 9999, jobLevel: customJobLevel }];

			const customEmp = createEmployee({ id: 70, fullName: 'Eng A', jobLevel: customJobLevel });

			const tx = {
				siteApprovalConfig: {
					findUnique: vi.fn().mockResolvedValue({ approvalRank: 1, maxApprovalRank: 3 }),
					findMany: vi.fn().mockResolvedValue(approverConfigs),
				},
				employee: {
					findMany: vi.fn().mockResolvedValueOnce([customEmp]),
				},
			};

			const requester = createRequester({ jobLevelId: 8888 });
			const stages = await resolveApprovalStages(tx, requester);

			expect(stages[0].stageType).toBe('SENIOR_ENGINEER');
		});
	});

	describe('Backward compatibility — seeded config (Req 8.4, 11.1)', () => {
		it('seeded config for Staff produces same stages as old hardcoded logic', async () => {
			// Old hardcoded sequence for Staff: Foreman → GF → SC → Dy DM → DM
			const approverConfigs = [
				{ approvalRank: 1, jobLevelId: 1001, jobLevel: SEEDED_JOB_LEVELS.FOREMAN },
				{ approvalRank: 2, jobLevelId: 1002, jobLevel: SEEDED_JOB_LEVELS.GENERAL_FOREMAN },
				{ approvalRank: 3, jobLevelId: 1003, jobLevel: SEEDED_JOB_LEVELS.SECTION_CHIEF },
				{ approvalRank: 4, jobLevelId: 1004, jobLevel: SEEDED_JOB_LEVELS.DY_DEPT_MANAGER },
				{ approvalRank: 5, jobLevelId: 1005, jobLevel: SEEDED_JOB_LEVELS.DEPT_MANAGER },
			];

			const employees = [
				createEmployee({ id: 80, fullName: 'FM', jobLevel: SEEDED_JOB_LEVELS.FOREMAN }),
				createEmployee({ id: 81, fullName: 'GF', jobLevel: SEEDED_JOB_LEVELS.GENERAL_FOREMAN }),
				createEmployee({ id: 82, fullName: 'SC', jobLevel: SEEDED_JOB_LEVELS.SECTION_CHIEF }),
				createEmployee({ id: 83, fullName: 'Dy', jobLevel: SEEDED_JOB_LEVELS.DY_DEPT_MANAGER }),
				createEmployee({ id: 84, fullName: 'DM', jobLevel: SEEDED_JOB_LEVELS.DEPT_MANAGER }),
			];

			const tx = {
				siteApprovalConfig: {
					findUnique: vi.fn().mockResolvedValue({ approvalRank: null, maxApprovalRank: 5 }),
					findMany: vi.fn().mockResolvedValue(approverConfigs),
				},
				employee: {
					findMany: vi
						.fn()
						.mockResolvedValueOnce([employees[0]])
						.mockResolvedValueOnce([employees[1]])
						.mockResolvedValueOnce([employees[2]])
						.mockResolvedValueOnce([employees[3]])
						.mockResolvedValueOnce([employees[4]]),
				},
			};

			const requester = createRequester({ jobLevelId: SEEDED_JOB_LEVELS.STAFF.id });
			const stages = await resolveApprovalStages(tx, requester);

			// Verify same sequence as old hardcoded APPROVAL_STAGE_SEQUENCE
			const expectedSequence = ['FOREMAN', 'GENERAL_FOREMAN', 'SECTION_CHIEF', 'DY_DEPT_MANAGER', 'DEPT_MANAGER'];
			expect(stages.map((s) => s.stageType)).toEqual(expectedSequence);
			expect(stages.map((s) => s.stageOrder)).toEqual([1, 2, 3, 4, 5]);
		});

		it('seeded config for Foreman produces GF → SC → Dy DM → DM stages', async () => {
			const approverConfigs = [
				{ approvalRank: 2, jobLevelId: 1002, jobLevel: SEEDED_JOB_LEVELS.GENERAL_FOREMAN },
				{ approvalRank: 3, jobLevelId: 1003, jobLevel: SEEDED_JOB_LEVELS.SECTION_CHIEF },
				{ approvalRank: 4, jobLevelId: 1004, jobLevel: SEEDED_JOB_LEVELS.DY_DEPT_MANAGER },
				{ approvalRank: 5, jobLevelId: 1005, jobLevel: SEEDED_JOB_LEVELS.DEPT_MANAGER },
			];

			const employees = [
				createEmployee({ id: 90, fullName: 'GF', jobLevel: SEEDED_JOB_LEVELS.GENERAL_FOREMAN }),
				createEmployee({ id: 91, fullName: 'SC', jobLevel: SEEDED_JOB_LEVELS.SECTION_CHIEF }),
				createEmployee({ id: 92, fullName: 'Dy', jobLevel: SEEDED_JOB_LEVELS.DY_DEPT_MANAGER }),
				createEmployee({ id: 93, fullName: 'DM', jobLevel: SEEDED_JOB_LEVELS.DEPT_MANAGER }),
			];

			const tx = {
				siteApprovalConfig: {
					findUnique: vi.fn().mockResolvedValue({ approvalRank: 1, maxApprovalRank: 5 }),
					findMany: vi.fn().mockResolvedValue(approverConfigs),
				},
				employee: {
					findMany: vi
						.fn()
						.mockResolvedValueOnce([employees[0]])
						.mockResolvedValueOnce([employees[1]])
						.mockResolvedValueOnce([employees[2]])
						.mockResolvedValueOnce([employees[3]]),
				},
			};

			const requester = createRequester({ jobLevelId: SEEDED_JOB_LEVELS.FOREMAN.id });
			const stages = await resolveApprovalStages(tx, requester);

			const expectedSequence = ['GENERAL_FOREMAN', 'SECTION_CHIEF', 'DY_DEPT_MANAGER', 'DEPT_MANAGER'];
			expect(stages.map((s) => s.stageType)).toEqual(expectedSequence);
		});

		it('seeded config for Dept. Manager produces only Site/Div. Manager stage', async () => {
			const approverConfigs = [
				{ approvalRank: 6, jobLevelId: 1006, jobLevel: SEEDED_JOB_LEVELS.SITE_DIV_MANAGER },
			];

			const sdmEmp = createEmployee({ id: 95, fullName: 'SDM', jobLevel: SEEDED_JOB_LEVELS.SITE_DIV_MANAGER });

			const tx = {
				siteApprovalConfig: {
					findUnique: vi.fn().mockResolvedValue({ approvalRank: 5, maxApprovalRank: 6 }),
					findMany: vi.fn().mockResolvedValue(approverConfigs),
				},
				employee: {
					findMany: vi.fn().mockResolvedValueOnce([sdmEmp]),
				},
			};

			const requester = createRequester({ jobLevelId: SEEDED_JOB_LEVELS.DEPT_MANAGER.id });
			const stages = await resolveApprovalStages(tx, requester);

			expect(stages.map((s) => s.stageType)).toEqual(['SITE_DIV_MANAGER']);
		});
	});

	describe('Approver resolution details (Req 6.4–6.5)', () => {
		it('includes multiple employees at the same rank as approvers in one stage', async () => {
			const approverConfigs = [{ approvalRank: 1, jobLevelId: 1001, jobLevel: SEEDED_JOB_LEVELS.FOREMAN }];

			const foreman1 = createEmployee({ id: 101, fullName: 'Foreman 1', jobLevel: SEEDED_JOB_LEVELS.FOREMAN });
			const foreman2 = createEmployee({ id: 102, fullName: 'Foreman 2', jobLevel: SEEDED_JOB_LEVELS.FOREMAN });

			const tx = {
				siteApprovalConfig: {
					findUnique: vi.fn().mockResolvedValue({ approvalRank: null, maxApprovalRank: 1 }),
					findMany: vi.fn().mockResolvedValue(approverConfigs),
				},
				employee: {
					findMany: vi.fn().mockResolvedValueOnce([foreman1, foreman2]),
				},
			};

			const requester = createRequester({ jobLevelId: SEEDED_JOB_LEVELS.STAFF.id });
			const stages = await resolveApprovalStages(tx, requester);

			expect(stages).toHaveLength(1);
			expect(stages[0].approvers).toHaveLength(2);
			expect(stages[0].approvers.map((a) => a.id)).toEqual([101, 102]);
		});

		it('skips rank levels where no employees are found and continues to next', async () => {
			const approverConfigs = [
				{ approvalRank: 1, jobLevelId: 1001, jobLevel: SEEDED_JOB_LEVELS.FOREMAN },
				{ approvalRank: 2, jobLevelId: 1002, jobLevel: SEEDED_JOB_LEVELS.GENERAL_FOREMAN },
				{ approvalRank: 3, jobLevelId: 1003, jobLevel: SEEDED_JOB_LEVELS.SECTION_CHIEF },
			];

			const scEmp = createEmployee({ id: 110, fullName: 'SC Only', jobLevel: SEEDED_JOB_LEVELS.SECTION_CHIEF });

			const tx = {
				siteApprovalConfig: {
					findUnique: vi.fn().mockResolvedValue({ approvalRank: null, maxApprovalRank: 5 }),
					findMany: vi.fn().mockResolvedValue(approverConfigs),
				},
				employee: {
					findMany: vi
						.fn()
						.mockResolvedValueOnce([]) // No foreman found
						.mockResolvedValueOnce([]) // No GF found
						.mockResolvedValueOnce([scEmp]), // SC found
				},
			};

			const requester = createRequester({ jobLevelId: SEEDED_JOB_LEVELS.STAFF.id });
			const stages = await resolveApprovalStages(tx, requester);

			expect(stages).toHaveLength(1);
			expect(stages[0]).toMatchObject({ stageOrder: 1, stageType: 'SECTION_CHIEF' });
		});
	});
});
