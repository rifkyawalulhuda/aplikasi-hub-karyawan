import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

import PageHeader from '@/components/pageHeader';
import EmployeesPage from '@/pages/masterData/employees';
import SitesPage from '@/pages/masterData/sites';
import DepartmentsPage from '@/pages/masterData/departments';
import JobRolesPage from '@/pages/masterData/jobRoles';
import JobLevelsPage from '@/pages/masterData/jobLevels';
import WorkLocationsPage from '@/pages/masterData/workLocations';
import GroupShiftsPage from '@/pages/masterData/groupShifts';

const TAB_CONFIG = [
	{ label: 'Master Karyawan', path: '/data-master/master-data-karyawan/employees' },
	{ label: 'Master Site', path: '/data-master/master-data-karyawan/sites' },
	{ label: 'Master Department', path: '/data-master/master-data-karyawan/departments' },
	{ label: 'Master Job Role', path: '/data-master/master-data-karyawan/job-roles' },
	{ label: 'Master Job Level', path: '/data-master/master-data-karyawan/job-levels' },
	{ label: 'Master Work Location', path: '/data-master/master-data-karyawan/work-locations' },
	{ label: 'Master Group Shift', path: '/data-master/master-data-karyawan/group-shifts' },
];

const TAB_PATHS = TAB_CONFIG.map((tab) => tab.path);

function MasterDataKaryawanCombinedPage() {
	const location = useLocation();
	const navigate = useNavigate();

	const activeTab = useMemo(() => {
		const index = TAB_PATHS.indexOf(location.pathname);
		return index >= 0 ? index : 0;
	}, [location.pathname]);

	const handleTabChange = (_event, newValue) => {
		navigate(TAB_PATHS[newValue], { replace: true });
	};

	return (
		<>
			<PageHeader title="Master Data Karyawan">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Link underline="hover" href="#!">
						Data Master
					</Link>
					<Typography color="text.tertiary">Master Data Karyawan</Typography>
				</Breadcrumbs>
			</PageHeader>

			<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2.5 }}>
				<Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
					{TAB_CONFIG.map((tab) => (
						<Tab key={tab.path} label={tab.label} />
					))}
				</Tabs>
			</Box>

			<Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
				<EmployeesPage hideHeader />
			</Box>
			<Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
				<SitesPage hideHeader />
			</Box>
			<Box sx={{ display: activeTab === 2 ? 'block' : 'none' }}>
				<DepartmentsPage hideHeader />
			</Box>
			<Box sx={{ display: activeTab === 3 ? 'block' : 'none' }}>
				<JobRolesPage hideHeader />
			</Box>
			<Box sx={{ display: activeTab === 4 ? 'block' : 'none' }}>
				<JobLevelsPage hideHeader />
			</Box>
			<Box sx={{ display: activeTab === 5 ? 'block' : 'none' }}>
				<WorkLocationsPage hideHeader />
			</Box>
			<Box sx={{ display: activeTab === 6 ? 'block' : 'none' }}>
				<GroupShiftsPage hideHeader />
			</Box>
		</>
	);
}

export default MasterDataKaryawanCombinedPage;
