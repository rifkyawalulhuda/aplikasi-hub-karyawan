import { describe, expect, it } from 'vitest';

import { STATUS, evaluateJobRequirement } from './jobRequirement';

function buildEmployee(overrides = {}) {
	return {
		id: 1,
		employeeNo: 'EMP001',
		fullName: 'Budi',
		employmentType: 'PERMANENT',
		gender: 'MALE',
		educationLevel: 'S1',
		joinDate: '2014-01-01',
		grade: 'RANK_7',
		...overrides,
	};
}

function buildProfile(overrides = {}) {
	return {
		grade: 'RANK_7',
		minEducation: 'D3',
		educationOther: null,
		minExperienceYears: 10,
		allowedEmploymentTypes: ['PERMANENT', 'CONTRACT'],
		allowedGenders: ['MALE', 'FEMALE'],
		sourceFormNo: 'SII-QSHE-002-03',
		sourceRev: '00',
		effectiveDate: null,
		notes: '',
		skills: [],
		trainings: [],
		...overrides,
	};
}

const REFERENCE_DATE = '2026-01-01';

describe('evaluateJobRequirement', () => {
	it('treats education as minimum, so a higher level still meets', () => {
		const result = evaluateJobRequirement({
			employee: buildEmployee({ educationLevel: 'S1' }),
			profile: buildProfile({ minEducation: 'D3' }),
			referenceDate: REFERENCE_DATE,
		});

		const education = result.categories.find((category) => category.key === 'EDUCATION');

		expect(education.met).toBe(1);
	});

	it('treats experience as a lower bound only', () => {
		const overqualified = evaluateJobRequirement({
			employee: buildEmployee({ joinDate: '2010-01-01' }),
			profile: buildProfile({ minExperienceYears: 10 }),
			referenceDate: REFERENCE_DATE,
		});
		const underqualified = evaluateJobRequirement({
			employee: buildEmployee({ joinDate: '2023-01-01' }),
			profile: buildProfile({ minExperienceYears: 10 }),
			referenceDate: REFERENCE_DATE,
		});

		expect(overqualified.categories.find((category) => category.key === 'EXPERIENCE').met).toBe(1);
		expect(underqualified.categories.find((category) => category.key === 'EXPERIENCE').met).toBe(0);
	});

	it('applies OR semantics for employment type and gender', () => {
		const contractEmployee = evaluateJobRequirement({
			employee: buildEmployee({ employmentType: 'CONTRACT', gender: 'FEMALE' }),
			profile: buildProfile({
				allowedEmploymentTypes: ['PERMANENT', 'CONTRACT'],
				allowedGenders: ['MALE', 'FEMALE'],
			}),
			referenceDate: REFERENCE_DATE,
		});
		const restrictedEmployee = evaluateJobRequirement({
			employee: buildEmployee({ gender: 'FEMALE' }),
			profile: buildProfile({ allowedGenders: ['MALE'] }),
			referenceDate: REFERENCE_DATE,
		});

		expect(contractEmployee.mandatoryMet).toBe(true);
		expect(restrictedEmployee.mandatoryMet).toBe(false);
	});

	it('requires every listed skill to reach the pass level', () => {
		const profile = buildProfile({
			skills: [
				{ category: 'SOFT_SKILL', name: 'Kerjasama Tim' },
				{ category: 'SOFT_SKILL', name: 'Empati' },
			],
		});
		const result = evaluateJobRequirement({
			employee: buildEmployee(),
			profile,
			assessments: [{ category: 'SOFT_SKILL', skillName: 'kerjasama tim', level: 1 }],
			referenceDate: REFERENCE_DATE,
		});

		const softSkill = result.categories.find((category) => category.key === 'SOFT_SKILL');

		expect(softSkill.met).toBe(0);
		expect(softSkill.notAssessed).toBe(1);
	});

	it('matches required trainings by master training name or material text', () => {
		const profile = buildProfile({
			trainings: [
				{ masterTraining: { name: 'Basic Management System' } },
				{ masterTraining: { name: 'Safety and Health' } },
			],
		});
		const result = evaluateJobRequirement({
			employee: buildEmployee(),
			profile,
			employeeTrainings: [
				{ material: 'basic management system' },
				{ material: 'Pelatihan lain', masterTraining: { name: 'Safety and Health' } },
			],
			referenceDate: REFERENCE_DATE,
		});

		const training = result.categories.find((category) => category.key === 'TRAINING');

		expect(training.met).toBe(2);
	});

	it('reports BELUM_DINILAI when mandatory dimensions pass but no skill evidence exists', () => {
		const result = evaluateJobRequirement({
			employee: buildEmployee(),
			profile: buildProfile({ skills: [{ category: 'SOFT_SKILL', name: 'Empati' }] }),
			referenceDate: REFERENCE_DATE,
		});

		expect(result.status).toBe(STATUS.NOT_ASSESSED);
	});

	it('reports MEMENUHI when mandatory dimensions pass and evidence exists', () => {
		const result = evaluateJobRequirement({
			employee: buildEmployee(),
			profile: buildProfile({ skills: [{ category: 'SOFT_SKILL', name: 'Empati' }] }),
			assessments: [{ category: 'SOFT_SKILL', skillName: 'Empati', level: 4 }],
			referenceDate: REFERENCE_DATE,
		});

		expect(result.status).toBe(STATUS.MEETS);
	});

	it('reports BELUM_MEMENUHI when a mandatory dimension fails', () => {
		const result = evaluateJobRequirement({
			employee: buildEmployee({ joinDate: '2024-01-01' }),
			profile: buildProfile({ minExperienceYears: 10 }),
			referenceDate: REFERENCE_DATE,
		});

		expect(result.status).toBe(STATUS.DOES_NOT_MEET);
	});

	it('reports TIDAK_ADA_PROFIL when the grade has no requirement profile', () => {
		const result = evaluateJobRequirement({
			employee: buildEmployee({ grade: 'RANK_1' }),
			profile: null,
			referenceDate: REFERENCE_DATE,
		});

		expect(result.status).toBe(STATUS.NO_PROFILE);
	});
});
