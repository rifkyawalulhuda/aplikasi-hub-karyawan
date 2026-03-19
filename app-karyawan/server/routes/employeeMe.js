import { Router } from 'express';

import prisma from '../lib/prisma.js';
import {
	buildEmployeePortalProfile,
	mapEmployeeGuidanceRecord,
	mapEmployeeWarningLetter,
} from '../lib/employeePortal.js';
import { getAppBaseUrl, queueAndSendEmail } from '../lib/emailService.js';
import {
	createLeaveRequestRevision,
	getActiveApprovals,
	getLeaveRequestOrThrow,
	listApprovalsForEmployee,
	mapApprovalRow,
	mapLeaveRequestDetail,
	mapLeaveRequestSummary,
	normalizeString,
	toDateOnly,
} from '../lib/leaveWorkflow.js';
import { createLeaveDatabaseHistory, getLeaveDatabaseBalance } from '../lib/leaveDatabase.js';
import requireEmployeeAuth from '../middleware/requireEmployeeAuth.js';

const router = Router();

router.use(requireEmployeeAuth);

function buildLeaveRequestUrl(leaveRequestId) {
	return `${getAppBaseUrl()}/karyawan/cuti/${leaveRequestId}`;
}

function buildLeaveApprovalUrl(approvalId) {
	return `${getAppBaseUrl()}/karyawan/cuti/approval/${approvalId}`;
}

async function getLeaveTypeOrThrow(id, tx = prisma) {
	const leaveType = await tx.masterCutiKaryawan.findUnique({
		where: { id },
	});

	if (!leaveType) {
		throw Object.assign(new Error('Jenis cuti tidak ditemukan.'), { statusCode: 400 });
	}

	return leaveType;
}

function validateLeavePayload(payload = {}) {
	const masterCutiKaryawanId = Number(payload.masterCutiKaryawanId);
	const leaveDays = Number(payload.leaveDays);
	const periodStart = toDateOnly(payload.periodStart);
	const periodEnd = toDateOnly(payload.periodEnd);
	const notes = normalizeString(payload.notes || '');

	if (!Number.isInteger(masterCutiKaryawanId)) {
		throw Object.assign(new Error('Jenis cuti wajib dipilih.'), { statusCode: 400 });
	}

	if (!Number.isInteger(leaveDays) || leaveDays <= 0) {
		throw Object.assign(new Error('Jumlah cuti wajib diisi dengan angka yang valid.'), { statusCode: 400 });
	}

	if (!periodStart) {
		throw Object.assign(new Error('Periode cuti dari wajib diisi.'), { statusCode: 400 });
	}

	if (!periodEnd) {
		throw Object.assign(new Error('Periode cuti sampai wajib diisi.'), { statusCode: 400 });
	}

	if (periodEnd.getTime() < periodStart.getTime()) {
		throw Object.assign(new Error('Periode cuti sampai tidak boleh lebih kecil dari periode cuti dari.'), {
			statusCode: 400,
		});
	}

	return {
		masterCutiKaryawanId,
		leaveDays,
		periodStart,
		periodEnd,
		notes: notes || null,
	};
}

async function sendSubmittedEmail(record) {
	await queueAndSendEmail(prisma, {
		employeeLeaveId: record.id,
		revisionNo: record.revisionNo,
		recipientEmail: record.employee.email || '',
		recipientName: record.employee.fullName,
		subject: `Pengajuan cuti ${record.requestNumber} berhasil dikirim`,
		textBody: [
			`Halo ${record.employee.fullName},`,
			'',
			`Pengajuan cuti Anda dengan nomor ${record.requestNumber} telah dikirim.`,
			`Jenis cuti: ${record.masterCutiKaryawan.leaveType}`,
			`Periode: ${record.periodStart.toLocaleDateString('id-ID')} - ${record.periodEnd.toLocaleDateString('id-ID')}`,
			`Jumlah cuti: ${record.leaveDays} hari`,
			'',
			`Lihat detail: ${buildLeaveRequestUrl(record.id)}`,
		].join('\n'),
	});
}

