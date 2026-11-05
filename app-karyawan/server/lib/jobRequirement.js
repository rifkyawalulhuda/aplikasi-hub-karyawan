const SKILL_PASS_LEVEL = 3;

const CATEGORY = {
	EDUCATION: 'EDUCATION',
	EXPERIENCE: 'EXPERIENCE',
	EMPLOYMENT: 'EMPLOYMENT',
	GENDER: 'GENDER',
	SOFT_SKILL: 'SOFT_SKILL',
	HARD_SKILL: 'HARD_SKILL',
	TRAINING: 'TRAINING',
};

const CATEGORY_LABELS = {
	[CATEGORY.EDUCATION]: 'Pendidikan',
	[CATEGORY.EXPERIENCE]: 'Pengalaman',
	[CATEGORY.EMPLOYMENT]: 'Status Karyawan',
	[CATEGORY.GENDER]: 'Jenis Kelamin',
	[CATEGORY.SOFT_SKILL]: 'Soft Skill',
	[CATEGORY.HARD_SKILL]: 'Hard Skill',
	[CATEGORY.TRAINING]: 'Training',
};

const MANDATORY_CATEGORIES = new Set([
	CATEGORY.EDUCATION,
	CATEGORY.EXPERIENCE,
	CATEGORY.EMPLOYMENT,
	CATEGORY.GENDER,
]);

const EDUCATION_RANK = { SMA: 1, D3: 2, S1: 3, S2: 4 };

const EDUCATION_LABELS = {
	SMA: 'SLTA (Sederajat)',
	D3: 'D3',
	S1: 'S1',
	S2: 'S2',
};

const EMPLOYMENT_LABELS = {
	PERMANENT: 'Permanen',
	CONTRACT: 'Kontrak',
};

const GENDER_LABELS = {
	MALE: 'Laki-laki',
	FEMALE: 'Perempuan',
};

const ITEM_RESULT = {
	MET: 'TERPENUHI',
	UNMET: 'BELUM_TERPENUHI',
	NOT_ASSESSED: 'BELUM_DINILAI',
	MANUAL: 'MANUAL',
};

const STATUS = {
	MEETS: 'MEMENUHI',
	DOES_NOT_MEET: 'BELUM_MEMENUHI',
	NOT_ASSESSED: 'BELUM_DINILAI',
	NO_PROFILE: 'TIDAK_ADA_PROFIL',
};

const STATUS_LABELS = {
	[STATUS.MEETS]: 'Memenuhi',
	[STATUS.DOES_NOT_MEET]: 'Belum Memenuhi',
	[STATUS.NOT_ASSESSED]: 'Belum Dinilai',
	[STATUS.NO_PROFILE]: 'Tanpa Profil',
};

function normalizeText(value = '') {
	return String(value).trim().replace(/\s+/g, ' ').toLowerCase();
}

function toDate(value) {
	if (!value) {
		return null;
	}

	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value;
	}

	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function diffYears(fromDate, toDateValue = new Date()) {
	const from = toDate(fromDate);
	const to = toDate(toDateValue);

	if (!from || !to) {
		return 0;
	}

	let years = to.getUTCFullYear() - from.getUTCFullYear();
	const monthDiff = to.getUTCMonth() - from.getUTCMonth();

	if (monthDiff < 0 || (monthDiff === 0 && to.getUTCDate() < from.getUTCDate())) {
		years -= 1;
	}

	return Math.max(years, 0);
}

function formatGradeLabel(grade = '') {
	const match = String(grade).match(/^RANK_(\d+)$/);
	return match ? `Rank ${match[1]}` : String(grade || '');
}

function buildAssessmentIndex(assessments = []) {
	const index = new Map();

	assessments.forEach((assessment) => {
		const key = `${assessment.category}:${normalizeText(assessment.skillName)}`;
		index.set(key, assessment);
	});

	return index;
}

function buildEmployeeTrainingKeys(employeeTrainings = []) {
	const keys = new Set();

	employeeTrainings.forEach((item) => {
		const masterName = item.masterTraining?.name || item.masterTrainingName;

		if (masterName) {
			keys.add(normalizeText(masterName));
		}

		if (item.material) {
			keys.add(normalizeText(item.material));
		}
	});

	return keys;
}

function buildItem({ key, label, required, actual, result, note = '' }) {
	return { key, label, required, actual, result, note };
}

