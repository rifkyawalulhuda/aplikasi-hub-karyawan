import apiRequest, { appendSiteIdParam, downloadFile, getApiBaseUrl } from '@/services/api';

// --- Jenis Limbah Non-B3 ---

export async function getNonB3WasteTypes(siteId, params = {}) {
	const { page = 0, pageSize = 999 } = params;
	const path = appendSiteIdParam('/non-b3-waste/types', siteId);
	const separator = path.includes('?') ? '&' : '?';
	return apiRequest(`${path}${separator}page=${page}&pageSize=${pageSize}`);
}

export async function createNonB3WasteType(siteId, data) {
	const path = appendSiteIdParam('/non-b3-waste/types', siteId);
	return apiRequest(path, {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export async function updateNonB3WasteType(siteId, id, data) {
	const path = appendSiteIdParam(`/non-b3-waste/types/${id}`, siteId);
	return apiRequest(path, {
		method: 'PUT',
		body: JSON.stringify(data),
	});
}

export async function deleteNonB3WasteType(siteId, id) {
	const path = appendSiteIdParam(`/non-b3-waste/types/${id}`, siteId);
	return apiRequest(path, { method: 'DELETE' });
}

// --- Pencatatan Limbah Non-B3 ---

export async function getNonB3WasteRecords(siteId, params = {}) {
	const { page = 0, pageSize = 25, sortField = 'tanggalMasuk', sortOrder = 'desc' } = params;
	const path = appendSiteIdParam('/non-b3-waste/records', siteId);
	const separator = path.includes('?') ? '&' : '?';
	return apiRequest(
		`${path}${separator}page=${page}&pageSize=${pageSize}&sortField=${sortField}&sortOrder=${sortOrder}`,
	);
}

export async function createNonB3WasteRecord(siteId, data) {
	const path = appendSiteIdParam('/non-b3-waste/records', siteId);
	return apiRequest(path, {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export async function updateNonB3WasteRecord(siteId, id, data) {
	const path = appendSiteIdParam(`/non-b3-waste/records/${id}`, siteId);
	return apiRequest(path, {
		method: 'PUT',
		body: JSON.stringify(data),
	});
}

export async function deleteNonB3WasteRecord(siteId, id) {
	const path = appendSiteIdParam(`/non-b3-waste/records/${id}`, siteId);
	return apiRequest(path, { method: 'DELETE' });
}

export async function getNonB3Neraca(siteId, tahun, bulan) {
	const path = appendSiteIdParam('/non-b3-waste/records/neraca', siteId);
	const separator = path.includes('?') ? '&' : '?';
	return apiRequest(`${path}${separator}tahun=${tahun}&bulan=${bulan}`);
}

export async function exportNonB3WasteRecords(siteId, tahun) {
	let path = appendSiteIdParam('/non-b3-waste/records/export', siteId);
	if (tahun) {
		const separator = path.includes('?') ? '&' : '?';
		path = `${path}${separator}tahun=${tahun}`;
	}
	const url = `${getApiBaseUrl()}${path}`;
	const fallbackName = tahun ? `Pencatatan_Limbah_Non_B3_${tahun}.xlsx` : 'Pencatatan_Limbah_Non_B3.xlsx';
	return downloadFile(url, fallbackName);
}

export async function getNonB3ExportYears(siteId) {
	const path = appendSiteIdParam('/non-b3-waste/records/export/years', siteId);
	return apiRequest(path);
}

export async function getNonB3PencatatanPrint(siteId, params = {}) {
	const path = appendSiteIdParam('/non-b3-waste/records/pencatatan-print', siteId);
	const query = new URLSearchParams();
	if (params.from) query.set('from', params.from);
	if (params.to) query.set('to', params.to);
	const separator = path.includes('?') ? '&' : '?';
	const qs = query.toString();
	return apiRequest(qs ? `${path}${separator}${qs}` : path);
}