async function sendStageActivationEmails(record) {
	const activeApprovals = getActiveApprovals(record);

	await Promise.allSettled(
		activeApprovals.map((approval) =>
			queueAndSendEmail(prisma, {
				employeeLeaveId: record.id,
				employeeLeaveApprovalId: approval.id,
				revisionNo: record.revisionNo,
				recipientEmail: approval.approverEmployee.email || '',
				recipientName: approval.approverEmployee.fullName,
				subject: `Approval cuti menunggu tindakan: ${record.requestNumber}`,
				textBody: [
					`Halo ${approval.approverEmployee.fullName},`,
					'',
					`Ada pengajuan cuti yang membutuhkan persetujuan Anda.`,
					`Nomor request: ${record.requestNumber}`,
					`Karyawan: ${record.employee.fullName} (${record.employee.employeeNo})`,
					`Jenis cuti: ${record.masterCutiKaryawan.leaveType}`,
					`Periode: ${record.periodStart.toLocaleDateString('id-ID')} - ${record.periodEnd.toLocaleDateString('id-ID')}`,
					`Jumlah cuti: ${record.leaveDays} hari`,
					'',
					`Buka approval: ${buildLeaveApprovalUrl(approval.id)}`,
				].join('\n'),
			}),
		),
	);
}

async function sendRejectedEmail(record) {
	await queueAndSendEmail(prisma, {
		employeeLeaveId: record.id,
		revisionNo: record.revisionNo,
		recipientEmail: record.employee.email || '',
		recipientName: record.employee.fullName,
		subject: `Pengajuan cuti ${record.requestNumber} ditolak`,
		textBody: [
			`Halo ${record.employee.fullName},`,
			'',
			`Pengajuan cuti Anda dengan nomor ${record.requestNumber} ditolak.`,
			`Alasan reject: ${record.rejectionNote || '-'}`,
			'',
			'Anda dapat membuka detail pengajuan untuk melakukan resubmit atau cancel.',
			`Detail: ${buildLeaveRequestUrl(record.id)}`,
		].join('\n'),
	});
}

async function sendApprovedEmail(record) {
	await queueAndSendEmail(prisma, {
		employeeLeaveId: record.id,
		revisionNo: record.revisionNo,
		recipientEmail: record.employee.email || '',
		recipientName: record.employee.fullName,
		subject: `Pengajuan cuti ${record.requestNumber} selesai di-approve`,
		textBody: [
			`Halo ${record.employee.fullName},`,
			'',
			`Pengajuan cuti Anda dengan nomor ${record.requestNumber} telah selesai di-approve.`,
			`Sisa cuti setelah approval: ${record.remainingLeave}`,
			'',
			`Detail: ${buildLeaveRequestUrl(record.id)}`,
		].join('\n'),
	});
}

router.get('/dashboard', async (req, res, next) => {
	try {
		const [guidanceCount, warningLetterCount, leaveRequestCount, guidanceRecords, warningLetters] = await Promise.all([
			prisma.guidanceRecord.count({
				where: { employeeId: req.employee.id },
			}),
			prisma.warningLetter.count({
				where: { employeeId: req.employee.id },
			}),
			prisma.employeeLeave.count({
				where: { employeeId: req.employee.id },
			}),
			prisma.guidanceRecord.findMany({
				where: { employeeId: req.employee.id },
				orderBy: [{ meetingDate: 'desc' }, { id: 'desc' }],
				take: 3,
			}),
			prisma.warningLetter.findMany({
				where: { employeeId: req.employee.id },
				include: {
					employee: {
						include: {
							department: true,
							jobRole: true,
							jobLevel: true,
						},
					},
					superiorEmployee: {
						include: {
							jobLevel: true,
						},
					},
				},
				orderBy: [{ letterDate: 'desc' }, { id: 'desc' }],
				take: 3,
			}),
		]);

		return res.json({
			profile: buildEmployeePortalProfile(req.employee),
			summary: {
				guidanceCount,
				warningLetterCount,
				leaveRequestCount,
			},
			recentGuidanceRecords: guidanceRecords.map(mapEmployeeGuidanceRecord),
			recentWarningLetters: warningLetters.map(mapEmployeeWarningLetter),
		});
	} catch (error) {
		return next(error);
	}
});

