import {
	EDUCATION_LABELS,
	EDUCATION_RANK,
	EMPLOYMENT_LABELS,
	GENDER_LABELS,
	diffYears,
} from './jobRequirement.js';

const EDUCATION_OPTIONS = Object.keys(EDUCATION_RANK);
const EMPLOYMENT_OPTIONS = Object.keys(EMPLOYMENT_LABELS);
const GENDER_OPTIONS = Object.keys(GENDER_LABELS);

const MIN_EXPERIENCE_YEARS = 0;
const MAX_EXPERIENCE_YEARS = 50;

const REQUIRED_COMPONENTS = ['education', 'experience', 'employment', 'gender'];

const COMPONENT_LABELS = {
	education: 'Pendidikan',
	experience: 'Pengalaman',
	employment: 'Status Karyawan',
	gender: 'Jenis Kelamin',
};

function normalizeText(value = '') {
	// `String(null)` is the truthy string "null", which would turn an intentionally
	// cleared field into a filled one and trip the "pick one education mode" rule.
	if (value == null) {
		return '';
	}

	return String(value).trim().replace(/\s+/g, ' ');
}

function parseEnumList(rawValues, allowed, fieldLabel) {
	if (rawValues == null) {
		return null;
	}

	if (!Array.isArray(rawValues)) {
		throw Object.assign(new Error(`${fieldLabel} harus berupa daftar.`), { statusCode: 400 });
	}

	const normalized = [...new Set(rawValues.map((value) => normalizeText(value).toUpperCase()).filter(Boolean))];

	if (normalized.length === 0) {
		throw Object.assign(new Error(`${fieldLabel} minimal satu harus dipilih.`), { statusCode: 400 });
	}

	const unknown = normalized.filter((value) => !allowed.includes(value));

	if (unknown.length > 0) {
		throw Object.assign(
			new Error(`${fieldLabel} berisi nilai tidak dikenal: ${unknown.join(', ')}.`),
			{ statusCode: 400 },
		);
	}

	return normalized;
}

/**
 * Validate an editable grade requirement payload.
 *
 * Only the four mandatory non-skill components are editable together with the
 * source metadata. Skill rows are handled by the existing skill endpoints, so
 * they are deliberately not accepted here.
 */
function validateProfileInput(payload = {}) {
	const rawEducation = payload.minEducation;
	const minEducation = rawEducation == null || rawEducation === '' ? null : normalizeText(rawEducation).toUpperCase();

	if (!minEducation) {
		throw Object.assign(new Error('Pendidikan minimal wajib dipilih.'), { statusCode: 400 });
	}

	if (!EDUCATION_OPTIONS.includes(minEducation)) {
		throw Object.assign(
			new Error(`Pendidikan minimal harus salah satu dari: ${EDUCATION_OPTIONS.join(', ')}.`),
			{ statusCode: 400 },
		);
	}

	const rawExperience = payload.minExperienceYears;
	let minExperienceYears = null;

	if (rawExperience != null && rawExperience !== '') {
		const parsed = Number(rawExperience);

		if (!Number.isInteger(parsed)) {
			throw Object.assign(new Error('Pengalaman minimal harus bilangan bulat tahun.'), {
				statusCode: 400,
			});
		}

		if (parsed < MIN_EXPERIENCE_YEARS || parsed > MAX_EXPERIENCE_YEARS) {
			throw Object.assign(
				new Error(
					`Pengalaman minimal harus ${MIN_EXPERIENCE_YEARS} sampai ${MAX_EXPERIENCE_YEARS} tahun.`,
				),
				{ statusCode: 400 },
			);
		}

		minExperienceYears = parsed;
	}

	const allowedEmploymentTypes =
		parseEnumList(payload.allowedEmploymentTypes, EMPLOYMENT_OPTIONS, 'Status Karyawan') ||
		EMPLOYMENT_OPTIONS;
	const allowedGenders =
		parseEnumList(payload.allowedGenders, GENDER_OPTIONS, 'Jenis Kelamin') || GENDER_OPTIONS;

	const sourceFormNo = normalizeText(payload.sourceFormNo) || null;
	const sourceRev = normalizeText(payload.sourceRev) || null;

	if (sourceFormNo && sourceFormNo.length > 100) {
		throw Object.assign(new Error('No. Form maksimal 100 karakter.'), { statusCode: 400 });
	}

	if (sourceRev && sourceRev.length > 20) {
		throw Object.assign(new Error('Revisi maksimal 20 karakter.'), { statusCode: 400 });
	}

	let effectiveDate = null;

	if (payload.effectiveDate != null && payload.effectiveDate !== '') {
		const parsed = new Date(payload.effectiveDate);

		if (Number.isNaN(parsed.getTime())) {
			throw Object.assign(new Error('Tanggal berlaku tidak valid.'), { statusCode: 400 });
		}

		effectiveDate = parsed;
	}

	const notes = normalizeText(payload.notes) || null;

	return {
		minEducation,
		minExperienceYears,
		allowedEmploymentTypes,
		allowedGenders,
		sourceFormNo,
		sourceRev,
		effectiveDate,
		notes,
	};
}

