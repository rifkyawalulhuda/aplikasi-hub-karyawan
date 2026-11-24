/* eslint-disable import/extensions, no-underscore-dangle -- server modules use explicit .js and Prisma's _count */
import { Router } from 'express';

import prisma from '../lib/prisma.js';
import {
	buildRelationSiteWhere,
	buildSiteWhere,
	getAdminSiteId,
	isSuperAdmin,
	parseQuerySiteId,
} from '../lib/siteScope.js';
import {
	ALERT_LIMIT_PER_GROUP,
	buildB3Trend,
	buildLicenseAlert,
	buildMonthBuckets,
	countByMonth,
	groupAndSort,
	LICENSE_SOON_DAYS,
	mapLeaveRow,
	periodMonthCount,
	periodStartDate,
	resolvePeriod,
	sortLicenseAlerts,
	startOfDay,
	summarizeB3Waste,
} from '../lib/dashboardMetrics.js';

const router = Router();

const employeeLicenseSelect = {
	id: true,
	expiryDate: true,
	documentNumber: true,
	employee: { select: { fullName: true, employeeNo: true } },
	masterDokKaryawan: { select: { documentName: true } },
};

const unitLicenseSelect = {
	id: true,
	expiryDate: true,
	documentNumber: true,
	assetNo: true,
	masterUnit: { select: { unitName: true } },
};

const leaveRowSelect = {
	id: true,
	requestNumber: true,
	status: true,
	leaveDays: true,
	createdAt: true,
	employee: { select: { fullName: true, employeeNo: true } },
	masterCutiKaryawan: { select: { leaveType: true } },
};

/** Order used by the approval-status breakdown in the dashboard UI. */
const LEAVE_STATUS_ORDER = ['SUBMITTED', 'IN_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED'];

/** Rows returned for the "recent leave requests" table. */
const RECENT_LEAVE_LIMIT = 8;

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

