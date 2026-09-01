import nodemailer from 'nodemailer';

import { recordEmailWorkflowFailure, sanitizeEmailWorkflowErrorMessage } from './emailWorkflowFailureLog.js';

let cachedTransporter = null;

function normalizeBaseUrl(value, fallbackValue) {
	const normalized = String(value || fallbackValue || '')
		.trim()
		.replace(/\/+$/, '');

	return normalized;
}

function getAppBaseUrl() {
	return normalizeBaseUrl(process.env.APP_BASE_URL, 'http://localhost:5173');
}

function getEmployeePortalBaseUrl() {
	return normalizeBaseUrl(process.env.EMPLOYEE_PWA_BASE_URL, getAppBaseUrl());
}

function getBrevoApiConfig() {
	const apiKey = (process.env.BREVO_API_KEY || '').trim();
	return apiKey ? { apiKey } : null;
}

function getSmtpConfig() {
	const host = process.env.SMTP_HOST || 'smtp.gmail.com';
	const port = Number(process.env.SMTP_PORT || 587);
	const user = process.env.SMTP_USER || '';
	const pass = process.env.SMTP_PASS || '';
	const fromEmail = process.env.SMTP_FROM || user;
	const fromName = (process.env.SMTP_FROM_NAME || '').trim();
	const from = fromEmail && fromName ? `"${fromName.replace(/"/g, '\\"')}" <${fromEmail}>` : fromEmail;

	return {
		host,
		port,
		secure: port === 465,
		auth: user && pass ? { user, pass } : null,
		from,
		fromEmail,
		fromName,
	};
}

function getTransporter() {
	if (cachedTransporter) {
		return cachedTransporter;
	}

	const config = getSmtpConfig();

	if (!config.auth || !config.from) {
		return null;
	}

	cachedTransporter = nodemailer.createTransport({
		host: config.host,
		port: config.port,
		secure: config.secure,
		auth: config.auth,
	});

	return cachedTransporter;
}

async function sendViaBrevoApi(payload) {
	const brevoConfig = getBrevoApiConfig();
	const smtpConfig = getSmtpConfig();

	if (!smtpConfig.fromEmail) {
		return { ok: false, error: 'Konfigurasi SMTP belum lengkap (fromEmail).' };
	}

	const response = await fetch('https://api.brevo.com/v3/smtp/email', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'api-key': brevoConfig.apiKey,
		},
		body: JSON.stringify({
			sender: {
				name: smtpConfig.fromName || undefined,
				email: smtpConfig.fromEmail,
			},
			to: [{ email: payload.recipientEmail, name: payload.recipientName || undefined }],
			subject: payload.subject,
			textContent: payload.textBody || undefined,
			htmlContent: payload.htmlBody || undefined,
		}),
	});

	if (response.ok) {
		return { ok: true };
	}

	const errBody = await response.text();
	return { ok: false, error: `Brevo API error ${response.status}: ${errBody}` };
}

function useBrevoApi() {
	const config = getBrevoApiConfig();
	return config !== null;
}

async function persistEmailWorkflowFailure(prisma, payload) {
	try {
		await recordEmailWorkflowFailure(prisma, payload);
	} catch (error) {
		console.warn('Log kegagalan email workflow tidak dapat disimpan.', error);
	}
}

async function queueAndSendEmail(prisma, payload) {
	const outbox = await prisma.emailOutbox.create({
		data: {
			employeeLeaveId: payload.employeeLeaveId || null,
			employeeLeaveApprovalId: payload.employeeLeaveApprovalId || null,
			revisionNo: payload.revisionNo || null,
			recipientEmail: payload.recipientEmail,
			recipientName: payload.recipientName || null,
			subject: payload.subject,
			htmlBody: payload.htmlBody || null,
			textBody: payload.textBody || null,
			status: 'PENDING',
		},
	});

	if (!payload.recipientEmail) {
		await prisma.emailOutbox.update({
			where: { id: outbox.id },
			data: {
				status: 'FAILED',
				errorMessage: 'Email penerima belum tersedia.',
			},
		});
		await persistEmailWorkflowFailure(prisma, {
			event: payload.event,
			entityType: payload.entityType,
			employeeLeaveId: payload.employeeLeaveId,
			employeeLeaveApprovalId: payload.employeeLeaveApprovalId,
			recipientEmail: payload.recipientEmail || '',
			recipientName: payload.recipientName,
			subject: payload.subject,
			error: 'Email penerima belum tersedia.',
		});

		return {
			ok: false,
			id: outbox.id,
			error: 'Email penerima belum tersedia.',
		};
	}

	const transporter = getTransporter();
	const config = getSmtpConfig();
	const brevoApiEnabled = useBrevoApi();

	if ((!brevoApiEnabled && (!transporter || !config.from)) || (brevoApiEnabled && !config.fromEmail)) {
		await prisma.emailOutbox.update({
			where: { id: outbox.id },
			data: {
				status: 'FAILED',
				errorMessage: 'Konfigurasi SMTP belum lengkap.',
			},
		});
		await persistEmailWorkflowFailure(prisma, {
			event: payload.event,
			entityType: payload.entityType,
			employeeLeaveId: payload.employeeLeaveId,
			employeeLeaveApprovalId: payload.employeeLeaveApprovalId,
			recipientEmail: payload.recipientEmail || '',
			recipientName: payload.recipientName,
			subject: payload.subject,
			error: 'Konfigurasi SMTP belum lengkap.',
		});

		return {
			ok: false,
			id: outbox.id,
			error: 'Konfigurasi SMTP belum lengkap.',
		};
	}

	try {
		let sendResult;

		if (useBrevoApi()) {
			sendResult = await sendViaBrevoApi({
				recipientEmail: payload.recipientEmail,
				recipientName: payload.recipientName,
				subject: payload.subject,
				textBody: payload.textBody,
				htmlBody: payload.htmlBody,
			});
		} else {
			await transporter.sendMail({
				from: config.from,
				to: payload.recipientEmail,
				subject: payload.subject,
				text: payload.textBody || undefined,
				html: payload.htmlBody || undefined,
			});
			sendResult = { ok: true };
		}

		if (!sendResult.ok) {
			throw new Error(sendResult.error || 'Gagal mengirim email.');
		}

		await prisma.emailOutbox.update({
			where: { id: outbox.id },
			data: {
				status: 'SENT',
				sentAt: new Date(),
				errorMessage: null,
			},
		});

		return {
			ok: true,
			id: outbox.id,
		};
	} catch (error) {
		const safeErrorMessage = sanitizeEmailWorkflowErrorMessage(error);

		await prisma.emailOutbox.update({
			where: { id: outbox.id },
			data: {
				status: 'FAILED',
				errorMessage: safeErrorMessage,
			},
		});
		await persistEmailWorkflowFailure(prisma, {
			event: payload.event,
			entityType: payload.entityType,
			employeeLeaveId: payload.employeeLeaveId,
			employeeLeaveApprovalId: payload.employeeLeaveApprovalId,
			recipientEmail: payload.recipientEmail || '',
			recipientName: payload.recipientName,
			subject: payload.subject,
			error: safeErrorMessage,
		});

		return {
			ok: false,
			id: outbox.id,
			error: safeErrorMessage,
		};
	}
}

export { getAppBaseUrl, getEmployeePortalBaseUrl, queueAndSendEmail };
