import { Router } from 'express';

import prisma from '../lib/prisma.js';
import { buildSiteWhere, siteNotFound } from '../lib/siteScope.js';
import {
	CATEGORY,
	evaluateJobRequirement,
	normalizeText,
} from '../lib/jobRequirement.js';
import requireSiteIsolation from '../middleware/requireSiteIsolation.js';

const router = Router();

router.use(requireSiteIsolation({ modelType: 'per-site' }));

const SKILL_CATEGORIES = [CATEGORY.SOFT_SKILL, CATEGORY.HARD_SKILL];

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

function normalizeString(value = '') {
	return String(value).trim().replace(/\s+/g, ' ');
}

function parseId(value) {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function profileInclude() {
	return {
		skills: { orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] },
		trainings: {
			include: { masterTraining: true },
			orderBy: { sortOrder: 'asc' },
		},
	};
}

function employeeInclude() {
	return {
		department: true,
		jobLevel: true,
		jobRole: true,
	};
}

function buildEmployeeTrainingRows(participants = []) {
	const rowsByEmployee = new Map();

	participants.forEach((participant) => {
		const employeeId = participant.employeeId;

		if (!employeeId) {
			return;
		}

		if (!rowsByEmployee.has(employeeId)) {
			rowsByEmployee.set(employeeId, []);
		}

		rowsByEmployee.get(employeeId).push({
			material: participant.employeeTraining?.material || '',
			masterTraining: participant.employeeTraining?.masterTraining || null,
		});
	});

	return rowsByEmployee;
}

function buildAssessmentRows(assessments = []) {
	const rowsByEmployee = new Map();

	assessments.forEach((assessment) => {
		if (!rowsByEmployee.has(assessment.employeeId)) {
			rowsByEmployee.set(assessment.employeeId, []);
		}

		rowsByEmployee.get(assessment.employeeId).push(assessment);
	});

	return rowsByEmployee;
}

function mapRow(employee, evaluation, includeItems = false) {
	const row = {
		employeeId: employee.id,
		employeeNo: employee.employeeNo,
		fullName: employee.fullName,
		departmentId: employee.departmentId,
		departmentName: employee.department?.name || '',
		jobLevelId: employee.jobLevelId,
		jobLevelName: employee.jobLevel?.name || '',
		jobRoleName: employee.jobRole?.name || '',
		employmentType: employee.employmentType,
		educationLevel: employee.educationLevel,
		grade: employee.grade,
		gradeLabel: evaluation.gradeLabel,
		status: evaluation.status,
		statusLabel: evaluation.statusLabel,
		mandatoryMet: evaluation.mandatoryMet,
		percentOverall: evaluation.percentOverall,
		unmetMandatoryCount: evaluation.unmetItems.filter((item) => item.mandatory).length,
		unmetTotalCount: evaluation.unmetItems.length,
	};

	if (includeItems) {
		row.categories = evaluation.categories;
		row.unmetItems = evaluation.unmetItems;
	}

	return row;
}

async function safeEvaluationContext(employeeIds) {
	const [profiles, assessments, participants] = await Promise.all([
		prisma.jobRequirementProfile.findMany({ include: profileInclude() }),
		employeeIds.length > 0
			? prisma.employeeSkillAssessment.findMany({ where: { employeeId: { in: employeeIds } } })
			: Promise.resolve([]),
		employeeIds.length > 0
			? prisma.employeeTrainingParticipant.findMany({
					where: { employeeId: { in: employeeIds } },
					include: { employeeTraining: { include: { masterTraining: true } } },
			  })
			: Promise.resolve([]),
	]);

	const profileByGrade = new Map(profiles.map((profile) => [profile.grade, profile]));

	return {
		profileByGrade,
		assessmentByEmployee: buildAssessmentRows(assessments),
		trainingByEmployee: buildEmployeeTrainingRows(participants),
	};
}

