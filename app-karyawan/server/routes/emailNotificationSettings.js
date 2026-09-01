import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { queueAndSendEmail } from '../lib/emailService.js';
import { buildExpiryNotificationEmail } from '../lib/emailTemplates.js';

const router = Router();

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

function normalizeThresholds(raw) {
	if (!Array.isArray(raw)) return [90, 60, 30, 0];
	return raw
		.map(Number)
		.filter((n) => Number.isInteger(n) && n >= 0)
		.sort((a, b) => b - a);
}

function normalizeRecipients(raw) {
	if (!Array.isArray(raw)) return [];
	return raw
		.filter((r) => r && typeof r === 'object' && r.email)
		.map((r) => ({
			email: String(r.email).trim(),
			name: String(r.name || '').trim(),
			isActive: Boolean(r.isActive ?? true),
		}))
		.filter((r) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email));
}

// GET / — get settings for the admin's site
router.get(
	'/',
	withAsync(async (req, res) => {
		const siteId = req.admin.siteId;

		if (!siteId) {
			return res.status(400).json({ message: 'Admin tidak terkait dengan site.' });
		}

		const settings = await prisma.emailNotificationSettings.findUnique({
			where: { siteId },
		});

		if (!settings) {
			// Return defaults if not yet configured
			return res.json({
				siteId,
				isEnabled: false,
				sendHour: 7,
				unitThresholds: [90, 60, 30, 0],
				employeeThresholds: [90, 60, 30, 0],
				recipients: [],
			});
		}

		return res.json({
			...settings,
			recipients: Array.isArray(settings.recipients) ? settings.recipients : [],
		});
	}),
);

// PUT / — upsert settings for the admin's site
router.put(
	'/',
	withAsync(async (req, res) => {
		const siteId = req.admin.siteId;

		if (!siteId) {
			return res.status(400).json({ message: 'Admin tidak terkait dengan site.' });
		}

		const { isEnabled, sendHour, unitThresholds, employeeThresholds, recipients } = req.body;

		// Validate sendHour
		const parsedHour = Number(sendHour);
		if (!Number.isInteger(parsedHour) || parsedHour < 0 || parsedHour > 23) {
			return res.status(400).json({ message: 'Jam pengiriman harus antara 0 dan 23.' });
		}

		const normalizedUnitThresholds = normalizeThresholds(unitThresholds);
		const normalizedEmployeeThresholds = normalizeThresholds(employeeThresholds);
		const normalizedRecipients = normalizeRecipients(recipients);

		if (normalizedUnitThresholds.length === 0) {
			return res.status(400).json({ message: 'Threshold notifikasi unit tidak boleh kosong.' });
		}
		if (normalizedEmployeeThresholds.length === 0) {
			return res.status(400).json({ message: 'Threshold notifikasi karyawan tidak boleh kosong.' });
		}

		const settings = await prisma.emailNotificationSettings.upsert({
			where: { siteId },
			create: {
				siteId,
				isEnabled: Boolean(isEnabled),
				sendHour: parsedHour,
				unitThresholds: normalizedUnitThresholds,
				employeeThresholds: normalizedEmployeeThresholds,
				recipients: normalizedRecipients,
			},
			update: {
				isEnabled: Boolean(isEnabled),
				sendHour: parsedHour,
				unitThresholds: normalizedUnitThresholds,
				employeeThresholds: normalizedEmployeeThresholds,
				recipients: normalizedRecipients,
			},
		});

		return res.json({
			...settings,
			recipients: Array.isArray(settings.recipients) ? settings.recipients : [],
		});
	}),
);

// POST /test — kirim test email ke semua penerima aktif
router.post(
	'/test',
	withAsync(async (req, res) => {
		const siteId = req.admin.siteId;

		if (!siteId) {
			return res.status(400).json({ message: 'Admin tidak terkait dengan site.' });
		}

		const settings = await prisma.emailNotificationSettings.findUnique({
			where: { siteId },
			include: { site: { select: { name: true } } },
		});

		if (!settings) {
			return res.status(400).json({ message: 'Pengaturan email belum dikonfigurasi.' });
		}

		const recipients = Array.isArray(settings.recipients)
			? settings.recipients.filter((r) => r.isActive)
			: [];

		if (recipients.length === 0) {
			return res.status(400).json({ message: 'Tidak ada penerima aktif.' });
		}

		const results = await Promise.allSettled(
			recipients.map((recipient) =>
				queueAndSendEmail(prisma, {
					event: 'EXPIRY_NOTIFICATION_TEST',
					entityType: 'EMAIL_NOTIFICATION_SETTINGS',
					recipientEmail: recipient.email,
					recipientName: recipient.name || recipient.email,
					subject: `[TEST] Notifikasi Email Kadaluarsa — ${settings.site.name}`,
					htmlBody: buildExpiryNotificationEmail({
						siteName: settings.site.name,
						unitItems: [
							{
								name: 'Contoh Unit (TEST)',
								assetNo: 'TEST-001',
								documentNumber: 'DOC-TEST-001',
								expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
								daysLeft: 30,
							},
						],
						employeeItems: [
							{
								name: 'Contoh Karyawan (TEST)',
								employeeNo: 'EMP-TEST-001',
								documentName: 'SIM B2',
								documentNumber: 'SIM-TEST-001',
								expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
								daysLeft: 60,
							},
						],
						isTest: true,
					}),
					textBody: `[TEST] Email notifikasi kadaluarsa dari sistem. Site: ${settings.site.name}`,
				}),
			),
		);

		const sent = results.filter((r) => r.status === 'fulfilled' && r.value?.ok).length;
		const failed = results.length - sent;

		return res.json({
			message: `Test email terkirim ke ${sent} penerima${failed > 0 ? `, ${failed} gagal` : ''}.`,
			sent,
			failed,
		});
	}),
);

export default router;