router.get(
	'/',
	withAsync(async (req, res) => {
		const today = new Date();
		const todayStart = startOfDay(today);
		const soonThreshold = new Date(todayStart);
		soonThreshold.setDate(soonThreshold.getDate() + LICENSE_SOON_DAYS);

		const period = resolvePeriod(req.query.period);
		const monthCount = periodMonthCount(period, today);
		const periodStart = periodStartDate(monthCount, today);
		const monthBuckets = buildMonthBuckets(monthCount, today);

		// Reuse the shared site-isolation helpers so a site-scoped admin can never
		// read another site, and a super admin can narrow the view via ?siteId.
		// A scoped admin without an assigned site resolves to `{ siteId: -1 }`
		// (deny all) rather than `{}` (all sites).
		const siteWhere = buildSiteWhere(req);
		const employeeSiteWhere = buildRelationSiteWhere(req, 'employee');
		const scopedSiteId = isSuperAdmin(req) ? parseQuerySiteId(req) : getAdminSiteId(req);

		const employeeExpiredFilter = { ...siteWhere, expiryDate: { lt: todayStart } };
		const employeeSoonFilter = {
			...siteWhere,
			expiryDate: { gte: todayStart, lte: soonThreshold },
		};
		const unitExpiredFilter = { ...siteWhere, expiryDate: { lt: todayStart } };
		const unitSoonFilter = { ...siteWhere, expiryDate: { gte: todayStart, lte: soonThreshold } };
		const pendingLeaveFilter = {
			status: { in: ['SUBMITTED', 'IN_APPROVAL'] },
			...employeeSiteWhere,
		};

		const [
			employees,
			activeLeaveRequests,
			employeeExpiredLicenses,
			employeeSoonLicenses,
			unitExpiredLicenses,
			unitSoonLicenses,
			employeeExpiredCount,
			employeeSoonCount,
			unitExpiredCount,
			unitSoonCount,
			periodLeaveRequests,
			leaveStatusGroups,
			periodLeaveStatusGroups,
			recentLeaveRequests,
			pendingLeaveRequests,
			b3WasteRecords,
			b3WasteOutRecords,
			scopedSite,
		] = await Promise.all([
			prisma.employee.findMany({
				where: { ...siteWhere },
				select: {
					id: true,
					employmentType: true,
					joinDate: true,
					site: { select: { name: true } },
					department: { select: { name: true } },
					jobLevel: { select: { name: true } },
				},
			}),
			prisma.employeeLeave.count({ where: pendingLeaveFilter }),
			prisma.employeeLicenseCertification.findMany({
				where: employeeExpiredFilter,
				select: employeeLicenseSelect,
				orderBy: { expiryDate: 'desc' },
				take: ALERT_LIMIT_PER_GROUP,
			}),
			prisma.employeeLicenseCertification.findMany({
				where: employeeSoonFilter,
				select: employeeLicenseSelect,
				orderBy: { expiryDate: 'asc' },
				take: ALERT_LIMIT_PER_GROUP,
			}),
			prisma.unitLicenseCertification.findMany({
				where: unitExpiredFilter,
				select: unitLicenseSelect,
				orderBy: { expiryDate: 'desc' },
				take: ALERT_LIMIT_PER_GROUP,
			}),
			prisma.unitLicenseCertification.findMany({
				where: unitSoonFilter,
				select: unitLicenseSelect,
				orderBy: { expiryDate: 'asc' },
				take: ALERT_LIMIT_PER_GROUP,
			}),
			prisma.employeeLicenseCertification.count({ where: employeeExpiredFilter }),
			prisma.employeeLicenseCertification.count({ where: employeeSoonFilter }),
			prisma.unitLicenseCertification.count({ where: unitExpiredFilter }),
			prisma.unitLicenseCertification.count({ where: unitSoonFilter }),
			prisma.employeeLeave.findMany({
				where: { createdAt: { gte: periodStart, lte: today }, ...employeeSiteWhere },
				select: { createdAt: true },
			}),
			prisma.employeeLeave.groupBy({
				by: ['status'],
				where: { ...employeeSiteWhere },
				_count: { _all: true },
			}),
			prisma.employeeLeave.groupBy({
				by: ['status'],
				where: { createdAt: { gte: periodStart, lte: today }, ...employeeSiteWhere },
				_count: { _all: true },
			}),
			prisma.employeeLeave.findMany({
				where: { ...employeeSiteWhere },
				select: leaveRowSelect,
				orderBy: { createdAt: 'desc' },
				take: RECENT_LEAVE_LIMIT,
			}),
			prisma.employeeLeave.findMany({
				where: pendingLeaveFilter,
				select: leaveRowSelect,
				orderBy: { createdAt: 'asc' },
				take: 5,
			}),
			prisma.b3WasteRecord.findMany({
				where: { ...siteWhere },
				select: {
					id: true,
					jumlahMasuk: true,
					tanggalMasuk: true,
					tanggalBatas: true,
					outRecords: { select: { jumlahKeluar: true, tanggalKeluar: true } },
					jenisLimbah: { select: { nama: true } },
				},
			}),
			prisma.b3WasteOutRecord.findMany({
				where: { ...siteWhere },
				select: { jumlahKeluar: true, tanggalKeluar: true },
			}),
			scopedSiteId
				? prisma.masterSite.findUnique({ where: { id: scopedSiteId }, select: { id: true, name: true } })
				: Promise.resolve(null),
		]);

		const totalEmployees = employees.length;
		const permanentCount = employees.filter((emp) => emp.employmentType === 'PERMANENT').length;
		const contractCount = totalEmployees - permanentCount;

		const ninetyDaysAgo = new Date(todayStart);
		ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
		const newHires90d = employees.filter((emp) => new Date(emp.joinDate) >= ninetyDaysAgo).length;
		const newHiresInPeriod = employees.filter((emp) => new Date(emp.joinDate) >= periodStart).length;

		const leaveStatusCounts = leaveStatusGroups.reduce((acc, group) => {
			acc[group.status] = group._count?._all ?? 0;
			return acc;
		}, {});

		const periodLeaveStatusCounts = periodLeaveStatusGroups.reduce((acc, group) => {
			acc[group.status] = group._count?._all ?? 0;
			return acc;
		}, {});

		const leaveStatusBreakdown = LEAVE_STATUS_ORDER.map((status) => ({
			status,
			count: periodLeaveStatusCounts[status] || 0,
		}));

		const byDepartment = groupAndSort(employees, (emp) => emp.department?.name);
		const byJobLevel = groupAndSort(employees, (emp) => emp.jobLevel?.name);
		const bySite = groupAndSort(employees, (emp) => emp.site?.name);
		const byEmploymentType = [
			{ name: 'Permanent', count: permanentCount },
			{ name: 'Contract', count: contractCount },
		].filter((item) => item.count > 0);

		const leaveCountsByMonth = countByMonth(periodLeaveRequests, monthBuckets, (row) => row.createdAt);
		const monthlyLeaveTrend = monthBuckets.map((bucket, index) => ({
			month: bucket.month,
			year: bucket.year,
			label: bucket.label,
			count: leaveCountsByMonth[index],
		}));

		const hireCountsByMonth = countByMonth(employees, monthBuckets, (emp) => emp.joinDate);
		const hiresTrend = monthBuckets.map((bucket, index) => ({
			key: bucket.key,
			label: bucket.label,
			count: hireCountsByMonth[index],
		}));

		const licenseAlerts = sortLicenseAlerts([
			...employeeExpiredLicenses.map((item) => buildLicenseAlert(item, 'KARYAWAN', today)),
			...employeeSoonLicenses.map((item) => buildLicenseAlert(item, 'KARYAWAN', today)),
			...unitExpiredLicenses.map((item) => buildLicenseAlert(item, 'UNIT', today)),
			...unitSoonLicenses.map((item) => buildLicenseAlert(item, 'UNIT', today)),
		]);

		// Legacy shape kept for older consumers of this endpoint.
		const expiringLicensesList = licenseAlerts
			.filter((item) => item.kind === 'KARYAWAN')
			.slice(0, 5)
			.map((item) => ({
				id: item.id,
				employeeName: item.subjectName,
				employeeNo: item.subjectNo,
				documentName: item.documentName,
				validUntil: item.validUntil,
				status: item.status,
			}));

		const b3Summary = summarizeB3Waste({ records: b3WasteRecords, outRecords: b3WasteOutRecords, today });
		const b3Waste = {
			...b3Summary,
			trendBulanan: buildB3Trend(b3WasteRecords, b3WasteOutRecords, monthBuckets),
		};

		return res.json({
			summary: {
				totalEmployees,
				activeLeaveRequests,
				expiringLicenses: employeeExpiredCount + employeeSoonCount + unitExpiredCount + unitSoonCount,
				expiredLicenses: employeeExpiredCount + unitExpiredCount,
				expiringSoonLicenses: employeeSoonCount + unitSoonCount,
				expiredEmployeeLicenses: employeeExpiredCount,
				expiredUnitLicenses: unitExpiredCount,
				expiringSoonEmployeeLicenses: employeeSoonCount,
				expiringSoonUnitLicenses: unitSoonCount,
				siteCount: bySite.length,
				newHires90d,
				newHiresInPeriod,
				permanentCount,
				contractCount,
				submittedLeaveRequests: leaveStatusCounts.SUBMITTED || 0,
				inApprovalLeaveRequests: leaveStatusCounts.IN_APPROVAL || 0,
				leaveRequestsInPeriod: monthlyLeaveTrend.reduce((sum, item) => sum + item.count, 0),
				leaveStatusBreakdown,
			},
			charts: {
				byDepartment,
				byJobLevel,
				byEmploymentType,
				bySite,
				monthlyLeaveTrend,
				hiresTrend,
			},
			tables: {
				expiringLicenses: expiringLicensesList,
				licenseAlerts,
				recentLeaves: recentLeaveRequests.map(mapLeaveRow),
				pendingLeaves: pendingLeaveRequests.map(mapLeaveRow),
			},
			b3Waste,
			meta: {
				generatedAt: new Date().toISOString(),
				year: today.getFullYear(),
				licenseSoonDays: LICENSE_SOON_DAYS,
				period: { key: period.key, label: period.label, months: monthCount },
				scope: {
					siteId: scopedSiteId,
					siteName: scopedSite?.name || null,
					isAllSites: !scopedSiteId,
				},
			},
		});
	}),
);

export default router;
