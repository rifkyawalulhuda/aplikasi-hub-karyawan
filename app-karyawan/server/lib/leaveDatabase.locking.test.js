import { describe, expect, it, vi } from 'vitest';

import { applyApprovedLeaveToDatabase, updateLeaveDatabaseEntry } from './leaveDatabase.js';

function createLockAwareTx({ remainingLeave = 10, updateResult } = {}) {
	const order = [];
	const record = { id: 9, employeeId: 1, year: 2026, masterCutiKaryawanId: 2, remainingLeave };

	const tx = {
		order,
		$queryRaw: vi.fn(() => {
			order.push('lock');
			return Promise.resolve([{ id: record.id }]);
		}),
		employeeLeaveDatabase: {
			findUnique: vi.fn(() => {
				order.push('read');
				return Promise.resolve(record);
			}),
			update: vi.fn(({ data }) => {
				order.push('update');
				return Promise.resolve(updateResult || { ...record, ...data });
			}),
		},
		employeeLeaveDatabaseHistory: {
			create: vi.fn(() => {
				order.push('history');
				return Promise.resolve({ id: 1 });
			}),
		},
	};

	return { tx, order };
}

describe('leave balance row locking', () => {
	it('locks the ledger row before the import read-modify-write', async () => {
		const { tx, order } = createLockAwareTx();

		await updateLeaveDatabaseEntry(tx, 9, { remainingLeave: 4 }, { skipHistory: true });

		expect(order).toEqual(['lock', 'read', 'update']);
		expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
	});

	it('locks the ledger row before the approval balance read', async () => {
		const { tx, order } = createLockAwareTx({ remainingLeave: 10 });

		const result = await applyApprovedLeaveToDatabase(tx, {
			employeeId: 1,
			year: 2026,
			masterCutiKaryawanId: 2,
			leaveDays: 6,
			employeeLeaveId: 77,
		});

		expect(order[0]).toBe('lock');
		expect(order[1]).toBe('read');
		expect(result.balanceBefore).toBe(10);
		expect(result.balanceAfter).toBe(4);
	});

	it('refuses an approval that would drive the balance negative even after locking', async () => {
		const { tx } = createLockAwareTx({ remainingLeave: 3 });

		await expect(
			applyApprovedLeaveToDatabase(tx, {
				employeeId: 1,
				year: 2026,
				masterCutiKaryawanId: 2,
				leaveDays: 6,
			}),
		).rejects.toMatchObject({ statusCode: 400 });

		expect(tx.employeeLeaveDatabase.update).not.toHaveBeenCalled();
	});
});