router.get('/profile', async (req, res) => {
	return res.json(buildEmployeePortalProfile(req.employee));
});

router.get('/guidance-records', async (req, res, next) => {
	try {
		const records = await prisma.guidanceRecord.findMany({
			where: { employeeId: req.employee.id },
			orderBy: [{ meetingDate: 'desc' }, { id: 'desc' }],
		});

		return res.json(records.map(mapEmployeeGuidanceRecord));
	} catch (error) {
		return next(error);
	}
});

router.get('/warning-letters', async (req, res, next) => {
	try {
		const records = await prisma.warningLetter.findMany({
			where: { employeeId: req.employee.id },
			include: {
				employee: {
					include: {
						department: true,
						jobRole: true,
						jobLevel: true,
					},
				},
				superiorEmployee: {
					include: {
						jobLevel: true,
					},
				},
			},
			orderBy: [{ letterDate: 'desc' }, { id: 'desc' }],
		});

		return res.json(records.map(mapEmployeeWarningLetter));
	} catch (error) {
		return next(error);
	}
});

router.get('/leave-requests', async (req, res, next) => {
	try {
		const currentYear = new Date().getFullYear();
		const [balance, rows] = await Promise.all([
			getLeaveDatabaseBalance(prisma, req.employee.id, currentYear).catch(() => null),
			prisma.employeeLeave.findMany({
				where: {
					employeeId: req.employee.id,
				},
				include: {
					employee: true,
					masterCutiKaryawan: true,
					approvals: {
						include: {
							approverEmployee: true,
						},
					},
				},
				orderBy: [{ submittedAt: 'desc' }, { id: 'desc' }],
			}),
		]);

		return res.json({
			year: currentYear,
			balance,
			rows: rows.map(mapLeaveRequestSummary),
		});
	} catch (error) {
		return next(error);
	}
});

router.get('/leave-requests/:id', async (req, res, next) => {
	try {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const record = await getLeaveRequestOrThrow(prisma, id);

		if (record.employeeId !== req.employee.id) {
			return res.status(403).json({ message: 'Anda tidak memiliki akses ke request cuti ini.' });
		}

		return res.json(mapLeaveRequestDetail(record, req.employee.id));
	} catch (error) {
		return next(error);
	}
});

router.post('/leave-requests', async (req, res, next) => {
	try {
		const payload = validateLeavePayload(req.body);
		await getLeaveTypeOrThrow(payload.masterCutiKaryawanId);

		const result = await prisma.$transaction(async (tx) => {
			const workflow = await createLeaveRequestRevision(tx, {
				employeeId: req.employee.id,
				leaveDays: payload.leaveDays,
				periodStart: payload.periodStart,
				periodEnd: payload.periodEnd,
			});

			const leaveRequest = await tx.employeeLeave.create({
				data: {
					requestNumber: `CT-${Date.now()}`,
					employeeId: req.employee.id,
					masterCutiKaryawanId: payload.masterCutiKaryawanId,
					leaveYear: workflow.leaveYear,
					revisionNo: 1,
					status: 'IN_APPROVAL',
					leaveDays: payload.leaveDays,
					periodStart: payload.periodStart,
					periodEnd: payload.periodEnd,
					balanceBefore: workflow.balanceBefore,
					remainingLeave: workflow.remainingLeave,
					currentStageOrder: workflow.stages[0]?.stageOrder || null,
					notes: payload.notes,
					submittedAt: new Date(),
				},
			});

			await tx.employeeLeave.update({
				where: { id: leaveRequest.id },
				data: {
					requestNumber: `CT-${new Date().getFullYear()}-${String(leaveRequest.id).padStart(6, '0')}`,
				},
			});

			await tx.employeeLeaveRevision.create({
				data: {
					employeeLeaveId: leaveRequest.id,
					revisionNo: 1,
					status: 'IN_APPROVAL',
					leaveDays: payload.leaveDays,
					periodStart: payload.periodStart,
					periodEnd: payload.periodEnd,
					balanceBefore: workflow.balanceBefore,
					remainingLeave: workflow.remainingLeave,
					notes: payload.notes,
					submittedAt: new Date(),
				},
			});

			await tx.employeeLeaveApproval.createMany({
				data: workflow.stages.flatMap((stage) =>
					stage.approvers.map((approver) => ({
						employeeLeaveId: leaveRequest.id,
						revisionNo: 1,
						stageOrder: stage.stageOrder,
						stageType: stage.stageType,
						approverEmployeeId: approver.id,
						status: stage.stageOrder === workflow.stages[0].stageOrder ? 'PENDING' : 'WAITING',
					})),
				),
			});

			return leaveRequest.id;
		});

		const record = await getLeaveRequestOrThrow(prisma, result);
		await Promise.allSettled([sendSubmittedEmail(record), sendStageActivationEmails(record)]);

		return res.status(201).json(mapLeaveRequestDetail(record, req.employee.id));
	} catch (error) {
		return next(error);
	}
});

