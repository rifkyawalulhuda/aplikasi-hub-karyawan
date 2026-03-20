import apiRequest from '@/services/api';

/**
 * Normalizes a date string or Date object to a DD/MM/YYYY string format in local time.
 * @param {string|Date} date
 * @returns {string} DD/MM/YYYY
 */
export function toLocalDateString(date) {
	const d = new Date(date);
	if (Number.isNaN(d.getTime())) return null;

	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${day}/${month}/${year}`;
}

// Memory cache for holidays per year
const holidaysCache = {};

/**
 * Fetches national holidays from the local Master Data API.
 * Returns an array of strings in DD/MM/YYYY format.
 * @param {number|string} year
 * @returns {Promise<string[]>}
 */
export async function fetchNationalHolidays(year) {
	if (holidaysCache[year]) {
		return holidaysCache[year];
	}

	try {
		const data = await apiRequest('/master/master-holidays');
		// Filter by year if needed, although usually we want all or just current
		const formattedHolidays = data
			.filter((item) => String(item.year) === String(year))
			.map((item) => toLocalDateString(item.holidayDate));

		holidaysCache[year] = formattedHolidays;
		return formattedHolidays;
	} catch (error) {
		console.error('Error fetching national holidays:', error);
		// Return empty array if request fails, so it doesn't break the app
		return [];
	}
}

/**
 * Calculates the number of working days between two dates, inclusive.
 * Skips weekends (Saturday, Sunday) and predefined national holidays.
 *
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @param {string[]} nationalHolidays Array of dates in DD/MM/YYYY format
 * @returns {number} Number of working days, or 0 if dates are invalid or start > end.
 */
export default function calculateWorkingDays(startDate, endDate, nationalHolidays = []) {
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
		const isHoliday = nationalHolidays.includes(dateString);

		if (!isWeekend && !isHoliday) {
			workingDays += 1;
		}

		// Move to the next day
		current.setDate(current.getDate() + 1);
	}

	return workingDays;
}
