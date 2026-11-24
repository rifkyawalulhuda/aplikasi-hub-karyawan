/* eslint-disable import/extensions -- server modules use explicit .js */
import { describe, expect, it } from 'vitest';

import {
	ALERT_LIMIT_PER_GROUP,
	buildB3Trend,
	buildLicenseAlert,
	buildMonthBuckets,
	countByMonth,
	DEFAULT_PERIOD,
	diffInDays,
	groupAndSort,
	mapLeaveRow,
	periodMonthCount,
	periodStartDate,
	resolvePeriod,
	sortLicenseAlerts,
	summarizeB3Waste,
	toIsoDate,
} from './dashboardMetrics.js';

const REFERENCE = new Date(2026, 5, 15); // 15 Jun 2026 (local time)

describe('resolvePeriod', () => {
	it('accepts a known period key', () => {
		expect(resolvePeriod('3m')).toMatchObject({ key: '3m', months: 3 });
	});

	it('falls back to the default for unknown or missing input', () => {
		expect(resolvePeriod('99m').key).toBe(DEFAULT_PERIOD);
		expect(resolvePeriod(undefined).key).toBe(DEFAULT_PERIOD);
	});

	it('reports year-to-date as a null month count', () => {
		expect(resolvePeriod('ytd').months).toBeNull();
	});
});

describe('periodMonthCount', () => {
	it('uses the explicit window for fixed periods', () => {
		expect(periodMonthCount(resolvePeriod('12m'), REFERENCE)).toBe(12);
	});

	it('counts January as one month for year-to-date', () => {
		expect(periodMonthCount(resolvePeriod('ytd'), new Date(2026, 0, 20))).toBe(1);
	});

	it('counts the current month inclusively for year-to-date', () => {
		expect(periodMonthCount(resolvePeriod('ytd'), REFERENCE)).toBe(6);
	});
});

describe('buildMonthBuckets', () => {
	it('returns buckets oldest to newest ending at the reference month', () => {
		const buckets = buildMonthBuckets(3, REFERENCE);

		expect(buckets.map((bucket) => bucket.label)).toEqual(['Apr', 'Mei', 'Jun']);
		expect(buckets.map((bucket) => bucket.key)).toEqual(['2026-4', '2026-5', '2026-6']);
	});

	it('wraps across the year boundary', () => {
		const buckets = buildMonthBuckets(3, new Date(2026, 0, 10));

		expect(buckets.map((bucket) => bucket.key)).toEqual(['2025-11', '2025-12', '2026-1']);
	});

	it('adds a two-digit year when the window spans more than one year', () => {
		const buckets = buildMonthBuckets(3, new Date(2026, 0, 10));

		expect(buckets[0].label).toBe('Nov 25');
		expect(buckets[2].label).toBe('Jan 26');
	});

	it('keeps bare month names when the whole window stays inside one year', () => {
		const buckets = buildMonthBuckets(6, REFERENCE);

		expect(buckets[0].label).toBe('Jan');
		expect(buckets[5].label).toBe('Jun');
	});
});

describe('periodStartDate', () => {
	it('starts on the first day of the earliest bucket', () => {
		expect(periodStartDate(3, REFERENCE).getTime()).toBe(new Date(2026, 3, 1).getTime());
	});
});

describe('countByMonth', () => {
	it('counts records into their own monthly bucket', () => {
		const buckets = buildMonthBuckets(3, REFERENCE);
		const records = [
			{ createdAt: new Date(2026, 4, 2) },
			{ createdAt: new Date(2026, 4, 20) },
			{ createdAt: new Date(2026, 5, 1) },
		];

		expect(countByMonth(records, buckets, (row) => row.createdAt)).toEqual([0, 2, 1]);
	});

	it('ignores records outside the window and records without a date', () => {
		const buckets = buildMonthBuckets(2, REFERENCE);
		const records = [{ createdAt: new Date(2020, 0, 1) }, { createdAt: null }];

		expect(countByMonth(records, buckets, (row) => row.createdAt)).toEqual([0, 0]);
	});

	it('accepts raw date values when no picker is given', () => {
		const buckets = buildMonthBuckets(1, REFERENCE);

		expect(countByMonth([new Date(2026, 5, 9)], buckets)).toEqual([1]);
	});
});

