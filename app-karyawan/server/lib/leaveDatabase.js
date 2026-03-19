import prisma from './prisma.js';

function getYearRange(year) {
	return {
		start: new Date(Date.UTC(year, 0, 1, 12)),
		end: new Date(Date.UTC(year + 1, 0, 1, 12)),
	};
}

function getLeaveDatabaseHistorySourceLabel(sourceType) {
	switch (sourceType) {
		case 'WORKFLOW_APPROVED':
			return 'Workflow Approved';
		case 'ADMIN_CREATE':
			return 'Admin Create';
		case 'ADMIN_UPDATE':
			return 'Admin Update';
		case 'ADMIN_IMPORT':
			return 'Admin Import';
		default:
			return sourceType;
	}
}

function mapLeaveDatabaseRow(record) {
	return {
		id: record.id,
		employeeId: record.employeeId,
		employeeName: record.employee.fullName,
		employeeNo: record.employee.employeeNo,
		masterCutiKaryawanId: record.masterCutiKaryawanId,
		leaveType: record.masterCutiKaryawan.leaveType,
		year: record.year,
		leaveDays: record.leaveDays,
		periodStart: record.periodStart.toISOString().slice(0, 10),
		periodEnd: record.periodEnd.toISOString().slice(0, 10),
		remainingLeave: record.remainingLeave,
		notes: record.notes || '',
		createdAt: record.createdAt.toISOString(),
		updatedAt: record.updatedAt.toISOString(),
	};
}

function mapLeaveDatabaseHistoryRow(record) {
	return {
		id: record.id,
		employeeLeaveDatabaseId: record.employeeLeaveDatabaseId,
		employeeLeaveId: record.employeeLeaveId || null,
		sourceType: record.sourceType,
		sourceLabel: getLeaveDatabaseHistorySourceLabel(record.sourceType),
		changeDate: record.changeDate.toISOString(),
		leaveDays: record.leaveDays,
		periodStart: record.periodStart.toISOString().slice(0, 10),
		periodEnd: record.periodEnd.toISOString().slice(0, 10),
		balanceBefore: record.balanceBefore,
		balanceAfter: record.balanceAfter,
		notes: record.notes || '',
		requestNumber: record.employeeLeave?.requestNumber || '',
	};
}

function buildMainRecordData(payload) {
	return {
		employeeId: payload.employeeId,
		masterCutiKaryawanId: payload.masterCutiKaryawanId,
		year: payload.year,
		leaveDays: payload.leaveDays,
		periodStart: payload.periodStart,
		periodEnd: payload.periodEnd,
		remainingLeave: payload.remainingLeave,
		notes: payload.notes || null,
	};
}

function buildHistoryData(payload) {
	return {
		employeeLeaveDatabaseId: payload.employeeLeaveDatabaseId,
		employeeLeaveId: payload.employeeLeaveId || null,
		sourceType: payload.sourceType,
		changeDate: payload.changeDate || new Date(),
		leaveDays: payload.leaveDays,
		periodStart: payload.periodStart,
		periodEnd: payload.periodEnd,
		balanceBefore: payload.balanceBefore,
		balanceAfter: payload.balanceAfter,
		notes: payload.notes || null,
	};
}

async function createLeaveDatabaseHistory(tx, payload) {
	return tx.employeeLeaveDatabaseHistory.create({
		data: buildHistoryData(payload),
		include: {
			employeeLeave: true,
		},
	});
}

async function getLeaveDatabaseRecord(tx, employeeId, year, masterCutiKaryawanId) {
	if (!Number.isInteger(masterCutiKaryawanId)) {
		return null;
	}

	return tx.employeeLeaveDatabase.findUnique({
		where: {
			employeeId_masterCutiKaryawanId_year: {
				employeeId,
				masterCutiKaryawanId,
				year,
			},
		},
		include: {
			employee: true,
			masterCutiKaryawan: true,
		},
	});
}

async function getLatestLeaveDatabaseRecord(tx, employeeId, year, masterCutiKaryawanId = null) {
	if (Number.isInteger(masterCutiKaryawanId)) {
		return getLeaveDatabaseRecord(tx, employeeId, year, masterCutiKaryawanId);
	}

	return tx.employeeLeaveDatabase.findFirst({
		where: {
			employeeId,
			year,
		},
		include: {
			employee: true,
			masterCutiKaryawan: true,
		},
		orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
	});
}

async function getLeaveDatabaseBalance(tx, employeeId, year, masterCutiKaryawanId = null) {
	const record = await getLatestLeaveDatabaseRecord(tx, employeeId, year, masterCutiKaryawanId);

	if (!record) {
		return null;
	}

	return {
		year: record.year,
		masterCutiKaryawanId: record.masterCutiKaryawanId,
		currentBalance: record.remainingLeave,
		reference: mapLeaveDatabaseRow(record),
	};
}

async function listLeaveTypeBalancesForEmployeeYear(tx, employeeId, year) {
	const rows = await tx.employeeLeaveDatabase.findMany({
		where: {
			employeeId,
			year,
		},
		include: {
			employee: true,
			masterCutiKaryawan: true,
		},
		orderBy: [{ masterCutiKaryawan: { leaveType: 'asc' } }, { id: 'asc' }],
	});

	return rows.map((record) => ({
		year: record.year,
		masterCutiKaryawanId: record.masterCutiKaryawanId,
		currentBalance: record.remainingLeave,
		reference: mapLeaveDatabaseRow(record),
	}));
}

