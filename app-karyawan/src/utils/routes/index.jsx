import { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import ScrollToTopOnRouteChange from '@hocs/withScrollTopOnRouteChange';
import withLazyLoadably from '@hocs/withLazyLoadably';

import MainLayout from '@/components/layouts/mainLayout';

const WorkLocationsPage = withLazyLoadably(lazy(() => import('@/pages/masterData/workLocations')));
const DepartmentsPage = withLazyLoadably(lazy(() => import('@/pages/masterData/departments')));
const JobRolesPage = withLazyLoadably(lazy(() => import('@/pages/masterData/jobRoles')));
const JobLevelsPage = withLazyLoadably(lazy(() => import('@/pages/masterData/jobLevels')));
const EmployeesPage = withLazyLoadably(lazy(() => import('@/pages/masterData/employees')));
const MasterDokPkbPage = withLazyLoadably(lazy(() => import('@/pages/masterData/masterDokPkb')));
const GuidanceRecordsPage = withLazyLoadably(lazy(() => import('@/pages/employeeData/guidanceRecords')));
const GuidanceRecordDetailPage = withLazyLoadably(lazy(() => import('@/pages/employeeData/guidanceRecords/detail')));
const GuidanceRecordBulkPrintPage = withLazyLoadably(
	lazy(() => import('@/pages/employeeData/guidanceRecords/bulkPrint')),
);
const WarningLettersPage = withLazyLoadably(lazy(() => import('@/pages/employeeData/warningLetters')));
const WarningLetterDetailPage = withLazyLoadably(lazy(() => import('@/pages/employeeData/warningLetters/detail')));

function Router() {
	return (
		<BrowserRouter>
			<ScrollToTopOnRouteChange>
				<Routes>
					<Route path="/print/data-karyawan/bimbingan-pengarahan" element={<GuidanceRecordBulkPrintPage />} />
					<Route path="/" element={<MainLayout />}>
						<Route index element={<Navigate to="/data-master/master-data-karyawan/employees" replace />} />
						<Route path="data-master/master-data-karyawan/employees" element={<EmployeesPage />} />
						<Route path="data-master/master-data-karyawan/work-locations" element={<WorkLocationsPage />} />
						<Route path="data-master/master-data-karyawan/departments" element={<DepartmentsPage />} />
						<Route path="data-master/master-data-karyawan/job-roles" element={<JobRolesPage />} />
						<Route path="data-master/master-data-karyawan/job-levels" element={<JobLevelsPage />} />
						<Route path="data-master/master-data-dokumen/master-dok-pkb" element={<MasterDokPkbPage />} />
						<Route path="data-karyawan/bimbingan-pengarahan" element={<GuidanceRecordsPage />} />
						<Route path="data-karyawan/bimbingan-pengarahan/:id" element={<GuidanceRecordDetailPage />} />
						<Route path="data-karyawan/data-surat-peringatan" element={<WarningLettersPage />} />
						<Route path="data-karyawan/data-surat-peringatan/:id" element={<WarningLetterDetailPage />} />
						<Route
							path="data-karyawan/bimbingan-pengarahan/formulir-catatan-bimbingan-karyawan"
							element={<Navigate to="/data-karyawan/bimbingan-pengarahan" replace />}
						/>
					</Route>
				</Routes>
			</ScrollToTopOnRouteChange>
		</BrowserRouter>
	);
}

export default Router;
