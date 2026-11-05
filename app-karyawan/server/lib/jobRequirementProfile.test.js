import { describe, expect, it } from 'vitest';

import {
	EMPLOYMENT_OPTIONS,
	GENDER_OPTIONS,
	evaluateMandatoryComponents,
	validateProfileInput,
} from './jobRequirementProfile.js';

function employee(overrides = {}) {
	return {
		id: 1,
		employeeNo: '2301001',
		fullName: 'Budi',
		educationLevel: 'SMA',
		joinDate: new Date('2020-01-01T00:00:00.000Z'),
		employmentType: 'PERMANENT',
		gender: 'MALE',
		...overrides,
	};
}

function profile(overrides = {}) {
	return {
		minEducation: 'SMA',
		minExperienceYears: 0,
		allowedEmploymentTypes: EMPLOYMENT_OPTIONS,
		allowedGenders: GENDER_OPTIONS,
		...overrides,
	};
}

const referenceDate = new Date('2026-01-01T00:00:00.000Z');

describe('validateProfileInput', () => {
	it('accepts a complete valid payload', () => {
		const result = validateProfileInput({
			minEducation: 'D3',
			minExperienceYears: 5,
			allowedEmploymentTypes: ['PERMANENT'],
			allowedGenders: ['MALE', 'FEMALE'],
			sourceFormNo: 'SII-QSHE-002-03',
			sourceRev: '01',
			effectiveDate: '2024-04-01',
		});

		expect(result.minEducation).toBe('D3');
		expect(result.minExperienceYears).toBe(5);
		expect(result.allowedEmploymentTypes).toEqual(['PERMANENT']);
		expect(result.allowedGenders).toEqual(['MALE', 'FEMALE']);
		expect(result.sourceRev).toBe('01');
	});

	it('rejects an unknown education value', () => {
		expect(() => validateProfileInput({ minEducation: 'S3' })).toThrow(/Pendidikan minimal harus salah satu/);
	});

	it('ignores a legacy educationOther key in the payload', () => {
		const result = validateProfileInput({
			minEducation: 'D3',
			educationOther: 'STM Mesin',
		});

		expect(result.minEducation).toBe('D3');
		expect(result).not.toHaveProperty('educationOther');
	});

	it('does not turn null optional fields into the string "null"', () => {
		const result = validateProfileInput({
			minEducation: 'SMA',
			sourceFormNo: null,
			sourceRev: null,
			notes: null,
			effectiveDate: null,
		});

		expect(result.sourceFormNo).toBeNull();
		expect(result.sourceRev).toBeNull();
		expect(result.notes).toBeNull();
		expect(result.effectiveDate).toBeNull();
	});

	it('accepts the exact payload the Syarat Grade form sends', () => {
		// Regression: a legacy `educationOther` key in the payload must not break
		// saving now that education is a fixed list.
		const result = validateProfileInput({
			minEducation: 'D3',
			minExperienceYears: 5,
			allowedEmploymentTypes: ['PERMANENT', 'CONTRACT'],
			allowedGenders: ['MALE', 'FEMALE'],
			sourceFormNo: 'SII-QSHE-002-03',
			sourceRev: '00',
			effectiveDate: '2024-04-01',
			notes: null,
		});

		expect(result.minEducation).toBe('D3');
		expect(result).not.toHaveProperty('educationOther');
		expect(result.notes).toBeNull();
	});

	it('rejects a missing education value', () => {
		expect(() => validateProfileInput({ minEducation: null })).toThrow(/Pendidikan minimal wajib dipilih/);
		expect(() => validateProfileInput({ minEducation: '' })).toThrow(/Pendidikan minimal wajib dipilih/);
	});

	it('rejects free text as an education value now that the list is fixed', () => {
		expect(() => validateProfileInput({ minEducation: 'STM Mesin' })).toThrow(
			/Pendidikan minimal harus salah satu/,
		);
	});

	it('rejects out-of-range experience', () => {
		expect(() => validateProfileInput({ minEducation: 'SMA', minExperienceYears: -1 })).toThrow(
			/0 sampai 50 tahun/,
		);
		expect(() => validateProfileInput({ minEducation: 'SMA', minExperienceYears: 51 })).toThrow(
			/0 sampai 50 tahun/,
		);
	});

	it('rejects a fractional experience value', () => {
		expect(() => validateProfileInput({ minEducation: 'SMA', minExperienceYears: 2.5 })).toThrow(
			/bilangan bulat/,
		);
	});

	it('treats empty experience as "no requirement"', () => {
		const result = validateProfileInput({ minEducation: 'SMA', minExperienceYears: '' });

		expect(result.minExperienceYears).toBeNull();
	});

	it('rejects an empty employment list instead of silently dropping the component', () => {
		expect(() =>
			validateProfileInput({ minEducation: 'SMA', allowedEmploymentTypes: [] }),
		).toThrow(/Status Karyawan minimal satu harus dipilih/);
	});

	it('rejects an empty gender list', () => {
		expect(() => validateProfileInput({ minEducation: 'SMA', allowedGenders: [] })).toThrow(
			/Jenis Kelamin minimal satu harus dipilih/,
		);
	});

	it('rejects unknown enum members', () => {
		expect(() =>
			validateProfileInput({ minEducation: 'SMA', allowedGenders: ['OTHER'] }),
		).toThrow(/tidak dikenal/);
	});

	it('defaults both enum lists when omitted', () => {
		const result = validateProfileInput({ minEducation: 'SMA' });

		expect(result.allowedEmploymentTypes).toEqual(EMPLOYMENT_OPTIONS);
		expect(result.allowedGenders).toEqual(GENDER_OPTIONS);
	});

	it('rejects an invalid effective date', () => {
		expect(() =>
			validateProfileInput({ minEducation: 'SMA', effectiveDate: 'bukan-tanggal' }),
		).toThrow(/Tanggal berlaku tidak valid/);
	});
});

