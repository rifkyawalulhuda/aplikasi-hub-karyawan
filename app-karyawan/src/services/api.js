const DEFAULT_API_BASE_URL = '/api';

export function getApiBaseUrl() {
	return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
}

async function apiRequest(path, options = {}) {
	const isFormData = options.body instanceof FormData;
	const response = await fetch(`${getApiBaseUrl()}${path}`, {
		...options,
		headers: isFormData
			? options.headers || {}
			: {
					'Content-Type': 'application/json',
					...(options.headers || {}),
			  },
	});

	if (response.status === 204) {
		return null;
	}

	const contentType = response.headers.get('content-type') || '';
	const responseText = contentType.includes('application/json') ? '' : await response.text();
	const data = contentType.includes('application/json') ? await response.json() : null;

	if (!response.ok) {
		const fallbackMessage = responseText
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.replace(/^Error:\s*/i, '')
			.trim();
		const error = new Error(data?.message || fallbackMessage || 'Request failed.');
		error.status = response.status;
		throw error;
	}

	return data;
}

export default apiRequest;
