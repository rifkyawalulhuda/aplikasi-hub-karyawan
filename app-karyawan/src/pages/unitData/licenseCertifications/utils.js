export const UNIT_LICENSE_STATUS = {
	ACTIVE: 'Aktif',
	EXPIRING_SOON: 'Akan Expired',
	EXPIRED: 'Expired',
};

export const EXPIRING_SOON_DAYS = 25;

export function formatUnitLicenseDate(value) {
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

export function parseUnitLicenseDate(value) {
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
	const parsed = parseUnitLicenseDate(value);

	if (!parsed) {
		return null;
	}

	return Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}

export function getUnitLicenseStatus(value) {
	const comparableExpiryDate = toComparableUtcDate(value);

	if (!comparableExpiryDate) {
		return UNIT_LICENSE_STATUS.EXPIRED;
	}

	const today = new Date();
	const comparableToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
	const differenceInDays = Math.floor((comparableExpiryDate - comparableToday) / (24 * 60 * 60 * 1000));

	if (differenceInDays < 0) {
		return UNIT_LICENSE_STATUS.EXPIRED;
	}

	if (differenceInDays <= EXPIRING_SOON_DAYS) {
		return UNIT_LICENSE_STATUS.EXPIRING_SOON;
	}

	return UNIT_LICENSE_STATUS.ACTIVE;
}

export function getUnitLicenseStatusChipColor(status) {
	if (status === UNIT_LICENSE_STATUS.ACTIVE) {
		return 'success';
	}

	if (status === UNIT_LICENSE_STATUS.EXPIRING_SOON) {
		return 'warning';
	}

	return 'error';
}