function finalizeCategory(key, items) {
	const total = items.length;
	const met = items.filter((item) => item.result === ITEM_RESULT.MET).length;
	const notAssessed = items.filter((item) => item.result === ITEM_RESULT.NOT_ASSESSED).length;
	const manual = items.filter((item) => item.result === ITEM_RESULT.MANUAL).length;
	const percent = total === 0 ? 100 : Math.round((met / total) * 100);

	return {
		key,
		label: CATEGORY_LABELS[key],
		mandatory: MANDATORY_CATEGORIES.has(key),
		total,
		met,
		notAssessed,
		manual,
		percent,
		items,
	};
}

function buildEducationCategory(profile, employee) {
	const items = [];

	// Education is always a fixed enum (SMA/D3/S1/S2). The old free-text column was
	// dropped, so there is no manual branch here any more.
	if (profile.minEducation) {
		const requiredRank = EDUCATION_RANK[profile.minEducation] || 0;
		const actualRank = EDUCATION_RANK[employee.educationLevel] || 0;

		items.push(
			buildItem({
				key: 'education',
				label: 'Pendidikan minimal',
				required: EDUCATION_LABELS[profile.minEducation] || profile.minEducation,
				actual: EDUCATION_LABELS[employee.educationLevel] || employee.educationLevel || '-',
				result: actualRank >= requiredRank ? ITEM_RESULT.MET : ITEM_RESULT.UNMET,
			}),
		);
	}

	return finalizeCategory(CATEGORY.EDUCATION, items);
}

function buildExperienceCategory(profile, employee, referenceDate) {
	const items = [];

	if (profile.minExperienceYears != null) {
		const actualYears = diffYears(employee.joinDate, referenceDate);

		items.push(
			buildItem({
				key: 'experience',
				label: 'Masa kerja minimal',
				required: `${profile.minExperienceYears} tahun`,
				actual: `${actualYears} tahun`,
				result: actualYears >= profile.minExperienceYears ? ITEM_RESULT.MET : ITEM_RESULT.UNMET,
			}),
		);
	}

	return finalizeCategory(CATEGORY.EXPERIENCE, items);
}

function buildEmploymentCategory(profile, employee) {
	const items = [];
	const allowed = profile.allowedEmploymentTypes || [];

	if (allowed.length > 0) {
		items.push(
			buildItem({
				key: 'employmentType',
				label: 'Status karyawan',
				required: allowed.map((value) => EMPLOYMENT_LABELS[value] || value).join(' / '),
				actual: EMPLOYMENT_LABELS[employee.employmentType] || employee.employmentType || '-',
				result: allowed.includes(employee.employmentType) ? ITEM_RESULT.MET : ITEM_RESULT.UNMET,
			}),
		);
	}

	return finalizeCategory(CATEGORY.EMPLOYMENT, items);
}

function buildGenderCategory(profile, employee) {
	const items = [];
	const allowed = profile.allowedGenders || [];

	if (allowed.length > 0) {
		items.push(
			buildItem({
				key: 'gender',
				label: 'Jenis kelamin',
				required: allowed.map((value) => GENDER_LABELS[value] || value).join(' / '),
				actual: GENDER_LABELS[employee.gender] || employee.gender || '-',
				result: allowed.includes(employee.gender) ? ITEM_RESULT.MET : ITEM_RESULT.UNMET,
			}),
		);
	}

	return finalizeCategory(CATEGORY.GENDER, items);
}

function buildSkillCategory(categoryKey, profileSkills, assessmentIndex) {
	const items = (profileSkills || []).map((skill) => {
		const assessment = assessmentIndex.get(`${categoryKey}:${normalizeText(skill.name)}`);

		if (!assessment) {
			return buildItem({
				key: skill.name,
				label: skill.name,
				required: `Level >= ${SKILL_PASS_LEVEL}`,
				actual: 'Belum dinilai',
				result: ITEM_RESULT.NOT_ASSESSED,
			});
		}

		return buildItem({
			key: skill.name,
			label: skill.name,
			required: `Level >= ${SKILL_PASS_LEVEL}`,
			actual: `Level ${assessment.level}`,
			result: Number(assessment.level) >= SKILL_PASS_LEVEL ? ITEM_RESULT.MET : ITEM_RESULT.UNMET,
		});
	});

	return finalizeCategory(categoryKey, items);
}

function buildTrainingCategory(profileTrainings, trainingKeys) {
	const items = (profileTrainings || []).map((training) => {
		const name = training.masterTraining?.name || training.name || '';
		const matched = trainingKeys.has(normalizeText(name));

		return buildItem({
			key: name,
			label: name,
			required: 'Mengikuti training',
			actual: matched ? 'Sudah mengikuti' : 'Belum mengikuti',
			result: matched ? ITEM_RESULT.MET : ITEM_RESULT.UNMET,
		});
	});

	return finalizeCategory(CATEGORY.TRAINING, items);
}

