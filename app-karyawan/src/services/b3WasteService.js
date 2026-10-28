import apiRequest, { appendSiteIdParam, downloadFile, getApiBaseUrl } from '@/services/api';

// --- Waste Records ---

export async function getWasteRecords(siteId, params = {}) {
	const { page = 0, pageSize = 25, sortField = 'tanggalMasuk', sortOrder = 'desc' } = params;
	const path = appendSiteIdParam('/b3-waste/records', siteId);
	const separator = path.includes('?') ? '&' : '?';
	return apiRequest(
		`${path}${separator}page=${page}&pageSize=${pageSize}&sortField=${sortField}&sortOrder=${sortOrder}`,
	);
}

export async function createWasteRecord(siteId, data) {
	const path = appendSiteIdParam('/b3-waste/records', siteId);
	return apiRequest(path, {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export async function updateWasteRecord(siteId, id, data) {
	const path = appendSiteIdParam(`/b3-waste/records/${id}`, siteId);
	return apiRequest(path, {
		method: 'PUT',
		body: JSON.stringify(data),
	});
}

export async function deleteWasteRecord(siteId, id) {
	const path = appendSiteIdParam(`/b3-waste/records/${id}`, siteId);
	return apiRequest(path, { method: 'DELETE' });
}

// --- Waste Out Records ---

export async function createWasteOutRecord(siteId, recordId, data) {
	const path = appendSiteIdParam(`/b3-waste/records/${recordId}/out`, siteId);
	return apiRequest(path, {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export async function getWasteOutRecords(siteId, recordId) {
	const path = appendSiteIdParam(`/b3-waste/records/${recordId}/out`, siteId);
	return apiRequest(path);
}

export async function updateWasteOutRecord(siteId, id, data) {
	const path = appendSiteIdParam(`/b3-waste/records/out-records/${id}`, siteId);
	return apiRequest(path, {
		method: 'PUT',
		body: JSON.stringify(data),
	});
}

export async function deleteWasteOutRecord(siteId, id) {
	const path = appendSiteIdParam(`/b3-waste/records/out-records/${id}`, siteId);
	return apiRequest(path, { method: 'DELETE' });
}

// --- Export ---

export async function exportWasteRecords(siteId) {
	const path = appendSiteIdParam('/b3-waste/records/export', siteId);
	const url = `${getApiBaseUrl()}${path}`;
	return downloadFile(url, 'Pencatatan_Limbah_B3.xlsx');
}

// --- Waste Types (Master Data) ---

export async function getWasteTypes(siteId, params = {}) {
	const { page = 0, pageSize = 25 } = params;
	const path = appendSiteIdParam('/b3-waste/types', siteId);
	const separator = path.includes('?') ? '&' : '?';
	return apiRequest(`${path}${separator}page=${page}&pageSize=${pageSize}`);
}

export async function createWasteType(siteId, data) {
	const path = appendSiteIdParam('/b3-waste/types', siteId);
	return apiRequest(path, {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export async function updateWasteType(siteId, id, data) {
	const path = appendSiteIdParam(`/b3-waste/types/${id}`, siteId);
	return apiRequest(path, {
		method: 'PUT',
		body: JSON.stringify(data),
	});
}

export async function deleteWasteType(siteId, id) {
	const path = appendSiteIdParam(`/b3-waste/types/${id}`, siteId);
	return apiRequest(path, { method: 'DELETE' });
}

// --- Neraca Limbah B3 ---

export async function getNeracaLimbah(siteId, tahun, triwulan) {
	const path = appendSiteIdParam('/b3-waste/records/neraca', siteId);
	const sep = path.includes('?') ? '&' : '?';
	return apiRequest(`${path}${sep}tahun=${tahun}&triwulan=${triwulan}`);
}

export async function exportNeracaLimbah(siteId, tahun, triwulan) {
	const path = appendSiteIdParam('/b3-waste/records/neraca/export', siteId);
	const sep = path.includes('?') ? '&' : '?';
	const url = `${getApiBaseUrl()}${path}${sep}tahun=${tahun}&triwulan=${triwulan}`;
	return downloadFile(url, `Neraca_Limbah_B3_Q${triwulan}_${tahun}.xlsx`);
}

// --- Neraca Limbah B3 (format dokumen KLHK) ---

export async function getNeracaKlhk(siteId, tahun, triwulan) {
	const path = appendSiteIdParam('/b3-waste/records/neraca-klhk', siteId);
	const sep = path.includes('?') ? '&' : '?';
	return apiRequest(`${path}${sep}tahun=${tahun}&triwulan=${triwulan}`);
}

export async function saveNeracaPeriod(siteId, payload) {
	const path = appendSiteIdParam('/b3-waste/records/neraca-klhk/period', siteId);
	return apiRequest(path, {
		method: 'PUT',
		body: JSON.stringify(payload),
	});
}

// --- Profil Perusahaan per Site ---

export async function getSiteProfile(siteId) {
	const path = appendSiteIdParam('/master/site-profile', siteId);
	return apiRequest(path);
}

export async function saveSiteProfile(siteId, payload) {
	const path = appendSiteIdParam('/master/site-profile', siteId);
	return apiRequest(path, {
		method: 'PUT',
		body: JSON.stringify(payload),
	});
}
