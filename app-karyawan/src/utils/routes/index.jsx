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
const WorkLocationsPage = withLazyLoadably(lazy(() => import('@/pages/masterData/workLocations')));
const DepartmentsPage = withLazyLoadably(lazy(() => import('@/pages/masterData/departments')));
const JobRolesPage = withLazyLoadably(lazy(() => import('@/pages/masterData/jobRoles')));
const JobLevelsPage = withLazyLoadably(lazy(() => import('@/pages/masterData/jobLevels')));
const MasterUnitsPage = withLazyLoadably(lazy(() => import('@/pages/masterData/masterUnits')));
const AdminsPage = withLazyLoadably(lazy(() => import('@/pages/masterData/admins')));
const EmployeesPage = withLazyLoadably(lazy(() => import('@/pages/masterData/employees')));
const MasterDokPkbPage = withLazyLoadably(lazy(() => import('@/pages/masterData/masterDokPkb')));
const MasterDokKaryawanPage = withLazyLoadably(lazy(() => import('@/pages/masterData/masterDokKaryawan')));
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
						<Route path="/karyawan" element={<EmployeeMobileLayout />}>
							<Route index element={<EmployeeDashboardPage />} />
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
							<Route path="data-master/master-data-unit/master-unit" element={<MasterUnitsPage />} />
							<Route
								path="data-master/master-data-dokumen/master-dok-pkb"
								element={<MasterDokPkbPage />}
							/>
							<Route
								path="data-master/master-data-dokumen/master-dok-karyawan"
								element={<MasterDokKaryawanPage />}
							/>
							<Route path="data-karyawan/bimbingan-pengarahan" element={<GuidanceRecordsPage />} />
							<Route
								path="data-karyawan/bimbingan-pengarahan/:id"
								element={<GuidanceRecordDetailPage />}
							/>
							<Route path="data-karyawan/data-surat-peringatan" element={<WarningLettersPage />} />
							<Route path="data-karyawan/lisensi-sertifikasi" element={<LicenseCertificationsPage />} />
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
