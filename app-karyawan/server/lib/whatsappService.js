/**
 * WhatsApp Notification Service
 *
 * Mendukung dua provider:
 * - "fonnte" (default/production): via Fonnte API, butuh FONNTE_TOKEN
 * - "waha" (development/self-hosted): via WAHA API, butuh WAHA_URL + WAHA_API_KEY + WAHA_SESSION
 *
 * Pilih provider via env var WHATSAPP_PROVIDER (default: "fonnte")
 */

function getProvider() {
	return (process.env.WHATSAPP_PROVIDER || 'fonnte').trim().toLowerCase();
}

function getFonnteConfig() {
	const token = (process.env.FONNTE_TOKEN || '').trim();
	const enabled = token.length > 0;

	return { token, enabled };
}

function getWahaConfig() {
	const url = (process.env.WAHA_URL || 'http://localhost:3100').replace(/\/$/, '');
	const apiKey = (process.env.WAHA_API_KEY || '').trim();
	const session = (process.env.WAHA_SESSION || 'default').trim();
	const enabled = apiKey.length > 0;

	return { url, apiKey, session, enabled };
}

/**
 * Normalisasi nomor telepon ke format internasional (62xxx).
 * Menerima format: 08xx, +628xx, 628xx, 8xx
 */
function normalizePhoneNumber(phone) {
	if (!phone) return '';

	let cleaned = String(phone).replace(/[\s\-().+]/g, '');

	if (cleaned.startsWith('08')) {
		cleaned = `62${cleaned.slice(1)}`;
	} else if (cleaned.startsWith('8') && cleaned.length >= 10) {
		cleaned = `62${cleaned}`;
	}

	return cleaned;
}

/**
 * Kirim pesan WhatsApp via Fonnte API.
 */
async function sendWhatsAppViaFonnte(target, message, countryCode = '62') {
	const config = getFonnteConfig();

	if (!config.enabled) {
		return { ok: false, error: 'FONNTE_TOKEN belum dikonfigurasi.' };
	}

	try {
		const body = new URLSearchParams({ target, message, countryCode });

		const response = await fetch('https://api.fonnte.com/send', {
			method: 'POST',
			headers: { Authorization: config.token },
			body,
		});

		const result = await response.json();

		if (result.status === true || result.status === 'true') {
			return { ok: true, detail: result };
		}

		return {
			ok: false,
			error: result.reason || result.message || 'Gagal mengirim pesan WhatsApp via Fonnte.',
			detail: result,
		};
	} catch (error) {
		return { ok: false, error: error.message || 'Network error saat mengirim WhatsApp via Fonnte.' };
	}
}

/**
 * Kirim pesan WhatsApp via WAHA (self-hosted WhatsApp API).
 * Docs: https://waha.devlike.pro/docs/how-to/send-messages/
 */
async function sendWhatsAppViaWaha(target, message) {
	const config = getWahaConfig();

	if (!config.enabled) {
		return { ok: false, error: 'WAHA_API_KEY belum dikonfigurasi.' };
	}

	// WAHA butuh format: 628xxx@c.us
	const normalized = normalizePhoneNumber(target);
	if (!normalized) {
		return { ok: false, error: 'Nomor telepon tujuan kosong.' };
	}

	const chatId = `${normalized}@c.us`;

	try {
		const response = await fetch(`${config.url}/api/sendText`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Api-Key': config.apiKey,
			},
			body: JSON.stringify({
				session: config.session,
				chatId,
				text: message,
			}),
		});

		if (response.ok) {
			const result = await response.json();
			return { ok: true, detail: result };
		}

		const errText = await response.text();
		return {
			ok: false,
			error: `WAHA error ${response.status}: ${errText}`,
		};
	} catch (error) {
		return { ok: false, error: error.message || 'Network error saat mengirim WhatsApp via WAHA.' };
	}
}

/**
 * Kirim pesan WhatsApp — otomatis pilih provider berdasarkan WHATSAPP_PROVIDER.
 *
 * @param {object} payload
 * @param {string} payload.target - Nomor telepon tujuan
 * @param {string} payload.message - Isi pesan teks
 * @param {string} [payload.countryCode] - Kode negara (default: 62, hanya untuk Fonnte)
 * @returns {Promise<{ok: boolean, error?: string, detail?: object}>}
 */
async function sendWhatsApp(payload) {
	const target = normalizePhoneNumber(payload.target);

	if (!target) {
		return { ok: false, error: 'Nomor telepon tujuan kosong.' };
	}

	const provider = getProvider();

	if (provider === 'waha') {
		return sendWhatsAppViaWaha(target, payload.message);
	}

	// Default: fonnte
	return sendWhatsAppViaFonnte(target, payload.message, payload.countryCode || '62');
}

/**
 * Kirim notifikasi WhatsApp untuk workflow cuti.
 * Otomatis pilih provider berdasarkan WHATSAPP_PROVIDER env var.
 *
 * @param {object} options
 * @param {string} options.phoneNumber - Nomor telepon karyawan
 * @param {string} options.employeeName - Nama karyawan
 * @param {string} options.message - Isi pesan
 */
async function sendLeaveWhatsAppNotification({ phoneNumber, employeeName, message }) {
	const provider = getProvider();

	// Cek apakah provider aktif dan terkonfigurasi
	if (provider === 'waha') {
		const config = getWahaConfig();
		if (!config.enabled) {
			console.warn(`[WhatsApp/WAHA] WAHA_API_KEY belum dikonfigurasi, notifikasi dilewati.`);
			return;
		}
	} else {
		const config = getFonnteConfig();
		if (!config.enabled) {
			return;
		}
	}

	if (!phoneNumber) {
		console.warn(`[WhatsApp] Nomor telepon kosong untuk ${employeeName}, notifikasi dilewati.`);
		return;
	}

	const result = await sendWhatsApp({ target: phoneNumber, message });

	if (!result.ok) {
		console.warn(`[WhatsApp/${provider}] Gagal kirim ke ${employeeName} (${phoneNumber}): ${result.error}`);
	}
}

export { getFonnteConfig, getWahaConfig, getProvider, normalizePhoneNumber, sendWhatsApp, sendLeaveWhatsAppNotification };