function evaluateForEmployee(employee, context) {
	const profile = context.profileByGrade.get(employee.grade) || null;

	return evaluateJobRequirement({
		employee,
		profile,
		assessments: context.assessmentByEmployee.get(employee.id) || [],
		employeeTrainings: context.trainingByEmployee.get(employee.id) || [],
	});
}

router.get(
	'/profiles',
	withAsync(async (_req, res) => {
		const profiles = await prisma.jobRequirementProfile.findMany({
			include: profileInclude(),
			orderBy: { grade: 'asc' },
		});

		return res.json(profiles);
	}),
);

router.get(
	'/profiles/:grade',
	withAsync(async (req, res) => {
		const grade = normalizeString(req.params.grade).toUpperCase();
		const profile = await prisma.jobRequirementProfile.findUnique({
			where: { grade },
			include: profileInclude(),
		});

		if (!profile) {
			return res.status(404).json({ message: 'Profil job requirement tidak ditemukan.' });
		}

		return res.json(profile);
	}),
);

router.get(
	'/employees',
	withAsync(async (req, res) => {
		const includeItems = req.query.includeItems === '1' || req.query.includeItems === 'true';
		const gradeFilter = normalizeString(req.query.grade).toUpperCase();
		const statusFilter = normalizeString(req.query.status).toUpperCase();
		const departmentId = parseId(req.query.departmentId);
		const search = normalizeText(req.query.search);
		const where = { ...buildSiteWhere(req) };

		if (gradeFilter) {
			where.grade = gradeFilter;
		}

		if (departmentId) {
			where.departmentId = departmentId;
		}

		const employees = await prisma.employee.findMany({
			where,
			include: employeeInclude(),
			orderBy: [{ fullName: 'asc' }, { id: 'asc' }],
		});

		const context = await safeEvaluationContext(employees.map((employee) => employee.id));
		let rows = employees.map((employee) => mapRow(employee, evaluateForEmployee(employee, context), includeItems));

		if (statusFilter) {
			rows = rows.filter((row) => row.status === statusFilter);
		}

		if (search) {
			rows = rows.filter((row) =>
				[`${row.fullName} ${row.employeeNo} ${row.departmentName} ${row.jobLevelName}`]
					.join(' ')
					.toLowerCase()
					.includes(search),
			);
		}

		return res.json({ total: rows.length, rows });
	}),
);

router.get(
	'/employees/:id',
	withAsync(async (req, res) => {
		const id = parseId(req.params.id);

		if (!id) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const employee = await prisma.employee.findFirst({
			where: { id, ...buildSiteWhere(req) },
			include: employeeInclude(),
		});

		if (!employee) {
			return siteNotFound(res);
		}

		const context = await safeEvaluationContext([employee.id]);
		const evaluation = evaluateForEmployee(employee, context);
		const profile = context.profileByGrade.get(employee.grade) || null;

		return res.json({
			employee: {
				id: employee.id,
				employeeNo: employee.employeeNo,
				fullName: employee.fullName,
				departmentName: employee.department?.name || '',
				jobLevelName: employee.jobLevel?.name || '',
				jobRoleName: employee.jobRole?.name || '',
				employmentType: employee.employmentType,
				educationLevel: employee.educationLevel,
				joinDate: employee.joinDate,
				grade: employee.grade,
				gradeLabel: evaluation.gradeLabel,
			},
			evaluation,
			profile,
			assessments: (context.assessmentByEmployee.get(employee.id) || []).map((assessment) => ({
				id: assessment.id,
				category: assessment.category,
				skillName: assessment.skillName,
				level: assessment.level,
				assessedAt: assessment.assessedAt,
				notes: assessment.notes,
			})),
		});
	}),
);