describe('evaluateMandatoryComponents', () => {
	it('passes everyone when the requirement matches the population', () => {
		const result = evaluateMandatoryComponents({
			profile: profile(),
			employees: [employee(), employee({ id: 2, educationLevel: 'S1' })],
			referenceDate,
		});

		expect(result.failingEmployeeCount).toBe(0);
		expect(result.components.every((component) => component.failCount === 0)).toBe(true);
	});

	it('flags employees below the minimum education rank', () => {
		const result = evaluateMandatoryComponents({
			profile: profile({ minEducation: 'D3' }),
			employees: [employee({ id: 1, educationLevel: 'SMA' }), employee({ id: 2, educationLevel: 'D3' })],
			referenceDate,
		});

		const education = result.components.find((component) => component.key === 'education');

		expect(result.failingEmployeeCount).toBe(1);
		expect(education.failCount).toBe(1);
		expect(education.employees[0].employeeId).toBe(1);
		expect(education.employees[0].required).toBe('D3');
	});

	it('flags employees below the minimum experience', () => {
		const result = evaluateMandatoryComponents({
			profile: profile({ minExperienceYears: 10 }),
			employees: [
				employee({ id: 1, joinDate: new Date('2020-01-01T00:00:00.000Z') }),
				employee({ id: 2, joinDate: new Date('2010-01-01T00:00:00.000Z') }),
			],
			referenceDate,
		});

		const experience = result.components.find((component) => component.key === 'experience');

		expect(experience.failCount).toBe(1);
		expect(experience.employees[0].employeeId).toBe(1);
	});

	it('does not flag employment or gender when every option is allowed', () => {
		const result = evaluateMandatoryComponents({
			profile: profile(),
			employees: [
				employee({ id: 1, employmentType: 'CONTRACT', gender: 'FEMALE' }),
				employee({ id: 2, employmentType: 'PERMANENT', gender: 'MALE' }),
			],
			referenceDate,
		});

		const employment = result.components.find((component) => component.key === 'employment');
		const gender = result.components.find((component) => component.key === 'gender');

		expect(employment.failCount).toBe(0);
		expect(gender.failCount).toBe(0);
	});

	it('starts flagging once employment is narrowed to one option', () => {
		const result = evaluateMandatoryComponents({
			profile: profile({ allowedEmploymentTypes: ['PERMANENT'] }),
			employees: [
				employee({ id: 1, employmentType: 'CONTRACT' }),
				employee({ id: 2, employmentType: 'PERMANENT' }),
			],
			referenceDate,
		});

		const employment = result.components.find((component) => component.key === 'employment');

		expect(employment.failCount).toBe(1);
		expect(employment.employees[0].required).toBe('Permanen');
	});

	it('starts flagging once gender is narrowed to one option', () => {
		const result = evaluateMandatoryComponents({
			profile: profile({ allowedGenders: ['MALE'] }),
			employees: [employee({ id: 1, gender: 'FEMALE' }), employee({ id: 2, gender: 'MALE' })],
			referenceDate,
		});

		const gender = result.components.find((component) => component.key === 'gender');

		expect(gender.failCount).toBe(1);
		expect(gender.employees[0].employeeId).toBe(1);
	});

	it('reports no manual components because education is always an enum', () => {
		const result = evaluateMandatoryComponents({
			profile: profile(),
			employees: [employee({ educationLevel: 'SMA' })],
			referenceDate,
		});

		expect(result.manualComponents).toEqual([]);
	});

	it('returns an empty result for a grade with no employees', () => {
		const result = evaluateMandatoryComponents({
			profile: profile({ minEducation: 'S1', minExperienceYears: 10 }),
			employees: [],
			referenceDate,
		});

		expect(result.employeeCount).toBe(0);
		expect(result.failingEmployeeCount).toBe(0);
	});

	it('counts an employee once even when failing two components', () => {
		const result = evaluateMandatoryComponents({
			profile: profile({ minEducation: 'D3', minExperienceYears: 10 }),
			employees: [employee({ id: 7, educationLevel: 'SMA', joinDate: new Date('2024-01-01') })],
			referenceDate,
		});

		expect(result.failingEmployeeCount).toBe(1);
		expect(result.failingEmployeeIds).toEqual([7]);
		expect(result.components.find((c) => c.key === 'education').failCount).toBe(1);
		expect(result.components.find((c) => c.key === 'experience').failCount).toBe(1);
	});
});