router.post('/leave-requests/:id/resubmit', async (req, res, next) => {
	try {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const payload = validateLeavePayload(req.body);
		await getLeaveTypeOrThrow(payload.masterCutiKaryawanId);

		const result = await prisma.$transaction(async (tx) => {
			const existing = await getLeaveRequestOrThrow(tx, id);

			if (existing.employeeId !== req.employee.id) {
				throw Object.assign(new Error('Anda tidak memiliki akses ke request cuti ini.'), {
					statusCode: 403,
				});
			}

			if (existing.status !== 'REJECTED') {
				throw Object.assign(new Error('Hanya request cuti berstatus rejected yang dapat di-resubmit.'), {
					statusCode: 400,
				});
			}

			const nextRevisionNo = existing.revisionNo + 1;
			const workflow = await createLeaveRequestRevision(tx, {
				employeeId: req.employee.id,
				employeeLeaveId: existing.id,
				leaveDays: payload.leaveDays,
				periodStart: payload.periodStart,
				periodEnd: payload.periodEnd,
			});

			await tx.employeeLeave.update({
				where: { id },
				data: {
					masterCutiKaryawanId: payload.masterCutiKaryawanId,
					leaveYear: workflow.leaveYear,
					revisionNo: nextRevisionNo,
					status: 'IN_APPROVAL',
					leaveDays: payload.leaveDays,
					periodStart: payload.periodStart,
					periodEnd: payload.periodEnd,
					balanceBefore: workflow.balanceBefore,
					remainingLeave: workflow.remainingLeave,
					currentStageOrder: workflow.stages[0]?.stageOrder || null,
					notes: payload.notes,
					rejectionNote: null,
					submittedAt: new Date(),
					rejectedAt: null,
					cancelledAt: null,
					approvedAt: null,
				},
			});

			await tx.employeeLeaveRevision.create({
				data: {
					employeeLeaveId: id,
					revisionNo: nextRevisionNo,
					status: 'IN_APPROVAL',
					leaveDays: payload.leaveDays,
					periodStart: payload.periodStart,
					periodEnd: payload.periodEnd,
					balanceBefore: workflow.balanceBefore,
					remainingLeave: workflow.remainingLeave,
					notes: payload.notes,
					submittedAt: new Date(),
				},
			});

			await tx.employeeLeaveApproval.createMany({
				data: workflow.stages.flatMap((stage) =>
					stage.approvers.map((approver) => ({
						employeeLeaveId: id,
						revisionNo: nextRevisionNo,
						stageOrder: stage.stageOrder,
						stageType: stage.stageType,
						approverEmployeeId: approver.id,
						status: stage.stageOrder === workflow.stages[0].stageOrder ? 'PENDING' : 'WAITING',
					})),
				),
			});

			return id;
		});

		const record = await getLeaveRequestOrThrow(prisma, result);
		await Promise.allSettled([sendSubmittedEmail(record), sendStageActivationEmails(record)]);

		return res.json(mapLeaveRequestDetail(record, req.employee.id));
	} catch (error) {
		return next(error);
	}
});

