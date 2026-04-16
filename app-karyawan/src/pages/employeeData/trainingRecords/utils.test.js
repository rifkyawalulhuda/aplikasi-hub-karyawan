import { calculateTrainingDays, formatTrainingDate } from './utils';

describe('training record utilities', () => {
	it('calculates inclusive training days', () => {
		expect(calculateTrainingDays('2026-04-01', '2026-04-03')).toBe(3);
	});

	it('formats training dates for display', () => {
		expect(formatTrainingDate('2026-04-16')).toContain('16');
		expect(formatTrainingDate('2026-04-16')).toContain('2026');
	});
});