async function listLeaveDatabase(tx = prisma) {
	const rows = await tx.employeeLeaveDatabase.findMany({
		include: {
			employee: true,
			masterCutiKaryawan: true,
		},
		orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
	});

	return rows.map(mapLeaveDatabaseRow);
}

async function getLeaveDatabaseDetailOrThrow(tx, id) {
	const record = await tx.employeeLeaveDatabase.findUnique({
		where: { id },
		include: {
			employee: true,
			masterCutiKaryawan: true,
			histories: {
				include: {
					employeeLeave: true,
				},
				orderBy: [{ changeDate: 'desc' }, { id: 'desc' }],
			},
		},
	});

	if (!record) {
		throw Object.assign(new Error('Data cuti karyawan tidak ditemukan.'), { statusCode: 404 });
	}

	return {
		...mapLeaveDatabaseRow(record),
		historyCount: record.histories.length,
		histories: record.histories.map(mapLeaveDatabaseHistoryRow),
	};
}

async function createLeaveDatabaseEntry(tx, payload, options = {}) {
	const record = await tx.employeeLeaveDatabase.create({
		data: buildMainRecordData(payload),
		include: {
			employee: true,
			masterCutiKaryawan: true,
		},
	});

	if (!options.skipHistory) {
		await createLeaveDatabaseHistory(tx, {
			employeeLeaveDatabaseId: record.id,
			employeeLeaveId: options.employeeLeaveId || null,
			sourceType: options.sourceType || 'ADMIN_CREATE',
			changeDate: options.changeDate,
			leaveDays: payload.leaveDays,
			periodStart: payload.periodStart,
			periodEnd: payload.periodEnd,
			balanceBefore: payload.remainingLeave,
			balanceAfter: payload.remainingLeave,
			notes: options.historyNotes ?? payload.notes,
		});
	}

	return record;
}

async function updateLeaveDatabaseEntry(tx, id, payload, options = {}) {
	const existing = await tx.employeeLeaveDatabase.findUnique({
		where: { id },
		include: {
			employee: true,
			masterCutiKaryawan: true,
		},
	});

	if (!existing) {
		throw Object.assign(new Error('Data cuti karyawan tidak ditemukan.'), { statusCode: 404 });
	}

	const record = await tx.employeeLeaveDatabase.update({
		where: { id },
		data: buildMainRecordData(payload),
		include: {
			employee: true,
			masterCutiKaryawan: true,
		},
	});

	if (!options.skipHistory) {
		await createLeaveDatabaseHistory(tx, {
			employeeLeaveDatabaseId: record.id,
			employeeLeaveId: options.employeeLeaveId || null,
			sourceType: options.sourceType || 'ADMIN_UPDATE',
			changeDate: options.changeDate,
			leaveDays: payload.leaveDays,
			periodStart: payload.periodStart,
			periodEnd: payload.periodEnd,
			balanceBefore: existing.remainingLeave,
			balanceAfter: payload.remainingLeave,
			notes: options.historyNotes ?? payload.notes,
		});
	}

	return record;
}

async function applyApprovedLeaveToDatabase(tx, payload) {
	const record = await getLeaveDatabaseRecord(tx, payload.employeeId, payload.year, payload.masterCutiKaryawanId);

	if (!record) {
		throw Object.assign(new Error('Data utama cuti karyawan untuk jenis cuti dan tahun ini belum tersedia.'), {
			statusCode: 400,
		});
	}

	const balanceBefore = record.remainingLeave;
	const balanceAfter = balanceBefore - payload.leaveDays;

	if (balanceAfter < 0) {
		throw Object.assign(new Error('Sisa cuti pada data utama tidak mencukupi untuk approval ini.'), {
			statusCode: 400,
		});
	}

	const updatedRecord = await tx.employeeLeaveDatabase.update({
		where: { id: record.id },
		data: {
			remainingLeave: balanceAfter,
		},
		include: {
			employee: true,
			masterCutiKaryawan: true,
		},
	});

	await createLeaveDatabaseHistory(tx, {
		employeeLeaveDatabaseId: record.id,
		employeeLeaveId: payload.employeeLeaveId,
		sourceType: 'WORKFLOW_APPROVED',
		changeDate: payload.changeDate,
		leaveDays: payload.leaveDays,
		periodStart: payload.periodStart,
		periodEnd: payload.periodEnd,
		balanceBefore,
		balanceAfter,
		notes: payload.notes,
	});

	return {
		record: updatedRecord,
		balanceBefore,
		balanceAfter,
	};
}

export {
	applyApprovedLeaveToDatabase,
	createLeaveDatabaseEntry,
	createLeaveDatabaseHistory,
	getLeaveDatabaseBalance,
	getLeaveDatabaseDetailOrThrow,
	getLeaveDatabaseRecord,
	getLatestLeaveDatabaseRecord,
	getYearRange,
	getLeaveDatabaseHistorySourceLabel,
	listLeaveDatabase,
	listLeaveTypeBalancesForEmployeeYear,
	mapLeaveDatabaseHistoryRow,
	mapLeaveDatabaseRow,
	updateLeaveDatabaseEntry,
};
