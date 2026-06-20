import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatIndonesianNumber } from '../b3WasteExport.js';

/**
 * Property 6: Indonesian Number Formatting
 * **Validates: Requirements 3.4**
 *
 * For any valid decimal number, the formatting function SHALL produce a string
 * with dot (.) as thousands separator and comma (,) as decimal separator,
 * with exactly 2 decimal places.
 */
describe('Feature: b3-waste-recording, Property 6: Indonesian Number Formatting', () => {
	const validNumberArb = fc.double({
		min: -999999999,
		max: 999999999,
		noNaN: true,
		noDefaultInfinity: true,
	});

	it('output uses comma as decimal separator (single comma followed by exactly 2 digits at end)', () => {
		fc.assert(
			fc.property(validNumberArb, (num) => {
				const result = formatIndonesianNumber(num);
				// Should match: optional negative sign, digits/dots, comma, exactly 2 digits at end
				expect(result).toMatch(/,\d{2}$/);
				// Should contain exactly one comma
				const commaCount = (result.match(/,/g) || []).length;
				expect(commaCount).toBe(1);
			}),
			{ numRuns: 100 },
		);
	});

	it('output uses dot as thousands separator for integer part (no other separators)', () => {
		fc.assert(
			fc.property(validNumberArb, (num) => {
				const result = formatIndonesianNumber(num);
				// Split at comma to get integer part and decimal part
				const [integerPart] = result.split(',');
				// Remove negative sign if present
				const absInteger = integerPart.startsWith('-') ? integerPart.slice(1) : integerPart;
				// Integer part should only contain digits and dots
				expect(absInteger).toMatch(/^[\d.]+$/);
				// Dots in integer part are thousands separators (no consecutive dots)
				expect(absInteger).not.toMatch(/\.\./);
			}),
			{ numRuns: 100 },
		);
	});

	it('output has exactly 2 decimal places', () => {
		fc.assert(
			fc.property(validNumberArb, (num) => {
				const result = formatIndonesianNumber(num);
				const parts = result.split(',');
				expect(parts).toHaveLength(2);
				expect(parts[1]).toMatch(/^\d{2}$/);
			}),
			{ numRuns: 100 },
		);
	});

	it('for numbers >= 1000, the integer part has dots every 3 digits from the right', () => {
		const largeNumberArb = fc.double({
			min: 1000,
			max: 999999999,
			noNaN: true,
			noDefaultInfinity: true,
		});

		fc.assert(
			fc.property(largeNumberArb, (num) => {
				const result = formatIndonesianNumber(num);
				const [integerPart] = result.split(',');
				// Remove negative sign if present
				const absInteger = integerPart.startsWith('-') ? integerPart.slice(1) : integerPart;
				// Remove dots to get pure digits
				const digits = absInteger.replace(/\./g, '');
				// Verify digits length >= 4 (since num >= 1000)
				expect(digits.length).toBeGreaterThanOrEqual(4);
				// Verify dots are placed every 3 digits from the right
				const groups = absInteger.split('.');
				// First group can be 1-3 digits
				expect(groups[0].length).toBeGreaterThanOrEqual(1);
				expect(groups[0].length).toBeLessThanOrEqual(3);
				// All subsequent groups must be exactly 3 digits
				for (let i = 1; i < groups.length; i++) {
					expect(groups[i]).toHaveLength(3);
				}
			}),
			{ numRuns: 100 },
		);
	});

	it('round-trip: parsing formatted string back produces a number close to original (within rounding tolerance)', () => {
		fc.assert(
			fc.property(validNumberArb, (num) => {
				const result = formatIndonesianNumber(num);
				// Parse back: remove dots (thousands), replace comma with dot (decimal)
				const parsed = parseFloat(result.replace(/\./g, '').replace(',', '.'));
				// Should be within rounding tolerance (toFixed(2) rounds to 2 decimal places)
				const expected = parseFloat(num.toFixed(2));
				expect(parsed).toBeCloseTo(expected, 2);
			}),
			{ numRuns: 100 },
		);
	});
});