router.post('/leave-requests/:id/cancel', async (req, res, next) => {
	try {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		await prisma.$transaction(async (tx) => {
			const existing = await getLeaveRequestOrThrow(tx, id);

			if (existing.employeeId !== req.employee.id) {
				throw Object.assign(new Error('Anda tidak memiliki akses ke request cuti ini.'), {
					statusCode: 403,
				});
			}

			if (existing.status === 'APPROVED' || existing.status === 'CANCELLED') {
				throw Object.assign(new Error('Request cuti ini tidak dapat dibatalkan lagi.'), {
					statusCode: 400,
				});
			}

			await tx.employeeLeave.update({
				where: { id },
				data: {
					status: 'CANCELLED',
					currentStageOrder: null,
					cancelledAt: new Date(),
				},
			});

			await tx.employeeLeaveRevision.update({
				where: {
					employeeLeaveId_revisionNo: {
						employeeLeaveId: id,
						revisionNo: existing.revisionNo,
					},
				},
				data: {
					status: 'CANCELLED',
					cancelledAt: new Date(),
				},
			});

			await tx.employeeLeaveApproval.updateMany({
				where: {
					employeeLeaveId: id,
					revisionNo: existing.revisionNo,
					status: {
						in: ['WAITING', 'PENDING'],
					},
				},
				data: {
					status: 'CANCELLED',
				},
			});
		});

		const record = await getLeaveRequestOrThrow(prisma, id);
		return res.json(mapLeaveRequestDetail(record, req.employee.id));
	} catch (error) {
		return next(error);
	}
});

router.get('/leave-approvals', async (req, res, next) => {
	try {
		const rows = await listApprovalsForEmployee(req.employee.id);
		return res.json(rows);
	} catch (error) {
		return next(error);
	}
});

router.get('/leave-approvals/:id', async (req, res, next) => {
	try {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const approval = await prisma.employeeLeaveApproval.findUnique({
			where: { id },
			include: {
				approverEmployee: {
					include: {
						jobLevel: true,
					},
				},
				employeeLeave: {
					include: {
						employee: {
							include: {
								jobLevel: true,
								department: true,
							},
						},
						masterCutiKaryawan: true,
						revisions: true,
						approvals: {
							include: {
								approverEmployee: {
									include: {
										jobLevel: true,
										department: true,
									},
								},
							},
						},
						emailOutbox: true,
					},
				},
			},
		});

		if (!approval) {
			return res.status(404).json({ message: 'Approval cuti tidak ditemukan.' });
		}

		if (approval.approverEmployeeId !== req.employee.id) {
			return res.status(403).json({ message: 'Anda tidak memiliki akses ke approval ini.' });
		}

		return res.json({
			approval: mapApprovalRow(approval, req.employee.id),
			request: mapLeaveRequestDetail(approval.employeeLeave, req.employee.id),
		});
	} catch (error) {
		return next(error);
	}
});

