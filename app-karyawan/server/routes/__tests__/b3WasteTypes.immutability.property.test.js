/* eslint-disable import/first, import/extensions */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';

/**
 * Property 9: Field Immutability After Save (kode)
 *
 * For any saved B3WasteType, the `kode` field SHALL not be modifiable
 * via update operations. The PUT /:id endpoint uses an updateSchema
 * that only validates `nama` — any kode sent in the body is stripped.
 *
 * Feature: b3-waste-recording, Property 9: Field Immutability After Save
 * Validates: Requirements 7.4, 8.2
 */

vi.mock('../../lib/prisma.js', () => ({
	default: {
		b3WasteType: {
			findFirst: vi.fn(),
			update: vi.fn(),
		},
	},
}));

import prisma from '../../lib/prisma.js';
import router from '../b3WasteTypes.js';

// Helper to extract route handlers from the Express router.
// The route uses withAsync which wraps the handler in a non-async function.
// We invoke the wrapper and flush microtasks with setImmediate to await completion.
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

function mockReq(overrides = {}) {
	return {
		siteId: 1,
		params: {},
		query: {},
		body: {},
		...overrides,
	};
}

function mockRes() {
	const res = {};
	res.status = vi.fn().mockReturnValue(res);
	res.json = vi.fn().mockReturnValue(res);
	res.send = vi.fn().mockReturnValue(res);
	return res;
}

describe('Property 9: Field Immutability After Save (kode)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('kode field is not modifiable via PUT /:id — any kode in body is stripped', async () => {
		const handler = getRouteHandler('put', '/:id');

		await fc.assert(
			fc.asyncProperty(
				// Generate an original kode (1-20 chars, non-whitespace-only)
				fc.stringMatching(/^[A-Za-z0-9\-]{1,20}$/),
				// Generate a different kode that an attacker tries to set
				fc.stringMatching(/^[A-Za-z0-9\-]{1,20}$/),
				// Generate a valid nama for the update (non-empty after trim, max 200)
				fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
				// Generate a record id
				fc.integer({ min: 1, max: 100000 }),
				async (originalKode, attemptedKode, newNama, recordId) => {
					// Setup: existing record with original kode
					const existingRecord = {
						id: recordId,
						siteId: 1,
						kode: originalKode,
						nama: 'Original Nama',
						createdAt: new Date(),
						updatedAt: new Date(),
					};

					prisma.b3WasteType.findFirst.mockReset();
					prisma.b3WasteType.update.mockReset();

					prisma.b3WasteType.findFirst.mockResolvedValue(existingRecord);

					// Mock update to return the record with only the data that was passed
					prisma.b3WasteType.update.mockImplementation(({ data }) =>
						Promise.resolve({
							...existingRecord,
							...data,
							updatedAt: new Date(),
						}),
					);

					const req = mockReq({
						params: { id: String(recordId) },
						body: {
							kode: attemptedKode, // attacker tries to change kode
							nama: newNama,
						},
					});
					const res = mockRes();

					await handler(req, res);

					// The update should have been called (validation passed)
					expect(prisma.b3WasteType.update).toHaveBeenCalledTimes(1);

					// Verify the update call does NOT include kode in the data payload
					const updateCall = prisma.b3WasteType.update.mock.calls[0][0];
					expect(updateCall.data).not.toHaveProperty('kode');

					// The response should still have the original kode
					const responseBody = res.json.mock.calls[0][0];
					expect(responseBody.kode).toBe(originalKode);
				},
			),
			{ numRuns: 100 },
		);
	});
});
