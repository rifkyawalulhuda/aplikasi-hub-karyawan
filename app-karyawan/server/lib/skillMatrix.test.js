import { describe, expect, it } from 'vitest';

import {
	DEFAULT_TARGET_LEVEL,
	READINESS_STATUS,
	evaluateSkillReadiness,
	normalizeLevel,
	normalizeTargetLevel,
} from './skillMatrix.js';

function requirement(overrides = {}) {
	return {
		category: 'HARD_SKILL',
		name: 'Excel',
		targetLevel: 3,
		masterSkillId: 1,
		...overrides,
	};
}

function assessment(overrides = {}) {
	return {
		category: 'HARD_SKILL',
		skillName: 'Excel',
		level: 3,
		...overrides,
	};
}

function requirements(count, overrides = {}) {
	return Array.from({ length: count }, (_, index) =>
		requirement({ name: `Skill ${index + 1}`, ...overrides }),
	);
}

function assessmentsFor(list, level = 3) {
	return list.map((item) => assessment({ skillName: item.name, level }));
}

describe('normalizeTargetLevel', () => {
	it('returns the default when empty', () => {
		expect(normalizeTargetLevel(null)).toBe(DEFAULT_TARGET_LEVEL);
	});

	it('rejects out-of-range values', () => {
		expect(normalizeTargetLevel(6)).toBeNull();
		expect(normalizeTargetLevel(-1)).toBeNull();
		expect(normalizeTargetLevel(2.5)).toBeNull();
	});

	it('accepts 0 as a valid target', () => {
		expect(normalizeTargetLevel(0)).toBe(0);
	});
});

describe('normalizeLevel', () => {
	it('treats 0 as a real assessment value, not as deletion', () => {
		expect(normalizeLevel(0)).toBe(0);
	});

	it('rejects invalid values', () => {
		expect(normalizeLevel('abc')).toBeNull();
		expect(normalizeLevel(6)).toBeNull();
	});
});

describe('evaluateSkillReadiness - denominator', () => {
	it('does NOT report 100% when only one of several required skills is assessed', () => {
		const list = requirements(7);

		// Only the first skill is assessed and it meets the target.
		const result = evaluateSkillReadiness({
			requirements: list,
			assessments: [assessment({ skillName: list[0].name, level: 3 })],
		});

		expect(result.readinessPercent).toBe(14);
		expect(result.status).toBe(READINESS_STATUS.INCOMPLETE);
		expect(result.assessedItems).toBe(1);
		expect(result.totalItems).toBe(7);
		expect(result.completionPercent).toBe(14);
		expect(result.isComplete).toBe(false);
	});

	it('scales against every required skill, treating unassessed ones as zero', () => {
		const list = requirements(4, { targetLevel: 2 });

		const result = evaluateSkillReadiness({
			requirements: list,
			assessments: [assessment({ skillName: list[0].name, level: 2 })],
		});

		// 2 achieved of 4 x 2 = 8 total -> 25%
		expect(result.readinessPercent).toBe(25);
		expect(result.totalTarget).toBe(8);
		expect(result.achievedScore).toBe(2);
	});

	it('reports null readiness but a real completion count when nothing is assessed', () => {
		const result = evaluateSkillReadiness({
			requirements: requirements(5),
			assessments: [],
		});

		expect(result.readinessPercent).toBeNull();
		expect(result.status).toBe(READINESS_STATUS.NOT_ASSESSED);
		expect(result.assessedItems).toBe(0);
		expect(result.totalItems).toBe(5);
		expect(result.completionPercent).toBe(0);
	});

	it('excludes skills whose target is 0 from denominator and completeness', () => {
		const list = [
			requirement({ name: 'Excel', targetLevel: 3 }),
			requirement({ name: 'Word', targetLevel: 0 }),
		];

		const result = evaluateSkillReadiness({
			requirements: list,
			assessments: [assessment({ skillName: 'Excel', level: 3 })],
		});

		expect(result.totalItems).toBe(1);
		expect(result.assessedItems).toBe(1);
		expect(result.isComplete).toBe(true);
		expect(result.readinessPercent).toBe(100);
		expect(result.status).toBe(READINESS_STATUS.READY);
	});

	it('returns null readiness when every requirement has target 0', () => {
		const result = evaluateSkillReadiness({
			requirements: [requirement({ targetLevel: 0 })],
			assessments: [assessment()],
		});

		expect(result.readinessPercent).toBeNull();
		expect(result.totalItems).toBe(0);
	});
});

describe('evaluateSkillReadiness - status', () => {
	it('marks READY only when complete and at or above 80%', () => {
		const list = requirements(5);

		const result = evaluateSkillReadiness({
			requirements: list,
			assessments: [
				...assessmentsFor(list.slice(0, 4), 3),
				assessment({ skillName: list[4].name, level: 3 }),
			],
		});

		expect(result.readinessPercent).toBe(100);
		expect(result.isComplete).toBe(true);
		expect(result.status).toBe(READINESS_STATUS.READY);
	});

	it('stays DEVELOPING when complete but below 80%', () => {
		const list = requirements(5, { targetLevel: 5 });

		const result = evaluateSkillReadiness({
			requirements: list,
			assessments: list.map((item) => assessment({ skillName: item.name, level: 3 })),
		});

		// 3 of 5 for every skill -> 60%
		expect(result.readinessPercent).toBe(60);
		expect(result.isComplete).toBe(true);
		expect(result.status).toBe(READINESS_STATUS.DEVELOPING);
	});

	it('stays INCOMPLETE even when the assessed part already reaches 100%', () => {
		const list = requirements(3);

		const result = evaluateSkillReadiness({
			requirements: list,
			assessments: [
				assessment({ skillName: list[0].name, level: 5 }),
				assessment({ skillName: list[1].name, level: 5 }),
			],
		});

		expect(result.isComplete).toBe(false);
		expect(result.status).toBe(READINESS_STATUS.INCOMPLETE);
		expect(result.readinessPercent).toBe(67);
	});

	it('treats level 0 as assessed and produces a full gap', () => {
		const result = evaluateSkillReadiness({
			requirements: [requirement({ targetLevel: 3 })],
			assessments: [assessment({ level: 0 })],
		});

		expect(result.assessedItems).toBe(1);
		expect(result.isComplete).toBe(true);
		expect(result.readinessPercent).toBe(0);
		expect(result.items[0].gap).toBe(3);
		expect(result.status).toBe(READINESS_STATUS.DEVELOPING);
	});

	it('caps over-performance at the target so one skill cannot mask another', () => {
		const list = requirements(2, { targetLevel: 3 });

		const result = evaluateSkillReadiness({
			requirements: list,
			assessments: [
				assessment({ skillName: list[0].name, level: 5 }),
				assessment({ skillName: list[1].name, level: 0 }),
			],
		});

		// min(5,3)=3 plus min(0,3)=0 of 6 -> 50%
		expect(result.readinessPercent).toBe(50);
		expect(result.status).toBe(READINESS_STATUS.DEVELOPING);
	});
});
