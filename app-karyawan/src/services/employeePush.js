import { employeeMeRequest } from './employeeApi';

function urlBase64ToUint8Array(base64String) {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let index = 0; index < rawData.length; index += 1) {
		outputArray[index] = rawData.charCodeAt(index);
	}

	return outputArray;
}

function isPushSupported() {
	return (
		typeof window !== 'undefined' &&
		'serviceWorker' in navigator &&
		'PushManager' in window &&
		'Notification' in window
	);
}

async function getPushConfig() {
	try {
		return await employeeMeRequest('/push-config');
	} catch {
		return { enabled: false, vapidPublicKey: '' };
	}
}

async function getEmployeePushStatus() {
	if (!isPushSupported()) {
		return {
			supported: false,
			configured: false,
			permission: 'unsupported',
			subscribed: false,
		};
	}

	const config = await getPushConfig();
	const registration = await navigator.serviceWorker.ready;
	const existingSubscription = await registration.pushManager.getSubscription();

	return {
		supported: true,
		configured: Boolean(config?.enabled && config?.vapidPublicKey),
		permission: Notification.permission,
		subscribed: Boolean(existingSubscription),
	};
}

async function enableEmployeePushSubscription() {
	if (!isPushSupported()) {
		throw new Error('Browser belum mendukung push notification.');
	}

	const config = await getPushConfig();
	const { enabled, vapidPublicKey } = config || {};

	if (!enabled || !vapidPublicKey) {
		throw new Error('Konfigurasi push notification belum aktif di server.');
	}

	let { permission } = Notification;

	if (permission === 'default') {
		permission = await Notification.requestPermission();
	}

	if (permission !== 'granted') {
		throw new Error('Izin notifikasi belum diberikan.');
	}

	const registration = await navigator.serviceWorker.ready;
	let subscription = await registration.pushManager.getSubscription();

	if (!subscription) {
		subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
		});
	}

	await employeeMeRequest('/push-subscriptions', {
		method: 'POST',
		body: JSON.stringify({
			subscription: subscription.toJSON(),
		}),
	});
}

async function syncEmployeePushSubscription() {
	if (!isPushSupported() || Notification.permission !== 'granted') {
		return;
	}

	const config = await getPushConfig();
	const { enabled, vapidPublicKey } = config || {};

	if (!enabled || !vapidPublicKey) {
		return;
	}

	const registration = await navigator.serviceWorker.ready;
	const subscription = await registration.pushManager.getSubscription();

	if (!subscription) {
		return;
	}

	await employeeMeRequest('/push-subscriptions', {
		method: 'POST',
		body: JSON.stringify({
			subscription: subscription.toJSON(),
		}),
	});
}

export { enableEmployeePushSubscription, getEmployeePushStatus, isPushSupported, syncEmployeePushSubscription };
