import { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import ScrollToTopOnRouteChange from '@hocs/withScrollTopOnRouteChange';
import withLazyLoadably from '@hocs/withLazyLoadably';

import ProtectedRoute from '@/components/auth/protectedRoute';
import PublicOnlyRoute from '@/components/auth/publicOnlyRoute';
import EmployeeProtectedRoute from '@/components/auth/employeeProtectedRoute';
import EmployeePublicOnlyRoute from '@/components/auth/employeePublicOnlyRoute';
import EmployeeAuthLayout from '@/components/layouts/employeeAuthLayout';
import EmployeeMobileLayout from '@/components/layouts/employeeMobileLayout';
import MinimalLayout from '@/components/layouts/minimalLayout';
import MainLayout from '@/components/layouts/mainLayout';

const LoginPage = withLazyLoadably(lazy(() => import('@/pages/login')));
const EmployeeLoginPage = withLazyLoadably(lazy(() => import('@/pages/employeeMobile/login')));
const EmployeeDashboardPage = withLazyLoadably(lazy(() => import('@/pages/employeeMobile/dashboard')));
const EmployeeProfilePage = withLazyLoadably(lazy(() => import('@/pages/employeeMobile/profile')));
const EmployeeGuidanceRecordsPage = withLazyLoadably(lazy(() => import('@/pages/employeeMobile/guidanceRecords')));
const EmployeeWarningLettersPage = withLazyLoadably(lazy(() => import('@/pages/employeeMobile/warningLetters')));
const EmployeeLeaveCenterPage = withLazyLoadably(lazy(() => import('@/pages/employeeMobile/leaveCenter')));
const EmployeeLeaveRequestDetailPage = withLazyLoadably(
	lazy(() => import('@/pages/employeeMobile/leaveRequestDetail')),
);
const EmployeeLeavePrintPage = withLazyLoadably(lazy(() => import('@/pages/employeeMobile/leavePrint')));
const EmployeeLeaveApprovalDetailPage = withLazyLoadably(
	lazy(() => import('@/pages/employeeMobile/leaveApprovalDetail')),
);
const WorkLocationsPage = withLazyLoadably(lazy(() => import('@/pages/masterData/workLocations')));
const DepartmentsPage = withLazyLoadably(lazy(() => import('@/pages/masterData/departments')));
const JobRolesPage = withLazyLoadably(lazy(() => import('@/pages/masterData/jobRoles')));
const JobLevelsPage = withLazyLoadably(lazy(() => import('@/pages/masterData/jobLevels')));
const GroupShiftsPage = withLazyLoadably(lazy(() => import('@/pages/masterData/groupShifts')));
const MasterUnitsPage = withLazyLoadably(lazy(() => import('@/pages/masterData/masterUnits')));
const MasterVendorsPage = withLazyLoadably(lazy(() => import('@/pages/masterData/masterVendors')));
const AdminsPage = withLazyLoadably(lazy(() => import('@/pages/masterData/admins')));
const EmployeesPage = withLazyLoadably(lazy(() => import('@/pages/masterData/employees')));
const MasterDokPkbPage = withLazyLoadably(lazy(() => import('@/pages/masterData/masterDokPkb')));
const MasterDokKaryawanPage = withLazyLoadably(lazy(() => import('@/pages/masterData/masterDokKaryawan')));
const MasterCutiKaryawanPage = withLazyLoadably(lazy(() => import('@/pages/masterData/masterCutiKaryawan')));
const MasterHariLiburPage = withLazyLoadably(lazy(() => import('@/pages/masterData/masterHoliday')));
const GuidanceRecordsPage = withLazyLoadably(lazy(() => import('@/pages/employeeData/guidanceRecords')));
const GuidanceRecordDetailPage = withLazyLoadably(lazy(() => import('@/pages/employeeData/guidanceRecords/detail')));
const GuidanceRecordBulkPrintPage = withLazyLoadably(
	lazy(() => import('@/pages/employeeData/guidanceRecords/bulkPrint')),
);
const WarningLettersPage = withLazyLoadably(lazy(() => import('@/pages/employeeData/warningLetters')));
const WarningLetterDetailPage = withLazyLoadably(lazy(() => import('@/pages/employeeData/warningLetters/detail')));
const WarningLetterBulkPrintPage = withLazyLoadably(
	lazy(() => import('@/pages/employeeData/warningLetters/bulkPrint')),
);
const LicenseCertificationsPage = withLazyLoadably(lazy(() => import('@/pages/employeeData/licenseCertifications')));
const EmployeeDetailListPage = withLazyLoadably(lazy(() => import('@/pages/employeeData/employeeDetail')));
const EmployeeDetailPage = withLazyLoadably(lazy(() => import('@/pages/employeeData/employeeDetail/detail')));
const EmployeeLeavesPage = withLazyLoadably(lazy(() => import('@/pages/employeeData/leaveRecords')));
const EmployeeLeaveFlowPage = withLazyLoadably(lazy(() => import('@/pages/employeeData/leaveFlow')));
const EmployeeLeavePrintAdminPage = withLazyLoadably(lazy(() => import('@/pages/employeeData/leaveFlow/print')));
const UnitLicenseCertificationsPage = withLazyLoadably(lazy(() => import('@/pages/unitData/licenseCertifications')));

function Router() {
	return (
		<BrowserRouter>
			<ScrollToTopOnRouteChange>
				<Routes>
					<Route element={<EmployeePublicOnlyRoute />}>
						<Route element={<EmployeeAuthLayout />}>
							<Route path="/karyawan/login" element={<EmployeeLoginPage />} />
						</Route>
					</Route>
					<Route element={<EmployeeProtectedRoute />}>
						<Route path="/karyawan/cuti/:id/print" element={<EmployeeLeavePrintPage />} />
						<Route path="/karyawan" element={<EmployeeMobileLayout />}>
							<Route index element={<EmployeeDashboardPage />} />
							<Route path="cuti" element={<EmployeeLeaveCenterPage />} />
							<Route path="cuti/approval/:approvalId" element={<EmployeeLeaveApprovalDetailPage />} />
							<Route path="cuti/:id" element={<EmployeeLeaveRequestDetailPage />} />
							<Route path="profil" element={<EmployeeProfilePage />} />
							<Route path="bimbingan-pengarahan" element={<EmployeeGuidanceRecordsPage />} />
							<Route path="surat-peringatan" element={<EmployeeWarningLettersPage />} />
						</Route>
					</Route>
					<Route element={<PublicOnlyRoute />}>
						<Route element={<MinimalLayout />}>
							<Route path="/login" element={<LoginPage />} />
						</Route>
					</Route>
					<Route element={<ProtectedRoute />}>
						<Route
							path="/print/data-karyawan/bimbingan-pengarahan"
							element={<GuidanceRecordBulkPrintPage />}
						/>
						<Route
							path="/print/data-karyawan/data-surat-peringatan"
							element={<WarningLetterBulkPrintPage />}
						/>
						<Route
							path="/print/data-karyawan/cuti-karyawan/:id"
							element={<EmployeeLeavePrintAdminPage />}
						/>
						<Route path="/" element={<MainLayout />}>
							<Route
								index
								element={<Navigate to="/data-master/master-data-karyawan/employees" replace />}
							/>
							<Route path="data-master/master-data-karyawan/employees" element={<EmployeesPage />} />
							<Route path="data-master/master-data-karyawan/admins" element={<AdminsPage />} />
							<Route
								path="data-master/master-data-karyawan/work-locations"
								element={<WorkLocationsPage />}
							/>
							<Route path="data-master/master-data-karyawan/departments" element={<DepartmentsPage />} />
							<Route path="data-master/master-data-karyawan/job-roles" element={<JobRolesPage />} />
							<Route path="data-master/master-data-karyawan/job-levels" element={<JobLevelsPage />} />
							<Route path="data-master/master-data-karyawan/group-shifts" element={<GroupShiftsPage />} />
							<Route path="data-master/master-data-unit/master-unit" element={<MasterUnitsPage />} />
							<Route path="data-master/master-data-unit/master-vendor" element={<MasterVendorsPage />} />
							<Route
								path="data-master/master-data-dokumen/master-dok-pkb"
								element={<MasterDokPkbPage />}
							/>
							<Route
								path="data-master/master-data-dokumen/master-dok-karyawan"
								element={<MasterDokKaryawanPage />}
							/>
							<Route
								path="data-master/master-data-dokumen/master-cuti-karyawan"
								element={<MasterCutiKaryawanPage />}
							/>
							<Route
								path="data-master/master-data-dokumen/master-hari-libur"
								element={<MasterHariLiburPage />}
							/>
							<Route path="data-karyawan/bimbingan-pengarahan" element={<GuidanceRecordsPage />} />
							<Route
								path="data-karyawan/bimbingan-pengarahan/:id"
								element={<GuidanceRecordDetailPage />}
							/>
							<Route path="data-karyawan/data-surat-peringatan" element={<WarningLettersPage />} />
							<Route path="data-karyawan/detail-karyawan" element={<EmployeeDetailListPage />} />
							<Route path="data-karyawan/detail-karyawan/:id" element={<EmployeeDetailPage />} />
							<Route path="data-karyawan/lisensi-sertifikasi" element={<LicenseCertificationsPage />} />
							<Route path="data-karyawan/cuti-karyawan" element={<EmployeeLeavesPage />} />
							<Route path="data-karyawan/cuti-karyawan/flow" element={<EmployeeLeaveFlowPage />} />
							<Route
								path="data-unit/lisensi-sertifikasi-unit"
								element={<UnitLicenseCertificationsPage />}
							/>
							<Route
								path="data-karyawan/data-surat-peringatan/:id"
								element={<WarningLetterDetailPage />}
							/>
							<Route
								path="data-karyawan/bimbingan-pengarahan/formulir-catatan-bimbingan-karyawan"
								element={<Navigate to="/data-karyawan/bimbingan-pengarahan" replace />}
							/>
						</Route>
					</Route>
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</ScrollToTopOnRouteChange>
		</BrowserRouter>
	);
}

export default Router;