describe('buildLicenseAlert', () => {
	const employeeLicense = {
		id: 7,
		expiryDate: new Date(2026, 5, 1),
		documentNumber: 'DOC-7',
		employee: { fullName: 'Budi Santoso', employeeNo: 'EMP-7' },
		masterDokKaryawan: { documentName: 'SIO Operator' },
	};

	it('marks a past expiry date as Expired with a negative remaining count', () => {
		const alert = buildLicenseAlert(employeeLicense, 'KARYAWAN', REFERENCE);

		expect(alert.status).toBe('Expired');
		expect(alert.daysRemaining).toBe(-14);
		expect(alert.id).toBe('KARYAWAN-7');
		expect(alert.subjectName).toBe('Budi Santoso');
	});

	it('marks a future expiry date as Akan Expired', () => {
		const alert = buildLicenseAlert(
			{ ...employeeLicense, expiryDate: new Date(2026, 6, 1) },
			'KARYAWAN',
			REFERENCE,
		);

		expect(alert.status).toBe('Akan Expired');
		expect(alert.daysRemaining).toBe(16);
	});

	it('treats expiry today as still valid', () => {
		const alert = buildLicenseAlert(
			{ ...employeeLicense, expiryDate: new Date(2026, 5, 15) },
			'KARYAWAN',
			REFERENCE,
		);

		expect(alert.status).toBe('Akan Expired');
		expect(alert.daysRemaining).toBe(0);
	});

	it('builds unit alerts from the unit relation', () => {
		const alert = buildLicenseAlert(
			{
				id: 3,
				expiryDate: new Date(2026, 5, 10),
				documentNumber: 'UNIT-3',
				assetNo: 'AST-3',
				masterUnit: { unitName: 'Forklift' },
			},
			'UNIT',
			REFERENCE,
		);

		expect(alert.kind).toBe('UNIT');
		expect(alert.subjectName).toBe('Forklift');
		expect(alert.subjectNo).toBe('AST-3');
		expect(alert.documentName).toBe('Sertifikat unit');
	});

	it('falls back to placeholders when relations are missing', () => {
		const alert = buildLicenseAlert({ id: 9, expiryDate: new Date(2026, 5, 20) }, 'KARYAWAN', REFERENCE);

		expect(alert.subjectName).toBe('-');
		expect(alert.subjectNo).toBe('-');
		expect(alert.documentName).toBe('-');
	});
});

describe('sortLicenseAlerts', () => {
	it('puts expired rows first, most recently expired leading', () => {
		const sorted = sortLicenseAlerts([
			{ id: 'soon-far', status: 'Akan Expired', daysRemaining: 20 },
			{ id: 'expired-old', status: 'Expired', daysRemaining: -90 },
			{ id: 'soon-near', status: 'Akan Expired', daysRemaining: 2 },
			{ id: 'expired-recent', status: 'Expired', daysRemaining: -3 },
		]);

		expect(sorted.map((item) => item.id)).toEqual(['expired-recent', 'expired-old', 'soon-near', 'soon-far']);
	});

	it('does not mutate the input array', () => {
		const input = [
			{ id: 'b', status: 'Akan Expired', daysRemaining: 5 },
			{ id: 'a', status: 'Expired', daysRemaining: -1 },
		];
		sortLicenseAlerts(input);

		expect(input[0].id).toBe('b');
	});
});

describe('summarizeB3Waste', () => {
	it('computes the balance and flags entries past their storage deadline', () => {
		const result = summarizeB3Waste({
			records: [
				{
					jumlahMasuk: 100,
					tanggalBatas: new Date(2026, 5, 1),
					outRecords: [{ jumlahKeluar: 40 }],
				},
				{
					jumlahMasuk: 50,
					tanggalBatas: new Date(2026, 5, 20),
					outRecords: [],
				},
				{
					jumlahMasuk: 30,
					tanggalBatas: new Date(2026, 4, 1),
					outRecords: [{ jumlahKeluar: 30 }],
				},
			],
			outRecords: [{ jumlahKeluar: 40 }, { jumlahKeluar: 30 }],
			today: REFERENCE,
		});

		expect(result.totalMasuk).toBe(180);
		expect(result.totalKeluar).toBe(70);
		expect(result.sisaDiTps).toBe(110);
		expect(result.overdueCount).toBe(1);
		expect(result.warningCount).toBe(1);
		expect(result.nearestDeadline).toMatchObject({ sisaHari: expect.any(Number), sisaKg: expect.any(Number) });
		expect(result.nearestDeadline.sisaKg).toBe(60);
	});

	it('returns zeroes for an empty dataset', () => {
		expect(summarizeB3Waste()).toEqual({
			totalMasuk: 0,
			totalKeluar: 0,
			sisaDiTps: 0,
			overdueCount: 0,
			warningCount: 0,
			nearestDeadline: null,
		});
	});

	it('ignores fully shipped-out waste when counting deadlines', () => {
		const result = summarizeB3Waste({
			records: [{ jumlahMasuk: 10, tanggalBatas: new Date(2026, 0, 1), outRecords: [{ jumlahKeluar: 10 }] }],
			outRecords: [{ jumlahKeluar: 10 }],
			today: REFERENCE,
		});

		expect(result.overdueCount).toBe(0);
		expect(result.warningCount).toBe(0);
	});
});

