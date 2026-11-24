/**
 * Pure metric helpers for the dashboard endpoint.
 *
 * Kept free of Prisma so the date windows, license alerting and B3 waste
 * balance can be unit tested without a database.
 */

export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const LICENSE_SOON_DAYS = 25;

/** How many alert rows are fetched per license group (expired / expiring soon). */
export const ALERT_LIMIT_PER_GROUP = 6;

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Trend windows offered by the dashboard period filter. */
export const PERIODS = {
	'3m': { months: 3, label: '3 bulan terakhir' },
	'6m': { months: 6, label: '6 bulan terakhir' },
	'12m': { months: 12, label: '12 bulan terakhir' },
	ytd: { months: null, label: 'Tahun berjalan' },
};

export const DEFAULT_PERIOD = '6m';

/** Falls back to the default window for unknown or missing input. */
export function resolvePeriod(value) {
	const key = PERIODS[value] ? value : DEFAULT_PERIOD;

	return { key, ...PERIODS[key] };
}

/** Number of months a period covers, counting the current month as one. */
export function periodMonthCount(period, reference = new Date()) {
	return period.months ?? reference.getMonth() + 1;
}

export function startOfDay(value) {
	const date = new Date(value);
	date.setHours(0, 0, 0, 0);
	return date;
}

