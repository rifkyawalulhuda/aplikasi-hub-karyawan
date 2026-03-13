const DEFAULT_API_BASE_URL = '/api';

export function getApiBaseUrl() {
	return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
}

async function apiRequest(path, options = {}) {
	const isFormData = options.body instanceof FormData;
	const response = await fetch(`${getApiBaseUrl()}${path}`, {
		headers: isFormData
			? options.headers || {}
			: {
					'Content-Type': 'application/json',
					...(options.headers || {}),
			  },
		...options,
	});

	if (response.status === 204) {
		return null;
	}

	const contentType = response.headers.get('content-type') || '';
	const data = contentType.includes('application/json') ? await response.json() : null;

	if (!response.ok) {
		const error = new Error(data?.message || 'Request failed.');
		error.status = response.status;
		throw error;
	}

	return data;
}

export default apiRequest;
