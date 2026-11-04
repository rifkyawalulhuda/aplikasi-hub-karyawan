import apiRequest from '@/services/api';

const BASE_PATH = '/master/master-trainings';

export function fetchMasterTrainings() {
	return apiRequest(BASE_PATH);
}

export function createMasterTraining(payload) {
	return apiRequest(BASE_PATH, {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export function updateMasterTraining(id, payload) {
	return apiRequest(`${BASE_PATH}/${id}`, {
		method: 'PUT',
		body: JSON.stringify(payload),
	});
}

export function deleteMasterTraining(id) {
	return apiRequest(`${BASE_PATH}/${id}`, {
		method: 'DELETE',
	});
}

export function fetchMasterTrainingUsage(id) {
	return apiRequest(`${BASE_PATH}/${id}/usage`);
}

export function fetchRequirementTrainingMap(grade) {
	return apiRequest(`${BASE_PATH}/requirement-map/${encodeURIComponent(grade)}`);
}

export function saveRequirementTrainingMap(grade, masterTrainingIds) {
	return apiRequest(`${BASE_PATH}/requirement-map/${encodeURIComponent(grade)}`, {
		method: 'PUT',
		body: JSON.stringify({ masterTrainingIds }),
	});
}
