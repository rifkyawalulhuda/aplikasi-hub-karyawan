export const WARNING_LEVEL_OPTIONS = [1, 2, 3];
export const SUPERIOR_JOB_LEVEL = 'Dept. Manager';
export const SUPERIOR_JOB_LEVEL_ALIASES = [SUPERIOR_JOB_LEVEL, 'Department Manager'];
const NORMALIZED_SUPERIOR_JOB_LEVELS = SUPERIOR_JOB_LEVEL_ALIASES.map((value) => value.toLowerCase());
const DEFAULT_WARNING_LEVEL = 1;
export const DISCIPLINE_LETTER_CATEGORIES = {
	WARNING_LETTER: 'WARNING_LETTER',
	REPRIMAND: 'REPRIMAND',
	SUSPENSION: 'SUSPENSION',
};
export const DISCIPLINE_LETTER_CATEGORY_LABELS = {
	[DISCIPLINE_LETTER_CATEGORIES.WARNING_LETTER]: 'Surat Peringatan',
	[DISCIPLINE_LETTER_CATEGORIES.REPRIMAND]: 'Surat Teguran',
	[DISCIPLINE_LETTER_CATEGORIES.SUSPENSION]: 'Skorsing',
};
const DISCIPLINE_PRINT_DECISION_ROWS = {
	[DISCIPLINE_LETTER_CATEGORIES.WARNING_LETTER]: [
		{
			label: 'Kedua',
			content: 'Keputusan ini berlaku sejak surat ini dikeluarkan sampai dengan 6 bulan kedepan.',
		},
		{
			label: 'Ketiga',
			content:
				'Apabila dikemudian hari yang bersangkutan melanggar kembali peraturan / PKB, maka Perusahaan akan mengeluarkan sangsi berikutnya sesuai dengan peraturan / PKB yang berlaku.',
		},
	],
	[DISCIPLINE_LETTER_CATEGORIES.SUSPENSION]: [
		{
			label: 'Kedua',
			content:
				'Keputusan ini berlaku sejak surat ini dikeluarkan sampai dengan diterbitkannya keputusan final mengenai status hubungan kerja Saudara.',
		},
		{
			label: 'Ketiga',
			content:
				'Instruksi Khusus, karyawan dilarang masuk ke area kantor tetapi harus tetap siap sedia jika dipanggil sewaktu-waktu.',
		},
		{
			label: 'Keempat',
			content: 'Hak Karyawan, karyawan tetap menerima gaji/upah penuh selama masa skorsing.',
		},
	],
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
	return employeeOptions.filter((item) =>
		NORMALIZED_SUPERIOR_JOB_LEVELS.includes(
			String(item.jobLevelName || '')
				.trim()
				.toLowerCase(),
		),
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

export function shouldShowWarningLevel(category) {
	return category === DISCIPLINE_LETTER_CATEGORIES.WARNING_LETTER;
}

export function shouldRequireArticle(category) {
	return category !== DISCIPLINE_LETTER_CATEGORIES.REPRIMAND;
}

export function getDisciplineDocumentTitle(category, warningLevel) {
	if (category === DISCIPLINE_LETTER_CATEGORIES.REPRIMAND) {
		return 'Surat Teguran';
	}

	if (category === DISCIPLINE_LETTER_CATEGORIES.SUSPENSION) {
		return 'Skorsing';
	}

	if (warningLevel) {
		return `Surat Peringatan ${warningLevel}`;
	}

	return 'Surat Peringatan';
}

export function getDisciplinePrintConfig(record = {}) {
	const category = record.category || DISCIPLINE_LETTER_CATEGORIES.WARNING_LETTER;
	const warningLevel = Number(record.warningLevel) || 0;

	return {
		formTitle: 'FORM SURAT PERINGATAN/SKORSING',
		checkedType:
			category === DISCIPLINE_LETTER_CATEGORIES.SUSPENSION
				? 'SUSPENSION'
				: `SP_${Math.min(Math.max(warningLevel, 1), 3)}`,
		decisionRows: DISCIPLINE_PRINT_DECISION_ROWS[category] || DISCIPLINE_PRINT_DECISION_ROWS.WARNING_LETTER,
	};
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
