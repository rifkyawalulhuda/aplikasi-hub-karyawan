import apiRequest from './api';

const BASE_PATH = '/master/site-approval-configs';

export async function fetchConfigsBySite(siteId) {
	return apiRequest(`${BASE_PATH}?siteId=${siteId}`);
}

export async function saveConfigsBulk(siteId, entries) {
	return apiRequest(`${BASE_PATH}/bulk`, {
		method: 'PUT',
		body: JSON.stringify({ siteId, entries }),
	});
}