router.post('/leave-approvals/:id/approve', async (req, res, next) => {
	try {
		const id = Number(req.params.id);
		const actionNote = normalizeString(req.body?.note || '');

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const result = await prisma.$transaction(async (tx) => {
			const approval = await tx.employeeLeaveApproval.findUnique({
				where: { id },
				include: {
					employeeLeave: true,
				},
			});

			if (!approval) {
				throw Object.assign(new Error('Approval cuti tidak ditemukan.'), { statusCode: 404 });
			}

			if (approval.approverEmployeeId !== req.employee.id) {
				throw Object.assign(new Error('Anda tidak memiliki akses untuk approval ini.'), {
					statusCode: 403,
				});
			}

			if (approval.status !== 'PENDING') {
				throw Object.assign(new Error('Approval ini sudah tidak aktif untuk diproses.'), {
					statusCode: 409,
				});
			}

			if (
				approval.employeeLeave.revisionNo !== approval.revisionNo ||
				approval.employeeLeave.currentStageOrder !== approval.stageOrder ||
				!['SUBMITTED', 'IN_APPROVAL'].includes(approval.employeeLeave.status)
			) {
				throw Object.assign(new Error('Tahap approval ini sudah tidak aktif.'), {
					statusCode: 409,
				});
			}

			const updated = await tx.employeeLeaveApproval.updateMany({
				where: {
					id,
					status: 'PENDING',
				},
				data: {
					status: 'APPROVED',
					actionNote: actionNote || null,
					actedAt: new Date(),
				},
			});

			if (updated.count !== 1) {
				throw Object.assign(new Error('Approval ini sudah diproses oleh approver lain.'), {
					statusCode: 409,
				});
			}

			await tx.employeeLeaveApproval.updateMany({
				where: {
					employeeLeaveId: approval.employeeLeaveId,
					revisionNo: approval.revisionNo,
					stageOrder: approval.stageOrder,
					id: { not: id },
					status: 'PENDING',
				},
				data: {
					status: 'LOCKED',
				},
			});

			const nextStage = await tx.employeeLeaveApproval.findFirst({
				where: {
					employeeLeaveId: approval.employeeLeaveId,
					revisionNo: approval.revisionNo,
					stageOrder: {
						gt: approval.stageOrder,
					},
					status: 'WAITING',
				},
				orderBy: {
					stageOrder: 'asc',
				},
			});

			if (nextStage) {
				await tx.employeeLeave.update({
					where: { id: approval.employeeLeaveId },
					data: {
						status: 'IN_APPROVAL',
						currentStageOrder: nextStage.stageOrder,
					},
				});

				await tx.employeeLeaveRevision.update({
					where: {
						employeeLeaveId_revisionNo: {
							employeeLeaveId: approval.employeeLeaveId,
							revisionNo: approval.revisionNo,
						},
					},
					data: {
						status: 'IN_APPROVAL',
					},
				});

				await tx.employeeLeaveApproval.updateMany({
					where: {
						employeeLeaveId: approval.employeeLeaveId,
						revisionNo: approval.revisionNo,
						stageOrder: nextStage.stageOrder,
						status: 'WAITING',
					},
					data: {
						status: 'PENDING',
					},
				});
			} else {
				await tx.employeeLeave.update({
					where: { id: approval.employeeLeaveId },
					data: {
						status: 'APPROVED',
						currentStageOrder: null,
						approvedAt: new Date(),
					},
				});

				await tx.employeeLeaveRevision.update({
					where: {
						employeeLeaveId_revisionNo: {
							employeeLeaveId: approval.employeeLeaveId,
							revisionNo: approval.revisionNo,
						},
					},
					data: {
						status: 'APPROVED',
						approvedAt: new Date(),
					},
				});

				await createLeaveDatabaseHistory(tx, {
					employeeId: approval.employeeLeave.employeeId,
					masterCutiKaryawanId: approval.employeeLeave.masterCutiKaryawanId,
					leaveDays: approval.employeeLeave.leaveDays,
					periodStart: approval.employeeLeave.periodStart,
					periodEnd: approval.employeeLeave.periodEnd,
					remainingLeave: approval.employeeLeave.remainingLeave,
					notes: approval.employeeLeave.notes
						? `${approval.employeeLeave.notes}\n\nRef Workflow: ${approval.employeeLeave.requestNumber}`
						: `Ref Workflow: ${approval.employeeLeave.requestNumber}`,
				});
			}

			return approval.employeeLeaveId;
		});

		const record = await getLeaveRequestOrThrow(prisma, result);

		if (record.status === 'APPROVED') {
			await sendApprovedEmail(record);
		} else {
			await sendStageActivationEmails(record);
		}

		const approval = await prisma.employeeLeaveApproval.findUnique({
			where: { id },
			include: {
				approverEmployee: {
					include: {
						jobLevel: true,
					},
				},
			},
		});

		return res.json({
			approval: mapApprovalRow(approval, req.employee.id),
			request: mapLeaveRequestDetail(record, req.employee.id),
		});
	} catch (error) {
		return next(error);
	}
});