describe('buildB3Trend', () => {
	it('aligns in and out volumes to the buckets', () => {
		const buckets = buildMonthBuckets(3, REFERENCE);
		const trend = buildB3Trend(
			[
				{ jumlahMasuk: 10, tanggalMasuk: new Date(2026, 4, 4) },
				{ jumlahMasuk: 5, tanggalMasuk: new Date(2026, 5, 4) },
			],
			[{ jumlahKeluar: 7, tanggalKeluar: new Date(2026, 5, 6) }],
			buckets,
		);

		expect(trend).toEqual([
			{ bulan: 'Apr', masuk: 0, keluar: 0 },
			{ bulan: 'Mei', masuk: 10, keluar: 0 },
			{ bulan: 'Jun', masuk: 5, keluar: 7 },
		]);
	});
});

describe('groupAndSort', () => {
	it('groups by name and sorts by count descending', () => {
		const rows = groupAndSort(
			[
				{ department: { name: 'Produksi' } },
				{ department: { name: 'HR' } },
				{ department: { name: 'Produksi' } },
			],
			(item) => item.department?.name,
		);

		expect(rows).toEqual([
			{ name: 'Produksi', count: 2 },
			{ name: 'HR', count: 1 },
		]);
	});

	it('buckets missing names as Lainnya', () => {
		expect(groupAndSort([{ department: null }], (item) => item.department?.name)).toEqual([
			{ name: 'Lainnya', count: 1 },
		]);
	});

	it('breaks ties alphabetically for stable output', () => {
		const rows = groupAndSort([{ name: 'Zeta' }, { name: 'Alpha' }], (item) => item.name);

		expect(rows.map((row) => row.name)).toEqual(['Alpha', 'Zeta']);
	});
});

describe('mapLeaveRow', () => {
	it('flattens the relations into the dashboard table shape', () => {
		const row = mapLeaveRow({
			id: 1,
			requestNumber: 'CUTI-1',
			status: 'SUBMITTED',
			leaveDays: 3,
			createdAt: new Date(2026, 5, 10),
			employee: { fullName: 'Siti', employeeNo: 'EMP-1' },
			masterCutiKaryawan: { leaveType: 'Cuti Tahunan' },
		});

		expect(row).toMatchObject({
			employeeName: 'Siti',
			leaveType: 'Cuti Tahunan',
			leaveDays: 3,
			status: 'SUBMITTED',
		});
		expect(row.createdAt).toBe('2026-06-10');
	});

	it('survives missing relations', () => {
		const row = mapLeaveRow({ id: 2, leaveDays: 1, status: 'APPROVED', createdAt: null });

		expect(row.employeeName).toBe('-');
		expect(row.leaveType).toBe('-');
		expect(row.createdAt).toBeNull();
	});
});

describe('date helpers', () => {
	it('diffInDays ignores the time of day', () => {
		expect(diffInDays(new Date(2026, 5, 15, 23, 30), new Date(2026, 5, 16, 0, 5))).toBe(1);
	});

	it('toIsoDate returns null for empty input', () => {
		expect(toIsoDate(null)).toBeNull();
		expect(toIsoDate(undefined)).toBeNull();
	});

	it('toIsoDate keeps the local calendar date', () => {
		expect(toIsoDate(new Date(2026, 5, 10))).toBe('2026-06-10');
	});

	it('toIsoDate does not shift the day near midnight in a UTC+ timezone', () => {
		expect(toIsoDate(new Date(2026, 5, 10, 0, 30))).toBe('2026-06-10');
		expect(toIsoDate(new Date(2026, 5, 10, 23, 45))).toBe('2026-06-10');
	});

	it('toIsoDate returns null for an invalid date', () => {
		expect(toIsoDate('bukan tanggal')).toBeNull();
	});
});

describe('ALERT_LIMIT_PER_GROUP', () => {
	it('keeps the alert list short enough for a dashboard panel', () => {
		expect(ALERT_LIMIT_PER_GROUP).toBeGreaterThan(0);
		expect(ALERT_LIMIT_PER_GROUP).toBeLessThanOrEqual(10);
	});
});
