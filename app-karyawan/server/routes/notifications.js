import { Router } from 'express';

import prisma from '../lib/prisma.js';

const router = Router();
const EXPIRING_SOON_DAYS = 25;
const STALE_APPROVAL_DAYS = 2;
const PROFILE_CHANGE_DAYS = 30;
const MAX_NOTIFICATION_ITEMS = 50;
const DEFAULT_HISTORY_PAGE_SIZE = 20;
const MAX_HISTORY_PAGE_SIZE = 100;
const NOTIFICATION_CATEGORIES = [
	'EMPLOYEE_LICENSE',
	'UNIT_LICENSE',
	'LEAVE_FLOW',
	'LEAVE_REJECTED',
	'EMAIL_FAILED',
	'EMPLOYEE_PROFILE_CHANGE',
];

function formatStageLabel(stageType = '') {
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
			return 'Site / Div. Manager';
		default:
			return stageType;
	}
}

function normalizeString(value = '') {
	return String(value).trim();
}

function resolveEmployeeId(req, payload = {}) {
	const fromBody = Number(payload.employeeId);
	const fromQuery = Number(req.query.employeeId);
	const fromHeader = Number(req.headers['x-admin-employee-id']);
	const candidate = [fromBody, fromQuery, fromHeader].find((value) => Number.isInteger(value));

	if (!Number.isInteger(candidate)) {
		throw Object.assign(new Error('employeeId admin wajib dikirim.'), { statusCode: 400 });
	}

	return candidate;
}

function toDateOnlyComparable(value) {
	if (!value) {
		return null;
	}

	const parsed = value instanceof Date ? value : new Date(value);

	if (Number.isNaN(parsed.getTime())) {
		return null;
	}

	return Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}

