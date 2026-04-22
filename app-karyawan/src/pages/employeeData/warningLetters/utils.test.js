import {
	DISCIPLINE_LETTER_CATEGORIES,
	getActiveWarningLetterState,
	getDisciplineDocumentTitle,
	getDisciplinePrintConfig,
	validateWarningLetterEscalation,
	shouldRequireArticle,
	shouldShowWarningLevel,
} from './utils';

describe('warning letter utilities', () => {
	it('keeps warning letter and suspension behaviors separated', () => {
		expect(shouldShowWarningLevel(DISCIPLINE_LETTER_CATEGORIES.WARNING_LETTER)).toBe(true);
		expect(shouldShowWarningLevel(DISCIPLINE_LETTER_CATEGORIES.SUSPENSION)).toBe(false);
		expect(shouldRequireArticle(DISCIPLINE_LETTER_CATEGORIES.WARNING_LETTER)).toBe(true);
		expect(shouldRequireArticle(DISCIPLINE_LETTER_CATEGORIES.SUSPENSION)).toBe(true);
		expect(shouldRequireArticle(DISCIPLINE_LETTER_CATEGORIES.REPRIMAND)).toBe(false);
	});

	it('builds print config for suspension and warning letters correctly', () => {
		expect(getDisciplineDocumentTitle(DISCIPLINE_LETTER_CATEGORIES.WARNING_LETTER, 2)).toBe('Surat Peringatan 2');
		expect(getDisciplineDocumentTitle(DISCIPLINE_LETTER_CATEGORIES.SUSPENSION)).toBe('Skorsing');

		const warningConfig = getDisciplinePrintConfig({
			category: DISCIPLINE_LETTER_CATEGORIES.WARNING_LETTER,
			warningLevel: 3,
		});
		const suspensionConfig = getDisciplinePrintConfig({
			category: DISCIPLINE_LETTER_CATEGORIES.SUSPENSION,
		});

		expect(warningConfig.checkedType).toBe('SP_3');
		expect(warningConfig.decisionRows).toHaveLength(2);
		expect(suspensionConfig.checkedType).toBe('SUSPENSION');
		expect(suspensionConfig.decisionRows).toHaveLength(3);
		expect(suspensionConfig.decisionRows[2].label).toBe('Keempat');
	});

	it('allows all warning levels when there is no active warning letter', () => {
		const state = getActiveWarningLetterState({
			rows: [],
			employeeId: 7,
			referenceDate: '2026-04-22',
		});

		expect(state.allowedLevels).toEqual([1, 2, 3]);
		expect(state.defaultLevel).toBe(1);
		expect(state.isBlocked).toBe(false);
	});

	it('matches final escalation rule for active SP1, SP2, and SP3', () => {
		const baseRows = [
			{
				id: 1,
				category: DISCIPLINE_LETTER_CATEGORIES.WARNING_LETTER,
				employeeId: 9,
				warningLevel: 1,
				letterDate: '2026-03-01',
			},
			{
				id: 2,
				category: DISCIPLINE_LETTER_CATEGORIES.WARNING_LETTER,
				employeeId: 9,
				warningLevel: 2,
				letterDate: '2026-03-10',
			},
			{
				id: 3,
				category: DISCIPLINE_LETTER_CATEGORIES.WARNING_LETTER,
				employeeId: 9,
				warningLevel: 3,
				letterDate: '2026-03-20',
			},
		];

		const sp1State = getActiveWarningLetterState({
			rows: [baseRows[0]],
			employeeId: 9,
			referenceDate: '2026-04-22',
		});
		const sp2State = getActiveWarningLetterState({
			rows: [baseRows[1]],
			employeeId: 9,
			referenceDate: '2026-04-22',
		});
		const sp3State = getActiveWarningLetterState({
			rows: [baseRows[2]],
			employeeId: 9,
			referenceDate: '2026-04-22',
		});

		expect(sp1State.allowedLevels).toEqual([2, 3]);
		expect(sp1State.defaultLevel).toBe(2);
		expect(validateWarningLetterEscalation({ state: sp1State, selectedLevel: 1 }).ok).toBe(false);
		expect(validateWarningLetterEscalation({ state: sp1State, selectedLevel: 3 }).ok).toBe(true);

		expect(sp2State.allowedLevels).toEqual([3]);
		expect(sp2State.defaultLevel).toBe(3);
		expect(validateWarningLetterEscalation({ state: sp2State, selectedLevel: 2 }).ok).toBe(false);
		expect(validateWarningLetterEscalation({ state: sp2State, selectedLevel: 3 }).ok).toBe(true);

		expect(sp3State.allowedLevels).toEqual([]);
		expect(sp3State.isBlocked).toBe(true);
		expect(validateWarningLetterEscalation({ state: sp3State, selectedLevel: 3 }).ok).toBe(false);
		expect(sp3State.feedbackMessage).toContain('Tidak dapat membuat Surat Peringatan baru');
	});
});
