import { readStoredSession } from '@/contexts/employeeAuthContext';

import apiRequest from './api';

async function employeeAuthRequest(path, options = {}) {
	return apiRequest(`/employee-auth${path}`, options);
}

async function employeeMeRequest(path, options = {}) {
	const session = readStoredSession();
	const accessToken = session?.accessToken;

	if (!accessToken) {
		const error = new Error('Sesi login tidak ditemukan. Silakan login kembali.');
		error.status = 401;
		throw error;
	}

	return apiRequest(`/employee-me${path}`, {
		...options,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			...(options.headers || {}),
		},
	});
}

export { employeeAuthRequest, employeeMeRequest };
