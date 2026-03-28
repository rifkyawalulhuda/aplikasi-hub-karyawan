const DEFAULT_API_BASE_URL = '/api';

export function getApiBaseUrl() {
	return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
}

function buildRequestError({ status, data, responseText }) {
	const fallbackMessage = responseText
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.replace(/^Error:\s*/i, '')
		.trim();
	const error = new Error(data?.message || fallbackMessage || 'Request failed.');
	error.status = status;
	return error;
}

function getDownloadFileName(contentDisposition, fallbackFileName = 'download.xlsx') {
	if (!contentDisposition) {
		return fallbackFileName;
	}

	const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

	if (utf8Match?.[1]) {
		return decodeURIComponent(utf8Match[1]);
	}

	const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);

	if (asciiMatch?.[1]) {
		return asciiMatch[1];
	}

	return fallbackFileName;
}

export async function downloadFile(url, fallbackFileName = 'download.xlsx') {
	const response = await fetch(url);
	const contentType = response.headers.get('content-type') || '';

	if (!response.ok) {
		const data = contentType.includes('application/json') ? await response.json() : null;
		const responseText = contentType.includes('application/json') ? '' : await response.text();
		throw buildRequestError({
			status: response.status,
			data,
			responseText,
		});
	}

	const blob = await response.blob();
	const objectUrl = window.URL.createObjectURL(blob);
	const link = document.createElement('a');

	link.href = objectUrl;
	link.download = getDownloadFileName(response.headers.get('content-disposition'), fallbackFileName);
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	window.URL.revokeObjectURL(objectUrl);
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
		throw buildRequestError({
			status: response.status,
			data,
			responseText,
		});
	}

	return data;
}

export default apiRequest;
