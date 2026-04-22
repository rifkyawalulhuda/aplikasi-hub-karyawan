import { describe, expect, it } from 'vitest';

import {
	getActiveWarningLetterState,
	isWarningLetterActive,
	validateWarningLetterEscalation,
} from './warningLetterEscalation';

describe('warningLetterEscalation helpers', () => {
	it('treats warning letter as active until six months after letter date', () => {
		expect(
			isWarningLetterActive(
				{
					category: 'WARNING_LETTER',
					letterDate: '2026-01-22',
				},
				'2026-07-22',
			),
		).toBe(true);
		expect(
			isWarningLetterActive(
				{
					category: 'WARNING_LETTER',
					letterDate: '2026-01-22',
				},
				'2026-07-23',
			),
		).toBe(false);
	});

	it('allows SP2 or SP3 when SP1 is active', () => {
		const state = getActiveWarningLetterState({
			rows: [
				{
					id: 11,
					category: 'WARNING_LETTER',
					warningLevel: 1,
					letterDate: '2026-04-01',
				},
			],
			referenceDate: '2026-04-22',
		});

		expect(state.allowedLevels).toEqual([2, 3]);
		expect(state.defaultLevel).toBe(2);
		expect(validateWarningLetterEscalation({ state, selectedLevel: 1 }).ok).toBe(false);
		expect(validateWarningLetterEscalation({ state, selectedLevel: 2 }).ok).toBe(true);
		expect(validateWarningLetterEscalation({ state, selectedLevel: 3 }).ok).toBe(true);
	});

	it('forces SP3 when SP2 is active and blocks new SP when SP3 is active', () => {
		const sp2State = getActiveWarningLetterState({
			rows: [
				{
					id: 12,
					category: 'WARNING_LETTER',
					warningLevel: 2,
					letterDate: '2026-04-01',
				},
			],
			referenceDate: '2026-04-22',
		});
		const sp3State = getActiveWarningLetterState({
			rows: [
				{
					id: 13,
					category: 'WARNING_LETTER',
					warningLevel: 3,
					letterDate: '2026-04-01',
				},
			],
			referenceDate: '2026-04-22',
		});

		expect(sp2State.allowedLevels).toEqual([3]);
		expect(validateWarningLetterEscalation({ state: sp2State, selectedLevel: 1 }).ok).toBe(false);
		expect(validateWarningLetterEscalation({ state: sp2State, selectedLevel: 3 }).ok).toBe(true);

		expect(sp3State.isBlocked).toBe(true);
		expect(validateWarningLetterEscalation({ state: sp3State, selectedLevel: 3 }).ok).toBe(false);
		expect(sp3State.feedbackMessage).toContain('Tidak dapat membuat Surat Peringatan baru');
	});

	it('ignores the current record when editing', () => {
		const state = getActiveWarningLetterState({
			rows: [
				{
					id: 15,
					category: 'WARNING_LETTER',
					warningLevel: 3,
					letterDate: '2026-04-01',
				},
			],
			referenceDate: '2026-04-22',
			excludeId: 15,
		});

		expect(state.allowedLevels).toEqual([1, 2, 3]);
		expect(state.isBlocked).toBe(false);
	});
});
