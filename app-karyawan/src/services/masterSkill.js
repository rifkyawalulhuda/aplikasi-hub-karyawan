import apiRequest from '@/services/api';

const BASE_PATH = '/master/master-skills';

export function fetchMasterSkills() {
	return apiRequest(BASE_PATH);
}

export function createMasterSkill(payload) {
	return apiRequest(BASE_PATH, {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export function updateMasterSkill(id, payload) {
	return apiRequest(`${BASE_PATH}/${id}`, {
		method: 'PUT',
		body: JSON.stringify(payload),
	});
}

export function deleteMasterSkill(id) {
	return apiRequest(`${BASE_PATH}/${id}`, {
		method: 'DELETE',
	});
}

export function deleteSkillAssessments(id) {
	return apiRequest(`${BASE_PATH}/${id}/assessments`, {
		method: 'DELETE',
	});
}

export function fetchSkillMapping(grade) {
	return apiRequest(`${BASE_PATH}/mapping/${encodeURIComponent(grade)}`);
}

export function saveSkillMapping(grade, payload) {
	return apiRequest(`${BASE_PATH}/mapping/${encodeURIComponent(grade)}`, {
		method: 'PUT',
		body: JSON.stringify(payload),
	});
}

export function saveSkillTargets(grade, items) {
	return apiRequest(`${BASE_PATH}/mapping/${encodeURIComponent(grade)}/targets`, {
		method: 'PUT',
		body: JSON.stringify({ items }),
	});
}

export function copySkillMappingFromAbove(grade) {
	return apiRequest(`${BASE_PATH}/mapping/${encodeURIComponent(grade)}/copy-from-above`, {
		method: 'POST',
	});
}

export function fetchSkillTrainingMap() {
	return apiRequest(`${BASE_PATH}/training-map`);
}

export function saveSkillTrainingMap(masterSkillId, masterTrainingIds) {
	return apiRequest(`${BASE_PATH}/training-map/${masterSkillId}`, {
		method: 'PUT',
		body: JSON.stringify({ masterTrainingIds }),
	});
}