export function diffInDays(from, to) {
	return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

/**
 * Formats a date as `YYYY-MM-DD` using its **local** calendar day.
 * `toISOString()` would shift the day for timezones ahead of UTC (e.g. WIB),
 * making a document dated the 10th render as the 9th.
 */
export function toIsoDate(value) {
	if (!value) {
		return null;
	}

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return null;
	}

	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');

	return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Ordered monthly buckets used by the trend charts, oldest → newest.
 * Labels gain a two-digit year when — and only when — the generated range
 * crosses a calendar year, so a 12-month view never repeats a bare month name.
 */
export function buildMonthBuckets(monthCount, reference = new Date()) {
	const buckets = Array.from({ length: monthCount }, (_, index) => {
		const date = new Date(reference.getFullYear(), reference.getMonth() - (monthCount - 1 - index), 1);
		const month = date.getMonth();

		return {
			key: `${date.getFullYear()}-${month + 1}`,
			label: MONTH_LABELS[month],
			month,
			year: date.getFullYear(),
		};
	});

	const crossesYear = buckets.length > 1 && buckets[0].year !== buckets[buckets.length - 1].year;

	if (!crossesYear) {
		return buckets;
	}

	return buckets.map((bucket) => ({
		...bucket,
		label: `${bucket.label} ${String(bucket.year).slice(-2)}`,
	}));
}

/** First day of the window covered by `monthCount` buckets ending at `reference`. */
export function periodStartDate(monthCount, reference = new Date()) {
	return new Date(reference.getFullYear(), reference.getMonth() - (monthCount - 1), 1);
}

/** Counts records per monthly bucket, keyed by a record's own date. */
export function countByMonth(records, buckets, pickDate = (record) => record) {
	const counts = new Map(buckets.map((bucket) => [bucket.key, 0]));

	records.forEach((record) => {
		const value = pickDate(record);

		if (!value) {
			return;
		}

		const date = new Date(value);
		const key = `${date.getFullYear()}-${date.getMonth() + 1}`;

		if (counts.has(key)) {
			counts.set(key, counts.get(key) + 1);
		}
	});

	return buckets.map((bucket) => counts.get(bucket.key) || 0);
}

/**
 * Normalises an employee or unit license into the alert row shape.
 * Negative `daysRemaining` means the document already expired.
 */
export function buildLicenseAlert(item, kind, today = new Date()) {
	const isEmployee = kind === 'KARYAWAN';
	const daysRemaining = diffInDays(today, item.expiryDate);

	return {
		id: `${kind}-${item.id}`,
		kind,
		subjectName: isEmployee ? item.employee?.fullName || '-' : item.masterUnit?.unitName || '-',
		subjectNo: isEmployee ? item.employee?.employeeNo || '-' : item.assetNo || '-',
		documentName: isEmployee ? item.masterDokKaryawan?.documentName || '-' : 'Sertifikat unit',
		documentNumber: item.documentNumber,
		validUntil: toIsoDate(item.expiryDate),
		daysRemaining,
		status: daysRemaining < 0 ? 'Expired' : 'Akan Expired',
	};
}

/** Expired rows first (most recently expired first), then nearest expiry. */
export function sortLicenseAlerts(alerts) {
	return [...alerts].sort((left, right) => {
		if (left.status !== right.status) {
			return left.status === 'Expired' ? -1 : 1;
		}

		return left.status === 'Expired'
			? right.daysRemaining - left.daysRemaining
			: left.daysRemaining - right.daysRemaining;
	});
}

export function mapLeaveRow(item) {
	return {
		id: item.id,
		requestNumber: item.requestNumber,
		employeeName: item.employee?.fullName || '-',
		employeeNo: item.employee?.employeeNo || '-',
		leaveType: item.masterCutiKaryawan?.leaveType || '-',
		leaveDays: item.leaveDays,
		status: item.status,
		createdAt: toIsoDate(item.createdAt),
	};
}

function sumOf(records, pickValue) {
	return records.reduce((sum, record) => sum + Number(pickValue(record) || 0), 0);
}

/**
 * B3 waste balance across all recorded waste: how much came in, how much left,
 * what is still stored, and how many entries breach the storage deadline.
 */
export function summarizeB3Waste({ records = [], outRecords = [], today = new Date() } = {}) {
	const totalMasuk = sumOf(records, (record) => record.jumlahMasuk);
	const totalKeluar = sumOf(outRecords, (record) => record.jumlahKeluar);

	let overdueCount = 0;
	let warningCount = 0;
	let nearestDeadline = null;

	records.forEach((record) => {
		const keluar = sumOf(record.outRecords || [], (out) => out.jumlahKeluar);
		const sisaLimbah = Number(record.jumlahMasuk || 0) - keluar;

		if (sisaLimbah <= 0) {
			return;
		}

		const sisaHari = Math.ceil((new Date(record.tanggalBatas).getTime() - today.getTime()) / DAY_MS);

		if (sisaHari < 0) {
			overdueCount += 1;
		} else if (sisaHari <= 14) {
			warningCount += 1;
		}

		if (!nearestDeadline || sisaHari < nearestDeadline.sisaHari) {
			nearestDeadline = {
				sisaHari,
				tanggalBatas: toIsoDate(record.tanggalBatas),
				jenisLimbah: record.jenisLimbah?.nama || record.jenisLimbah?.name || null,
				sisaKg: Number(sisaLimbah.toFixed(2)),
			};
		}
	});

	return {
		totalMasuk,
		totalKeluar,
		sisaDiTps: totalMasuk - totalKeluar,
		overdueCount,
		warningCount,
		nearestDeadline,
	};
}

/** Monthly in/out waste volumes aligned to the given buckets. */
export function buildB3Trend(records, outRecords, buckets) {
	const inByMonth = new Map();
	const outByMonth = new Map();

	records.forEach((record) => {
		const date = new Date(record.tanggalMasuk);
		const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
		inByMonth.set(key, (inByMonth.get(key) || 0) + Number(record.jumlahMasuk || 0));
	});

	outRecords.forEach((record) => {
		const date = new Date(record.tanggalKeluar);
		const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
		outByMonth.set(key, (outByMonth.get(key) || 0) + Number(record.jumlahKeluar || 0));
	});

	return buckets.map((bucket) => ({
		bulan: bucket.label,
		masuk: inByMonth.get(bucket.key) || 0,
		keluar: outByMonth.get(bucket.key) || 0,
	}));
}

/** Groups records into `{ name, count }` rows, largest first. */
export function groupAndSort(records, pickName) {
	const counts = new Map();

	records.forEach((record) => {
		const name = pickName(record) || 'Lainnya';
		counts.set(name, (counts.get(name) || 0) + 1);
	});

	return [...counts.entries()]
		.map(([name, count]) => ({ name, count }))
		.sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
}
