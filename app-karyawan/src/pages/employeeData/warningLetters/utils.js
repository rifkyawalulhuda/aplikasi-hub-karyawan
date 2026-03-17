export const WARNING_LEVEL_OPTIONS = [1, 2, 3];
export const SUPERIOR_JOB_LEVEL = 'Department Manager';
const DEFAULT_WARNING_LEVEL = 1;
export const DISCIPLINE_LETTER_CATEGORIES = {
	WARNING_LETTER: 'WARNING_LETTER',
	REPRIMAND: 'REPRIMAND',
};
export const DISCIPLINE_LETTER_CATEGORY_LABELS = {
	[DISCIPLINE_LETTER_CATEGORIES.WARNING_LETTER]: 'Surat Peringatan',
	[DISCIPLINE_LETTER_CATEGORIES.REPRIMAND]: 'Surat Teguran',
};

export function formatWarningDate(value) {
	if (!value) {
		return '';
	}

	const raw = String(value).trim();
	const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

	if (isoMatch) {
		const [, year, month, day] = isoMatch;
		return `${day}/${month}/${year}`;
	}

	const parsed = new Date(raw);

	if (Number.isNaN(parsed.getTime())) {
		return raw;
	}

	return `${String(parsed.getDate()).padStart(2, '0')}/${String(parsed.getMonth() + 1).padStart(
		2,
		'0',
	)}/${parsed.getFullYear()}`;
}

export function parseWarningDate(value) {
	if (!value) {
		return null;
	}

	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value;
	}

	const raw = String(value).trim();
	const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

	if (isoMatch) {
		const [, year, month, day] = isoMatch;
		return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
	}

	const parsed = new Date(raw);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addSixMonths(value) {
	const parsed = parseWarningDate(value);

	if (!parsed) {
		return null;
	}

	const sourceDay = parsed.getUTCDate();
	const target = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + 6, 1, 12));
	const lastDayOfTargetMonth = new Date(
		Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12),
	).getUTCDate();

	target.setUTCDate(Math.min(sourceDay, lastDayOfTargetMonth));

	return target;
}

export function getWarningEndDate(value) {
	const target = addSixMonths(value);

	if (!target) {
		return '';
	}

	return formatWarningDate(target);
}

export function getSuperiorOptions(employeeOptions = []) {
	return employeeOptions.filter(
		(item) =>
			String(item.jobLevelName || '')
				.trim()
				.toLowerCase() === SUPERIOR_JOB_LEVEL.toLowerCase(),
	);
}

function toComparableUtcDate(value) {
	const parsed = parseWarningDate(value);

	if (!parsed) {
		return null;
	}

	return Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}

export function getDisciplineCategoryLabel(category) {
	return DISCIPLINE_LETTER_CATEGORY_LABELS[category] || DISCIPLINE_LETTER_CATEGORY_LABELS.WARNING_LETTER;
}

export function getActiveWarningLetterSummary({ rows = [], employeeId, excludeId, referenceDate }) {
	if (!employeeId) {
		return {
			activeLetters: [],
			highestActiveLevel: 0,
			recommendedLevel: DEFAULT_WARNING_LEVEL,
			disabledLevels: [],
			nextLevelReason: '',
		};
	}

	const comparableReferenceDate = toComparableUtcDate(referenceDate) ?? toComparableUtcDate(new Date());

	const activeLetters = rows
		.filter(
			(row) =>
				row.category === DISCIPLINE_LETTER_CATEGORIES.WARNING_LETTER &&
				row.employeeId === Number(employeeId) &&
				row.id !== Number(excludeId),
		)
		.filter((row) => {
			const startDate = toComparableUtcDate(row.letterDate);
			const endDate = toComparableUtcDate(addSixMonths(row.letterDate));

			if (!startDate || !endDate || !comparableReferenceDate) {
				return false;
			}

			return comparableReferenceDate >= startDate && comparableReferenceDate <= endDate;
		})
		.sort((left, right) => {
			const leftDate = toComparableUtcDate(left.letterDate) ?? 0;
			const rightDate = toComparableUtcDate(right.letterDate) ?? 0;
			return rightDate - leftDate;
		});

	const highestActiveLevel = activeLetters.reduce(
		(highestLevel, row) => Math.max(highestLevel, Number(row.warningLevel) || 0),
		0,
	);
	const recommendedLevel = highestActiveLevel <= 0 ? DEFAULT_WARNING_LEVEL : Math.min(highestActiveLevel + 1, 3);
	const disabledLevels = WARNING_LEVEL_OPTIONS.filter((option) => option < recommendedLevel);

	let nextLevelReason = '';
	if (highestActiveLevel > 0) {
		const highestActiveLetter = activeLetters.find((row) => Number(row.warningLevel) === highestActiveLevel);
		const validUntil = highestActiveLetter ? getWarningEndDate(highestActiveLetter.letterDate) : '';
		nextLevelReason = `Karyawan ini masih memiliki Surat Peringatan ke ${highestActiveLevel}${
			validUntil ? ` yang berlaku sampai ${validUntil}` : ''
		}.`;
	}

	return {
		activeLetters,
		highestActiveLevel,
		recommendedLevel,
		disabledLevels,
		nextLevelReason,
	};
}
