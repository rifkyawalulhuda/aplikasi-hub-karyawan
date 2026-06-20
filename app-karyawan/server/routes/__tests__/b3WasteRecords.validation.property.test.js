/* eslint-disable import/first, import/extensions */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';

/**
 * Property-Based Test: Validation Rejects Invalid or Incomplete Inputs
 *
 * Feature: b3-waste-recording, Property 2: Validation Rejects Invalid Inputs
 *
 * **Validates: Requirements 1.7, 1.9, 2.8**
 *
 * For any waste record input where at least one required field is missing, empty,
 * or has an invalid value, the system SHALL reject the input with a validation error
 * and no record SHALL be persisted.
 */

// Mock prisma before importing the router (vitest hoists vi.mock)
vi.mock('../../lib/prisma.js', () => ({
	default: {
		b3WasteRecord: {
			create: vi.fn(),
			findMany: vi.fn(),
			findFirst: vi.fn(),
			count: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		b3WasteOutRecord: {
			count: vi.fn(),
		},
	},
}));

import prisma from '../../lib/prisma.js';
import router from '../b3WasteRecords.js';

// Helper to extract route handlers from the Express router
function getRouteHandler(method, path) {
	const layer = router.stack.find((l) => l.route && l.route.path === path && l.route.methods[method]);
	if (!layer) throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
	const handlers = layer.route.stack.map((s) => s.handle);
	const wrappedHandler = handlers[handlers.length - 1];

	return async (req, res) => {
		let caughtError = null;
		const next = (err) => {
			caughtError = err;
		};
		wrappedHandler(req, res, next);
		await new Promise((resolve) => {
			setImmediate(resolve);
		});
		if (caughtError) throw caughtError;
	};
}

function createMockRes() {
	const res = {
		statusCode: 200,
		jsonData: null,
		status: vi.fn(function status(code) {
			this.statusCode = code;
			return this;
		}),
		json: vi.fn(function json(data) {
			this.jsonData = data;
			return this;
		}),
		send: vi.fn(function send() {
			return this;
		}),
	};
	return res;
}

function createMockReq(body = {}) {
	return {
		siteId: 1,
		body,
		query: {},
		params: {},
	};
}

// Valid base input for reference
function validInput() {
	return {
		jenisLimbahId: 1,
		tanggalMasuk: '2024-06-15',
		sumberLimbah: 'Warehouse A',
		jumlahMasuk: 50.5,
		maksimalPenyimpanan: 90,
		petugasPenanggungJawab: 'Ahmad Fauzi',
	};
}

describe('Feature: b3-waste-recording, Property 2: Validation Rejects Invalid Inputs', () => {
	let postHandler;

	beforeEach(() => {
		vi.clearAllMocks();
		postHandler = getRouteHandler('post', '/');
	});

	it('should reject input when a required field is randomly omitted', async () => {
		const requiredFields = [
			'jenisLimbahId',
			'tanggalMasuk',
			'sumberLimbah',
			'jumlahMasuk',
			'maksimalPenyimpanan',
			'petugasPenanggungJawab',
		];

		await fc.assert(
			fc.asyncProperty(fc.integer({ min: 0, max: requiredFields.length - 1 }), async (fieldIndex) => {
				const input = validInput();
				const omittedField = requiredFields[fieldIndex];
				delete input[omittedField];

				const req = createMockReq(input);
				const res = createMockRes();

				await postHandler(req, res);

				expect(res.statusCode).toBe(400);
				expect(res.jsonData).toHaveProperty('message');
				expect(prisma.b3WasteRecord.create).not.toHaveBeenCalled();
			}),
			{ numRuns: 100 },
		);
	});

	it('should reject input when jumlahMasuk is below minimum (< 0.01)', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.double({ min: -999999, max: 0.009, noNaN: true, noDefaultInfinity: true }),
				async (invalidAmount) => {
					const input = validInput();
					input.jumlahMasuk = invalidAmount;

					const req = createMockReq(input);
					const res = createMockRes();

					await postHandler(req, res);

					expect(res.statusCode).toBe(400);
					expect(res.jsonData).toHaveProperty('message');
					expect(prisma.b3WasteRecord.create).not.toHaveBeenCalled();
				},
			),
			{ numRuns: 100 },
		);
	});

	it('should reject input when jumlahMasuk exceeds maximum (> 999999.99)', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.double({ min: 1000000, max: 9999999, noNaN: true, noDefaultInfinity: true }),
				async (invalidAmount) => {
					const input = validInput();
					input.jumlahMasuk = invalidAmount;

					const req = createMockReq(input);
					const res = createMockRes();

					await postHandler(req, res);

					expect(res.statusCode).toBe(400);
					expect(res.jsonData).toHaveProperty('message');
					expect(prisma.b3WasteRecord.create).not.toHaveBeenCalled();
				},
			),
			{ numRuns: 100 },
		);
	});

	it('should reject input when jumlahMasuk has more than 2 decimal places', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.integer({ min: 1, max: 9999 }),
				fc.integer({ min: 1, max: 9 }),
				fc.integer({ min: 1, max: 9 }),
				fc.integer({ min: 1, max: 9 }),
				async (wholePart, d1, d2, d3) => {
					// Construct a number with exactly 3 decimal places where last digit is non-zero
					const invalidAmount = parseFloat(`${wholePart}.${d1}${d2}${d3}`);
					const input = validInput();
					input.jumlahMasuk = invalidAmount;

					const req = createMockReq(input);
					const res = createMockRes();

					await postHandler(req, res);

					expect(res.statusCode).toBe(400);
					expect(res.jsonData).toHaveProperty('message');
					expect(prisma.b3WasteRecord.create).not.toHaveBeenCalled();
				},
			),
			{ numRuns: 100 },
		);
	});

	it('should reject input when tanggalMasuk is before 2020-01-01', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc
					.date({ min: new Date('2000-01-01'), max: new Date('2019-12-31') })
					.filter((d) => !isNaN(d.getTime())),
				async (invalidDate) => {
					const input = validInput();
					input.tanggalMasuk = invalidDate.toISOString().split('T')[0];

					const req = createMockReq(input);
					const res = createMockRes();

					await postHandler(req, res);

					expect(res.statusCode).toBe(400);
					expect(res.jsonData).toHaveProperty('message');
					expect(prisma.b3WasteRecord.create).not.toHaveBeenCalled();
				},
			),
			{ numRuns: 100 },
		);
	});

	it('should reject input when tanggalMasuk is after today', async () => {
		await fc.assert(
			fc.asyncProperty(fc.integer({ min: 1, max: 3650 }), async (daysInFuture) => {
				const futureDate = new Date();
				futureDate.setDate(futureDate.getDate() + daysInFuture);
				const input = validInput();
				input.tanggalMasuk = futureDate.toISOString().split('T')[0];

				const req = createMockReq(input);
				const res = createMockRes();

				await postHandler(req, res);

				expect(res.statusCode).toBe(400);
				expect(res.jsonData).toHaveProperty('message');
				expect(prisma.b3WasteRecord.create).not.toHaveBeenCalled();
			}),
			{ numRuns: 100 },
		);
	});

	it('should reject input when maksimalPenyimpanan is not 90 or 180', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.integer({ min: -1000, max: 1000 }).filter((n) => n !== 90 && n !== 180),
				async (invalidStorage) => {
					const input = validInput();
					input.maksimalPenyimpanan = invalidStorage;

					const req = createMockReq(input);
					const res = createMockRes();

					await postHandler(req, res);

					expect(res.statusCode).toBe(400);
					expect(res.jsonData).toHaveProperty('message');
					expect(prisma.b3WasteRecord.create).not.toHaveBeenCalled();
				},
			),
			{ numRuns: 100 },
		);
	});

	it('should reject input when sumberLimbah exceeds 200 characters', async () => {
		await fc.assert(
			fc.asyncProperty(fc.integer({ min: 201, max: 500 }), async (length) => {
				// Use 'A'.repeat to ensure length is preserved after Yup's trim()
				const longSource = 'A'.repeat(length);
				const input = validInput();
				input.sumberLimbah = longSource;

				const req = createMockReq(input);
				const res = createMockRes();

				await postHandler(req, res);

				expect(res.statusCode).toBe(400);
				expect(res.jsonData).toHaveProperty('message');
				expect(prisma.b3WasteRecord.create).not.toHaveBeenCalled();
			}),
			{ numRuns: 100 },
		);
	});

	it('should reject input when petugasPenanggungJawab exceeds 100 characters', async () => {
		await fc.assert(
			fc.asyncProperty(fc.integer({ min: 101, max: 300 }), async (length) => {
				// Use 'B'.repeat to ensure length is preserved after Yup's trim()
				const longName = 'B'.repeat(length);
				const input = validInput();
				input.petugasPenanggungJawab = longName;

				const req = createMockReq(input);
				const res = createMockRes();

				await postHandler(req, res);

				expect(res.statusCode).toBe(400);
				expect(res.jsonData).toHaveProperty('message');
				expect(prisma.b3WasteRecord.create).not.toHaveBeenCalled();
			}),
			{ numRuns: 100 },
		);
	});
});