function evaluateJobRequirement({ employee, profile, assessments = [], employeeTrainings = [], referenceDate = new Date() }) {
	if (!profile) {
		return {
			employeeId: employee?.id ?? null,
			grade: employee?.grade ?? null,
			gradeLabel: formatGradeLabel(employee?.grade),
			status: STATUS.NO_PROFILE,
			statusLabel: STATUS_LABELS[STATUS.NO_PROFILE],
			mandatoryMet: false,
			percentOverall: 0,
			categories: [],
			unmetItems: [],
		};
	}

	const assessmentIndex = buildAssessmentIndex(assessments);
	const trainingKeys = buildEmployeeTrainingKeys(employeeTrainings);

	const softSkills = (profile.skills || []).filter((skill) => skill.category === CATEGORY.SOFT_SKILL);
	const hardSkills = (profile.skills || []).filter((skill) => skill.category === CATEGORY.HARD_SKILL);

	const categories = [
		buildEducationCategory(profile, employee),
		buildExperienceCategory(profile, employee, referenceDate),
		buildEmploymentCategory(profile, employee),
		buildGenderCategory(profile, employee),
		buildSkillCategory(CATEGORY.SOFT_SKILL, softSkills, assessmentIndex),
		buildSkillCategory(CATEGORY.HARD_SKILL, hardSkills, assessmentIndex),
		buildTrainingCategory(profile.trainings, trainingKeys),
	].filter((category) => category.total > 0);

	const mandatoryCategories = categories.filter((category) => category.mandatory);
	const mandatoryMet = mandatoryCategories.every((category) => category.met === category.total);

	const scoredCategories = categories.filter((category) => category.total > 0);
	const percentOverall =
		scoredCategories.length === 0
			? 0
			: Math.round(
					scoredCategories.reduce((total, category) => total + category.percent, 0) / scoredCategories.length,
			  );

	const hasSkillOrTrainingRequirement = categories.some(
		(category) => category.key === CATEGORY.SOFT_SKILL || category.key === CATEGORY.HARD_SKILL || category.key === CATEGORY.TRAINING,
	);
	const hasEvidence = categories.some((category) =>
		category.items.some((item) => item.result === ITEM_RESULT.MET && category.key !== CATEGORY.EDUCATION && category.key !== CATEGORY.EXPERIENCE && category.key !== CATEGORY.EMPLOYMENT && category.key !== CATEGORY.GENDER),
	);

	let status;

	if (!mandatoryMet) {
		status = STATUS.DOES_NOT_MEET;
	} else if (hasSkillOrTrainingRequirement && !hasEvidence) {
		status = STATUS.NOT_ASSESSED;
	} else {
		status = STATUS.MEETS;
	}

	const unmetItems = categories.flatMap((category) =>
		category.items
			.filter((item) => item.result === ITEM_RESULT.UNMET || item.result === ITEM_RESULT.NOT_ASSESSED)
			.map((item) => ({
				categoryKey: category.key,
				categoryLabel: category.label,
				mandatory: category.mandatory,
				...item,
			})),
	);

	return {
		employeeId: employee?.id ?? null,
		grade: profile.grade,
		gradeLabel: formatGradeLabel(profile.grade),
		status,
		statusLabel: STATUS_LABELS[status],
		mandatoryMet,
		percentOverall,
		assessedSkillCount: assessmentIndex.size,
		categories,
		unmetItems,
		profile: {
			grade: profile.grade,
			gradeLabel: formatGradeLabel(profile.grade),
			minEducation: profile.minEducation,
			minExperienceYears: profile.minExperienceYears,
			allowedEmploymentTypes: profile.allowedEmploymentTypes || [],
			allowedGenders: profile.allowedGenders || [],
			sourceFormNo: profile.sourceFormNo,
			sourceRev: profile.sourceRev,
			effectiveDate: profile.effectiveDate,
			notes: profile.notes,
		},
	};
}

export {
	CATEGORY,
	CATEGORY_LABELS,
	EDUCATION_LABELS,
	EDUCATION_RANK,
	EMPLOYMENT_LABELS,
	GENDER_LABELS,
	ITEM_RESULT,
	MANDATORY_CATEGORIES,
	SKILL_PASS_LEVEL,
	STATUS,
	STATUS_LABELS,
	buildAssessmentIndex,
	buildEmployeeTrainingKeys,
	diffYears,
	evaluateJobRequirement,
	formatGradeLabel,
	normalizeText,
};
