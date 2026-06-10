import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

import PageHeader from '@/components/pageHeader';
import EmployeeLeavesPage from '@/pages/employeeData/leaveRecords';
import EmployeeLeaveFlowPage from '@/pages/employeeData/leaveFlow';

const TAB_PATHS = ['/data-karyawan/cuti-karyawan', '/data-karyawan/cuti-karyawan/flow'];

function LeaveCombinedPage() {
	const location = useLocation();
	const navigate = useNavigate();

	const activeTab = useMemo(() => {
		if (location.pathname === '/data-karyawan/cuti-karyawan/flow') {
			return 1;
		}

		return 0;
	}, [location.pathname]);

	const handleTabChange = (_event, newValue) => {
		navigate(TAB_PATHS[newValue], { replace: true });
	};

	return (
		<>
			<PageHeader title="Cuti Karyawan">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Link underline="hover" href="#!">
						Data Karyawan
					</Link>
					<Typography color="text.tertiary">Cuti Karyawan</Typography>
				</Breadcrumbs>
			</PageHeader>

			<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2.5 }}>
				<Tabs value={activeTab} onChange={handleTabChange}>
					<Tab label="Data Cuti Karyawan" />
					<Tab label="Flow Proses Cuti" />
				</Tabs>
			</Box>

			<Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
				<EmployeeLeavesPage hideHeader />
			</Box>
			<Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
				<EmployeeLeaveFlowPage hideHeader />
			</Box>
		</>
	);
}

export default LeaveCombinedPage;