function getDaysUntilDate(value) {
	const comparableValue = toDateOnlyComparable(value);

	if (!comparableValue) {
		return null;
	}

	const today = new Date();
	const comparableToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
	return Math.floor((comparableValue - comparableToday) / (24 * 60 * 60 * 1000));
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

function buildHref(targetPath, targetSearch = '') {
	if (!targetSearch) {
		return targetPath;
	}

	return `${targetPath}?search=${encodeURIComponent(targetSearch)}`;
}

function formatCategoryLabel(category = '') {
	switch (category) {
		case 'EMPLOYEE_LICENSE':
			return 'Lisensi Karyawan';
		case 'UNIT_LICENSE':
			return 'Lisensi Unit';
		case 'LEAVE_FLOW':
			return 'Flow Cuti';
		case 'LEAVE_REJECTED':
			return 'Cuti Ditolak';
		case 'EMAIL_FAILED':
			return 'Email Gagal';
		case 'EMPLOYEE_PROFILE_CHANGE':
			return 'Perubahan Profil Karyawan';
		default:
			return category || 'Notifikasi';
	}
}

function formatSeverityLabel(severity = '') {
	switch (severity) {
		case 'error':
			return 'Kritis';
		case 'warning':
			return 'Perlu Dipantau';
		default:
			return 'Informasi';
	}
}

function getPriority(item) {
	switch (item.category) {
		case 'EMPLOYEE_LICENSE':
		case 'UNIT_LICENSE':
			return item.severity === 'error' ? 500 : 200;
		case 'EMAIL_FAILED':
			return 400;
		case 'EMPLOYEE_PROFILE_CHANGE':
			return 350;
		case 'LEAVE_FLOW':
			return 300;
		case 'LEAVE_REJECTED':
			return 100;
		default:
			return 0;
	}
}

function compareNotifications(left, right) {
	const unreadDelta = Number(left.isRead) - Number(right.isRead);

	if (unreadDelta !== 0) {
		return unreadDelta;
	}

	const priorityDelta = getPriority(right) - getPriority(left);

	if (priorityDelta !== 0) {
		return priorityDelta;
	}

	const leftTime = new Date(left.sortDate).getTime();
	const rightTime = new Date(right.sortDate).getTime();
	const isLicenseCategory =
		(left.category === 'EMPLOYEE_LICENSE' || left.category === 'UNIT_LICENSE') &&
		(right.category === 'EMPLOYEE_LICENSE' || right.category === 'UNIT_LICENSE');

	if (isLicenseCategory) {
		return leftTime - rightTime;
	}

	if (left.category === 'LEAVE_FLOW' && right.category === 'LEAVE_FLOW') {
		return leftTime - rightTime;
	}

	return rightTime - leftTime;
}

function compareHistoryNotifications(left, right) {
	const unreadDelta = Number(left.isRead) - Number(right.isRead);

	if (unreadDelta !== 0) {
		return unreadDelta;
	}

	const activeDelta = Number(right.isActive) - Number(left.isActive);

	if (activeDelta !== 0) {
		return activeDelta;
	}

	return compareNotifications(left, right);
}

function decorateNotification(item) {
	return {
		...item,
		categoryLabel: formatCategoryLabel(item.category),
		severityLabel: formatSeverityLabel(item.severity),
	};
}

function parsePositiveInt(value, fallback, maxValue = Infinity) {
	const parsed = Number.parseInt(value, 10);

	if (!Number.isFinite(parsed) || parsed <= 0) {
		return fallback;
	}

	return Math.min(parsed, maxValue);
}

function normalizeReadStatus(value = 'all') {
	const normalized = normalizeString(value).toLowerCase();
	return ['all', 'unread', 'read'].includes(normalized) ? normalized : 'all';
}

function normalizeActiveStatus(value = 'all') {
	const normalized = normalizeString(value).toLowerCase();
	return ['all', 'active', 'archived'].includes(normalized) ? normalized : 'all';
}

function normalizeCategory(value = '') {
	const normalized = normalizeString(value).toUpperCase();
	return NOTIFICATION_CATEGORIES.includes(normalized) ? normalized : 'ALL';
}

function createEmployeeLicenseNotification(record) {
	const daysUntilExpiry = getDaysUntilDate(record.expiryDate);

	if (daysUntilExpiry == null || daysUntilExpiry > EXPIRING_SOON_DAYS) {
		return null;
	}

	const isExpired = daysUntilExpiry < 0;
	const severityLabel = isExpired ? 'expired' : 'soon';
	const title = isExpired
		? `Lisensi karyawan expired: ${record.employee.fullName}`
		: `Lisensi karyawan akan expired: ${record.employee.fullName}`;
	const description = isExpired
		? `${record.masterDokKaryawan.documentName} (${record.documentNumber}) sudah expired pada ${formatDateLabel(
				record.expiryDate,
		  )}.`
		: `${record.masterDokKaryawan.documentName} (${record.documentNumber}) akan expired pada ${formatDateLabel(
				record.expiryDate,
		  )}.`;
	const targetSearch =
		record.documentNumber ||
		record.employee.employeeNo ||
		record.employee.fullName ||
		record.masterDokKaryawan.documentName;

	return {
		id: `employee-license-${record.id}-${severityLabel}-${record.expiryDate.toISOString().slice(0, 10)}`,
		category: 'EMPLOYEE_LICENSE',
		severity: isExpired ? 'error' : 'warning',
		title,
		description,
		targetPath: '/data-karyawan/lisensi-sertifikasi',
		targetSearch,
		dateLabel: `Masa berlaku: ${formatDateLabel(record.expiryDate)}`,
		sortDate: record.expiryDate.toISOString(),
		href: buildHref('/data-karyawan/lisensi-sertifikasi', targetSearch),
	};
}

function createUnitLicenseNotification(record) {
	const daysUntilExpiry = getDaysUntilDate(record.expiryDate);

	if (daysUntilExpiry == null || daysUntilExpiry > EXPIRING_SOON_DAYS) {
		return null;
	}

	const isExpired = daysUntilExpiry < 0;
	const severityLabel = isExpired ? 'expired' : 'soon';
	const title = isExpired
		? `Lisensi unit expired: ${record.masterUnit.unitName}`
		: `Lisensi unit akan expired: ${record.masterUnit.unitName}`;
	const description = isExpired
		? `Dokumen ${record.documentNumber} untuk asset ${record.assetNo} sudah expired pada ${formatDateLabel(
				record.expiryDate,
		  )}.`
		: `Dokumen ${record.documentNumber} untuk asset ${record.assetNo} akan expired pada ${formatDateLabel(
				record.expiryDate,
		  )}.`;
	const targetSearch = record.documentNumber || record.assetNo || record.masterUnit.unitName;

	return {
		id: `unit-license-${record.id}-${severityLabel}-${record.expiryDate.toISOString().slice(0, 10)}`,
		category: 'UNIT_LICENSE',
		severity: isExpired ? 'error' : 'warning',
		title,
		description,
		targetPath: '/data-unit/lisensi-sertifikasi-unit',
		targetSearch,
		dateLabel: `Masa berlaku: ${formatDateLabel(record.expiryDate)}`,
		sortDate: record.expiryDate.toISOString(),
		href: buildHref('/data-unit/lisensi-sertifikasi-unit', targetSearch),
	};
}

function createLeaveFlowNotification(approval) {
	const activatedAt = approval.updatedAt || approval.createdAt;
	const targetSearch = approval.employeeLeave.requestNumber;

	return {
		id: `leave-flow-${approval.employeeLeaveId}-${approval.revisionNo}-${
			approval.stageOrder
		}-${activatedAt.toISOString()}`,
		category: 'LEAVE_FLOW',
		severity: 'warning',
		title: `Flow cuti lama: ${approval.employeeLeave.requestNumber}`,
		description: `${approval.employeeLeave.employee.fullName} masih menunggu approval ${
			approval.approverEmployee.fullName
		} pada tahap ${formatStageLabel(approval.stageType)}.`,
		targetPath: '/data-karyawan/cuti-karyawan/flow',
		targetSearch,
		dateLabel: `Stage aktif sejak: ${formatDateLabel(activatedAt)}`,
		sortDate: activatedAt.toISOString(),
		href: buildHref('/data-karyawan/cuti-karyawan/flow', targetSearch),
	};
}

function groupStaleApprovals(approvals = []) {
	const grouped = new Map();

	approvals.forEach((approval) => {
		const key = `${approval.employeeLeaveId}-${approval.revisionNo}-${approval.stageOrder}`;
		const current = grouped.get(key);

		if (!current) {
			grouped.set(key, {
				...approval,
				approverEmployeeNames: [approval.approverEmployee.fullName],
			});
			return;
		}

		current.approverEmployeeNames.push(approval.approverEmployee.fullName);

		if ((approval.updatedAt || approval.createdAt) < (current.updatedAt || current.createdAt)) {
			current.updatedAt = approval.updatedAt;
			current.createdAt = approval.createdAt;
		}
	});

	return Array.from(grouped.values()).map((item) => ({
		...item,
		approverEmployee: {
			...item.approverEmployee,
			fullName: item.approverEmployeeNames.join(', '),
		},
	}));
}

function createRejectedLeaveNotification(record) {
	const rejectedAt = record.rejectedAt || record.updatedAt || record.createdAt;
	const targetSearch = record.requestNumber;

	return {
		id: `leave-rejected-${record.id}-rev-${record.revisionNo}-${rejectedAt.toISOString()}`,
		category: 'LEAVE_REJECTED',
		severity: 'info',
		title: `Cuti rejected: ${record.requestNumber}`,
		description: `${record.employee.fullName} perlu menindaklanjuti pengajuan cuti yang ditolak.`,
		targetPath: '/data-karyawan/cuti-karyawan/flow',
		targetSearch,
		dateLabel: `Rejected: ${formatDateLabel(rejectedAt)}`,
		sortDate: rejectedAt.toISOString(),
		href: buildHref('/data-karyawan/cuti-karyawan/flow', targetSearch),
	};
}

function createFailedEmailNotification(record) {
	const failureDate = record.updatedAt || record.createdAt;
	const leaveRequestNumber = record.employeeLeave?.requestNumber || 'workflow cuti';
	const targetSearch = record.employeeLeave?.requestNumber || record.recipientEmail;

	return {
		id: `email-failed-${record.id}-${failureDate.toISOString()}`,
		category: 'EMAIL_FAILED',
		severity: 'error',
		title: `Email workflow gagal: ${leaveRequestNumber}`,
		description: `Pengiriman ke ${record.recipientEmail} gagal${
			record.errorMessage ? `: ${record.errorMessage}` : '.'
		}`,
		targetPath: '/data-karyawan/cuti-karyawan/flow',
		targetSearch,
		dateLabel: `Gagal kirim: ${formatDateLabel(failureDate)}`,
		sortDate: failureDate.toISOString(),
		href: buildHref('/data-karyawan/cuti-karyawan/flow', targetSearch),
	};
}

function createEmployeeProfileChangeNotification(record) {
	const changedAt = record.updatedAt || record.createdAt;
	const employeeName = record.employee?.fullName || 'Karyawan';
	const employeeNo = record.employee?.employeeNo || '';
	const titleLabel =
		record.changeType === 'PASSWORD'
			? 'Password'
			: record.changeType === 'CONTACT_EMAIL'
			? 'Kontak dan Email'
			: record.changeType === 'CONTACT'
			? 'Kontak'
			: 'Email';

	return {
		id: `profile-change-${record.id}`,
		category: 'EMPLOYEE_PROFILE_CHANGE',
		severity: record.changeType === 'PASSWORD' ? 'warning' : 'info',
		title: `${employeeName} memperbarui ${titleLabel}`,
		description: record.summary,
		targetPath: `/data-karyawan/detail-karyawan/${record.employeeId}`,
		targetSearch: employeeNo,
		dateLabel: `Diperbarui: ${formatDateLabel(changedAt)}`,
		sortDate: changedAt.toISOString(),
		href: `/data-karyawan/detail-karyawan/${record.employeeId}`,
	};
}

async function fetchRecentProfileChanges(profileChangeThreshold) {
	try {
		return await prisma.employeeSelfServiceChangeLog.findMany({
			where: {
				createdAt: {
					gte: profileChangeThreshold,
				},
			},
			include: {
				employee: true,
			},
			orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
		});
	} catch (error) {
		if (error?.code === 'P2021') {
			console.warn(
				'employee_self_service_change_logs belum tersedia di database. Notifikasi perubahan profil dilewati sementara.',
			);
			return [];
		}

		throw error;
	}
}

async function buildLiveNotifications() {
	const staleThreshold = new Date(Date.now() - STALE_APPROVAL_DAYS * 24 * 60 * 60 * 1000);
	const profileChangeThreshold = new Date(Date.now() - PROFILE_CHANGE_DAYS * 24 * 60 * 60 * 1000);
	const [employeeLicenses, unitLicenses, staleLeaveApprovals, rejectedLeaveRequests, failedEmails, profileChanges] =
		await Promise.all([
			prisma.employeeLicenseCertification.findMany({
				include: {
					employee: true,
					masterDokKaryawan: true,
				},
				orderBy: [{ expiryDate: 'asc' }, { id: 'desc' }],
			}),
			prisma.unitLicenseCertification.findMany({
				include: {
					masterUnit: true,
				},
				orderBy: [{ expiryDate: 'asc' }, { id: 'desc' }],
			}),
			prisma.employeeLeaveApproval.findMany({
				where: {
					status: 'PENDING',
					updatedAt: {
						lte: staleThreshold,
					},
				},
				include: {
					approverEmployee: true,
					employeeLeave: {
						include: {
							employee: true,
						},
					},
				},
				orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
			}),
			prisma.employeeLeave.findMany({
				where: {
					status: 'REJECTED',
				},
				include: {
					employee: true,
				},
				orderBy: [{ rejectedAt: 'desc' }, { updatedAt: 'desc' }, { id: 'desc' }],
			}),
			prisma.emailOutbox.findMany({
				where: {
					status: 'FAILED',
				},
				include: {
					employeeLeave: true,
				},
				orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
			}),
			fetchRecentProfileChanges(profileChangeThreshold),
		]);

	return [
		...employeeLicenses.map(createEmployeeLicenseNotification).filter(Boolean),
		...unitLicenses.map(createUnitLicenseNotification).filter(Boolean),
		...groupStaleApprovals(staleLeaveApprovals)
			.filter((item) => item.employeeLeave.status === 'IN_APPROVAL')
			.map(createLeaveFlowNotification),
		...rejectedLeaveRequests.map(createRejectedLeaveNotification),
		...failedEmails.map(createFailedEmailNotification),
		...profileChanges.map(createEmployeeProfileChangeNotification),
	];
}

function toNotificationRecordPayload(item) {
	return {
		category: item.category,
		severity: item.severity,
		title: item.title,
		description: item.description,
		targetPath: item.targetPath || null,
		targetSearch: item.targetSearch || null,
		href: item.href || null,
		dateLabel: item.dateLabel || null,
		sortDate: new Date(item.sortDate),
	};
}

async function syncNotificationRecords(liveItems = []) {
	const uniqueItems = Array.from(new Map(liveItems.map((item) => [item.id, item])).values());
	const liveIds = uniqueItems.map((item) => item.id);
	const seenAt = new Date();

	if (liveIds.length) {
		await prisma.adminNotificationRecord.updateMany({
			where: {
				isActive: true,
				notificationId: {
					notIn: liveIds,
				},
			},
			data: {
				isActive: false,
			},
		});
	} else {
		await prisma.adminNotificationRecord.updateMany({
			where: {
				isActive: true,
			},
			data: {
				isActive: false,
			},
		});
	}

	if (!uniqueItems.length) {
		return [];
	}

	await prisma.$transaction(
		uniqueItems.map((item) =>
			prisma.adminNotificationRecord.upsert({
				where: {
					notificationId: item.id,
				},
				update: {
					...toNotificationRecordPayload(item),
					lastDetectedAt: seenAt,
					isActive: true,
				},
				create: {
					notificationId: item.id,
					...toNotificationRecordPayload(item),
					firstDetectedAt: seenAt,
					lastDetectedAt: seenAt,
					isActive: true,
				},
			}),
		),
	);

	return uniqueItems;
}

async function attachReadState(employeeId, items) {
	if (!items.length) {
		return [];
	}

	const reads = await prisma.adminNotificationReadState.findMany({
		where: {
			employeeId,
			notificationId: {
				in: items.map((item) => item.id),
			},
		},
		select: {
			notificationId: true,
			readAt: true,
		},
	});
	const readMap = new Map(reads.map((item) => [item.notificationId, item.readAt]));

	return items.map((item) =>
		decorateNotification({
			...item,
			isRead: readMap.has(item.id),
			readAt: readMap.get(item.id)?.toISOString() || null,
		}),
	);
}

async function attachHistoryReadState(employeeId, records) {
	if (!records.length) {
		return [];
	}

	const notificationIds = records.map((record) => record.notificationId);
	const reads = await prisma.adminNotificationReadState.findMany({
		where: {
			employeeId,
			notificationId: {
				in: notificationIds,
			},
		},
		select: {
			notificationId: true,
			readAt: true,
		},
	});
	const readMap = new Map(reads.map((item) => [item.notificationId, item.readAt]));

	return records.map((record) =>
		decorateNotification({
			id: record.notificationId,
			category: record.category,
			severity: record.severity,
			title: record.title,
			description: record.description,
			targetPath: record.targetPath,
			targetSearch: record.targetSearch,
			href: record.href || buildHref(record.targetPath || '/', record.targetSearch || ''),
			dateLabel: record.dateLabel,
			sortDate: record.sortDate.toISOString(),
			firstDetectedAt: record.firstDetectedAt.toISOString(),
			lastDetectedAt: record.lastDetectedAt.toISOString(),
			isActive: record.isActive,
			isRead: readMap.has(record.notificationId),
			readAt: readMap.get(record.notificationId)?.toISOString() || null,
		}),
	);
}

async function markNotificationsRead(employeeId, notificationIds = []) {
	const uniqueNotificationIds = [...new Set(notificationIds.map((value) => normalizeString(value)).filter(Boolean))];

	if (!uniqueNotificationIds.length) {
		return;
	}

	await prisma.adminNotificationReadState.createMany({
		data: uniqueNotificationIds.map((notificationId) => ({
			employeeId,
			notificationId,
			readAt: new Date(),
		})),
		skipDuplicates: true,
	});
}

async function resolveNotificationIdsForMarkAll(employeeId, notificationIds = []) {
	const uniqueNotificationIds = [...new Set(notificationIds.map((value) => normalizeString(value)).filter(Boolean))];

	if (uniqueNotificationIds.length) {
		return uniqueNotificationIds;
	}

	await syncNotificationRecords(await buildLiveNotifications());

	const [records, reads] = await Promise.all([
		prisma.adminNotificationRecord.findMany({
			select: {
				notificationId: true,
			},
		}),
		prisma.adminNotificationReadState.findMany({
			where: {
				employeeId,
			},
			select: {
				notificationId: true,
			},
		}),
	]);
	const readSet = new Set(reads.map((item) => item.notificationId));

	return records.map((item) => item.notificationId).filter((notificationId) => !readSet.has(notificationId));
}

async function buildHistoryResponse(employeeId, query) {
	await syncNotificationRecords(await buildLiveNotifications());

	const page = parsePositiveInt(query.page, 1);
	const pageSize = parsePositiveInt(query.pageSize, DEFAULT_HISTORY_PAGE_SIZE, MAX_HISTORY_PAGE_SIZE);
	const readStatus = normalizeReadStatus(query.readStatus);
	const activeStatus = normalizeActiveStatus(query.activeStatus);
	const category = normalizeCategory(query.category);
	const keyword = normalizeString(query.keyword);

	const where = {
		...(category !== 'ALL'
			? {
					category,
			  }
			: {}),
		...(activeStatus === 'active'
			? {
					isActive: true,
			  }
			: {}),
		...(activeStatus === 'archived'
			? {
					isActive: false,
			  }
			: {}),
		...(keyword
			? {
					OR: [
						{ title: { contains: keyword, mode: 'insensitive' } },
						{ description: { contains: keyword, mode: 'insensitive' } },
						{ targetSearch: { contains: keyword, mode: 'insensitive' } },
						{ category: { contains: keyword, mode: 'insensitive' } },
					],
			  }
			: {}),
	};

	const [records, categoryRows] = await Promise.all([
		prisma.adminNotificationRecord.findMany({
			where,
			orderBy: [{ lastDetectedAt: 'desc' }, { sortDate: 'desc' }, { id: 'desc' }],
		}),
		prisma.adminNotificationRecord.findMany({
			distinct: ['category'],
			select: {
				category: true,
			},
			orderBy: {
				category: 'asc',
			},
		}),
	]);

	const itemsWithReadState = await attachHistoryReadState(employeeId, records);
	const readFilteredItems = itemsWithReadState.filter((item) => {
		if (readStatus === 'unread') {
			return !item.isRead;
		}

		if (readStatus === 'read') {
			return item.isRead;
		}

		return true;
	});
	const sortedItems = readFilteredItems.sort(compareHistoryNotifications);
	const totalCount = sortedItems.length;
	const unreadCount = sortedItems.filter((item) => !item.isRead).length;
	const activeCount = sortedItems.filter((item) => item.isActive).length;
	const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
	const currentPage = Math.min(page, totalPages);
	const offset = (currentPage - 1) * pageSize;

	return {
		totalCount,
		unreadCount,
		activeCount,
		page: currentPage,
		pageSize,
		totalPages,
		readStatus,
		activeStatus,
		category,
		items: sortedItems.slice(offset, offset + pageSize),
		categories: categoryRows.map((item) => ({
			value: item.category,
			label: formatCategoryLabel(item.category),
		})),
	};
}

router.get('/', async (req, res, next) => {
	try {
		const employeeId = resolveEmployeeId(req);
		const limit = parsePositiveInt(req.query.limit, MAX_NOTIFICATION_ITEMS, MAX_NOTIFICATION_ITEMS);
		const syncedItems = await syncNotificationRecords(await buildLiveNotifications());
		const items = await attachReadState(employeeId, syncedItems);
		const sortedItems = items.sort(compareNotifications);

		return res.json({
			totalCount: sortedItems.length,
			unreadCount: sortedItems.filter((item) => !item.isRead).length,
			items: sortedItems.slice(0, limit),
		});
	} catch (error) {
		return next(error);
	}
});

router.get('/history', async (req, res, next) => {
	try {
		const employeeId = resolveEmployeeId(req);
		const response = await buildHistoryResponse(employeeId, req.query);
		return res.json(response);
	} catch (error) {
		return next(error);
	}
});

router.post('/read', async (req, res, next) => {
	try {
		const employeeId = resolveEmployeeId(req, req.body);
		const notificationId = normalizeString(req.body?.notificationId);

		if (!notificationId) {
			return res.status(400).json({ message: 'notificationId wajib diisi.' });
		}

		await markNotificationsRead(employeeId, [notificationId]);
		return res.status(204).send();
	} catch (error) {
		return next(error);
	}
});

router.post('/read-all', async (req, res, next) => {
	try {
		const employeeId = resolveEmployeeId(req, req.body);
		const notificationIds = Array.isArray(req.body?.notificationIds) ? req.body.notificationIds : [];
		const resolvedNotificationIds = await resolveNotificationIdsForMarkAll(employeeId, notificationIds);

		await markNotificationsRead(employeeId, resolvedNotificationIds);
		return res.status(204).send();
	} catch (error) {
		return next(error);
	}
});

export default router;
