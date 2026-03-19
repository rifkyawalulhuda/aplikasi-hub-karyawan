import prisma from './prisma.js';
import { getLeaveDatabaseBalance } from './leaveDatabase.js';

const APPROVAL_STAGE_SEQUENCE = [
	{ stageType: 'FOREMAN', jobLevelName: 'Foreman' },
	{ stageType: 'GENERAL_FOREMAN', jobLevelName: 'General Foreman' },
	{ stageType: 'SECTION_CHIEF', jobLevelName: 'Section Chief' },
	{ stageType: 'DY_DEPT_MANAGER', jobLevelName: 'Dy. Dept. Manager' },
	{ stageType: 'DEPT_MANAGER', jobLevelName: 'Dept. Manager' },
	{ stageType: 'SITE_DIV_MANAGER', jobLevelName: 'Site/Div. Manager' },
];

function normalizeString(value = '') {
	return String(value).trim().replace(/\s+/g, ' ');
}

function normalizeJobLevelName(value = '') {
	return normalizeString(value).toLowerCase();
}

function formatDateForClient(value) {
	if (!value) {
		return null;
	}

	return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(
		2,
		'0',
	)}`;
}

function toDateOnly(value) {
	if (!value) {
		return null;
	}

	if (value instanceof Date) {
		return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 12));
	}

	const raw = normalizeString(value);
	const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

	if (isoMatch) {
		const [, year, month, day] = isoMatch;
		return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
	}

	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getApprovalRank(jobLevelName = '') {
	return APPROVAL_STAGE_SEQUENCE.findIndex(
		(item) => normalizeJobLevelName(item.jobLevelName) === normalizeJobLevelName(jobLevelName),
	);
}

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

function getRequestStatusLabel(status = '') {
	switch (status) {
		case 'SUBMITTED':
			return 'Submitted';
		case 'IN_APPROVAL':
			return 'Dalam Approval';
		case 'APPROVED':
			return 'Approved';
		case 'REJECTED':
			return 'Rejected';
		case 'CANCELLED':
			return 'Cancelled';
		default:
			return status;
	}
}

function getApprovalStatusLabel(status = '') {
	switch (status) {
		case 'WAITING':
			return 'Menunggu Tahap';
		case 'PENDING':
			return 'Menunggu Tindakan';
		case 'APPROVED':
			return 'Approved';
		case 'REJECTED':
			return 'Rejected';
		case 'LOCKED':
			return 'Tidak Aktif';
		case 'CANCELLED':
			return 'Dibatalkan';
		default:
			return status;
	}
}

async function getRequesterForWorkflow(tx, employeeId) {
	const employee = await tx.employee.findUnique({
		where: { id: employeeId },
		include: {
			department: true,
			groupShift: {
				include: {
					foremen: {
						include: {
							employee: {
								include: {
									jobLevel: true,
									department: true,
								},
							},
						},
						orderBy: {
							id: 'asc',
						},
					},
				},
			},
			jobLevel: true,
		},
	});

	if (!employee) {
		throw Object.assign(new Error('Karyawan tidak ditemukan.'), { statusCode: 404 });
	}

	return employee;
}

async function findDepartmentApprovers(
	tx,
	{ departmentId, jobLevelName, requesterId, excludeGroupedForemen = false, excludeEmployeeIds = [] },
) {
	const uniqueExcludedEmployeeIds = [...new Set(excludeEmployeeIds)].filter((value) => Number.isInteger(value));

	return tx.employee.findMany({
		where: {
			departmentId,
			id: {
				notIn: [...uniqueExcludedEmployeeIds, requesterId],
			},
			jobLevel: {
				name: {
					equals: jobLevelName,
					mode: 'insensitive',
				},
			},
			...(excludeGroupedForemen && normalizeJobLevelName(jobLevelName) === 'foreman'
				? {
						groupShiftAssignments: {
							none: {},
						},
				  }
				: {}),
		},
		include: {
			jobLevel: true,
			department: true,
		},
		orderBy: [{ fullName: 'asc' }, { id: 'asc' }],
	});
}

async function resolveApprovalStages(tx, requester) {
	const stages = [];
	const requesterRank = getApprovalRank(requester.jobLevel?.name);
	const hasRequesterGroupShift = Boolean(requester.groupShiftId);
	const groupShiftForemanApprovers = hasRequesterGroupShift
		? requester.groupShift?.foremen
				.map((assignment) => assignment.employee)
				.filter((employee) => employee.id !== requester.id) || []
		: [];
	const seenApproverIds = new Set();
	let stageOrder = 1;

	if (requesterRank < 0 && groupShiftForemanApprovers.length > 0) {
		const approvers = groupShiftForemanApprovers.filter((employee) => !seenApproverIds.has(employee.id));

		if (approvers.length > 0) {
			approvers.forEach((employee) => seenApproverIds.add(employee.id));
			stages.push({
				stageOrder,
				stageType: 'FOREMAN_GROUP_SHIFT',
				approvers,
			});
			stageOrder += 1;
		}
	}

	const startIndex = requesterRank >= 0 ? requesterRank + 1 : 0;
	for (let index = startIndex; index < APPROVAL_STAGE_SEQUENCE.length; index += 1) {
		const stageConfig = APPROVAL_STAGE_SEQUENCE[index];
		const shouldSkipDepartmentForemanStage = stageConfig.stageType === 'FOREMAN' && hasRequesterGroupShift;

		if (shouldSkipDepartmentForemanStage) {
			continue;
		}

		const approvers = await findDepartmentApprovers(tx, {
			departmentId: requester.departmentId,
			jobLevelName: stageConfig.jobLevelName,
			requesterId: requester.id,
			excludeGroupedForemen: stageConfig.stageType === 'FOREMAN' && !hasRequesterGroupShift,
			excludeEmployeeIds: Array.from(seenApproverIds),
		});

		if (approvers.length === 0) {
			continue;
		}

		approvers.forEach((employee) => seenApproverIds.add(employee.id));
		stages.push({
			stageOrder,
			stageType: stageConfig.stageType,
			approvers,
		});
		stageOrder += 1;
	}

	if (stages.length === 0) {
		throw Object.assign(
			new Error('Route approval cuti tidak ditemukan. Pastikan approver tersedia pada department terkait.'),
			{ statusCode: 400 },
		);
	}

	return stages;
}

async function getBalanceSeed(tx, employeeId, leaveYear) {
	const seed = await tx.employeeLeaveBalanceSeed.findUnique({
		where: {
			employeeId_year: {
				employeeId,
				year: leaveYear,
			},
		},
	});

	if (!seed) {
		throw Object.assign(
			new Error(`Saldo cuti tahunan ${leaveYear} belum disiapkan untuk karyawan ini.`),
			{ statusCode: 400 },
		);
	}

	return seed;
}

async function validateOverlappingLeave(tx, { employeeId, periodStart, periodEnd, ignoreLeaveId = null }) {
	const overlappingRecord = await tx.employeeLeave.findFirst({
		where: {
			employeeId,
			...(ignoreLeaveId ? { id: { not: ignoreLeaveId } } : {}),
			status: {
				in: ['SUBMITTED', 'IN_APPROVAL', 'APPROVED'],
			},
			AND: [
				{
					periodStart: {
						lte: periodEnd,
					},
				},
				{
					periodEnd: {
						gte: periodStart,
					},
				},
			],
		},
	});

	if (overlappingRecord) {
		throw Object.assign(
			new Error('Pengajuan cuti bentrok dengan request cuti lain yang masih aktif atau sudah disetujui.'),
			{ statusCode: 400 },
		);
	}
}

async function getBalanceBefore(tx, employeeId, leaveYear, masterCutiKaryawanId) {
	const balance = await getLeaveDatabaseBalance(tx, employeeId, leaveYear, masterCutiKaryawanId);

	if (!balance) {
		throw Object.assign(
			new Error(`Database cuti tahun ${leaveYear} untuk jenis cuti ini belum disiapkan untuk karyawan ini.`),
			{ statusCode: 400 },
		);
	}

	return balance.currentBalance;
}

function buildRequestNumber(date = new Date()) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const randomSuffix = Math.random().toString(36).slice(2, 7).toUpperCase();

	return `CT-${year}${month}${day}-${randomSuffix}`;
}

function getSortedReplacementAssignments(assignments = [], revisionNo = null) {
	return assignments
		.filter((item) => (revisionNo == null ? true : item.revisionNo === revisionNo))
		.slice()
		.sort((left, right) => {
			if (left.sequenceNo !== right.sequenceNo) {
				return left.sequenceNo - right.sequenceNo;
			}

			return left.id - right.id;
		});
}

function mapReplacementAssignmentRow(assignment) {
	return {
		id: assignment.replacementEmployee.id,
		fullName: assignment.replacementEmployee.fullName,
		employeeNo: assignment.replacementEmployee.employeeNo,
		sequenceNo: assignment.sequenceNo,
	};
}

function buildReplacementFields(assignments = []) {
	const replacementEmployees = assignments.map(mapReplacementAssignmentRow);
	const replacementEmployeeNames = replacementEmployees.map((item) => item.fullName);
	const replacementEmployeeSummary = replacementEmployees
		.map((item) => `${item.fullName} (${item.employeeNo})`)
		.join(', ');

	return {
		replacementEmployees,
		replacementEmployeeNames,
		replacementEmployeeId: replacementEmployees[0]?.id || null,
		replacementEmployeeName: replacementEmployeeSummary || '',
	};
}

function mapApprovalRow(approval, activeApproverId = null) {
	return {
		id: approval.id,
		revisionNo: approval.revisionNo,
		stageOrder: approval.stageOrder,
		stageType: approval.stageType,
		stageLabel: getStageLabel(approval.stageType),
		status: approval.status,
		statusLabel: getApprovalStatusLabel(approval.status),
		actionNote: approval.actionNote || '',
		actedAt: approval.actedAt ? approval.actedAt.toISOString() : null,
		isActionable: activeApproverId != null && approval.status === 'PENDING' && approval.approverEmployeeId === activeApproverId,
		approver: {
			id: approval.approverEmployee.id,
			fullName: approval.approverEmployee.fullName,
			employeeNo: approval.approverEmployee.employeeNo,
			email: approval.approverEmployee.email,
			jobLevelName: approval.approverEmployee.jobLevel?.name || '',
		},
	};
}

function mapRevisionRow(revision) {
	const replacementFields = buildReplacementFields(getSortedReplacementAssignments(revision.replacementAssignments));

	return {
		id: revision.id,
		revisionNo: revision.revisionNo,
		masterCutiKaryawanId: revision.masterCutiKaryawanId,
		leaveType: revision.masterCutiKaryawan.leaveType,
		...replacementFields,
		status: revision.status,
		statusLabel: getRequestStatusLabel(revision.status),
		leaveDays: revision.leaveDays,
		periodStart: formatDateForClient(revision.periodStart),
		periodEnd: formatDateForClient(revision.periodEnd),
		submissionDate: formatDateForClient(revision.submittedAt),
		balanceBefore: revision.balanceBefore,
		availableLeaveBalance: revision.balanceBefore,
		remainingLeave: revision.remainingLeave,
		remainingLeavePreview: revision.remainingLeave,
		notes: revision.notes || '',
		leaveAddress: revision.leaveAddress || '',
		leaveReason: revision.leaveReason || '',
		rejectionNote: revision.rejectionNote || '',
		submittedAt: revision.submittedAt ? revision.submittedAt.toISOString() : null,
		approvedAt: revision.approvedAt ? revision.approvedAt.toISOString() : null,
		rejectedAt: revision.rejectedAt ? revision.rejectedAt.toISOString() : null,
		cancelledAt: revision.cancelledAt ? revision.cancelledAt.toISOString() : null,
	};
}

function mapLeaveRequestSummary(record) {
	const activeApprovals = record.approvals.filter(
		(item) => item.revisionNo === record.revisionNo && item.status === 'PENDING',
	);
	const replacementFields = buildReplacementFields(
		getSortedReplacementAssignments(record.replacementAssignments, record.revisionNo),
	);

	return {
		id: record.id,
		requestNumber: record.requestNumber,
		status: record.status,
		statusLabel: getRequestStatusLabel(record.status),
		employeeId: record.employeeId,
		employeeName: record.employee.fullName,
		employeeNo: record.employee.employeeNo,
		leaveYear: record.leaveYear,
		revisionNo: record.revisionNo,
		submissionDate: formatDateForClient(record.submittedAt || record.createdAt),
		masterCutiKaryawanId: record.masterCutiKaryawanId,
		leaveType: record.masterCutiKaryawan.leaveType,
		leaveDays: record.leaveDays,
		periodStart: formatDateForClient(record.periodStart),
		periodEnd: formatDateForClient(record.periodEnd),
		balanceBefore: record.balanceBefore,
		availableLeaveBalance: record.balanceBefore,
		remainingLeave: record.remainingLeave,
		remainingLeavePreview: record.remainingLeave,
		currentStageOrder: record.currentStageOrder,
		activeStageLabel: activeApprovals[0] ? getStageLabel(activeApprovals[0].stageType) : '',
		activeApproverNames: activeApprovals.map((item) => item.approverEmployee.fullName).join(', '),
		notes: record.notes || '',
		leaveAddress: record.leaveAddress || '',
		leaveReason: record.leaveReason || '',
		...replacementFields,
		rejectionNote: record.rejectionNote || '',
		submittedAt: record.submittedAt ? record.submittedAt.toISOString() : null,
		approvedAt: record.approvedAt ? record.approvedAt.toISOString() : null,
		rejectedAt: record.rejectedAt ? record.rejectedAt.toISOString() : null,
		cancelledAt: record.cancelledAt ? record.cancelledAt.toISOString() : null,
	};
}

function mapLeaveRequestDetail(record, activeApproverId = null) {
	const summary = mapLeaveRequestSummary(record);

	return {
		...summary,
		canCancel: ['SUBMITTED', 'IN_APPROVAL', 'REJECTED'].includes(record.status),
		canResubmit: record.status === 'REJECTED',
		revisions: record.revisions
			.slice()
			.sort((a, b) => b.revisionNo - a.revisionNo)
			.map(mapRevisionRow),
		approvals: record.approvals
			.slice()
			.sort((a, b) => {
				if (a.revisionNo !== b.revisionNo) {
					return b.revisionNo - a.revisionNo;
				}

				if (a.stageOrder !== b.stageOrder) {
					return a.stageOrder - b.stageOrder;
				}

				return a.id - b.id;
			})
			.map((item) => mapApprovalRow(item, activeApproverId)),
		emailOutbox: record.emailOutbox
			.slice()
			.sort((a, b) => b.id - a.id)
			.map((item) => ({
				id: item.id,
				revisionNo: item.revisionNo,
				recipientEmail: item.recipientEmail,
				recipientName: item.recipientName || '',
				subject: item.subject,
				status: item.status,
				sentAt: item.sentAt ? item.sentAt.toISOString() : null,
				errorMessage: item.errorMessage || '',
			})),
	};
}

async function getLeaveRequestOrThrow(tx, id) {
	const record = await tx.employeeLeave.findUnique({
		where: { id },
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
				orderBy: [{ revisionNo: 'desc' }, { stageOrder: 'asc' }, { id: 'asc' }],
			},
			emailOutbox: {
				orderBy: { id: 'desc' },
			},
		},
	});

	if (!record) {
		throw Object.assign(new Error('Request cuti tidak ditemukan.'), { statusCode: 404 });
	}

	return record;
}

function getActiveApprovals(record) {
	return record.approvals.filter((item) => item.revisionNo === record.revisionNo && item.status === 'PENDING');
}

async function createLeaveRequestRevision(tx, payload) {
	const requester = await getRequesterForWorkflow(tx, payload.employeeId);
	const leaveYear = payload.periodStart.getUTCFullYear();
	const balanceBefore =
		typeof payload.balanceBeforeOverride === 'number'
			? payload.balanceBeforeOverride
			: await getBalanceBefore(tx, payload.employeeId, leaveYear, payload.masterCutiKaryawanId);
	const remainingLeave = balanceBefore - payload.leaveDays;

	if (remainingLeave < 0) {
		throw Object.assign(new Error('Sisa cuti tidak mencukupi untuk pengajuan ini.'), { statusCode: 400 });
	}

	await validateOverlappingLeave(tx, {
		employeeId: payload.employeeId,
		periodStart: payload.periodStart,
		periodEnd: payload.periodEnd,
		ignoreLeaveId: payload.employeeLeaveId || null,
	});

	const stages = await resolveApprovalStages(tx, requester);

	return {
		requester,
		leaveYear,
		balanceBefore,
		remainingLeave,
		stages,
	};
}

async function listApprovalsForEmployee(employeeId) {
	const rows = await prisma.employeeLeaveApproval.findMany({
		where: {
			approverEmployeeId: employeeId,
		},
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
								},
							},
						},
					},
					emailOutbox: true,
				},
			},
		},
		orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
	});

	return rows.map((row) => ({
		id: row.id,
		revisionNo: row.revisionNo,
		stageOrder: row.stageOrder,
		stageType: row.stageType,
		stageLabel: getStageLabel(row.stageType),
		status: row.status,
		statusLabel: getApprovalStatusLabel(row.status),
		actionNote: row.actionNote || '',
		actedAt: row.actedAt ? row.actedAt.toISOString() : null,
		request: mapLeaveRequestSummary(row.employeeLeave),
	}));
}

export {
	APPROVAL_STAGE_SEQUENCE,
	buildRequestNumber,
	createLeaveRequestRevision,
	formatDateForClient,
	getActiveApprovals,
	getApprovalRank,
	getBalanceBefore,
	getBalanceSeed,
	getLeaveRequestOrThrow,
	getRequestStatusLabel,
	getStageLabel,
	getRequesterForWorkflow,
	listApprovalsForEmployee,
	mapApprovalRow,
	mapLeaveRequestDetail,
	mapLeaveRequestSummary,
	normalizeJobLevelName,
	normalizeString,
	resolveApprovalStages,
	toDateOnly,
	validateOverlappingLeave,
};
