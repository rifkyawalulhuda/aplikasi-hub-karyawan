import { formatTrainingDate } from '../trainingRecords/utils';

export function formatEmployeeTrainingPeriod(startDate, endDate) {
	const startLabel = formatTrainingDate(startDate);
	const endLabel = formatTrainingDate(endDate);

	if (startLabel === '-' && endLabel === '-') {
		return '-';
	}

	return `${startLabel} - ${endLabel}`;
}

export function formatEmployeeTrainingParticipantCount(participantCount = 0) {
	const count = Number(participantCount) || 0;

	if (count <= 0) {
		return '-';
	}

	return `${count} peserta`;
}
