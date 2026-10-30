const MONTHS_ID = [
	'Januari',
	'Februari',
	'Maret',
	'April',
	'Mei',
	'Juni',
	'Juli',
	'Agustus',
	'September',
	'Oktober',
	'November',
	'Desember',
];

export function formatDateId(value) {
	if (!value) {
		return '';
	}

	const [year, month, day] = String(value).split('-').map(Number);

	if (!year || !month || !day) {
		return String(value);
	}

	return `${day} ${MONTHS_ID[month - 1]} ${year}`;
}

export function formatDateShort(value) {
	if (!value) {
		return '-';
	}

	const [year, month, day] = String(value).split('-').map(Number);

	if (!year || !month || !day) {
		return String(value);
	}

	return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

export function getTodayInputValue() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function toggleListValue(list, value) {
	const current = Array.isArray(list) ? list : [];

	return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}
