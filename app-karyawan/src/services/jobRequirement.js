import apiRequest from '@/services/api';

const BASE_PATH = '/data-karyawan/job-requirement';

function buildQuery(params = {}) {
	const searchParams = new URLSearchParams();

	Object.entries(params).forEach(([key, value]) => {
		if (value === undefined || value === null || value === '' || value === 'ALL') {
			return;
		}

		searchParams.set(key, String(value));
	});

	const query = searchParams.toString();
	return query ? `?${query}` : '';
}

export function fetchJobRequirementProfiles() {
	return apiRequest(`${BASE_PATH}/profiles`);
}

export function fetchJobRequirementProfile(grade) {
	return apiRequest(`${BASE_PATH}/profiles/${encodeURIComponent(grade)}`);
}

export function fetchEmployeeJobRequirement(employeeId) {
	return apiRequest(`${BASE_PATH}/employees/${employeeId}`);
}

export function fetchJobRequirementEmployees(params = {}) {
	return apiRequest(`${BASE_PATH}/employees${buildQuery(params)}`);
}

export function fetchJobRequirementTrainingNeeds(params = {}) {
	return apiRequest(`${BASE_PATH}/training-needs${buildQuery(params)}`);
}

export function saveEmployeeSkillAssessments(employeeId, assessments = []) {
	return apiRequest(`${BASE_PATH}/employees/${employeeId}/assessments`, {
		method: 'PUT',
		body: JSON.stringify({ assessments }),
	});
}

export function getJobRequirementStatusColor(status) {
	if (status === 'MEMENUHI') {
		return 'success';
	}

	if (status === 'BELUM_MEMENUHI') {
		return 'error';
	}

	if (status === 'BELUM_DINILAI') {
		return 'warning';
	}

	return 'default';
}
