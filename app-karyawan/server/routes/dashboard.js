import { Router } from 'express';

import prisma from '../lib/prisma.js';

const router = Router();

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

router.get(
	'/',
	withAsync(async (req, res) => {
		const today = new Date();
		const soonThreshold = new Date(today);
		soonThreshold.setDate(soonThreshold.getDate() + 25);

		const currentYear = today.getFullYear();
		const yearStart = new Date(Date.UTC(currentYear, 0, 1));
		const yearEnd = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59));

		const isSuperAdmin = req.admin.role === 'super_admin';

		// Super admin can filter by siteId query param; regular admin always uses their own site
		let filterSiteId = null;
		if (isSuperAdmin) {
			const querySiteId = req.query.siteId ? Number(req.query.siteId) : null;
			filterSiteId = Number.isInteger(querySiteId) ? querySiteId : null;
		} else {
			filterSiteId = req.admin.siteId;
		}

		const siteFilter = filterSiteId ? { siteId: filterSiteId } : {};
		const employeeRelationFilter = filterSiteId ? { employee: { siteId: filterSiteId } } : {};

		const [
			employees,
			leaveRequests,
			licenseCertifications,
			unitLicenseCertifications,
			monthlyLeaveRequests,
			recentLeaveRequests,
		] = await Promise.all([
			// All employees with relations
			prisma.employee.findMany({
				where: { ...siteFilter },
				select: {
					id: true,
					employmentType: true,
					siteId: true,
					departmentId: true,
					jobLevelId: true,
					site: { select: { name: true } },
					department: { select: { name: true } },
					jobLevel: { select: { name: true } },
				},
			}),
			// Active leave requests
			prisma.employeeLeave.count({
				where: {
					status: { in: ['SUBMITTED', 'IN_APPROVAL'] },
					...employeeRelationFilter,
				},
			}),
			// Employee license certifications expiring soon
			prisma.employeeLicenseCertification.findMany({
				where: {
					expiryDate: { lte: soonThreshold },
					...employeeRelationFilter,
				},
				select: {
					id: true,
					expiryDate: true,
					employee: { select: { fullName: true, employeeNo: true } },
					masterDokKaryawan: { select: { documentName: true } },
				},
				orderBy: { expiryDate: 'asc' },
				take: 5,
			}),
			// Unit license certifications expiring soon
			prisma.unitLicenseCertification.count({
				where: {
					expiryDate: { lte: soonThreshold },
				},
			}),
			// Monthly leave requests for current year (for trend chart)
			prisma.employeeLeave.findMany({
				where: {
					createdAt: { gte: yearStart, lte: yearEnd },
					...employeeRelationFilter,
				},
				select: {
					createdAt: true,
				},
			}),
			// Recent leave requests
			prisma.employeeLeave.findMany({
				where: {
					...employeeRelationFilter,
				},
				select: {
					id: true,
					requestNumber: true,
					status: true,
					leaveDays: true,
					createdAt: true,
					employee: { select: { fullName: true, employeeNo: true } },
					masterCutiKaryawan: { select: { leaveType: true } },
				},
				orderBy: { createdAt: 'desc' },
				take: 5,
			}),
		]);

		// Summary cards
		const totalEmployees = employees.length;
		const activeLeaveRequests = leaveRequests;
		const expiringLicenses = licenseCertifications.length + unitLicenseCertifications;

		// Distribution by department
		const departmentMap = {};
		employees.forEach((emp) => {
			const name = emp.department?.name || 'Lainnya';
			departmentMap[name] = (departmentMap[name] || 0) + 1;
		});
		const byDepartment = Object.entries(departmentMap)
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count);

		// Distribution by job level
		const jobLevelMap = {};
		employees.forEach((emp) => {
			const name = emp.jobLevel?.name || 'Lainnya';
			jobLevelMap[name] = (jobLevelMap[name] || 0) + 1;
		});
		const byJobLevel = Object.entries(jobLevelMap)
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count);

		// Distribution by employment type
		const employmentTypeMap = {};
		employees.forEach((emp) => {
			const label = emp.employmentType === 'PERMANENT' ? 'Permanent' : 'Contract';
			employmentTypeMap[label] = (employmentTypeMap[label] || 0) + 1;
		});
		const byEmploymentType = Object.entries(employmentTypeMap).map(([name, count]) => ({ name, count }));

		// Distribution by site
		const siteMap = {};
		employees.forEach((emp) => {
			const name = emp.site?.name || 'Lainnya';
			siteMap[name] = (siteMap[name] || 0) + 1;
		});
		const bySite = Object.entries(siteMap)
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count);

		// Monthly leave trend (current year)
		const monthlyTrend = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: 0 }));
		monthlyLeaveRequests.forEach((req) => {
			const month = req.createdAt.getMonth();
			monthlyTrend[month].count += 1;
		});

		// Expiring licenses detail
		const expiringLicensesList = licenseCertifications.map((item) => ({
			id: item.id,
			employeeName: item.employee.fullName,
			employeeNo: item.employee.employeeNo,
			documentName: item.masterDokKaryawan?.documentName || '-',
			validUntil: item.expiryDate ? item.expiryDate.toISOString().slice(0, 10) : null,
			status: item.expiryDate < today ? 'Expired' : 'Akan Expired',
		}));

		// Recent leave requests
		const recentLeaves = recentLeaveRequests.map((item) => ({
			id: item.id,
			requestNumber: item.requestNumber,
			employeeName: item.employee.fullName,
			employeeNo: item.employee.employeeNo,
			leaveType: item.masterCutiKaryawan?.leaveType || '-',
			leaveDays: item.leaveDays,
			status: item.status,
			createdAt: item.createdAt ? item.createdAt.toISOString().slice(0, 10) : null,
		}));

		return res.json({
			summary: {
				totalEmployees,
				activeLeaveRequests,
				expiringLicenses,
				siteCount: Object.keys(siteMap).length,
			},
			charts: {
				byDepartment,
				byJobLevel,
				byEmploymentType,
				bySite,
				monthlyLeaveTrend: monthlyTrend,
			},
			tables: {
				expiringLicenses: expiringLicensesList,
				recentLeaves,
			},
		});
	}),
);

export default router;
