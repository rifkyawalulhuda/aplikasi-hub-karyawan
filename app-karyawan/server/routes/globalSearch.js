import { Router } from 'express';

import prisma from '../lib/prisma.js';

const router = Router();
const RESULT_LIMIT = 4;

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

function normalizeString(value = '') {
	return String(value).trim().replace(/\s+/g, ' ');
}

function formatDateForClient(value) {
	if (!value) {
		return '';
	}

	return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(
		2,
		'0',
	)}`;
}

function buildSearchHref(path, query) {
	const searchParams = new URLSearchParams();

	if (query) {
		searchParams.set('search', query);
	}

	const queryString = searchParams.toString();
	return queryString ? `${path}?${queryString}` : path;
}

function mapGlobalSearchItem({ id, group, title, subtitle = '', href }) {
	return {
		id: `${group}-${id}`,
		group,
		type: 'data',
		title,
		subtitle,
		href,
	};
}

router.get(
	'/',
	withAsync(async (req, res) => {
		const query = normalizeString(req.query.q || '');

		if (query.length < 2) {
			return res.json({ query, items: [] });
		}

		const containsQuery = {
			contains: query,
			mode: 'insensitive',
		};

		const [
			admins,
			employees,
			workLocations,
			departments,
			jobRoles,
			jobLevels,
			groupShifts,
			masterDokPkb,
			masterDokKaryawan,
			masterCutiKaryawan,
			masterUnits,
			masterVendors,
			guidanceRecords,
			warningLetters,
			leaveDatabaseRows,
			leaveFlowRows,
			licenseCertifications,
			unitLicenseCertifications,
		] = await Promise.all([
			prisma.masterAdmin.findMany({
				where: {
					OR: [
						{ role: containsQuery },
						{ employee: { is: { fullName: containsQuery } } },
						{ employee: { is: { employeeNo: containsQuery } } },
					],
				},
				include: {
					employee: true,
				},
				orderBy: { id: 'desc' },
				take: RESULT_LIMIT,
			}),
			prisma.employee.findMany({
				where: {
					OR: [
						{ fullName: containsQuery },
						{ employeeNo: containsQuery },
						{ siteDiv: containsQuery },
						{ phoneNumber: containsQuery },
						{ email: containsQuery },
						{ department: { is: { name: containsQuery } } },
						{ jobRole: { is: { name: containsQuery } } },
						{ jobLevel: { is: { name: containsQuery } } },
						{ workLocation: { is: { name: containsQuery } } },
					],
				},
				include: {
					department: true,
					jobRole: true,
					jobLevel: true,
					workLocation: true,
				},
				orderBy: { id: 'desc' },
				take: RESULT_LIMIT,
			}),
			prisma.workLocation.findMany({
				where: { name: containsQuery },
				orderBy: { id: 'desc' },
				take: RESULT_LIMIT,
			}),
			prisma.department.findMany({
				where: { name: containsQuery },
				orderBy: { id: 'desc' },
				take: RESULT_LIMIT,
			}),
			prisma.jobRole.findMany({
				where: { name: containsQuery },
				orderBy: { id: 'desc' },
				take: RESULT_LIMIT,
			}),
			prisma.jobLevel.findMany({
				where: { name: containsQuery },
				orderBy: { id: 'desc' },
				take: RESULT_LIMIT,
			}),
			prisma.masterGroupShift.findMany({
				where: { groupShiftName: containsQuery },
				orderBy: { id: 'desc' },
				take: RESULT_LIMIT,
			}),
			prisma.masterDokPkb.findMany({
				where: {
					OR: [{ article: containsQuery }, { content: containsQuery }],
				},
				orderBy: { id: 'desc' },
				take: RESULT_LIMIT,
			}),
			prisma.masterDokKaryawan.findMany({
				where: {
					OR: [{ documentName: containsQuery }, { documentType: containsQuery }, { issuer: containsQuery }],
				},
				orderBy: { id: 'desc' },
				take: RESULT_LIMIT,
			}),
			prisma.masterCutiKaryawan.findMany({
				where: { leaveType: containsQuery },
				orderBy: { id: 'desc' },
				take: RESULT_LIMIT,
			}),
			prisma.masterUnit.findMany({
				where: {
					OR: [
						{ unitName: containsQuery },
						{ unitType: containsQuery },
						{ capacity: containsQuery },
						{ unitSerialNumber: containsQuery },
						{ detailLainnya: containsQuery },
					],
				},
				orderBy: { id: 'desc' },
				take: RESULT_LIMIT,
			}),
			prisma.masterVendor.findMany({
				where: {
					OR: [
						{ vendorName: containsQuery },
						{ vendorType: containsQuery },
						{ address: containsQuery },
						{ picName: containsQuery },
						{ phoneNumber: containsQuery },
						{ email: containsQuery },
						{ detailLainnya: containsQuery },
					],
				},
				orderBy: { id: 'desc' },
				take: RESULT_LIMIT,
			}),
			prisma.guidanceRecord.findMany({
				where: {
					OR: [
						{ employee: { is: { fullName: containsQuery } } },
						{ employee: { is: { employeeNo: containsQuery } } },
						{ location: containsQuery },
						{ problemFaced: containsQuery },
						{ problemCause: containsQuery },
						{ problemSolving: containsQuery },
					],
				},
				include: {
					employee: true,
				},
				orderBy: { id: 'desc' },
				take: RESULT_LIMIT,
			}),
			prisma.warningLetter.findMany({
				where: {
					OR: [
						{ letterNumber: containsQuery },
						{ employee: { is: { fullName: containsQuery } } },
						{ employee: { is: { employeeNo: containsQuery } } },
						{ superiorEmployee: { is: { fullName: containsQuery } } },
						{ violation: containsQuery },
						{ articleLabel: containsQuery },
						{ articleContent: containsQuery },
					],
				},
				include: {
					employee: true,
					superiorEmployee: true,
				},
				orderBy: { id: 'desc' },
				take: RESULT_LIMIT,
			}),
			prisma.employeeLeaveDatabase.findMany({
				where: {
					OR: [
						{ employee: { is: { fullName: containsQuery } } },
						{ employee: { is: { employeeNo: containsQuery } } },
						{ masterCutiKaryawan: { is: { leaveType: containsQuery } } },
						{ notes: containsQuery },
					],
				},
				include: {
					employee: true,
					masterCutiKaryawan: true,
				},
				orderBy: { id: 'desc' },
				take: RESULT_LIMIT,
			}),
			prisma.employeeLeave.findMany({
				where: {
					OR: [
						{ requestNumber: containsQuery },
						{ employee: { is: { fullName: containsQuery } } },
						{ employee: { is: { employeeNo: containsQuery } } },
						{ masterCutiKaryawan: { is: { leaveType: containsQuery } } },
						{ notes: containsQuery },
						{ leaveAddress: containsQuery },
						{ leaveReason: containsQuery },
					],
				},
				include: {
					employee: true,
					masterCutiKaryawan: true,
				},
				orderBy: { id: 'desc' },
				take: RESULT_LIMIT,
			}),
			prisma.employeeLicenseCertification.findMany({
				where: {
					OR: [
						{ employee: { is: { fullName: containsQuery } } },
						{ employee: { is: { employeeNo: containsQuery } } },
						{ masterDokKaryawan: { is: { documentName: containsQuery } } },
						{ type: containsQuery },
						{ documentNumber: containsQuery },
						{ issuerSnapshot: containsQuery },
						{ notes: containsQuery },
					],
				},
				include: {
					employee: true,
					masterDokKaryawan: true,
				},
				orderBy: { id: 'desc' },
				take: RESULT_LIMIT,
			}),
			prisma.unitLicenseCertification.findMany({
				where: {
					OR: [
						{ masterUnit: { is: { unitName: containsQuery } } },
						{ masterUnit: { is: { unitSerialNumber: containsQuery } } },
						{ assetNo: containsQuery },
						{ documentNumber: containsQuery },
						{ issuedBy: containsQuery },
						{ vendor: { is: { vendorName: containsQuery } } },
						{ notes: containsQuery },
					],
				},
				include: {
					masterUnit: true,
					vendor: true,
				},
				orderBy: { id: 'desc' },
				take: RESULT_LIMIT,
			}),
		]);

		const items = [
			...admins.map((item) =>
				mapGlobalSearchItem({
					id: item.id,
					group: 'Master Admin',
					title: item.employee.fullName,
					subtitle: `${item.employee.employeeNo} | Role: ${item.role}`,
					href: buildSearchHref('/data-master/master-data-karyawan/admins', query),
				}),
			),
			...employees.map((item) =>
				mapGlobalSearchItem({
					id: item.id,
					group: 'Master Karyawan',
					title: item.fullName,
					subtitle: `${item.employeeNo} | ${item.department?.name || '-'} | ${item.jobRole?.name || '-'}`,
					href: buildSearchHref('/data-master/master-data-karyawan/employees', query),
				}),
			),
			...workLocations.map((item) =>
				mapGlobalSearchItem({
					id: item.id,
					group: 'Master Work Location',
					title: item.name,
					href: buildSearchHref('/data-master/master-data-karyawan/work-locations', query),
				}),
			),
			...departments.map((item) =>
				mapGlobalSearchItem({
					id: item.id,
					group: 'Master Department',
					title: item.name,
					href: buildSearchHref('/data-master/master-data-karyawan/departments', query),
				}),
			),
			...jobRoles.map((item) =>
				mapGlobalSearchItem({
					id: item.id,
					group: 'Master Job Role',
					title: item.name,
					href: buildSearchHref('/data-master/master-data-karyawan/job-roles', query),
				}),
			),
			...jobLevels.map((item) =>
				mapGlobalSearchItem({
					id: item.id,
					group: 'Master Job Level',
					title: item.name,
					href: buildSearchHref('/data-master/master-data-karyawan/job-levels', query),
				}),
			),
			...groupShifts.map((item) =>
				mapGlobalSearchItem({
					id: item.id,
					group: 'Master Group Shift',
					title: item.groupShiftName,
					href: buildSearchHref('/data-master/master-data-karyawan/group-shifts', query),
				}),
			),
			...masterDokPkb.map((item) =>
				mapGlobalSearchItem({
					id: item.id,
					group: 'Master Dok PKB',
					title: item.article,
					subtitle: item.content,
					href: buildSearchHref('/data-master/master-data-dokumen/master-dok-pkb', query),
				}),
			),
			...masterDokKaryawan.map((item) =>
				mapGlobalSearchItem({
					id: item.id,
					group: 'Master Dok Karyawan',
					title: item.documentName,
					subtitle: `${item.documentType} | ${item.issuer}`,
					href: buildSearchHref('/data-master/master-data-dokumen/master-dok-karyawan', query),
				}),
			),
			...masterCutiKaryawan.map((item) =>
				mapGlobalSearchItem({
					id: item.id,
					group: 'Master Cuti Karyawan',
					title: item.leaveType,
					href: buildSearchHref('/data-master/master-data-dokumen/master-cuti-karyawan', query),
				}),
			),
			...masterUnits.map((item) =>
				mapGlobalSearchItem({
					id: item.id,
					group: 'Master Unit',
					title: item.unitName,
					subtitle: `${item.unitType} | ${item.unitSerialNumber}`,
					href: buildSearchHref('/data-master/master-data-unit/master-unit', query),
				}),
			),
			...masterVendors.map((item) =>
				mapGlobalSearchItem({
					id: item.id,
					group: 'Master Vendor',
					title: item.vendorName,
					subtitle: `${item.vendorType} | ${item.picName}`,
					href: buildSearchHref('/data-master/master-data-unit/master-vendor', query),
				}),
			),
			...guidanceRecords.map((item) =>
				mapGlobalSearchItem({
					id: item.id,
					group: 'Bimbingan & Pengarahan',
					title: item.employee.fullName,
					subtitle: `${item.employee.employeeNo} | ${formatDateForClient(item.meetingDate)} | ${
						item.location
					}`,
					href: buildSearchHref('/data-karyawan/bimbingan-pengarahan', query),
				}),
			),
			...warningLetters.map((item) =>
				mapGlobalSearchItem({
					id: item.id,
					group: 'Data Surat Peringatan',
					title: item.letterNumber,
					subtitle: `${item.employee.fullName} (${item.employee.employeeNo}) | ${formatDateForClient(
						item.letterDate,
					)}`,
					href: buildSearchHref('/data-karyawan/data-surat-peringatan', query),
				}),
			),
			...leaveDatabaseRows.map((item) =>
				mapGlobalSearchItem({
					id: item.id,
					group: 'Data Cuti Karyawan',
					title: `${item.employee.fullName} (${item.employee.employeeNo})`,
					subtitle: `${item.masterCutiKaryawan.leaveType} | Tahun ${item.year} | Sisa ${item.remainingLeave}`,
					href: buildSearchHref('/data-karyawan/cuti-karyawan', query),
				}),
			),
			...leaveFlowRows.map((item) =>
				mapGlobalSearchItem({
					id: item.id,
					group: 'Flow Proses Cuti',
					title: item.requestNumber,
					subtitle: `${item.employee.fullName} (${item.employee.employeeNo}) | ${item.masterCutiKaryawan.leaveType} | ${item.status}`,
					href: buildSearchHref('/data-karyawan/cuti-karyawan/flow', query),
				}),
			),
			...licenseCertifications.map((item) =>
				mapGlobalSearchItem({
					id: item.id,
					group: 'Lisensi & Sertifikasi',
					title: item.employee.fullName,
					subtitle: `${item.employee.employeeNo} | ${item.masterDokKaryawan.documentName} | ${item.documentNumber}`,
					href: buildSearchHref('/data-karyawan/lisensi-sertifikasi', query),
				}),
			),
			...unitLicenseCertifications.map((item) =>
				mapGlobalSearchItem({
					id: item.id,
					group: 'Lisensi & Sertifikasi Unit',
					title: item.masterUnit.unitName,
					subtitle: `${item.assetNo} | ${item.documentNumber} | ${item.vendor.vendorName}`,
					href: buildSearchHref('/data-unit/lisensi-sertifikasi-unit', query),
				}),
			),
		];

		return res.json({
			query,
			items,
		});
	}),
);

export default router;