router.put(
	'/employees/:id/assessments',
	withAsync(async (req, res) => {
		const id = parseId(req.params.id);

		if (!id) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const employee = await prisma.employee.findFirst({
			where: { id, ...buildSiteWhere(req) },
			select: { id: true },
		});

		if (!employee) {
			return siteNotFound(res);
		}

		const rawAssessments = Array.isArray(req.body?.assessments) ? req.body.assessments : [];
		const normalized = [];

		for (const item of rawAssessments) {
			const category = normalizeString(item?.category).toUpperCase();
			const skillName = normalizeString(item?.skillName);
			const level = Number(item?.level);
			const notes = normalizeString(item?.notes) || null;

			if (!SKILL_CATEGORIES.includes(category)) {
				return res.status(400).json({ message: `Kategori skill tidak valid: ${category || '-'}.` });
			}

			if (!skillName) {
				return res.status(400).json({ message: 'Nama skill wajib diisi.' });
			}

			if (!Number.isInteger(level) || level < 1 || level > 5) {
				return res.status(400).json({ message: `Level skill ${skillName} harus 1 sampai 5.` });
			}

			normalized.push({ category, skillName, level, notes });
		}

		await prisma.$transaction(
			normalized.map((item) =>
				prisma.employeeSkillAssessment.upsert({
					where: {
						employeeId_category_skillName: {
							employeeId: id,
							category: item.category,
							skillName: item.skillName,
						},
					},
					update: {
						level: item.level,
						notes: item.notes,
						assessedAt: new Date(),
						assessedByAdminId: req.admin?.id ?? null,
					},
					create: {
						employeeId: id,
						category: item.category,
						skillName: item.skillName,
						level: item.level,
						notes: item.notes,
						assessedAt: new Date(),
						assessedByAdminId: req.admin?.id ?? null,
					},
				}),
			),
		);

		const context = await safeEvaluationContext([id]);
		const employees = await prisma.employee.findMany({ where: { id }, include: employeeInclude() });
		const evaluation = evaluateForEmployee(employees[0], context);

		return res.json({ updated: normalized.length, evaluation });
	}),
);

router.get(
	'/training-needs',
	withAsync(async (req, res) => {
		const gradeFilter = normalizeString(req.query.grade).toUpperCase();
		const departmentId = parseId(req.query.departmentId);
		const where = { ...buildSiteWhere(req) };

		if (gradeFilter) {
			where.grade = gradeFilter;
		}

		if (departmentId) {
			where.departmentId = departmentId;
		}

		const employees = await prisma.employee.findMany({
			where,
			include: employeeInclude(),
		});
		const context = await safeEvaluationContext(employees.map((employee) => employee.id));
		const needs = new Map();
		const employeeDirectory = new Map();

		employees.forEach((employee) => {
			employeeDirectory.set(employee.id, {
				employeeId: employee.id,
				employeeNo: employee.employeeNo,
				fullName: employee.fullName,
				departmentName: employee.department?.name || '',
				grade: employee.grade,
			});

			const evaluation = evaluateForEmployee(employee, context);
			const trainingCategory = evaluation.categories.find((category) => category.key === CATEGORY.TRAINING);

			if (!trainingCategory) {
				return;
			}

			trainingCategory.items
				.filter((item) => item.result !== 'TERPENUHI')
				.forEach((item) => {
					if (!needs.has(item.label)) {
						needs.set(item.label, { trainingName: item.label, employeeCount: 0, employeeIds: [] });
					}

					const entry = needs.get(item.label);
					entry.employeeCount += 1;
					entry.employeeIds.push(employee.id);
				});
		});

		const rows = [...needs.values()]
			.map((entry) => ({
				trainingName: entry.trainingName,
				employeeCount: entry.employeeCount,
				employees: entry.employeeIds.map((employeeId) => employeeDirectory.get(employeeId)).filter(Boolean),
			}))
			.sort((left, right) => right.employeeCount - left.employeeCount || left.trainingName.localeCompare(right.trainingName));

		return res.json({ total: rows.length, rows });
	}),
);

export default router;
