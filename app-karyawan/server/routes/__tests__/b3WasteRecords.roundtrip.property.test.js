/* eslint-disable import/first, import/extensions */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';

/**
 * Property 1: Waste Record Creation Round-Trip
 *
 * For any valid waste record input (jenisLimbahId, tanggalMasuk, sumberLimbah,
 * jumlahMasuk, maksimalPenyimpanan, petugasPenanggungJawab), creating the record
 * and then reading it back SHALL return data identical to the input, with
 * `tanggalBatas` correctly computed as `tanggalMasuk + maksimalPenyimpanan` days.
 *
 * **Validates: Requirements 1.1, 1.8**
 *
 * Feature: b3-waste-recording, Property 1: Waste Record Creation Round-Trip
 */

// Mock prisma before importing the router
vi.mock('../../lib/prisma.js', () => ({
	default: {
		b3WasteRecord: {
			create: vi.fn(),
			findMany: vi.fn(),
			count: vi.fn(),
		},
	},
}));

import prisma from '../../lib/prisma.js';
import router from '../b3WasteRecords.js';

// Helper to extract route handlers from Express router
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
	};
	return res;
}

function createMockReq(overrides = {}) {
	return {
		siteId: 1,
		query: {},
		params: {},
		body: {},
		...overrides,
	};
}

/**
 * Compute expected tanggalBatas from tanggalMasuk + maksimalPenyimpanan days
 */
function computeExpectedTanggalBatas(tanggalMasuk, maksimalPenyimpanan) {
	const date = new Date(tanggalMasuk);
	date.setDate(date.getDate() + maksimalPenyimpanan);
	return date;
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('Feature: b3-waste-recording, Property 1: Waste Record Creation Round-Trip', () => {
	it('creating a waste record and reading it back returns data identical to input with correct tanggalBatas', async () => {
		const postHandler = getRouteHandler('post', '/');

		await fc.assert(
			fc.asyncProperty(
				fc.integer({ min: 1, max: 1000 }),
				fc
					.date({ min: new Date('2020-01-01'), max: new Date(Date.now() - 86400000) })
					.filter((d) => !isNaN(d.getTime())),
				fc.stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9 ]{0,199}$/).filter((s) => s.trim().length >= 1),
				fc.integer({ min: 1, max: 99999999 }).map((n) => n / 100),
				fc.constantFrom(90, 180),
				fc.stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9 ]{0,99}$/).filter((s) => s.trim().length >= 1),
				async (
					jenisLimbahId,
					tanggalMasuk,
					sumberLimbah,
					jumlahMasuk,
					maksimalPenyimpanan,
					petugasPenanggungJawab,
				) => {
					// Reset mocks between iterations
					vi.clearAllMocks();

					// Setup mock: prisma.b3WasteRecord.create captures data and returns it
					prisma.b3WasteRecord.create.mockImplementation(async ({ data, include }) => ({
						id: 1,
						...data,
						jenisLimbah: { id: data.jenisLimbahId, kode: 'TEST', nama: 'Test Limbah' },
						outRecords: [],
						createdAt: new Date(),
						updatedAt: new Date(),
					}));

					const req = createMockReq({
						body: {
							jenisLimbahId,
							tanggalMasuk: tanggalMasuk.toISOString(),
							sumberLimbah,
							jumlahMasuk,
							maksimalPenyimpanan,
							petugasPenanggungJawab,
						},
					});
					const res = createMockRes();

					await postHandler(req, res);

					// Verify successful creation (201)
					expect(res.status).toHaveBeenCalledWith(201);
					expect(res.json).toHaveBeenCalled();

					const returnedRecord = res.jsonData;

					// Verify returned record matches input fields
					expect(returnedRecord.jenisLimbahId).toBe(jenisLimbahId);
					expect(returnedRecord.sumberLimbah).toBe(sumberLimbah.trim());
					expect(returnedRecord.jumlahMasuk).toBe(jumlahMasuk);
					expect(returnedRecord.maksimalPenyimpanan).toBe(maksimalPenyimpanan);
					expect(returnedRecord.petugasPenanggungJawab).toBe(petugasPenanggungJawab.trim());
					expect(returnedRecord.siteId).toBe(1);

					// Verify tanggalMasuk was passed correctly
					const returnedTanggalMasuk = new Date(returnedRecord.tanggalMasuk);
					const inputTanggalMasuk = new Date(tanggalMasuk.toISOString());
					expect(returnedTanggalMasuk.toISOString()).toBe(inputTanggalMasuk.toISOString());

					// Verify tanggalBatas = tanggalMasuk + maksimalPenyimpanan days
					const expectedTanggalBatas = computeExpectedTanggalBatas(tanggalMasuk, maksimalPenyimpanan);
					const returnedTanggalBatas = new Date(returnedRecord.tanggalBatas);
					expect(returnedTanggalBatas.getFullYear()).toBe(expectedTanggalBatas.getFullYear());
					expect(returnedTanggalBatas.getMonth()).toBe(expectedTanggalBatas.getMonth());
					expect(returnedTanggalBatas.getDate()).toBe(expectedTanggalBatas.getDate());

					// Verify prisma.create was called with the correct data
					expect(prisma.b3WasteRecord.create).toHaveBeenCalledTimes(1);
					const createCall = prisma.b3WasteRecord.create.mock.calls[0][0];
					expect(createCall.data.jenisLimbahId).toBe(jenisLimbahId);
					expect(createCall.data.sumberLimbah).toBe(sumberLimbah.trim());
					expect(createCall.data.jumlahMasuk).toBe(jumlahMasuk);
					expect(createCall.data.maksimalPenyimpanan).toBe(maksimalPenyimpanan);
					expect(createCall.data.petugasPenanggungJawab).toBe(petugasPenanggungJawab.trim());
					expect(createCall.data.siteId).toBe(1);
				},
			),
			{ numRuns: 100 },
		);
	});
});
