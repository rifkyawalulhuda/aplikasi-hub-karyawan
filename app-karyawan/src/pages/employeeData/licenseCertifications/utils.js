export const LICENSE_STATUS = {
	ACTIVE: 'Aktif',
	EXPIRED: 'Expired',
};

export function formatLicenseDate(value) {
	if (!value) {
		return '';
	}

	const raw = String(value).trim();
	const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

	if (isoMatch) {
		const [, year, month, day] = isoMatch;
		return `${day}/${month}/${year}`;
	}

	const parsed = new Date(raw);

	if (Number.isNaN(parsed.getTime())) {
		return raw;
	}

	return `${String(parsed.getDate()).padStart(2, '0')}/${String(parsed.getMonth() + 1).padStart(
		2,
		'0',
	)}/${parsed.getFullYear()}`;
}

export function parseLicenseDate(value) {
	if (!value) {
		return null;
	}

	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value;
	}

	const raw = String(value).trim();
	const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

	if (isoMatch) {
		const [, year, month, day] = isoMatch;
		return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
	}

	const parsed = new Date(raw);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toComparableUtcDate(value) {
	const parsed = parseLicenseDate(value);

	if (!parsed) {
		return null;
	}

	return Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}

export function getLicenseStatus(value) {
	const comparableExpiryDate = toComparableUtcDate(value);

	if (!comparableExpiryDate) {
		return LICENSE_STATUS.EXPIRED;
	}

	const today = new Date();
	const comparableToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

	return comparableExpiryDate >= comparableToday ? LICENSE_STATUS.ACTIVE : LICENSE_STATUS.EXPIRED;
}

export function getLicenseStatusChipColor(status) {
	return status === LICENSE_STATUS.ACTIVE ? 'success' : 'error';
}
