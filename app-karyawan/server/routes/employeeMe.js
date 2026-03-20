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
import {
	applyApprovedLeaveToDatabase,
	getLeaveDatabaseBalance,
	listLeaveTypeBalancesForEmployeeYear,
} from '../lib/leaveDatabase.js';
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
	const rawReplacementEmployeeIds = Array.isArray(payload.replacementEmployeeIds)
		? payload.replacementEmployeeIds
		: typeof payload.replacementEmployeeId !== 'undefined' && payload.replacementEmployeeId !== null
			? [payload.replacementEmployeeId]
			: [];
	const replacementEmployeeIds = rawReplacementEmployeeIds.map((value) => Number(value));
	const periodStart = toDateOnly(payload.periodStart);
	const periodEnd = toDateOnly(payload.periodEnd);
	const notes = normalizeString(payload.notes || '');
	const leaveAddress = normalizeString(payload.leaveAddress || '');
	const leaveReason = normalizeString(payload.leaveReason || '');

	if (!Number.isInteger(masterCutiKaryawanId)) {
		throw Object.assign(new Error('Jenis cuti wajib dipilih.'), { statusCode: 400 });
	}

	if (!Number.isInteger(leaveDays) || leaveDays <= 0) {
		throw Object.assign(new Error('Jumlah cuti wajib diisi dengan angka yang valid.'), { statusCode: 400 });
	}

	if (!leaveAddress) {
		throw Object.assign(new Error('Alamat selama cuti wajib diisi.'), { statusCode: 400 });
	}

	if (!leaveReason) {
		throw Object.assign(new Error('Alasan cuti wajib diisi.'), { statusCode: 400 });
	}

	if (replacementEmployeeIds.length === 0) {
		throw Object.assign(new Error('Minimal 1 pengganti selama cuti wajib dipilih.'), { statusCode: 400 });
	}

	if (replacementEmployeeIds.length > 4) {
		throw Object.assign(new Error('Maksimal 4 pengganti selama cuti dapat dipilih.'), { statusCode: 400 });
	}

	if (replacementEmployeeIds.some((value) => !Number.isInteger(value))) {
		throw Object.assign(new Error('Data pengganti selama cuti tidak valid.'), { statusCode: 400 });
	}

	if (new Set(replacementEmployeeIds).size !== replacementEmployeeIds.length) {
		throw Object.assign(new Error('Pengganti selama cuti tidak boleh duplikat.'), { statusCode: 400 });
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
		replacementEmployeeIds,
		periodStart,
		periodEnd,
		leaveAddress,
		leaveReason,
		notes: notes || null,
	};
}

function mapReplacementOption(employee) {
	return {
		id: employee.id,
		fullName: employee.fullName,
		employeeNo: employee.employeeNo,
		departmentName: employee.department?.name || '',
		jobRoleName: employee.jobRole?.name || '',
	};
}

async function getReplacementOptions(employee, tx = prisma) {
	const sameRoleAndDepartment = await tx.employee.findMany({
		where: {
			id: { not: employee.id },
			departmentId: employee.departmentId,
			jobRoleId: employee.jobRoleId,
		},
		include: {
			department: true,
			jobRole: true,
		},
		orderBy: [{ fullName: 'asc' }, { employeeNo: 'asc' }],
	});

	if (sameRoleAndDepartment.length > 0) {
		return sameRoleAndDepartment.map(mapReplacementOption);
	}

	const sameDepartment = await tx.employee.findMany({
		where: {
			id: { not: employee.id },
			departmentId: employee.departmentId,
		},
		include: {
			department: true,
			jobRole: true,
		},
		orderBy: [{ fullName: 'asc' }, { employeeNo: 'asc' }],
	});

	return sameDepartment.map(mapReplacementOption);
}

async function getAvailableLeaveTypeOptions(employeeId, year, tx = prisma) {
	const balances = await listLeaveTypeBalancesForEmployeeYear(tx, employeeId, year);

	return balances
		.filter((item) => item.currentBalance > 0)
		.sort((left, right) => left.reference.leaveType.localeCompare(right.reference.leaveType))
		.map((item) => ({
			id: item.masterCutiKaryawanId,
			leaveType: item.reference.leaveType,
			availableLeaveBalance: item.currentBalance,
			referenceId: item.reference.id,
			referencePeriodStart: item.reference.periodStart,
			referencePeriodEnd: item.reference.periodEnd,
		}));
}

