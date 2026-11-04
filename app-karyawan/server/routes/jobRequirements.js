import { Router } from 'express';

import prisma from '../lib/prisma.js';
import { buildSiteWhere, siteNotFound } from '../lib/siteScope.js';
import {
	CATEGORY,
	evaluateJobRequirement,
	normalizeText,
} from '../lib/jobRequirement.js';
import {
	DEFAULT_TARGET_LEVEL,
	evaluateSkillReadiness,
	normalizeLevel,
} from '../lib/skillMatrix.js';
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
		readinessStatus: evaluation.readiness?.status ?? null,
		readinessStatusLabel: evaluation.readiness?.statusLabel ?? null,
		readinessPercent: evaluation.readiness?.readinessPercent ?? null,
		assessedSkillCount: evaluation.readiness?.assessedItems ?? 0,
	};

	if (includeItems) {
		row.categories = evaluation.categories;
		row.unmetItems = evaluation.unmetItems;
	}

	return row;
}

async function safeEvaluationContext(employeeIds, { periodId } = {}) {
	const resolvedPeriodId = periodId === undefined ? await resolveActivePeriodId() : periodId;

	const [profiles, assessments, participants] = await Promise.all([
		prisma.jobRequirementProfile.findMany({ include: profileInclude() }),
		employeeIds.length > 0
			? prisma.employeeSkillAssessment.findMany({
					where: {
						employeeId: { in: employeeIds },
						...(resolvedPeriodId ? { periodId: resolvedPeriodId } : {}),
					},
			  })
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
		periodId: resolvedPeriodId,
		profileByGrade,
		assessmentByEmployee: buildAssessmentRows(assessments),
		trainingByEmployee: buildEmployeeTrainingRows(participants),
	};
}

async function resolveActivePeriodId() {
	const active = await prisma.skillAssessmentPeriod.findFirst({
		where: { isActive: true },
		orderBy: { startDate: 'desc' },
		select: { id: true },
	});

	return active?.id ?? null;
}

/**
 * Resolve the period for a write. An explicit periodId in the query/body wins,
 * otherwise the single active period is used. Returns null after responding
 * when no usable period exists.
 */
async function resolvePeriodId(req, res) {
	const explicit = parseId(req.body?.periodId ?? req.query?.periodId);

	if (explicit) {
		const period = await prisma.skillAssessmentPeriod.findUnique({
			where: { id: explicit },
			select: { id: true },
		});

		if (!period) {
			res.status(404).json({ message: 'Periode asesmen tidak ditemukan.' });
			return null;
		}

		return period.id;
	}

	const activeId = await resolveActivePeriodId();

	if (!activeId) {
		res.status(409).json({
			message: 'Belum ada periode asesmen aktif. Aktifkan periode terlebih dahulu sebelum menilai.',
		});
		return null;
	}

	return activeId;
}

function evaluateForEmployee(employee, context) {
	const profile = context.profileByGrade.get(employee.grade) || null;
	const assessments = context.assessmentByEmployee.get(employee.id) || [];

	const evaluation = evaluateJobRequirement({
		employee,
		profile,
		assessments,
		employeeTrainings: context.trainingByEmployee.get(employee.id) || [],
	});

	return {
		...evaluation,
		readiness: profile
			? evaluateSkillReadiness({ requirements: profile.skills || [], assessments })
			: evaluateSkillReadiness({ requirements: [], assessments: [] }),
	};
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
			periodId: context.periodId,
			evaluation,
			readiness: evaluation.readiness,
			profile,
			assessments: (context.assessmentByEmployee.get(employee.id) || []).map((assessment) => ({
				id: assessment.id,
				category: assessment.category,
				skillName: assessment.skillName,
				masterSkillId: assessment.masterSkillId ?? null,
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

		if (rawAssessments.length === 0) {
			return res.status(400).json({ message: 'Tidak ada asesmen yang dikirim.' });
		}

		const periodId = await resolvePeriodId(req, res);

		if (periodId === null) {
			return undefined;
		}

		const masterSkills = await prisma.masterSkill.findMany();
		const masterSkillByKey = new Map(
			masterSkills.map((skill) => [`${skill.category}:${skill.name}`.toLowerCase(), skill.id]),
		);

		const normalized = [];

		for (const item of rawAssessments) {
			const category = normalizeString(item?.category).toUpperCase();
			const skillName = normalizeString(item?.skillName);
			const level = normalizeLevel(item?.level);
			const notes = normalizeString(item?.notes) || null;

			if (!SKILL_CATEGORIES.includes(category)) {
				return res.status(400).json({ message: `Kategori skill tidak valid: ${category || '-'}.` });
			}

			if (!skillName) {
				return res.status(400).json({ message: 'Nama skill wajib diisi.' });
			}

			if (level === null) {
				return res.status(400).json({ message: `Level skill ${skillName} harus 0 sampai 5.` });
			}

			normalized.push({
				category,
				skillName,
				level,
				notes,
				masterSkillId: masterSkillByKey.get(`${category}:${skillName}`.toLowerCase()) ?? null,
			});
		}

		const now = new Date();
		const adminId = req.admin?.id ?? null;

		await prisma.$transaction(
			normalized.map((item) =>
				prisma.employeeSkillAssessment.upsert({
					where: {
						employeeId_category_skillName_periodId: {
							employeeId: id,
							category: item.category,
							skillName: item.skillName,
							periodId,
						},
					},
					update: {
						level: item.level,
						notes: item.notes,
						masterSkillId: item.masterSkillId,
						assessedAt: now,
						assessedByAdminId: adminId,
					},
					create: {
						employeeId: id,
						category: item.category,
						skillName: item.skillName,
						level: item.level,
						notes: item.notes,
						masterSkillId: item.masterSkillId,
						periodId,
						assessedAt: now,
						assessedByAdminId: adminId,
					},
				}),
			),
		);

		const context = await safeEvaluationContext([id], { periodId });
		const employees = await prisma.employee.findMany({ where: { id }, include: employeeInclude() });
		const evaluation = evaluateForEmployee(employees[0], context);

		return res.json({ updated: normalized.length, periodId, evaluation, readiness: evaluation.readiness });
	}),
);

router.delete(
	'/employees/:id/assessments/:category/:skillName',
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

		const category = normalizeString(req.params.category).toUpperCase();
		const skillName = normalizeString(req.params.skillName);

		if (!SKILL_CATEGORIES.includes(category)) {
			return res.status(400).json({ message: `Kategori skill tidak valid: ${category || '-'}.` });
		}

		if (!skillName) {
			return res.status(400).json({ message: 'Nama skill wajib diisi.' });
		}

		const periodId = await resolvePeriodId(req, res);

		if (periodId === null) {
			return undefined;
		}

		const deleted = await prisma.employeeSkillAssessment.deleteMany({
			where: { employeeId: id, category, skillName, periodId },
		});

		if (deleted.count === 0) {
			return res.status(404).json({ message: 'Asesmen tidak ditemukan pada periode tersebut.' });
		}

		const context = await safeEvaluationContext([id], { periodId });
		const employees = await prisma.employee.findMany({ where: { id }, include: employeeInclude() });
		const evaluation = evaluateForEmployee(employees[0], context);

		return res.json({
			deleted: deleted.count,
			periodId,
			evaluation,
			readiness: evaluation.readiness,
		});
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

router.get(
	'/assessment-sheet',
	withAsync(async (req, res) => {
		const departmentId = parseId(req.query.departmentId);
		const gradeFilter = normalizeString(req.query.grade).toUpperCase();
		const search = normalizeText(req.query.search);
		const periodId = parseId(req.query.periodId) ?? (await resolveActivePeriodId());

		if (!periodId) {
			return res.status(409).json({
				message: 'Belum ada periode asesmen aktif. Aktifkan periode terlebih dahulu.',
			});
		}

		const period = await prisma.skillAssessmentPeriod.findUnique({ where: { id: periodId } });

		if (!period) {
			return res.status(404).json({ message: 'Periode asesmen tidak ditemukan.' });
		}

		const where = { ...buildSiteWhere(req) };

		if (departmentId) {
			where.departmentId = departmentId;
		}

		if (gradeFilter) {
			where.grade = gradeFilter;
		}

		const employees = await prisma.employee.findMany({
			where,
			include: employeeInclude(),
			orderBy: [{ grade: 'asc' }, { fullName: 'asc' }],
		});

		const filteredEmployees = search
			? employees.filter((employee) =>
					`${employee.fullName} ${employee.employeeNo} ${employee.department?.name || ''}`
						.toLowerCase()
						.includes(search),
			  )
			: employees;

		const context = await safeEvaluationContext(
			filteredEmployees.map((employee) => employee.id),
			{ periodId },
		);

		const rows = filteredEmployees.map((employee) => {
			const profile = context.profileByGrade.get(employee.grade) || null;
			const assessmentIndex = new Map(
				(context.assessmentByEmployee.get(employee.id) || []).map((assessment) => [
					`${assessment.category}:${assessment.skillName}`.toLowerCase(),
					assessment,
				]),
			);

			const items = (profile?.skills || []).map((skill) => {
				const assessment = assessmentIndex.get(`${skill.category}:${skill.name}`.toLowerCase()) || null;

				return {
					category: skill.category,
					skillName: skill.name,
					targetLevel: skill.targetLevel ?? DEFAULT_TARGET_LEVEL,
					level: assessment ? assessment.level : null,
					assessedAt: assessment?.assessedAt ?? null,
					notes: assessment?.notes ?? null,
				};
			});

			const evaluation = evaluateForEmployee(employee, context);

			return {
				employeeId: employee.id,
				employeeNo: employee.employeeNo,
				fullName: employee.fullName,
				departmentId: employee.departmentId,
				departmentName: employee.department?.name || '',
				jobLevelName: employee.jobLevel?.name || '',
				grade: employee.grade,
				gradeLabel: evaluation.gradeLabel,
				readinessStatus: evaluation.readiness.status,
				readinessStatusLabel: evaluation.readiness.statusLabel,
				readinessPercent: evaluation.readiness.readinessPercent,
				assessedItems: evaluation.readiness.assessedItems,
				totalItems: evaluation.readiness.totalItems,
				isComplete: evaluation.readiness.isComplete,
				completionPercent: evaluation.readiness.completionPercent,
				items,
			};
		});

		return res.json({
			period,
			rows,
			summary: {
				employeeCount: rows.length,
				assessedEmployees: rows.filter((row) => row.assessedItems > 0).length,
				completeEmployees: rows.filter((row) => row.isComplete).length,
				readyEmployees: rows.filter((row) => row.readinessStatus === 'SIAP').length,
				averageReadiness: (() => {
					const scored = rows.filter((row) => row.readinessPercent != null);

					if (scored.length === 0) {
						return null;
					}

					return Math.round(
						scored.reduce((total, row) => total + row.readinessPercent, 0) / scored.length,
					);
				})(),
			},
		});
	}),
);

const MATRIX_MAX_EMPLOYEES = 200;

function buildMatrixColumnKey(category, name) {
	return `${category}:${normalizeText(name)}`;
}

router.get(
	'/matrix',
	withAsync(async (req, res) => {
		const departmentId = parseId(req.query.departmentId);

		if (!departmentId) {
			return res.status(400).json({ message: 'Pilih departemen terlebih dahulu.' });
		}

		const periodId = parseId(req.query.periodId) ?? (await resolveActivePeriodId());

		if (!periodId) {
			return res.status(409).json({
				message: 'Belum ada periode asesmen aktif. Aktifkan periode terlebih dahulu.',
			});
		}

		const period = await prisma.skillAssessmentPeriod.findUnique({ where: { id: periodId } });

		if (!period) {
			return res.status(404).json({ message: 'Periode asesmen tidak ditemukan.' });
		}

		const gradeFilter = normalizeString(req.query.grade).toUpperCase();
		const search = normalizeText(req.query.search);
		const page = Math.max(1, parseId(req.query.page) ?? 1);
		const limit = Math.min(parseId(req.query.limit) ?? MATRIX_MAX_EMPLOYEES, MATRIX_MAX_EMPLOYEES);

		const where = { ...buildSiteWhere(req), departmentId };

		if (gradeFilter) {
			where.grade = gradeFilter;
		}

		const department = await prisma.department.findUnique({
			where: { id: departmentId },
			select: { id: true, name: true },
		});

		const employees = await prisma.employee.findMany({
			where,
			include: employeeInclude(),
			orderBy: [{ grade: 'asc' }, { fullName: 'asc' }],
		});

		const searchedEmployees = search
			? employees.filter((employee) =>
					`${employee.fullName} ${employee.employeeNo}`.toLowerCase().includes(search),
			  )
			: employees;

		const totalEmployees = searchedEmployees.length;
		const pageEmployees = searchedEmployees.slice((page - 1) * limit, page * limit);

		const context = await safeEvaluationContext(
			pageEmployees.map((employee) => employee.id),
			{ periodId },
		);

		// Columns = union of every skill required by any grade present in this department.
		const gradesInScope = [...new Set(employees.map((employee) => employee.grade))];
		const columnMeta = new Map();

		gradesInScope.forEach((grade) => {
			const profile = context.profileByGrade.get(grade);

			(profile?.skills || []).forEach((skill) => {
				const key = buildMatrixColumnKey(skill.category, skill.name);
				const entry = columnMeta.get(key) || {
					key,
					category: skill.category,
					skillName: skill.name,
					requiredGrades: [],
					targetLevels: [],
				};

				entry.requiredGrades.push(grade);
				entry.targetLevels.push(skill.targetLevel ?? DEFAULT_TARGET_LEVEL);
				columnMeta.set(key, entry);
			});
		});

		const columns = [...columnMeta.values()]
			.map((entry) => ({
				key: entry.key,
				category: entry.category,
				skillName: entry.skillName,
				requiredGradeCount: entry.requiredGrades.length,
				requiredGrades: entry.requiredGrades,
				maxTarget: Math.max(...entry.targetLevels),
			}))
			.sort((left, right) => {
				if (left.category !== right.category) {
					return left.category === CATEGORY.SOFT_SKILL ? -1 : 1;
				}

				return (
					right.requiredGradeCount - left.requiredGradeCount ||
					left.skillName.localeCompare(right.skillName)
				);
			});

		const rows = pageEmployees.map((employee) => {
			const profile = context.profileByGrade.get(employee.grade) || null;
			const assessments = context.assessmentByEmployee.get(employee.id) || [];
			const assessmentByKey = new Map(
				assessments.map((assessment) => [
					buildMatrixColumnKey(assessment.category, assessment.skillName),
					assessment,
				]),
			);

			const requirementByKey = new Map(
				(profile?.skills || []).map((skill) => [
					buildMatrixColumnKey(skill.category, skill.name),
					{
						targetLevel: skill.targetLevel ?? DEFAULT_TARGET_LEVEL,
					},
				]),
			);

			const cells = {};

			columns.forEach((column) => {
				const requirement = requirementByKey.get(column.key);

				if (!requirement) {
					cells[column.key] = { required: false };
					return;
				}

				const assessment = assessmentByKey.get(column.key);
				const level = assessment ? assessment.level : null;
				const met = level != null && level >= requirement.targetLevel;

				cells[column.key] = {
					required: true,
					level,
					targetLevel: requirement.targetLevel,
					met,
					gap: level == null ? null : Math.max(requirement.targetLevel - level, 0),
				};
			});

			const evaluation = evaluateForEmployee(employee, context);

			return {
				employeeId: employee.id,
				employeeNo: employee.employeeNo,
				fullName: employee.fullName,
				departmentName: employee.department?.name || '',
				jobLevelName: employee.jobLevel?.name || '',
				grade: employee.grade,
				gradeLabel: evaluation.gradeLabel,
				readinessStatus: evaluation.readiness.status,
				readinessStatusLabel: evaluation.readiness.statusLabel,
				readinessPercent: evaluation.readiness.readinessPercent,
				assessedItems: evaluation.readiness.assessedItems,
				totalItems: evaluation.readiness.totalItems,
				isComplete: evaluation.readiness.isComplete,
				completionPercent: evaluation.readiness.completionPercent,
				cells,
			};
		});

		// Aggregate per skill across the whole department (not just the current page).
		const allContext = await safeEvaluationContext(
			searchedEmployees.map((employee) => employee.id),
			{ periodId },
		);

		const skillStats = columns.map((column) => {
			let requiredCount = 0;
			let assessedCount = 0;
			let metCount = 0;
			let gapCount = 0;
			let gapSum = 0;

			searchedEmployees.forEach((employee) => {
				const profile = allContext.profileByGrade.get(employee.grade);
				const requirement = (profile?.skills || []).find(
					(skill) => buildMatrixColumnKey(skill.category, skill.name) === column.key,
				);

				if (!requirement) {
					return;
				}

				requiredCount += 1;

				const assessment = (allContext.assessmentByEmployee.get(employee.id) || []).find(
					(item) => buildMatrixColumnKey(item.category, item.skillName) === column.key,
				);

				if (!assessment) {
					return;
				}

				assessedCount += 1;

				const target = requirement.targetLevel ?? DEFAULT_TARGET_LEVEL;

				if (assessment.level >= target) {
					metCount += 1;
				} else {
					gapCount += 1;
					gapSum += target - assessment.level;
				}
			});

			return {
				key: column.key,
				skillName: column.skillName,
				category: column.category,
				requiredCount,
				assessedCount,
				metCount,
				gapCount,
				averageGap: gapCount === 0 ? 0 : Number((gapSum / gapCount).toFixed(2)),
				coveragePercent: requiredCount === 0 ? null : Math.round((assessedCount / requiredCount) * 100),
				metPercent: assessedCount === 0 ? null : Math.round((metCount / assessedCount) * 100),
			};
		});

		const naCells = rows.reduce(
			(total, row) => total + columns.filter((column) => !row.cells[column.key]?.required).length,
			0,
		);
		const assessedCells = rows.reduce(
			(total, row) =>
				total +
				columns.filter((column) => {
					const cell = row.cells[column.key];
					return cell?.required && cell.level != null;
				}).length,
			0,
		);
		const requiredCells = rows.reduce(
			(total, row) => total + columns.filter((column) => row.cells[column.key]?.required).length,
			0,
		);
		const scored = rows.filter((row) => row.readinessPercent != null);

		return res.json({
			period,
			department,
			page,
			limit,
			totalEmployees,
			totalPages: Math.max(1, Math.ceil(totalEmployees / limit)),
			columns,
			rows,
			summary: {
				employeeCount: totalEmployees,
				gradeCount: gradesInScope.length,
				skillCount: columns.length,
				requiredCells,
				assessedCells,
				unassessedCells: requiredCells - assessedCells,
				naCells,
				naPercent: requiredCells + naCells === 0 ? 0 : Math.round((naCells / (requiredCells + naCells)) * 100),
				assessedEmployees: searchedEmployees.filter((employee) => {
					return (allContext.assessmentByEmployee.get(employee.id) || []).length > 0;
				}).length,
				completeEmployees: searchedEmployees.filter((employee) => {
					const profile = allContext.profileByGrade.get(employee.grade);

					if (!profile) {
						return false;
					}

					return evaluateSkillReadiness({
						requirements: profile.skills || [],
						assessments: allContext.assessmentByEmployee.get(employee.id) || [],
					}).isComplete;
				}).length,
				readyEmployees: searchedEmployees.filter((employee) => {
					const profile = allContext.profileByGrade.get(employee.grade);

					if (!profile) {
						return false;
					}

					return (
						evaluateSkillReadiness({
							requirements: profile.skills || [],
							assessments: allContext.assessmentByEmployee.get(employee.id) || [],
						}).status === 'SIAP'
					);
				}).length,
				averageReadiness:
					scored.length === 0
						? null
						: Math.round(
							scored.reduce((total, row) => total + row.readinessPercent, 0) / scored.length,
						  ),
			},
			gaps: skillStats
				.filter((stat) => stat.gapCount > 0)
				.sort((left, right) => right.gapCount - left.gapCount || left.skillName.localeCompare(right.skillName))
				.slice(0, 15),
			skills: skillStats,
		});
	}),
);

router.get(
	'/skill-training-recommendations',
	withAsync(async (req, res) => {
		const departmentId = parseId(req.query.departmentId);
		const gradeFilter = normalizeString(req.query.grade).toUpperCase();
		const periodId = parseId(req.query.periodId) ?? (await resolveActivePeriodId());
		const where = { ...buildSiteWhere(req) };

		if (departmentId) {
			where.departmentId = departmentId;
		}

		if (gradeFilter) {
			where.grade = gradeFilter;
		}

		const [employees, mapRows, masterTrainings] = await Promise.all([
			prisma.employee.findMany({ where, include: employeeInclude() }),
			prisma.skillTrainingMap.findMany(),
			prisma.masterTraining.findMany({ select: { id: true, name: true, category: true } }),
		]);

		const context = await safeEvaluationContext(
			employees.map((employee) => employee.id),
			{ periodId },
		);

		const trainingById = new Map(masterTrainings.map((training) => [training.id, training]));
		const trainingIdsBySkill = new Map();

		mapRows.forEach((map) => {
			const entry = trainingIdsBySkill.get(map.masterSkillId) || [];
			entry.push(map.masterTrainingId);
			trainingIdsBySkill.set(map.masterSkillId, entry);
		});

		const hasMapping = mapRows.length > 0;
		const recommendations = new Map();
		const employeeDirectory = new Map();
		let employeesWithGap = 0;
		let unmappedGapCount = 0;

		employees.forEach((employee) => {
			const profile = context.profileByGrade.get(employee.grade);

			if (!profile) {
				return;
			}

			const assessments = context.assessmentByEmployee.get(employee.id) || [];
			const assessmentByKey = new Map(
				assessments.map((assessment) => [
					buildMatrixColumnKey(assessment.category, assessment.skillName),
					assessment,
				]),
			);

			let employeeHasGap = false;

			(profile.skills || []).forEach((skill) => {
				const assessment = assessmentByKey.get(buildMatrixColumnKey(skill.category, skill.name));

				if (!assessment) {
					return;
				}

				const target = skill.targetLevel ?? DEFAULT_TARGET_LEVEL;

				if (assessment.level >= target) {
					return;
				}

				employeeHasGap = true;
				const gap = target - assessment.level;
				const mappedTrainingIds = skill.masterSkillId
					? trainingIdsBySkill.get(skill.masterSkillId) || []
					: [];

				if (mappedTrainingIds.length === 0) {
					unmappedGapCount += 1;
					return;
				}

				mappedTrainingIds.forEach((trainingId) => {
					const training = trainingById.get(trainingId);

					if (!training) {
						return;
					}

					if (!recommendations.has(trainingId)) {
						recommendations.set(trainingId, {
							masterTrainingId: trainingId,
							trainingName: training.name,
							category: training.category || '',
							employeeCount: 0,
							employeeIds: [],
							skills: [],
							maxGap: 0,
							totalGap: 0,
						});
					}

					const entry = recommendations.get(trainingId);
					const existingSkill = entry.skills.find((item) => item.skillName === skill.name);

					if (!existingSkill) {
						entry.skills.push({
							skillName: skill.name,
							category: skill.category,
							targetLevel: target,
							affectedEmployees: 0,
						});
					}

					const skillEntry = entry.skills.find((item) => item.skillName === skill.name);
					skillEntry.affectedEmployees += 1;
					entry.maxGap = Math.max(entry.maxGap, gap);
					entry.totalGap += gap;

					if (!entry.employeeIds.includes(employee.id)) {
						entry.employeeIds.push(employee.id);
						entry.employeeCount += 1;
						employeeDirectory.set(employee.id, {
							employeeId: employee.id,
							employeeNo: employee.employeeNo,
							fullName: employee.fullName,
							departmentName: employee.department?.name || '',
							grade: employee.grade,
						});
					}
				});
			});

			if (employeeHasGap) {
				employeesWithGap += 1;
			}
		});

		const rows = [...recommendations.values()]
			.map((entry) => ({
				...entry,
				employees: entry.employeeIds.map((employeeId) => employeeDirectory.get(employeeId)).filter(Boolean),
			}))
			.sort(
				(left, right) =>
					right.employeeCount - left.employeeCount ||
					right.maxGap - left.maxGap ||
					left.trainingName.localeCompare(right.trainingName),
			);

		return res.json({
			periodId,
			hasMapping,
			total: rows.length,
			employeesWithGap,
			unmappedGapCount,
			rows,
		});
	}),
);

export default router;
