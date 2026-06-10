/* eslint-disable import/first, import/extensions */
import { describe, expect, it, vi } from 'vitest';

vi.mock('./prisma.js', () => ({ default: {} }));
vi.mock('./leaveDatabase.js', () => ({ getLeaveDatabaseBalance: vi.fn() }));

import { LeaveStageType, mapJobLevelToStageType } from './leaveWorkflow.js';

describe('mapJobLevelToStageType', () => {
	it('maps "Foreman" to FOREMAN', () => {
		expect(mapJobLevelToStageType('Foreman')).toBe(LeaveStageType.FOREMAN);
	});

	it('maps "General Foreman" to GENERAL_FOREMAN', () => {
		expect(mapJobLevelToStageType('General Foreman')).toBe(LeaveStageType.GENERAL_FOREMAN);
	});

	it('maps "Section Chief" to SECTION_CHIEF', () => {
		expect(mapJobLevelToStageType('Section Chief')).toBe(LeaveStageType.SECTION_CHIEF);
	});

	it('maps "Dy. Dept. Manager" to DY_DEPT_MANAGER', () => {
		expect(mapJobLevelToStageType('Dy. Dept. Manager')).toBe(LeaveStageType.DY_DEPT_MANAGER);
	});

	it('maps "Dept. Manager" to DEPT_MANAGER', () => {
		expect(mapJobLevelToStageType('Dept. Manager')).toBe(LeaveStageType.DEPT_MANAGER);
	});

	it('maps "Site/Div. Manager" to SITE_DIV_MANAGER', () => {
		expect(mapJobLevelToStageType('Site/Div. Manager')).toBe(LeaveStageType.SITE_DIV_MANAGER);
	});

	it('performs case-insensitive matching', () => {
		expect(mapJobLevelToStageType('foreman')).toBe(LeaveStageType.FOREMAN);
		expect(mapJobLevelToStageType('FOREMAN')).toBe(LeaveStageType.FOREMAN);
		expect(mapJobLevelToStageType('general foreman')).toBe(LeaveStageType.GENERAL_FOREMAN);
		expect(mapJobLevelToStageType('SECTION CHIEF')).toBe(LeaveStageType.SECTION_CHIEF);
		expect(mapJobLevelToStageType('dy. dept. manager')).toBe(LeaveStageType.DY_DEPT_MANAGER);
		expect(mapJobLevelToStageType('site/div. manager')).toBe(LeaveStageType.SITE_DIV_MANAGER);
	});

	it('handles extra whitespace in input', () => {
		expect(mapJobLevelToStageType('  Foreman  ')).toBe(LeaveStageType.FOREMAN);
		expect(mapJobLevelToStageType('General  Foreman')).toBe(LeaveStageType.GENERAL_FOREMAN);
	});

	it('applies fallback transformation for unknown job level names', () => {
		expect(mapJobLevelToStageType('Senior Engineer')).toBe('SENIOR_ENGINEER');
		expect(mapJobLevelToStageType('Team Lead')).toBe('TEAM_LEAD');
	});

	it('handles special characters in fallback transformation', () => {
		expect(mapJobLevelToStageType('Asst. Manager')).toBe('ASST_MANAGER');
		expect(mapJobLevelToStageType('VP/Director')).toBe('VP_DIRECTOR');
	});

	it('returns empty string for empty input', () => {
		expect(mapJobLevelToStageType('')).toBe('');
	});

	it('returns empty string for undefined input', () => {
		expect(mapJobLevelToStageType()).toBe('');
	});
});
