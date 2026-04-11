import apiRequest from './api';

function getAdminNotificationHeaders(user) {
	if (!user?.employeeId) {
		return {};
	}

	return {
		'X-Admin-Employee-Id': String(user.employeeId),
	};
}

export async function fetchAdminNotifications(user, options = {}) {
	const searchParams = new URLSearchParams({
		employeeId: String(user?.employeeId || ''),
	});

	if (options.limit) {
		searchParams.set('limit', String(options.limit));
	}

	return apiRequest(`/notifications?${searchParams.toString()}`, {
		headers: getAdminNotificationHeaders(user),
	});
}

export async function fetchAdminNotificationHistory(user, params = {}) {
	const searchParams = new URLSearchParams({
		employeeId: String(user?.employeeId || ''),
		page: String(params.page || 1),
		pageSize: String(params.pageSize || 20),
		readStatus: params.readStatus || 'all',
		activeStatus: params.activeStatus || 'all',
		category: params.category || 'ALL',
	});

	if (params.keyword?.trim()) {
		searchParams.set('keyword', params.keyword.trim());
	}

	return apiRequest(`/notifications/history?${searchParams.toString()}`, {
		headers: getAdminNotificationHeaders(user),
	});
}

export async function markAdminNotificationAsRead(user, notificationId) {
	return apiRequest('/notifications/read', {
		method: 'POST',
		body: JSON.stringify({
			employeeId: user?.employeeId,
			notificationId,
		}),
		headers: getAdminNotificationHeaders(user),
	});
}

export async function markAllAdminNotificationsAsRead(user, notificationIds = []) {
	return apiRequest('/notifications/read-all', {
		method: 'POST',
		body: JSON.stringify({
			employeeId: user?.employeeId,
			notificationIds,
		}),
		headers: getAdminNotificationHeaders(user),
	});
}

export function getAdminNotificationHeadersForUser(user) {
	return getAdminNotificationHeaders(user);
}
