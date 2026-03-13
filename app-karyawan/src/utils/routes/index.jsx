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

function Router() {
	return (
		<BrowserRouter>
			<ScrollToTopOnRouteChange>
				<Routes>
					<Route path="/" element={<MainLayout />}>
						<Route index element={<Navigate to="/data-master/master-data-karyawan/employees" replace />} />
						<Route path="data-master/master-data-karyawan/employees" element={<EmployeesPage />} />
						<Route path="data-master/master-data-karyawan/work-locations" element={<WorkLocationsPage />} />
						<Route path="data-master/master-data-karyawan/departments" element={<DepartmentsPage />} />
						<Route path="data-master/master-data-karyawan/job-roles" element={<JobRolesPage />} />
						<Route path="data-master/master-data-karyawan/job-levels" element={<JobLevelsPage />} />
					</Route>
				</Routes>
			</ScrollToTopOnRouteChange>
		</BrowserRouter>
	);
}

export default Router;
