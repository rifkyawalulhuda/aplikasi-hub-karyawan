export const DEFAULT_PERIOD = '6m';

export const PERIOD_OPTIONS = [
	{ value: '3m', label: '3 bulan' },
	{ value: '6m', label: '6 bulan' },
	{ value: '12m', label: '12 bulan' },
	{ value: 'ytd', label: 'Tahun ini' },
];

export const LEAVE_STATUS_MAP = {
	SUBMITTED: { label: 'Diajukan', color: 'info' },
	IN_APPROVAL: { label: 'Dalam Approval', color: 'warning' },
	APPROVED: { label: 'Disetujui', color: 'success' },
	REJECTED: { label: 'Ditolak', color: 'error' },
	CANCELLED: { label: 'Dibatalkan', color: 'default' },
};

/** Destinations reached by drilling down from the dashboard. */
export const DRILL_DOWN = {
	employees: '/data-karyawan/detail-karyawan',
	leaves: '/data-karyawan/cuti-karyawan',
	licenses: '/data-karyawan/lisensi-sertifikasi',
	unitLicenses: '/data-unit/lisensi-sertifikasi-unit',
	b3: '/limbah-b3/pencatatan',
	sites: '/data-master/master-data-karyawan/sites',
};

export function formatNumber(value) {
	return Number(value ?? 0).toLocaleString('id-ID');
}

export function formatKg(value) {
	return `${formatNumber(value)} kg`;
}

export function formatDate(value) {
	if (!value) {
		return '-';
	}

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return '-';
	}

	return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(value) {
	if (!value) {
		return '-';
	}

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return '-';
	}

	return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function describeRemainingDays(days) {
	if (days < 0) {
		return `Lewat ${Math.abs(days)} hari`;
	}

	if (days === 0) {
		return 'Berakhir hari ini';
	}

	return `${days} hari lagi`;
}

export function percentOf(part, total) {
	if (!total) {
		return 0;
	}

	return Math.round((part / total) * 100);
}
