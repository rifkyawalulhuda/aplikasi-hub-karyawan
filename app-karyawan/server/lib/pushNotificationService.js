import webpush from 'web-push';

import { getAppBaseUrl } from './emailService.js';

let vapidInitialized = false;

function getPushConfig() {
	const publicKey = (process.env.PUSH_VAPID_PUBLIC_KEY || '').trim();
	const privateKey = (process.env.PUSH_VAPID_PRIVATE_KEY || '').trim();
	const subject = (process.env.PUSH_VAPID_SUBJECT || 'mailto:admin@example.com').trim();

	return {
		publicKey,
		privateKey,
		subject,
		enabled: Boolean(publicKey && privateKey),
	};
}

function ensureVapidConfigured() {
	const config = getPushConfig();

	if (!config.enabled || vapidInitialized) {
		return config.enabled;
	}

	webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
	vapidInitialized = true;
	return true;
}

function isPushConfigured() {
	return getPushConfig().enabled;
}

function toAbsoluteNotificationUrl(url) {
	if (!url) return getAppBaseUrl();
	if (url.startsWith('http://') || url.startsWith('https://')) return url;
	return `${getAppBaseUrl()}${url.startsWith('/') ? url : `/${url}`}`;
}

function normalizeSubscriptionPayload(subscription = {}) {
	const endpoint = String(subscription.endpoint || '').trim();
	const keys = subscription?.keys || {};
	const p256dh = String(keys.p256dh || '').trim();
	const auth = String(keys.auth || '').trim();

	if (!endpoint || !p256dh || !auth) {
		throw Object.assign(new Error('Payload push subscription tidak valid.'), {
			statusCode: 400,
		});
	}

	let expirationTime = null;
	if (subscription.expirationTime) {
		const parsed = new Date(subscription.expirationTime);
		if (!Number.isNaN(parsed.getTime())) {
			expirationTime = parsed;
		}
	}

	return {
		endpoint,
		p256dh,
		auth,
		expirationTime,
	};
}

async function saveEmployeePushSubscription(prisma, { employeeId, subscription, userAgent = '' }) {
	const normalized = normalizeSubscriptionPayload(subscription);

	await prisma.employeePushSubscription.upsert({
		where: {
			employeeId_endpoint: {
				employeeId,
				endpoint: normalized.endpoint,
			},
		},
		create: {
			employeeId,
			endpoint: normalized.endpoint,
			p256dh: normalized.p256dh,
			auth: normalized.auth,
			expirationTime: normalized.expirationTime,
			userAgent: userAgent || null,
			isActive: true,
			lastUsedAt: new Date(),
		},
		update: {
			p256dh: normalized.p256dh,
			auth: normalized.auth,
			expirationTime: normalized.expirationTime,
			userAgent: userAgent || null,
			isActive: true,
			lastUsedAt: new Date(),
		},
	});
}

async function removeEmployeePushSubscription(prisma, { employeeId, endpoint }) {
	const normalizedEndpoint = String(endpoint || '').trim();

	if (!normalizedEndpoint) {
		return;
	}

	await prisma.employeePushSubscription.updateMany({
		where: {
			employeeId,
			endpoint: normalizedEndpoint,
		},
		data: {
			isActive: false,
			lastUsedAt: new Date(),
		},
	});
}

function buildPushPayload({ title, body, url, tag, data }) {
	return JSON.stringify({
		title: title || 'Sankyu Hub Karyawan',
		body: body || '',
		url: toAbsoluteNotificationUrl(url),
		tag: tag || null,
		data: data || null,
		icon: '/pwa/icon-192.png',
		badge: '/pwa/icon-192.png',
	});
}

async function sendEmployeePushNotification(prisma, { employeeIds = [], title, body, url, tag, data }) {
	if (!ensureVapidConfigured()) {
		return {
			ok: false,
			skipped: true,
			reason: 'VAPID belum dikonfigurasi.',
		};
	}

	const uniqueEmployeeIds = [...new Set(employeeIds.map((value) => Number(value)).filter((value) => Number.isInteger(value)))];

	if (!uniqueEmployeeIds.length) {
		return {
			ok: true,
			sent: 0,
			failed: 0,
		};
	}

	const subscriptions = await prisma.employeePushSubscription.findMany({
		where: {
			employeeId: { in: uniqueEmployeeIds },
			isActive: true,
		},
	});

	if (!subscriptions.length) {
		return {
			ok: true,
			sent: 0,
			failed: 0,
		};
	}

	const payload = buildPushPayload({ title, body, url, tag, data });
	let sent = 0;
	let failed = 0;

	await Promise.allSettled(
		subscriptions.map(async (subscription) => {
			try {
				await webpush.sendNotification(
					{
						endpoint: subscription.endpoint,
						expirationTime: subscription.expirationTime?.getTime() || null,
						keys: {
							p256dh: subscription.p256dh,
							auth: subscription.auth,
						},
					},
					payload,
				);

				sent += 1;
				await prisma.employeePushSubscription.update({
					where: { id: subscription.id },
					data: { lastUsedAt: new Date(), isActive: true },
				});
			} catch (error) {
				failed += 1;
				const statusCode = Number(error?.statusCode || 0);
				const shouldDeactivate = statusCode === 404 || statusCode === 410;

				if (shouldDeactivate) {
					await prisma.employeePushSubscription.update({
						where: { id: subscription.id },
						data: { isActive: false, lastUsedAt: new Date() },
					});
				}
			}
		}),
	);

	return {
		ok: failed === 0,
		sent,
		failed,
	};
}

export {
	getPushConfig,
	isPushConfigured,
	saveEmployeePushSubscription,
	removeEmployeePushSubscription,
	sendEmployeePushNotification,
};
