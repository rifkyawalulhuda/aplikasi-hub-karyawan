import apiRequest from '@/services/api';

const BASE_PATH = '/dokumen/lembar-pengiriman';

export async function getDeliverySlips(siteId) {
	const suffix = siteId ? `?siteId=${siteId}` : '';
	return apiRequest(`${BASE_PATH}${suffix}`);
}

export async function getDeliverySlip(id, siteId) {
	const suffix = siteId ? `?siteId=${siteId}` : '';
	return apiRequest(`${BASE_PATH}/${id}${suffix}`);
}

export async function createDeliverySlip(payload) {
	return apiRequest(BASE_PATH, {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export async function updateDeliverySlip(id, payload) {
	return apiRequest(`${BASE_PATH}/${id}`, {
		method: 'PUT',
		body: JSON.stringify(payload),
	});
}

export async function deleteDeliverySlip(id) {
	return apiRequest(`${BASE_PATH}/${id}`, {
		method: 'DELETE',
	});
}