/**
 * Evaluate only the mandatory non-skill components for a list of employees.
 *
 * Returns the failing employees per component so the UI can warn before saving.
 * The result is intentionally independent from the skill readiness engine: these
 * components feed the legacy `status`, not the readiness percentage.
 */
function evaluateMandatoryComponents({ profile, employees = [], referenceDate = new Date() }) {
	const failures = {
		education: [],
		experience: [],
		employment: [],
		gender: [],
	};

	employees.forEach((employee) => {
		if (profile.minEducation) {
			const requiredRank = EDUCATION_RANK[profile.minEducation] || 0;
			const actualRank = EDUCATION_RANK[employee.educationLevel] || 0;

			if (actualRank < requiredRank) {
				failures.education.push({
					employeeId: employee.id,
					employeeNo: employee.employeeNo,
					fullName: employee.fullName,
					actual: EDUCATION_LABELS[employee.educationLevel] || employee.educationLevel || '-',
					required: EDUCATION_LABELS[profile.minEducation] || profile.minEducation,
				});
			}
		}

		if (profile.minExperienceYears != null) {
			const actualYears = diffYears(employee.joinDate, referenceDate);

			if (actualYears < profile.minExperienceYears) {
				failures.experience.push({
					employeeId: employee.id,
					employeeNo: employee.employeeNo,
					fullName: employee.fullName,
					actual: `${actualYears} tahun`,
					required: `${profile.minExperienceYears} tahun`,
				});
			}
		}

		const allowedEmploymentTypes = profile.allowedEmploymentTypes || [];
		const employmentApplicable = allowedEmploymentTypes.length > 0 && allowedEmploymentTypes.length < EMPLOYMENT_OPTIONS.length;

		if (employmentApplicable && !allowedEmploymentTypes.includes(employee.employmentType)) {
			failures.employment.push({
				employeeId: employee.id,
				employeeNo: employee.employeeNo,
				fullName: employee.fullName,
				actual: EMPLOYMENT_LABELS[employee.employmentType] || employee.employmentType || '-',
				required: allowedEmploymentTypes.map((value) => EMPLOYMENT_LABELS[value] || value).join(' / '),
			});
		}

		const allowedGenders = profile.allowedGenders || [];
		const genderApplicable = allowedGenders.length > 0 && allowedGenders.length < GENDER_OPTIONS.length;

		if (genderApplicable && !allowedGenders.includes(employee.gender)) {
			failures.gender.push({
				employeeId: employee.id,
				employeeNo: employee.employeeNo,
				fullName: employee.fullName,
				actual: GENDER_LABELS[employee.gender] || employee.gender || '-',
				required: allowedGenders.map((value) => GENDER_LABELS[value] || value).join(' / '),
			});
		}
	});

	const failingEmployeeIds = new Set();

	Object.values(failures).forEach((list) => {
		list.forEach((item) => failingEmployeeIds.add(item.employeeId));
	});

	return {
		employeeCount: employees.length,
		failingEmployeeCount: failingEmployeeIds.size,
		failingEmployeeIds: [...failingEmployeeIds],
		// Kept for response compatibility. Education is always an enum now, so no
		// component is ever verified manually.
		manualComponents: [],
		components: REQUIRED_COMPONENTS.map((key) => ({
			key,
			label: COMPONENT_LABELS[key],
			failCount: failures[key].length,
			employees: failures[key],
		})),
	};
}

function summarizeMandatoryGap({ profile, employee, referenceDate = new Date() }) {
	const result = evaluateMandatoryComponents({
		profile,
		employees: [employee],
		referenceDate,
	});

	return {
		failing: result.failingEmployeeCount > 0,
		components: result.components.map((component) => ({
			key: component.key,
			failCount: component.failCount,
		})),
	};
}

export {
	COMPONENT_LABELS,
	EDUCATION_OPTIONS,
	EMPLOYMENT_OPTIONS,
	GENDER_OPTIONS,
	MAX_EXPERIENCE_YEARS,
	MIN_EXPERIENCE_YEARS,
	REQUIRED_COMPONENTS,
	evaluateMandatoryComponents,
	summarizeMandatoryGap,
	validateProfileInput,
};
