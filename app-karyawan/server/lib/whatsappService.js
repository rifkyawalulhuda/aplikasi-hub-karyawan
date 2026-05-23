/**
 * WhatsApp Notification Service via Fonnte API
 *
 * Mengirim notifikasi WhatsApp ke karyawan terkait workflow cuti.
 * Membutuhkan env var FONNTE_TOKEN untuk autentikasi.
 */

function getFonnteConfig() {
	const token = (process.env.FONNTE_TOKEN || '').trim();
	const enabled = token.length > 0;

	return { token, enabled };
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
 *
 * @param {object} payload
 * @param {string} payload.target - Nomor telepon tujuan
 * @param {string} payload.message - Isi pesan teks
 * @param {string} [payload.countryCode] - Kode negara (default: 62)
 * @returns {Promise<{ok: boolean, error?: string, detail?: object}>}
 */
async function sendWhatsApp(payload) {
	const config = getFonnteConfig();

	if (!config.enabled) {
		return { ok: false, error: 'FONNTE_TOKEN belum dikonfigurasi.' };
	}

	const target = normalizePhoneNumber(payload.target);

	if (!target) {
		return { ok: false, error: 'Nomor telepon tujuan kosong.' };
	}

	try {
		const body = new URLSearchParams({
			target,
			message: payload.message,
			countryCode: payload.countryCode || '62',
		});

		const response = await fetch('https://api.fonnte.com/send', {
			method: 'POST',
			headers: {
				Authorization: config.token,
			},
			body,
		});

		const result = await response.json();

		if (result.status === true || result.status === 'true') {
			return { ok: true, detail: result };
		}

		return {
			ok: false,
			error: result.reason || result.message || 'Gagal mengirim pesan WhatsApp.',
			detail: result,
		};
	} catch (error) {
		return {
			ok: false,
			error: error.message || 'Network error saat mengirim WhatsApp.',
		};
	}
}

/**
 * Kirim notifikasi WhatsApp untuk workflow cuti.
 * Fungsi ini bersifat fire-and-forget — error tidak akan menggagalkan proses utama.
 *
 * @param {object} options
 * @param {string} options.phoneNumber - Nomor telepon karyawan
 * @param {string} options.employeeName - Nama karyawan
 * @param {string} options.message - Isi pesan
 */
async function sendLeaveWhatsAppNotification({ phoneNumber, employeeName, message }) {
	const config = getFonnteConfig();

	if (!config.enabled) {
		return;
	}

	if (!phoneNumber) {
		console.warn(`[WhatsApp] Nomor telepon kosong untuk ${employeeName}, notifikasi dilewati.`);
		return;
	}

	const result = await sendWhatsApp({ target: phoneNumber, message });

	if (!result.ok) {
		console.warn(`[WhatsApp] Gagal kirim ke ${employeeName} (${phoneNumber}): ${result.error}`);
	}
}

export { getFonnteConfig, normalizePhoneNumber, sendWhatsApp, sendLeaveWhatsAppNotification };
