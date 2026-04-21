import { describe, expect, it } from 'vitest';

import {
	buildEmailWorkflowFailureNotification,
	mapEmailWorkflowFailureLog,
	sanitizeEmailWorkflowErrorMessage,
} from './emailWorkflowFailureLog';

describe('emailWorkflowFailureLog helpers', () => {
	it('sanitizes sensitive credentials from error messages', () => {
		const message = sanitizeEmailWorkflowErrorMessage(
			'SMTP auth failed: password=supersecret token:abc123 authorization=Bearer xyz',
		);

		expect(message).toContain('password=[redacted]');
		expect(message).toContain('token:[redacted]');
		expect(message).toContain('authorization=[redacted]');
		expect(message).not.toContain('supersecret');
		expect(message).not.toContain('abc123');
		expect(message).not.toContain('Bearer xyz');
	});

	it('maps failure logs for admin use and notifications', () => {
		const record = {
			id: 17,
			event: 'LEAVE_APPROVAL_STAGE_EMAIL',
			entityType: 'LEAVE_APPROVAL',
			employeeLeaveId: 91,
			employeeLeaveApprovalId: 55,
			recipientEmail: 'approver@company.test',
			recipientName: 'Approver Satu',
			subject: 'Approval cuti menunggu tindakan: CT-20260421-ABC',
			errorMessage: 'Konfigurasi SMTP belum lengkap.',
			status: 'OPEN',
			resolvedAt: null,
			resolvedByEmployeeId: null,
			resolvedByEmployee: null,
			resolvedNote: null,
			createdAt: new Date('2026-04-21T01:00:00.000Z'),
			updatedAt: new Date('2026-04-21T01:05:00.000Z'),
			employeeLeave: {
				requestNumber: 'CT-20260421-ABC',
			},
			employeeLeaveApproval: {
				stageType: 'FOREMAN',
			},
		};

		const mapped = mapEmailWorkflowFailureLog(record);
		const notification = buildEmailWorkflowFailureNotification(record);

		expect(mapped.statusLabel).toBe('Open');
		expect(mapped.entityLabel).toContain('Stage approval cuti');
		expect(mapped.approvalStageLabel).toBe('Foreman');
		expect(mapped.targetSearch).toBe('CT-20260421-ABC');
		expect(notification.id).toBe('email-workflow-failure-17');
		expect(notification.category).toBe('EMAIL_FAILED');
		expect(notification.title).toContain('CT-20260421-ABC');
		expect(notification.description).toContain('approver@company.test');
	});
});
