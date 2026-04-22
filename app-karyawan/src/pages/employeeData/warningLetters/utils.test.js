import {
	DISCIPLINE_LETTER_CATEGORIES,
	getDisciplineDocumentTitle,
	getDisciplinePrintConfig,
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
});