router.post('/leave-approvals/:id/reject', async (req, res, next) => {
	try {
		const id = Number(req.params.id);
		const actionNote = normalizeString(req.body?.note || '');

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		if (!actionNote) {
			return res.status(400).json({ message: 'Catatan reject wajib diisi.' });
		}

		const result = await prisma.$transaction(async (tx) => {
			const approval = await tx.employeeLeaveApproval.findUnique({
				where: { id },
				include: {
					employeeLeave: true,
				},
			});

			if (!approval) {
				throw Object.assign(new Error('Approval cuti tidak ditemukan.'), { statusCode: 404 });
			}

			if (approval.approverEmployeeId !== req.employee.id) {
				throw Object.assign(new Error('Anda tidak memiliki akses untuk approval ini.'), {
					statusCode: 403,
				});
			}

			if (approval.status !== 'PENDING') {
				throw Object.assign(new Error('Approval ini sudah tidak aktif untuk diproses.'), {
					statusCode: 409,
				});
			}

			if (
				approval.employeeLeave.revisionNo !== approval.revisionNo ||
				approval.employeeLeave.currentStageOrder !== approval.stageOrder ||
				!['SUBMITTED', 'IN_APPROVAL'].includes(approval.employeeLeave.status)
			) {
				throw Object.assign(new Error('Tahap approval ini sudah tidak aktif.'), {
					statusCode: 409,
				});
			}

			const updated = await tx.employeeLeaveApproval.updateMany({
				where: {
					id,
					status: 'PENDING',
				},
				data: {
					status: 'REJECTED',
					actionNote,
					actedAt: new Date(),
				},
			});

			if (updated.count !== 1) {
				throw Object.assign(new Error('Approval ini sudah diproses oleh approver lain.'), {
					statusCode: 409,
				});
			}

			await tx.employeeLeaveApproval.updateMany({
				where: {
					employeeLeaveId: approval.employeeLeaveId,
					revisionNo: approval.revisionNo,
					stageOrder: approval.stageOrder,
					id: { not: id },
					status: 'PENDING',
				},
				data: {
					status: 'LOCKED',
				},
			});

			await tx.employeeLeaveApproval.updateMany({
				where: {
					employeeLeaveId: approval.employeeLeaveId,
					revisionNo: approval.revisionNo,
					status: 'WAITING',
				},
				data: {
					status: 'CANCELLED',
				},
			});

			await tx.employeeLeave.update({
				where: { id: approval.employeeLeaveId },
				data: {
					status: 'REJECTED',
					currentStageOrder: null,
					rejectionNote: actionNote,
					rejectedAt: new Date(),
				},
			});

			await tx.employeeLeaveRevision.update({
				where: {
					employeeLeaveId_revisionNo: {
						employeeLeaveId: approval.employeeLeaveId,
						revisionNo: approval.revisionNo,
					},
				},
				data: {
					status: 'REJECTED',
					rejectionNote: actionNote,
					rejectedAt: new Date(),
				},
			});

			return approval.employeeLeaveId;
		});

		const record = await getLeaveRequestOrThrow(prisma, result);
		await sendRejectedEmail(record);

		const approval = await prisma.employeeLeaveApproval.findUnique({
			where: { id },
			include: {
				approverEmployee: {
					include: {
						jobLevel: true,
					},
				},
			},
		});

		return res.json({
			approval: mapApprovalRow(approval, req.employee.id),
			request: mapLeaveRequestDetail(record, req.employee.id),
		});
	} catch (error) {
		return next(error);
	}
});

export default router;
