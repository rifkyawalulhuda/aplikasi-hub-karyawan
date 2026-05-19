import apiRequest from './api';

export async function fetchAdminNotifications(options = {}) {
	const searchParams = new URLSearchParams();

	if (options.limit) {
		searchParams.set('limit', String(options.limit));
	}

	return apiRequest(`/notifications?${searchParams.toString()}`);
}

export async function fetchAdminNotificationHistory(params = {}) {
	const searchParams = new URLSearchParams({
		page: String(params.page || 1),
		pageSize: String(params.pageSize || 20),
		readStatus: params.readStatus || 'all',
		activeStatus: params.activeStatus || 'all',
		category: params.category || 'ALL',
	});

	if (params.keyword?.trim()) {
		searchParams.set('keyword', params.keyword.trim());
	}

	return apiRequest(`/notifications/history?${searchParams.toString()}`);
}

export async function markAdminNotificationAsRead(notificationId) {
	return apiRequest('/notifications/read', {
		method: 'POST',
		body: JSON.stringify({
			notificationId,
		}),
	});
}

export async function markAllAdminNotificationsAsRead(notificationIds = []) {
	return apiRequest('/notifications/read-all', {
		method: 'POST',
		body: JSON.stringify({
			notificationIds,
		}),
	});
}

export function getAdminNotificationHeadersForUser() {
	return {};
}
