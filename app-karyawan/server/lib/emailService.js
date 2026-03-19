import nodemailer from 'nodemailer';

let cachedTransporter = null;

function getAppBaseUrl() {
	return process.env.APP_BASE_URL || 'http://localhost:5173';
}

function getSmtpConfig() {
	const host = process.env.SMTP_HOST || 'smtp.gmail.com';
	const port = Number(process.env.SMTP_PORT || 587);
	const user = process.env.SMTP_USER || '';
	const pass = process.env.SMTP_PASS || '';
	const from = process.env.SMTP_FROM || user;

	return {
		host,
		port,
		secure: port === 465,
		auth: user && pass ? { user, pass } : null,
		from,
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

		return {
			ok: false,
			id: outbox.id,
			error: 'Email penerima belum tersedia.',
		};
	}

	const transporter = getTransporter();
	const config = getSmtpConfig();

	if (!transporter || !config.from) {
		await prisma.emailOutbox.update({
			where: { id: outbox.id },
			data: {
				status: 'FAILED',
				errorMessage: 'Konfigurasi SMTP belum lengkap.',
			},
		});

		return {
			ok: false,
			id: outbox.id,
			error: 'Konfigurasi SMTP belum lengkap.',
		};
	}

	try {
		await transporter.sendMail({
			from: config.from,
			to: payload.recipientEmail,
			subject: payload.subject,
			text: payload.textBody || undefined,
			html: payload.htmlBody || undefined,
		});

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
		await prisma.emailOutbox.update({
			where: { id: outbox.id },
			data: {
				status: 'FAILED',
				errorMessage: error.message || 'Gagal mengirim email.',
			},
		});

		return {
			ok: false,
			id: outbox.id,
			error: error.message || 'Gagal mengirim email.',
		};
	}
}

export { getAppBaseUrl, queueAndSendEmail };