async function assertReplacementEmployeesValid(employee, replacementEmployeeIds, tx = prisma) {
	const options = await getReplacementOptions(employee, tx);
	const optionMap = new Map(options.map((item) => [item.id, item]));
	const seenIds = new Set();
	const matches = replacementEmployeeIds.map((replacementEmployeeId) => {
		if (seenIds.has(replacementEmployeeId)) {
			throw Object.assign(new Error('Pengganti selama cuti tidak boleh duplikat.'), {
				statusCode: 400,
			});
		}

		seenIds.add(replacementEmployeeId);
		const match = optionMap.get(replacementEmployeeId);

		if (!match) {
			throw Object.assign(new Error('Pengganti selama cuti tidak valid untuk karyawan ini.'), {
				statusCode: 400,
			});
		}

		return match;
	});

	return matches;
}

async function getAvailableLeaveBalanceOrThrow(employeeId, masterCutiKaryawanId, year, tx = prisma) {
	const balance = await getLeaveDatabaseBalance(tx, employeeId, year, masterCutiKaryawanId);

	if (!balance) {
		throw Object.assign(new Error('Saldo cuti untuk jenis cuti ini belum tersedia.'), {
			statusCode: 400,
		});
	}

	return balance;
}

function getReplacementEmployeesForRecord(record) {
	return (record.replacementAssignments || [])
		.filter((item) => item.revisionNo === record.revisionNo)
		.slice()
		.sort((left, right) => {
			if (left.sequenceNo !== right.sequenceNo) {
				return left.sequenceNo - right.sequenceNo;
			}

			return left.id - right.id;
		})
		.map((item) => item.replacementEmployee);
}

