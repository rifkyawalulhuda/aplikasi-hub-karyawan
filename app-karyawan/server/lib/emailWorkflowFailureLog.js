const MAX_SAFE_TEXT_LENGTH = 1000;

function getStageLabel(stageType = '') {
	switch (stageType) {
		case 'FOREMAN_GROUP_SHIFT':
			return 'Foreman Group Shift';
		case 'FOREMAN':
			return 'Foreman';
		case 'GENERAL_FOREMAN':
			return 'General Foreman';
		case 'SECTION_CHIEF':
			return 'Section Chief';
		case 'DY_DEPT_MANAGER':
			return 'Dy. Dept. Manager';
		case 'DEPT_MANAGER':
			return 'Dept. Manager';
		case 'SITE_DIV_MANAGER':
			return 'Site/Div. Manager';
		default:
			return stageType;
	}
}

function normalizeString(value = '') {
	return String(value || '')
		.trim()
		.replace(/\s+/g, ' ');
}

function truncateString(value = '', maxLength = MAX_SAFE_TEXT_LENGTH) {
	const normalized = normalizeString(value);

	if (normalized.length <= maxLength) {
		return normalized;
	}

	return normalized.slice(0, maxLength).trimEnd();
}

function sanitizeSensitiveSegments(value = '') {
	return String(value)
		.replace(
			/((?:pass(?:word)?|token|secret|api[_-]?key|authorization|auth|client[_-]?secret)\s*[:=]\s*)(?:Bearer\s+)?([^,\s]+)/gi,
			'$1[redacted]',
		)
		.replace(/(https?:\/\/[^:\s/@]+:)([^@\s/]+)@/gi, '$1[redacted]@');
}

function sanitizeEmailWorkflowErrorMessage(error) {
	const rawMessage = typeof error === 'string' ? error : error?.message || error?.toString?.() || '';
	const sanitized = truncateString(sanitizeSensitiveSegments(rawMessage), MAX_SAFE_TEXT_LENGTH);

	return sanitized || 'Gagal mengirim email.';
}

function formatDateLabel(value) {
	if (!value) {
		return '-';
	}

	const parsed = value instanceof Date ? value : new Date(value);

	if (Number.isNaN(parsed.getTime())) {
		return '-';
	}

	return parsed.toLocaleDateString('id-ID', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
	});
}

function getEmailWorkflowFailureEventLabel(event = '') {
	switch (event) {
		case 'LEAVE_REQUEST_SUBMITTED_EMAIL':
			return 'Pengajuan cuti dikirim';
		case 'LEAVE_REQUEST_REJECTED_EMAIL':
			return 'Cuti ditolak';
		case 'LEAVE_REQUEST_APPROVED_EMAIL':
			return 'Cuti disetujui';
		case 'LEAVE_APPROVAL_STAGE_EMAIL':
			return 'Approval tahap cuti';
		default:
			return event || 'Email workflow cuti';
	}
}

function getEmailWorkflowFailureEntityLabel(entityType = '') {
	switch (entityType) {
		case 'LEAVE_REQUEST':
			return 'Request cuti';
		case 'LEAVE_APPROVAL':
			return 'Stage approval cuti';
		default:
			return entityType || 'Email workflow';
	}
}

function resolveEmailWorkflowFailureTarget(record = {}) {
	const requestNumber = record.employeeLeave?.requestNumber || '';
	const approvalStageLabel = record.employeeLeaveApproval?.stageType || '';
	const recipientEmail = record.recipientEmail || '';
	const subject = record.subject || '';

	return requestNumber || approvalStageLabel || recipientEmail || subject;
}

