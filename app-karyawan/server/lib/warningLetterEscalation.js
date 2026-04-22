const WARNING_LEVEL_OPTIONS = [1, 2, 3];
const WARNING_LETTER_CATEGORY = 'WARNING_LETTER';

function normalizeString(value = '') {
	return String(value).trim().replace(/\s+/g, ' ');
}

function toDateOnly(value) {
	if (!value) {
		return null;
	}

	if (value instanceof Date) {
		return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 12));
	}

	const raw = normalizeString(value);
	const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

	if (isoMatch) {
		const [, year, month, day] = isoMatch;
		return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
	}

	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addSixMonths(value) {
	const parsed = toDateOnly(value);

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

function toComparableUtcDate(value) {
	const parsed = toDateOnly(value);

	if (!parsed) {
		return null;
	}

	return Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}

function formatWarningEscalationDate(value) {
	const parsed = toDateOnly(value);

	if (!parsed) {
		return '';
	}

	return `${String(parsed.getUTCDate()).padStart(2, '0')}/${String(parsed.getUTCMonth() + 1).padStart(
		2,
		'0',
	)}/${parsed.getUTCFullYear()}`;
}

function getWarningLetterEndDate(value) {
	return addSixMonths(value);
}

function isWarningLetterActive(record, referenceDate = new Date()) {
	if (!record || record.category !== WARNING_LETTER_CATEGORY) {
		return false;
	}

	const comparableReferenceDate = toComparableUtcDate(referenceDate);
	const startDate = toComparableUtcDate(record.letterDate);
	const endDate = toComparableUtcDate(getWarningLetterEndDate(record.letterDate));

	if (!comparableReferenceDate || !startDate || !endDate) {
		return false;
	}

	return comparableReferenceDate >= startDate && comparableReferenceDate <= endDate;
}

function getAllowedWarningLetterLevels(highestActiveLevel) {
	if (highestActiveLevel >= 3) {
		return [];
	}

	if (highestActiveLevel === 2) {
		return [3];
	}

	if (highestActiveLevel === 1) {
		return [2, 3];
	}

	return [...WARNING_LEVEL_OPTIONS];
}

function getDefaultWarningLetterLevel(highestActiveLevel) {
	if (highestActiveLevel >= 3) {
		return null;
	}

	if (highestActiveLevel === 2) {
		return 3;
	}

	if (highestActiveLevel === 1) {
		return 2;
	}

	return 1;
}

function buildWarningLetterEscalationFeedback(state) {
	if (!state || !state.highestActiveLetter) {
		return {
			severity: 'info',
			message: '',
		};
	}

	const validUntil = formatWarningEscalationDate(state.highestActiveLetter.validUntil);

	if (state.highestActiveLevel === 1) {
		return {
			severity: 'warning',
			message: `Karyawan masih memiliki Surat Peringatan ke 1 yang berlaku sampai ${validUntil}. Form otomatis diarahkan ke Surat Peringatan ke 2. Anda masih dapat memilih Surat Peringatan ke 3 jika diperlukan.`,
		};
	}

	if (state.highestActiveLevel === 2) {
		return {
			severity: 'warning',
			message: `Karyawan masih memiliki Surat Peringatan ke 2 yang berlaku sampai ${validUntil}. Form otomatis diarahkan ke Surat Peringatan ke 3.`,
		};
	}

	return {
		severity: 'error',
		message: `Karyawan masih memiliki Surat Peringatan ke 3 yang berlaku sampai ${validUntil}. Tidak dapat membuat Surat Peringatan baru sampai masa SP tersebut selesai. Karyawan perlu ditindaklanjuti lebih lanjut sesuai ketentuan yang berlaku.`,
	};
}

function buildWarningLetterValidationMessage(state, selectedLevel) {
	if (!state || !state.highestActiveLetter) {
		return '';
	}

	const validUntil = formatWarningEscalationDate(state.highestActiveLetter.validUntil);

	if (state.highestActiveLevel === 1 && selectedLevel === 1) {
		return `Karyawan masih memiliki Surat Peringatan ke 1 yang berlaku sampai ${validUntil}. Tidak dapat membuat Surat Peringatan ke 1 lagi. Pilih Surat Peringatan ke 2 atau Surat Peringatan ke 3.`;
	}

	if (state.highestActiveLevel === 2) {
		return `Karyawan masih memiliki Surat Peringatan ke 2 yang berlaku sampai ${validUntil}. Tidak dapat membuat Surat Peringatan ke 1 atau ke 2. Karyawan harus langsung menerima Surat Peringatan ke 3.`;
	}

	if (state.highestActiveLevel >= 3) {
		return buildWarningLetterEscalationFeedback(state).message;
	}

	return '';
}

function validateWarningLetterEscalation({ state, selectedLevel }) {
	if (!state) {
		return {
			ok: true,
			message: '',
		};
	}

	if (state.isBlocked) {
		return {
			ok: false,
			message: buildWarningLetterEscalationFeedback(state).message,
		};
	}

	if (!state.allowedLevels.includes(Number(selectedLevel))) {
		return {
			ok: false,
			message: buildWarningLetterValidationMessage(state, Number(selectedLevel)),
		};
	}

	return {
		ok: true,
		message: '',
	};
}

function getActiveWarningLetterState({ rows = [], referenceDate = new Date(), excludeId = null }) {
	const activeLetters = rows
		.filter(
			(record) =>
				record?.category === WARNING_LETTER_CATEGORY &&
				(excludeId ? Number(record.id) !== Number(excludeId) : true) &&
				isWarningLetterActive(record, referenceDate),
		)
		.map((record) => ({
			...record,
			validUntil: getWarningLetterEndDate(record.letterDate),
		}))
		.sort((left, right) => {
			const levelDelta = (Number(right.warningLevel) || 0) - (Number(left.warningLevel) || 0);

			if (levelDelta !== 0) {
				return levelDelta;
			}

			const leftEndDate = toComparableUtcDate(left.validUntil) ?? 0;
			const rightEndDate = toComparableUtcDate(right.validUntil) ?? 0;

			if (rightEndDate !== leftEndDate) {
				return rightEndDate - leftEndDate;
			}

			const leftDate = toComparableUtcDate(left.letterDate) ?? 0;
			const rightDate = toComparableUtcDate(right.letterDate) ?? 0;

			return rightDate - leftDate;
		});

	const highestActiveLetter = activeLetters[0] || null;
	const highestActiveLevel = Number(highestActiveLetter?.warningLevel) || 0;
	const allowedLevels = getAllowedWarningLetterLevels(highestActiveLevel);
	const defaultLevel = getDefaultWarningLetterLevel(highestActiveLevel);
	const disabledLevels = WARNING_LEVEL_OPTIONS.filter((level) => !allowedLevels.includes(level));
	const isBlocked = allowedLevels.length === 0;
	const feedback = buildWarningLetterEscalationFeedback({
		activeLetters,
		highestActiveLetter,
		highestActiveLevel,
		allowedLevels,
		defaultLevel,
		disabledLevels,
		isBlocked,
	});

	return {
		activeLetters,
		highestActiveLetter,
		highestActiveLevel,
		allowedLevels,
		defaultLevel,
		disabledLevels,
		isBlocked,
		feedbackMessage: feedback.message,
		feedbackSeverity: feedback.severity,
	};
}

async function getWarningLetterEscalationStateForEmployee(tx, { employeeId, referenceDate, excludeId }) {
	const rows = await tx.warningLetter.findMany({
		where: {
			employeeId,
			category: WARNING_LETTER_CATEGORY,
			...(excludeId ? { id: { not: excludeId } } : {}),
		},
		select: {
			id: true,
			category: true,
			warningLevel: true,
			letterDate: true,
		},
	});

	return getActiveWarningLetterState({
		rows,
		referenceDate,
		excludeId,
	});
}

export {
	WARNING_LEVEL_OPTIONS,
	addSixMonths,
	buildWarningLetterEscalationFeedback,
	formatWarningEscalationDate,
	getActiveWarningLetterState,
	getAllowedWarningLetterLevels,
	getDefaultWarningLetterLevel,
	getWarningLetterEndDate,
	getWarningLetterEscalationStateForEmployee,
	isWarningLetterActive,
	toDateOnly,
	validateWarningLetterEscalation,
};