function formatReplacementEmployeesForEmail(record) {
	const replacements = getReplacementEmployeesForRecord(record);

	if (!replacements.length) {
		return '-';
	}

	return replacements.map((item, index) => `${index + 1}. ${item.fullName} (${item.employeeNo})`).join('\n');
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
			`Alamat selama cuti: ${record.leaveAddress || '-'}`,
			`Alasan cuti: ${record.leaveReason || '-'}`,
			'Pengganti selama cuti:',
			formatReplacementEmployeesForEmail(record),
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
					`Alamat selama cuti: ${record.leaveAddress || '-'}`,
					`Alasan cuti: ${record.leaveReason || '-'}`,
					'Pengganti selama cuti:',
					formatReplacementEmployeesForEmail(record),
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
			`Jenis cuti: ${record.masterCutiKaryawan.leaveType}`,
			`Alamat selama cuti: ${record.leaveAddress || '-'}`,
			`Alasan cuti: ${record.leaveReason || '-'}`,
			'Pengganti selama cuti:',
			formatReplacementEmployeesForEmail(record),
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
			`Jenis cuti: ${record.masterCutiKaryawan.leaveType}`,
			`Alamat selama cuti: ${record.leaveAddress || '-'}`,
			`Alasan cuti: ${record.leaveReason || '-'}`,
			'Pengganti selama cuti:',
			formatReplacementEmployeesForEmail(record),
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
					replacementAssignments: {
						include: {
							replacementEmployee: true,
						},
						orderBy: [{ revisionNo: 'desc' }, { sequenceNo: 'asc' }, { id: 'asc' }],
					},
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

router.get('/leave-form-options', async (req, res, next) => {
	try {
		const now = new Date();
		const currentYear = now.getFullYear();
		const [leaveTypeOptions, replacementOptions] = await Promise.all([
			getAvailableLeaveTypeOptions(req.employee.id, currentYear),
			getReplacementOptions(req.employee),
		]);

		return res.json({
			submissionDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
				now.getDate(),
			).padStart(2, '0')}`,
			year: currentYear,
			leaveTypeOptions,
			replacementOptions,
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
		const leaveYear = payload.periodStart.getUTCFullYear();

		const result = await prisma.$transaction(async (tx) => {
			const availableBalance = await getAvailableLeaveBalanceOrThrow(
				req.employee.id,
				payload.masterCutiKaryawanId,
				leaveYear,
				tx,
			);
			await assertReplacementEmployeesValid(req.employee, payload.replacementEmployeeIds, tx);

			if (payload.leaveDays > availableBalance.currentBalance) {
				throw Object.assign(new Error('Jumlah cuti tidak cukup untuk jenis cuti yang dipilih.'), {
					statusCode: 400,
				});
			}

			const workflow = await createLeaveRequestRevision(tx, {
				employeeId: req.employee.id,
				masterCutiKaryawanId: payload.masterCutiKaryawanId,
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
					leaveAddress: payload.leaveAddress,
					leaveReason: payload.leaveReason,
					replacementEmployeeId: payload.replacementEmployeeIds[0],
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
					masterCutiKaryawanId: payload.masterCutiKaryawanId,
					status: 'IN_APPROVAL',
					leaveDays: payload.leaveDays,
					periodStart: payload.periodStart,
					periodEnd: payload.periodEnd,
					balanceBefore: workflow.balanceBefore,
					remainingLeave: workflow.remainingLeave,
					notes: payload.notes,
					leaveAddress: payload.leaveAddress,
					leaveReason: payload.leaveReason,
					replacementEmployeeId: payload.replacementEmployeeIds[0],
					submittedAt: new Date(),
				},
			});

			await tx.employeeLeaveReplacementAssignee.createMany({
				data: payload.replacementEmployeeIds.map((replacementEmployeeId, index) => ({
					employeeLeaveId: leaveRequest.id,
					revisionNo: 1,
					replacementEmployeeId,
					sequenceNo: index + 1,
				})),
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
			const leaveYear = payload.periodStart.getUTCFullYear();
			const availableBalance = await getAvailableLeaveBalanceOrThrow(
				req.employee.id,
				payload.masterCutiKaryawanId,
				leaveYear,
				tx,
			);
			await assertReplacementEmployeesValid(req.employee, payload.replacementEmployeeIds, tx);

			if (payload.leaveDays > availableBalance.currentBalance) {
				throw Object.assign(new Error('Jumlah cuti tidak cukup untuk jenis cuti yang dipilih.'), {
					statusCode: 400,
				});
			}

			const workflow = await createLeaveRequestRevision(tx, {
				employeeId: req.employee.id,
				employeeLeaveId: existing.id,
				masterCutiKaryawanId: payload.masterCutiKaryawanId,
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
					leaveAddress: payload.leaveAddress,
					leaveReason: payload.leaveReason,
					replacementEmployeeId: payload.replacementEmployeeIds[0],
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
					masterCutiKaryawanId: payload.masterCutiKaryawanId,
					status: 'IN_APPROVAL',
					leaveDays: payload.leaveDays,
					periodStart: payload.periodStart,
					periodEnd: payload.periodEnd,
					balanceBefore: workflow.balanceBefore,
					remainingLeave: workflow.remainingLeave,
					notes: payload.notes,
					leaveAddress: payload.leaveAddress,
					leaveReason: payload.leaveReason,
					replacementEmployeeId: payload.replacementEmployeeIds[0],
					submittedAt: new Date(),
				},
			});

			await tx.employeeLeaveReplacementAssignee.createMany({
				data: payload.replacementEmployeeIds.map((replacementEmployeeId, index) => ({
					employeeLeaveId: id,
					revisionNo: nextRevisionNo,
					replacementEmployeeId,
					sequenceNo: index + 1,
				})),
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
						replacementAssignments: {
							include: {
								replacementEmployee: true,
							},
							orderBy: [{ revisionNo: 'desc' }, { sequenceNo: 'asc' }, { id: 'asc' }],
						},
						revisions: {
							include: {
								masterCutiKaryawan: true,
								replacementAssignments: {
									include: {
										replacementEmployee: true,
									},
									orderBy: [{ sequenceNo: 'asc' }, { id: 'asc' }],
								},
							},
						},
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
				const approvedAt = new Date();
				const leaveDatabaseResult = await applyApprovedLeaveToDatabase(tx, {
					employeeId: approval.employeeLeave.employeeId,
					masterCutiKaryawanId: approval.employeeLeave.masterCutiKaryawanId,
					year: approval.employeeLeave.leaveYear,
					employeeLeaveId: approval.employeeLeaveId,
					leaveDays: approval.employeeLeave.leaveDays,
					periodStart: approval.employeeLeave.periodStart,
					periodEnd: approval.employeeLeave.periodEnd,
					changeDate: approvedAt,
					notes: approval.employeeLeave.notes
						? `${approval.employeeLeave.notes}\n\nRef Workflow: ${approval.employeeLeave.requestNumber}`
						: `Ref Workflow: ${approval.employeeLeave.requestNumber}`,
				});

				await tx.employeeLeave.update({
					where: { id: approval.employeeLeaveId },
					data: {
						status: 'APPROVED',
						currentStageOrder: null,
						remainingLeave: leaveDatabaseResult.balanceAfter,
						approvedAt,
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
						remainingLeave: leaveDatabaseResult.balanceAfter,
						approvedAt,
					},
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

function getEmployeePriority(item) {
	switch (item.category) {
		case 'WARNING_LETTER':
			return 500;
		case 'LEAVE_REJECTED':
			return 400;
		case 'LEAVE_APPROVAL_PENDING':
			return 300;
		case 'LEAVE_APPROVED':
			return 200;
		case 'GUIDANCE_RECORD':
			return 100;
		default:
			return 0;
	}
}

function compareEmployeeNotifications(left, right) {
	const unreadDelta = Number(left.isRead) - Number(right.isRead);

	if (unreadDelta !== 0) {
		return unreadDelta;
	}

	const priorityDelta = getEmployeePriority(right) - getEmployeePriority(left);

	if (priorityDelta !== 0) {
		return priorityDelta;
	}

	const leftTime = new Date(left.sortDate).getTime();
	const rightTime = new Date(right.sortDate).getTime();

	return rightTime - leftTime;
}

function formatLongDateForNotice(value) {
	if (!value) return '-';
	const parsed = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(parsed.getTime())) return '-';
	return parsed.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function createPendingApprovalNotification(approval) {
	const activatedAt = approval.updatedAt || approval.createdAt;

	return {
		id: `emp-approval-pending-${approval.id}-${activatedAt.toISOString()}`,
		category: 'LEAVE_APPROVAL_PENDING',
		severity: 'warning',
		title: `Approval menunggu tindakan: ${approval.employeeLeave.requestNumber}`,
		description: `Permohonan cuti ${approval.employeeLeave.employee.fullName} menunggu persetujuan Anda.`,
		targetPath: `/karyawan/cuti/approval/${approval.id}`,
		targetSearch: '',
		dateLabel: `Sejak: ${formatLongDateForNotice(activatedAt)}`,
		sortDate: activatedAt.toISOString(),
		href: `/karyawan/cuti/approval/${approval.id}`,
	};
}

function createApprovedLeaveNotification(record) {
	const approvedAt = record.approvedAt || record.updatedAt || record.createdAt;

	return {
		id: `emp-leave-approved-${record.id}-${approvedAt.toISOString()}`,
		category: 'LEAVE_APPROVED',
		severity: 'success',
		title: `Cuti Disetujui: ${record.requestNumber}`,
		description: `Permohonan cuti Anda telah disetujui.`,
		targetPath: `/karyawan/cuti/${record.id}`,
		targetSearch: '',
		dateLabel: `Approved: ${formatLongDateForNotice(approvedAt)}`,
		sortDate: approvedAt.toISOString(),
		href: `/karyawan/cuti/${record.id}`,
	};
}

function createRejectedLeaveNotification(record) {
	const rejectedAt = record.rejectedAt || record.updatedAt || record.createdAt;

	return {
		id: `emp-leave-rejected-${record.id}-rev-${record.revisionNo}-${rejectedAt.toISOString()}`,
		category: 'LEAVE_REJECTED',
		severity: 'error',
		title: `Cuti Ditolak: ${record.requestNumber}`,
		description: `Permohonan cuti Anda ditolak. Silakan cek detailnya.`,
		targetPath: `/karyawan/cuti/${record.id}`,
		targetSearch: '',
		dateLabel: `Rejected: ${formatLongDateForNotice(rejectedAt)}`,
		sortDate: rejectedAt.toISOString(),
		href: `/karyawan/cuti/${record.id}`,
	};
}

function createGuidanceNotification(record) {
	const meetingDate = record.meetingDate;

	return {
		id: `emp-guidance-${record.id}-${meetingDate.toISOString()}`,
		category: 'GUIDANCE_RECORD',
		severity: 'info',
		title: `Catatan Bimbingan Baru`,
		description: `Ada catatan ${record.category === 'GUIDANCE' ? 'bimbingan' : 'pengarahan'} baru untuk Anda.`,
		targetPath: `/karyawan/bimbingan-pengarahan`,
		targetSearch: '',
		dateLabel: `Tanggal: ${formatLongDateForNotice(meetingDate)}`,
		sortDate: meetingDate.toISOString(),
		href: `/karyawan/bimbingan-pengarahan`,
	};
}

function createWarningLetterNotification(record) {
	const letterDate = record.letterDate;
	const isWarning = record.category === 'WARNING_LETTER';

	return {
		id: `emp-warning-${record.id}-${letterDate.toISOString()}`,
		category: 'WARNING_LETTER',
		severity: 'error',
		title: `Surat ${isWarning ? 'Peringatan' : 'Teguran'} Baru`,
		description: `Anda menerima Surat ${isWarning ? `Peringatan ke-${record.warningLevel}` : 'Teguran'}.`,
		targetPath: `/karyawan/surat-peringatan`,
		targetSearch: '',
		dateLabel: `Tanggal: ${formatLongDateForNotice(letterDate)}`,
		sortDate: letterDate.toISOString(),
		href: `/karyawan/surat-peringatan`,
	};
}

async function buildEmployeeLiveNotifications(employeeId) {
	const threshold14Days = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
	const threshold30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

	const [
		pendingApprovals,
		approvedLeaves,
		rejectedLeaves,
		guidances,
		warnings,
	] = await Promise.all([
		prisma.employeeLeaveApproval.findMany({
			where: {
				approverEmployeeId: employeeId,
				status: 'PENDING',
			},
			include: {
				employeeLeave: {
					include: { employee: true },
				},
			},
			orderBy: [{ createdAt: 'desc' }],
		}),
		prisma.employeeLeave.findMany({
			where: {
				employeeId,
				status: 'APPROVED',
				approvedAt: { gte: threshold14Days },
			},
			orderBy: [{ approvedAt: 'desc' }],
		}),
		prisma.employeeLeave.findMany({
			where: {
				employeeId,
				status: 'REJECTED',
				updatedAt: { gte: threshold14Days },
			},
			orderBy: [{ updatedAt: 'desc' }],
		}),
		prisma.guidanceRecord.findMany({
			where: {
				employeeId,
				meetingDate: { gte: threshold14Days },
			},
			orderBy: [{ meetingDate: 'desc' }],
		}),
		prisma.warningLetter.findMany({
			where: {
				employeeId,
				letterDate: { gte: threshold30Days },
			},
			orderBy: [{ letterDate: 'desc' }],
		}),
	]);

	return [
		...pendingApprovals.map(createPendingApprovalNotification),
		...approvedLeaves.map(createApprovedLeaveNotification),
		...rejectedLeaves.map(createRejectedLeaveNotification),
		...guidances.map(createGuidanceNotification),
		...warnings.map(createWarningLetterNotification),
	];
}

async function attachEmployeeReadState(employeeId, items) {
	if (!items.length) return [];

	const reads = await prisma.adminNotificationReadState.findMany({
		where: {
			employeeId,
			notificationId: { in: items.map((item) => item.id) },
		},
		select: { notificationId: true, readAt: true },
	});
	const readMap = new Map(reads.map((item) => [item.notificationId, item.readAt]));

	return items.map((item) => ({
		...item,
		isRead: readMap.has(item.id),
		readAt: readMap.get(item.id)?.toISOString() || null,
	}));
}

async function markEmployeeNotificationsRead(employeeId, notificationIds = []) {
	const uniqueNotificationIds = [...new Set(notificationIds.map((value) => String(value).trim()).filter(Boolean))];
	if (!uniqueNotificationIds.length) return;

	await prisma.adminNotificationReadState.createMany({
		data: uniqueNotificationIds.map((notificationId) => ({
			employeeId,
			notificationId,
			readAt: new Date(),
		})),
		skipDuplicates: true,
	});
}

router.get('/notifications', async (req, res, next) => {
	try {
		const employeeId = req.employee.id;
		const items = await attachEmployeeReadState(employeeId, await buildEmployeeLiveNotifications(employeeId));
		const sortedItems = items.sort(compareEmployeeNotifications);

		return res.json({
			totalCount: sortedItems.length,
			unreadCount: sortedItems.filter((item) => !item.isRead).length,
			items: sortedItems.slice(0, 50),
		});
	} catch (error) {
		return next(error);
	}
});

router.post('/notifications/read', async (req, res, next) => {
	try {
		const employeeId = req.employee.id;
		const notificationId = String(req.body?.notificationId || '').trim();

		if (!notificationId) {
			return res.status(400).json({ message: 'notificationId wajib diisi.' });
		}

		await markEmployeeNotificationsRead(employeeId, [notificationId]);
		return res.status(204).send();
	} catch (error) {
		return next(error);
	}
});

router.post('/notifications/read-all', async (req, res, next) => {
	try {
		const employeeId = req.employee.id;
		const notificationIds = Array.isArray(req.body?.notificationIds) ? req.body.notificationIds : [];

		await markEmployeeNotificationsRead(employeeId, notificationIds);
		return res.status(204).send();
	} catch (error) {
		return next(error);
	}
});

export default router;
