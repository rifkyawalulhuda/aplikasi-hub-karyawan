/**
 * Expiry Notification Cron Job
 *
 * Runs every hour. For each site with isEnabled=true and sendHour == current hour,
 * queries unit/employee license certifications expiring within configured thresholds
 * and sends a summary email to all active recipients.
 *
 * Uses node-cron: schedule '0 * * * *' (top of every hour).
 * PM2 cluster guard: only runs on instance 0 (or when INSTANCE_ID is undefined).
 */

import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { queueAndSendEmail } from '../lib/emailService.js';
import { buildExpiryNotificationEmail } from '../lib/emailTemplates.js';

/**
 * Returns date that is exactly `days` from now (midnight UTC).
 */
function targetDate(days) {
	const d = new Date();
	d.setUTCHours(0, 0, 0, 0);
	d.setUTCDate(d.getUTCDate() + days);
	return d;
}

/**
 * Days between today (midnight UTC) and given date.
 */
function daysUntil(date) {
	const today = new Date();
	today.setUTCHours(0, 0, 0, 0);
	const diff = new Date(date).getTime() - today.getTime();
	return Math.round(diff / (1000 * 60 * 60 * 24));
}

async function runExpiryNotifications() {
	const currentHour = new Date().getHours();

	// Fetch all enabled settings whose sendHour matches the current hour
	const allSettings = await prisma.emailNotificationSettings.findMany({
		where: { isEnabled: true, sendHour: currentHour },
		include: { site: { select: { id: true, name: true } } },
	});

	if (allSettings.length === 0) return;

	for (const settings of allSettings) {
		try {
			await processsite(settings);
		} catch (err) {
			console.error(`[ExpiryNotification] Error processing site ${settings.siteId}:`, err);
		}
	}
}

async function processsite(settings) {
	const siteId = settings.site.id;
	const siteName = settings.site.name;

	const recipients = Array.isArray(settings.recipients)
		? settings.recipients.filter((r) => r.isActive && r.email)
		: [];

	if (recipients.length === 0) return;

	// ─── Query Unit License Certifications ──────────────────────────────────
	const unitThresholds = Array.isArray(settings.unitThresholds)
		? settings.unitThresholds
		: [90, 60, 30, 0];

	const unitExpiryDates = unitThresholds.map(targetDate);

	const unitCerts = await prisma.unitLicenseCertification.findMany({
		where: {
			masterUnit: { siteId },
			expiryDate: { in: unitExpiryDates },
		},
		include: {
			masterUnit: { select: { unitName: true, unitSerialNumber: true } },
		},
		orderBy: { expiryDate: 'asc' },
	});

	// ─── Query Employee License Certifications ───────────────────────────────
	const empThresholds = Array.isArray(settings.employeeThresholds)
		? settings.employeeThresholds
		: [90, 60, 30, 0];

	const empExpiryDates = empThresholds.map(targetDate);

	const empCerts = await prisma.employeeLicenseCertification.findMany({
		where: {
			employee: { siteId },
			expiryDate: { in: empExpiryDates },
		},
		include: {
			employee: { select: { fullName: true, employeeNo: true } },
			masterDokKaryawan: { select: { documentName: true } },
		},
		orderBy: { expiryDate: 'asc' },
	});

	// No expiring items → skip
	if (unitCerts.length === 0 && empCerts.length === 0) return;

	// ─── Build email items ───────────────────────────────────────────────────
	const unitItems = unitCerts.map((c) => ({
		name: c.masterUnit.unitName,
		serialNumber: c.masterUnit.unitSerialNumber,
		assetNo: c.assetNo,
		documentNumber: c.documentNumber,
		issuedBy: c.issuedBy,
		expiryDate: c.expiryDate,
		daysLeft: daysUntil(c.expiryDate),
	}));

	const employeeItems = empCerts.map((c) => ({
		name: c.employee.fullName,
		employeeNo: c.employee.employeeNo,
		documentName: c.masterDokKaryawan.documentName,
		documentNumber: c.documentNumber,
		expiryDate: c.expiryDate,
		daysLeft: daysUntil(c.expiryDate),
	}));

	const subject = `Notifikasi Kadaluarsa Lisensi & Sertifikasi — ${siteName}`;
	const htmlBody = buildExpiryNotificationEmail({ siteName, unitItems, employeeItems });
	const textBody = buildExpiryNotificationText({ siteName, unitItems, employeeItems });

	// ─── Send to all active recipients ───────────────────────────────────────
	await Promise.allSettled(
		recipients.map((recipient) =>
			queueAndSendEmail(prisma, {
				event: 'EXPIRY_NOTIFICATION',
				entityType: 'EMAIL_NOTIFICATION_SETTINGS',
				recipientEmail: recipient.email,
				recipientName: recipient.name || recipient.email,
				subject,
				htmlBody,
				textBody,
			}),
		),
	);

	console.log(
		`[ExpiryNotification] Site "${siteName}": ${unitItems.length} unit, ${employeeItems.length} employee certs → ${recipients.length} recipients`,
	);
}

function buildExpiryNotificationText({ siteName, unitItems, employeeItems }) {
	const lines = [`Notifikasi Kadaluarsa Lisensi & Sertifikasi`, `Site: ${siteName}`, ''];

	if (unitItems.length > 0) {
		lines.push('=== Lisensi & Sertifikasi Unit ===');
		for (const item of unitItems) {
			const daysLabel = item.daysLeft === 0 ? 'HARI INI' : `${item.daysLeft} hari lagi`;
			lines.push(
				`- ${item.name} (S/N: ${item.serialNumber || '-'}) | No. Dok: ${item.documentNumber} | Kadaluarsa: ${new Date(item.expiryDate).toLocaleDateString('id-ID')} (${daysLabel})`,
			);
		}
		lines.push('');
	}

	if (employeeItems.length > 0) {
		lines.push('=== Lisensi & Sertifikasi Karyawan ===');
		for (const item of employeeItems) {
			const daysLabel = item.daysLeft === 0 ? 'HARI INI' : `${item.daysLeft} hari lagi`;
			lines.push(
				`- ${item.name} (${item.employeeNo}) | ${item.documentName} | No. Dok: ${item.documentNumber} | Kadaluarsa: ${new Date(item.expiryDate).toLocaleDateString('id-ID')} (${daysLabel})`,
			);
		}
	}

	return lines.join('\n');
}

/**
 * Initialize the cron job. Call once at server startup.
 * Guard: only runs on PM2 instance 0 (or non-cluster mode).
 */
export function initExpiryNotificationJob() {
	const instanceId = process.env.NODE_APP_INSTANCE;

	// In PM2 cluster mode, only run on instance 0
	if (instanceId !== undefined && instanceId !== '0') {
		console.log(`[ExpiryNotification] Skipping cron init on PM2 instance ${instanceId}`);
		return;
	}

	cron.schedule('0 * * * *', async () => {
		try {
			await runExpiryNotifications();
		} catch (err) {
			console.error('[ExpiryNotification] Cron job error:', err);
		}
	});

	console.log('[ExpiryNotification] Cron job initialized (runs every hour)');
}