function mapEmailWorkflowFailureLog(record) {
	const createdAt = record.createdAt instanceof Date ? record.createdAt : new Date(record.createdAt);
	const updatedAt = record.updatedAt instanceof Date ? record.updatedAt : new Date(record.updatedAt);
	const entityLabel = getEmailWorkflowFailureEntityLabel(record.entityType);
	const eventLabel = getEmailWorkflowFailureEventLabel(record.event);
	const requestNumber = record.employeeLeave?.requestNumber || '';
	const approvalStageType = record.employeeLeaveApproval?.stageType || '';
	const approvalStageLabel = approvalStageType ? getStageLabel(approvalStageType) : '';

	return {
		id: record.id,
		event: record.event,
		eventLabel,
		entityType: record.entityType,
		entityTypeLabel: entityLabel,
		entityLabel:
			record.entityType === 'LEAVE_APPROVAL' && approvalStageLabel
				? `${entityLabel} - ${approvalStageLabel}`
				: entityLabel,
		employeeLeaveId: record.employeeLeaveId || null,
		employeeLeaveApprovalId: record.employeeLeaveApprovalId || null,
		requestNumber,
		approvalStageType,
		approvalStageLabel,
		recipientEmail: record.recipientEmail || '',
		recipientName: record.recipientName || '',
		subject: record.subject || '',
		errorMessage: record.errorMessage || '',
		status: record.status,
		statusLabel: record.status === 'RESOLVED' ? 'Resolved' : 'Open',
		isResolved: record.status === 'RESOLVED',
		resolvedAt: record.resolvedAt ? record.resolvedAt.toISOString() : null,
		resolvedByEmployeeId: record.resolvedByEmployeeId || null,
		resolvedByEmployeeName: record.resolvedByEmployee?.fullName || '',
		resolvedNote: record.resolvedNote || '',
		createdAt: createdAt.toISOString(),
		updatedAt: updatedAt.toISOString(),
		targetPath: '/notifikasi',
		targetSearch: resolveEmailWorkflowFailureTarget(record),
	};
}

function buildEmailWorkflowFailureNotification(record) {
	const mapped = mapEmailWorkflowFailureLog(record);
	const failureDate = record.updatedAt || record.createdAt || new Date();
	const failureDateValue = failureDate instanceof Date ? failureDate : new Date(failureDate);

	return {
		id: `email-workflow-failure-${record.id}`,
		category: 'EMAIL_FAILED',
		severity: 'error',
		title: `Email workflow gagal: ${mapped.requestNumber || mapped.eventLabel}`,
		description: `Pengiriman ke ${mapped.recipientEmail || '-'} gagal${
			mapped.errorMessage ? `: ${mapped.errorMessage}` : '.'
		}`,
		targetPath: '/notifikasi',
		targetSearch: mapped.targetSearch,
		dateLabel: `Gagal kirim: ${formatDateLabel(failureDateValue)}`,
		sortDate: failureDateValue.toISOString(),
		href: '/notifikasi?category=EMAIL_FAILED',
	};
}

async function recordEmailWorkflowFailure(prismaClient, payload = {}) {
	const log = await prismaClient.emailWorkflowFailureLog.create({
		data: {
			event: normalizeString(payload.event) || 'EMAIL_WORKFLOW_FAILED',
			entityType: normalizeString(payload.entityType) || 'LEAVE_REQUEST',
			employeeLeaveId: payload.employeeLeaveId || null,
			employeeLeaveApprovalId: payload.employeeLeaveApprovalId || null,
			recipientEmail: normalizeString(payload.recipientEmail) || '',
			recipientName: normalizeString(payload.recipientName) || null,
			subject: truncateString(payload.subject || '', 255),
			errorMessage: sanitizeEmailWorkflowErrorMessage(payload.error || payload.errorMessage || ''),
		},
	});

	return log;
}

async function resolveEmailWorkflowFailureLog(prismaClient, id, payload = {}) {
	const existing = await prismaClient.emailWorkflowFailureLog.findUnique({
		where: { id },
	});

	if (!existing) {
		throw Object.assign(new Error('Log kegagalan email workflow tidak ditemukan.'), { statusCode: 404 });
	}

	if (existing.status === 'RESOLVED') {
		return existing;
	}

	return prismaClient.emailWorkflowFailureLog.update({
		where: { id },
		data: {
			status: 'RESOLVED',
			resolvedAt: new Date(),
			resolvedByEmployeeId: payload.resolvedByEmployeeId || null,
			resolvedNote: normalizeString(payload.resolvedNote || '') || null,
		},
	});
}

export {
	buildEmailWorkflowFailureNotification,
	formatDateLabel,
	getEmailWorkflowFailureEntityLabel,
	getEmailWorkflowFailureEventLabel,
	mapEmailWorkflowFailureLog,
	recordEmailWorkflowFailure,
	resolveEmailWorkflowFailureLog,
	sanitizeEmailWorkflowErrorMessage,
};
