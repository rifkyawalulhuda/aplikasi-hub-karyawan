const SKILL_LEVEL_MIN = 0;
const SKILL_LEVEL_MAX = 5;

const DEFAULT_TARGET_LEVEL = 3;

const READINESS_STATUS = {
	READY: 'SIAP',
	DEVELOPING: 'DALAM_PENGEMBANGAN',
	INCOMPLETE: 'BELUM_LENGKAP',
	NOT_ASSESSED: 'BELUM_DINILAI',
};

const READINESS_STATUS_LABELS = {
	[READINESS_STATUS.READY]: 'Siap',
	[READINESS_STATUS.DEVELOPING]: 'Dalam Pengembangan',
	[READINESS_STATUS.INCOMPLETE]: 'Belum Lengkap',
	[READINESS_STATUS.NOT_ASSESSED]: 'Belum Dinilai',
};

const READY_MIN_PERCENT = 80;

const SKILL_LEVEL_LABELS = {
	0: 'Tidak terpapar',
	1: 'Memahami konsep',
	2: 'Dapat dengan supervisi',
	3: 'Mandiri',
	4: 'Melatih orang lain',
	5: 'Rujukan / penyusun standar',
};

function normalizeTargetLevel(value) {
	if (value == null || value === '') {
		return DEFAULT_TARGET_LEVEL;
	}

	const parsed = Number(value);

	if (!Number.isInteger(parsed) || parsed < SKILL_LEVEL_MIN || parsed > SKILL_LEVEL_MAX) {
		return null;
	}

	return parsed;
}

function normalizeLevel(value) {
	const parsed = Number(value);

	if (!Number.isInteger(parsed) || parsed < SKILL_LEVEL_MIN || parsed > SKILL_LEVEL_MAX) {
		return null;
	}

	return parsed;
}

/**
 * Readiness against the job requirement of the employee's own grade.
 *
 * Every required skill counts equally and contributes to the denominator, so an
 * employee who has only been assessed on one of seven skills can never read as
 * 100%. Skills that are required (target > 0) but not yet assessed simply score
 * zero; skills with target 0 are excluded because they are not a requirement.
 *
 * An employee with no assessment at all returns `null` instead of 0, because
 * "not measured" and "measured and failing" are different situations.
 */
function evaluateSkillReadiness({ requirements = [], assessments = [] }) {
	const assessedByKey = new Map();

	assessments.forEach((assessment) => {
		assessedByKey.set(`${assessment.category}:${assessment.skillName}`.toLowerCase(), assessment);
	});

	const requiredSkills = requirements.filter(
		(requirement) => (requirement.targetLevel ?? DEFAULT_TARGET_LEVEL) > 0,
	);

	const items = requiredSkills.map((requirement) => {
		const key = `${requirement.category}:${requirement.name}`.toLowerCase();
		const assessment = assessedByKey.get(key) || null;
		const targetLevel = requirement.targetLevel ?? DEFAULT_TARGET_LEVEL;
		const level = assessment ? Number(assessment.level) : null;

		if (level == null) {
			return {
				category: requirement.category,
				name: requirement.name,
				masterSkillId: requirement.masterSkillId ?? null,
				targetLevel,
				level: null,
				gap: targetLevel,
				assessed: false,
				met: false,
				assessedAt: null,
			};
		}

		const met = level >= targetLevel;

		return {
			category: requirement.category,
			name: requirement.name,
			masterSkillId: requirement.masterSkillId ?? null,
			targetLevel,
			level,
			gap: met ? 0 : targetLevel - level,
			assessed: true,
			met,
			assessedAt: assessment?.assessedAt ?? null,
		};
	});

	const assessedItems = items.filter((item) => item.assessed);
	const totalItems = items.length;
	const isComplete = totalItems > 0 && assessedItems.length === totalItems;

	// Assessments may exist for skills that are not required by this grade (for
	// example after a skill was dropped from the requirement). Those do not count
	// as "measured" here: only an assessment on a required skill does. Otherwise an
	// employee whose only assessments are off-requirement would read as 0% instead
	// of "not assessed".
	const hasAnyAssessment = assessedItems.length > 0;

	const totalTarget = items.reduce((sum, item) => sum + item.targetLevel, 0);
	const achievedScore = items.reduce(
		(sum, item) => sum + (item.assessed ? Math.min(item.level, item.targetLevel) : 0),
		0,
	);

	// Nothing measured at all: report "unknown", not "zero".
	const readinessPercent =
		!hasAnyAssessment || totalTarget === 0
			? null
			: Math.round((achievedScore / totalTarget) * 100);

	const completionPercent =
		totalItems === 0 ? null : Math.round((assessedItems.length / totalItems) * 100);

	let status = READINESS_STATUS.NOT_ASSESSED;

	if (hasAnyAssessment && totalItems > 0) {
		if (!isComplete) {
			status = READINESS_STATUS.INCOMPLETE;
		} else if (readinessPercent != null && readinessPercent >= READY_MIN_PERCENT) {
			status = READINESS_STATUS.READY;
		} else {
			status = READINESS_STATUS.DEVELOPING;
		}
	}

	return {
		status,
		statusLabel: READINESS_STATUS_LABELS[status],
		readinessPercent,
		isComplete,
		completionPercent,
		totalItems,
		assessedItems: assessedItems.length,
		unassessedItems: totalItems - assessedItems.length,
		metItems: items.filter((item) => item.met).length,
		totalTarget,
		achievedScore,
		items,
	};
}

export {
	DEFAULT_TARGET_LEVEL,
	READINESS_STATUS,
	READINESS_STATUS_LABELS,
	READY_MIN_PERCENT,
	SKILL_LEVEL_LABELS,
	SKILL_LEVEL_MAX,
	SKILL_LEVEL_MIN,
	evaluateSkillReadiness,
	normalizeLevel,
	normalizeTargetLevel,
};
