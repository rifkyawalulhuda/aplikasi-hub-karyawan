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

export function saveEmployeeSkillAssessments(employeeId, assessments = [], periodId = null) {
	return apiRequest(`${BASE_PATH}/employees/${employeeId}/assessments`, {
		method: 'PUT',
		body: JSON.stringify({ assessments, periodId }),
	});
}

export function deleteEmployeeSkillAssessment(employeeId, category, skillName, periodId) {
	return apiRequest(
		`${BASE_PATH}/employees/${employeeId}/assessments/${encodeURIComponent(category)}/${encodeURIComponent(
			skillName,
		)}${buildQuery({ periodId })}`,
		{ method: 'DELETE' },
	);
}

export function fetchAssessmentSheet(params = {}) {
	return apiRequest(`${BASE_PATH}/assessment-sheet${buildQuery(params)}`);
}

export function fetchSkillMatrix(params = {}) {
	return apiRequest(`${BASE_PATH}/matrix${buildQuery(params)}`);
}

export function fetchSkillTrainingRecommendations(params = {}) {
	return apiRequest(`${BASE_PATH}/skill-training-recommendations${buildQuery(params)}`);
}

export function fetchDepartments() {
	return apiRequest('/master/departments');
}

export function fetchAssessmentPeriods() {
	return apiRequest('/master/skill-assessment-periods');
}

export function fetchActiveAssessmentPeriod() {
	return apiRequest('/master/skill-assessment-periods/active');
}

export function createAssessmentPeriod(payload) {
	return apiRequest('/master/skill-assessment-periods', {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export function updateAssessmentPeriod(id, payload) {
	return apiRequest(`/master/skill-assessment-periods/${id}`, {
		method: 'PUT',
		body: JSON.stringify(payload),
	});
}

export function deleteAssessmentPeriod(id) {
	return apiRequest(`/master/skill-assessment-periods/${id}`, { method: 'DELETE' });
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
