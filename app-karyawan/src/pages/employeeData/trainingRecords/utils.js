const DAY_MS = 24 * 60 * 60 * 1000;

export function formatTrainingDate(value) {
	if (!value) {
		return '-';
	}

	const date = new Date(`${value}T12:00:00Z`);

	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return date.toLocaleDateString('id-ID', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
	});
}

export function calculateTrainingDays(startDate, endDate) {
	if (!startDate || !endDate) {
		return null;
	}

	const start = new Date(`${startDate}T00:00:00Z`);
	const end = new Date(`${endDate}T00:00:00Z`);

	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
		return null;
	}

	return (
		Math.floor(
			(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()) -
				Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())) /
				DAY_MS,
		) + 1
	);
}

export function formatTrainingTypeLabel(value = '') {
	const normalized = String(value || '')
		.trim()
		.toLowerCase();

	if (normalized === 'internal') {
		return 'Internal';
	}

	if (normalized === 'external') {
		return 'External';
	}

	return value || '-';
}

export function getTrainingTypeChipColor(value = '') {
	const normalized = String(value || '')
		.trim()
		.toLowerCase();

	if (normalized === 'internal') {
		return 'primary';
	}

	if (normalized === 'external') {
		return 'success';
	}

	return 'default';
}

export function formatParticipantSummary(participantNames = []) {
	if (!participantNames.length) {
		return '-';
	}

	if (participantNames.length === 1) {
		return participantNames[0];
	}

	return `${participantNames[0]} + ${participantNames.length - 1} lainnya`;
}
