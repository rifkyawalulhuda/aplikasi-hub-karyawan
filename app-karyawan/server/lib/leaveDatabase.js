import prisma from './prisma.js';

function getYearRange(year) {
	return {
		start: new Date(Date.UTC(year, 0, 1, 12)),
		end: new Date(Date.UTC(year + 1, 0, 1, 12)),
	};
}

function mapLeaveDatabaseRow(record) {
	return {
		id: record.id,
		employeeId: record.employeeId,
		employeeName: record.employee.fullName,
		employeeNo: record.employee.employeeNo,
		masterCutiKaryawanId: record.masterCutiKaryawanId,
		leaveType: record.masterCutiKaryawan.leaveType,
		leaveDays: record.leaveDays,
		periodStart: record.periodStart.toISOString().slice(0, 10),
		periodEnd: record.periodEnd.toISOString().slice(0, 10),
		remainingLeave: record.remainingLeave,
		notes: record.notes || '',
		createdAt: record.createdAt.toISOString(),
		updatedAt: record.updatedAt.toISOString(),
	};
}

async function getLatestLeaveDatabaseRecord(tx, employeeId, year) {
	const { start, end } = getYearRange(year);

	return tx.employeeLeaveDatabase.findFirst({
		where: {
			employeeId,
			periodStart: {
				gte: start,
				lt: end,
			},
		},
		include: {
			employee: true,
			masterCutiKaryawan: true,
		},
		orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
	});
}

async function getLeaveDatabaseBalance(tx, employeeId, year) {
	const record = await getLatestLeaveDatabaseRecord(tx, employeeId, year);

	if (!record) {
		return null;
	}

	return {
		year,
		currentBalance: record.remainingLeave,
		reference: mapLeaveDatabaseRow(record),
	};
}

async function createLeaveDatabaseHistory(tx, payload) {
	return tx.employeeLeaveDatabase.create({
		data: {
			employeeId: payload.employeeId,
			masterCutiKaryawanId: payload.masterCutiKaryawanId,
			leaveDays: payload.leaveDays,
			periodStart: payload.periodStart,
			periodEnd: payload.periodEnd,
			remainingLeave: payload.remainingLeave,
			notes: payload.notes || null,
		},
		include: {
			employee: true,
			masterCutiKaryawan: true,
		},
	});
}

async function listLeaveDatabase(tx = prisma) {
	const rows = await tx.employeeLeaveDatabase.findMany({
		include: {
			employee: true,
			masterCutiKaryawan: true,
		},
		orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
	});

	return rows.map(mapLeaveDatabaseRow);
}

export {
	createLeaveDatabaseHistory,
	getLatestLeaveDatabaseRecord,
	getLeaveDatabaseBalance,
	getYearRange,
	listLeaveDatabase,
	mapLeaveDatabaseRow,
};
