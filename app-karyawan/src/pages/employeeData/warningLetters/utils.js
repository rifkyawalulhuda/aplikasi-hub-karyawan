export const WARNING_LEVEL_OPTIONS = [1, 2, 3];
export const SUPERIOR_JOB_LEVEL = 'Department Manager';

export function formatWarningDate(value) {
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

export function getSuperiorOptions(employeeOptions = []) {
	return employeeOptions.filter(
		(item) =>
			String(item.jobLevelName || '')
				.trim()
				.toLowerCase() === SUPERIOR_JOB_LEVEL.toLowerCase(),
	);
}
