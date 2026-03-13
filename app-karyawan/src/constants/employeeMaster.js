export const DEFAULT_EMPLOYMENT_TYPE = 'Permanent';

export const EMPLOYMENT_TYPE_OPTIONS = [
	{ value: 'Permanent', label: 'Permanent' },
	{ value: 'Contract', label: 'Contract' },
];

export const GENDER_OPTIONS = [
	{ value: 'MALE', label: 'Male' },
	{ value: 'FEMALE', label: 'Female' },
];

export const EDUCATION_LEVEL_OPTIONS = [
	{ value: 'SMA', label: 'SMA' },
	{ value: 'D3', label: 'D3' },
	{ value: 'S1', label: 'S1' },
	{ value: 'S2', label: 'S2' },
];

export const DEFAULT_GRADE = 'Rank 1';

export const GRADE_OPTIONS = [
	{ value: 'Rank 1', label: 'Rank 1' },
	{ value: 'Rank 2', label: 'Rank 2' },
	{ value: 'Rank 3', label: 'Rank 3' },
	{ value: 'Rank 4', label: 'Rank 4' },
	{ value: 'Rank 5', label: 'Rank 5' },
	{ value: 'Rank 6', label: 'Rank 6' },
	{ value: 'Rank 7', label: 'Rank 7' },
	{ value: 'Rank 8', label: 'Rank 8' },
	{ value: 'Rank 9', label: 'Rank 9' },
];

export function formatGradeLabel(value = '') {
	const normalizedValue = String(value).trim();

	if (!normalizedValue) {
		return DEFAULT_GRADE;
	}

	const enumMatch = normalizedValue.match(/^RANK_(\d+)$/i);
	if (enumMatch) {
		return `Rank ${enumMatch[1]}`;
	}

	const labelMatch = normalizedValue.match(/^Rank\s+(\d+)$/i);
	if (labelMatch) {
		return `Rank ${labelMatch[1]}`;
	}

	return normalizedValue;
}

export function formatEmploymentTypeLabel(value = '') {
	const normalizedValue = String(value).trim();

	if (!normalizedValue) {
		return DEFAULT_EMPLOYMENT_TYPE;
	}

	if (/^PERMANENT$/i.test(normalizedValue)) {
		return 'Permanent';
	}

	if (/^CONTRACT$/i.test(normalizedValue)) {
		return 'Contract';
	}

	if (/^Permanent$/i.test(normalizedValue)) {
		return 'Permanent';
	}

	if (/^Contract$/i.test(normalizedValue)) {
		return 'Contract';
	}

	return normalizedValue;
}
