self.addEventListener('push', (event) => {
	if (!event.data) {
		return;
	}

	let payload = {};

	try {
		payload = event.data.json();
	} catch {
		payload = {
			title: 'Sankyu Hub Karyawan',
			body: event.data.text(),
		};
	}

	const title = payload.title || 'Sankyu Hub Karyawan';
	const options = {
		body: payload.body || '',
		icon: payload.icon || '/pwa/icon-192.png',
		badge: payload.badge || '/pwa/icon-192.png',
		tag: payload.tag || undefined,
		renotify: Boolean(payload.tag),
		data: {
			url: payload.url || '/',
			...(payload.data || {}),
		},
	};

	event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const targetUrl = event.notification?.data?.url || '/';

	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
			const existing = clients.find((client) => client.url === targetUrl || client.url.startsWith(targetUrl));

			if (existing) {
				return existing.focus();
			}

			if (self.clients.openWindow) {
				return self.clients.openWindow(targetUrl);
			}

			return null;
		}),
	);
});
