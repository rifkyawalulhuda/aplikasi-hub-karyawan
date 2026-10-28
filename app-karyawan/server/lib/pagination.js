const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 200;

function parsePage(value) {
	const parsed = Number.parseInt(value, 10);

	if (!Number.isInteger(parsed) || parsed < 0) {
		return 0;
	}

	return parsed;
}

function parsePageSize(value, { defaultSize = DEFAULT_PAGE_SIZE, maxSize = MAX_PAGE_SIZE } = {}) {
	const parsed = Number.parseInt(value, 10);

	if (!Number.isInteger(parsed) || parsed < 1) {
		return defaultSize;
	}

	return Math.min(parsed, maxSize);
}

export { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, parsePage, parsePageSize };
