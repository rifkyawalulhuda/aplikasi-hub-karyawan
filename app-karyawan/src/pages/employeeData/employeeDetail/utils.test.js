import { formatEmployeeTrainingParticipantCount, formatEmployeeTrainingPeriod } from './utils';

describe('employee detail training helpers', () => {
	it('formats training period consistently', () => {
		const label = formatEmployeeTrainingPeriod('2026-04-01', '2026-04-03');

		expect(label).toContain('01');
		expect(label).toContain('April');
		expect(label).toContain('2026');
	});

	it('formats participant count for training records', () => {
		expect(formatEmployeeTrainingParticipantCount(1)).toBe('1 peserta');
		expect(formatEmployeeTrainingParticipantCount(4)).toBe('4 peserta');
	});
});
