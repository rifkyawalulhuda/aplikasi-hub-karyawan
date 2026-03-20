/**
 * Date utility functions for the Hub Karyawan application.
 */

// Example list of Indonesian national holidays for 2026 (Format: DD/MM/YYYY).
// This can be expanded or fetched from an API in a real-world scenario.
const NATIONAL_HOLIDAYS_2026 = [
	'01/01/2026', // Tahun Baru Masehi
	'17/02/2026', // Isra Mikraj Nabi Muhammad SAW
	'03/03/2026', // Hari Suci Nyepi
	'20/03/2026', // Hari Raya Idul Fitri (Estimasi)
	'21/03/2026', // Hari Raya Idul Fitri (Estimasi)
	'03/04/2026', // Wafat Isa Almasih
	'01/05/2026', // Hari Buruh Internasional
	'14/05/2026', // Kenaikan Isa Almasih
	'27/05/2026', // Hari Raya Idul Adha (Estimasi)
	'01/06/2026', // Hari Lahir Pancasila
	'16/07/2026', // Tahun Baru Islam (Estimasi)
	'17/08/2026', // Hari Kemerdekaan RI
	'25/09/2026', // Maulid Nabi Muhammad SAW (Estimasi)
	'25/12/2026', // Hari Raya Natal
];

/**
 * Normalizes a date string or Date object to a DD/MM/YYYY string format in local time.
 * @param {string|Date} date
 * @returns {string} DD/MM/YYYY
 */
function toLocalDateString(date) {
	const d = new Date(date);
	if (Number.isNaN(d.getTime())) return null;

	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${day}/${month}/${year}`;
}

/**
 * Calculates the number of working days between two dates, inclusive.
 * Skips weekends (Saturday, Sunday) and predefined national holidays.
 *
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {number} Number of working days, or 0 if dates are invalid or start > end.
 */
export default function calculateWorkingDays(startDate, endDate) {
	if (!startDate || !endDate) return 0;

	const start = new Date(startDate);
	const end = new Date(endDate);

	// Strip time component to avoid timezone edge cases
	start.setHours(0, 0, 0, 0);
	end.setHours(0, 0, 0, 0);

	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
	if (start > end) return 0;

	let workingDays = 0;
	const current = new Date(start);

	while (current <= end) {
		const dayOfWeek = current.getDay();
		const dateString = toLocalDateString(current);

		// dayOfWeek: 0 = Sunday, 6 = Saturday
		const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
		const isHoliday = NATIONAL_HOLIDAYS_2026.includes(dateString);

		if (!isWeekend && !isHoliday) {
			workingDays += 1;
		}

		// Move to the next day
		current.setDate(current.getDate() + 1);
	}

	return workingDays;
}
