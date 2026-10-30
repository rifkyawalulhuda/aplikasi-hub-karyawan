import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

import PageHeader from '@/components/pageHeader';
import PencatatanLimbahB3 from '@/pages/employeeData/pencatatanLimbahB3/PencatatanLimbahB3';
import NeracaLimbahB3 from '@/pages/employeeData/pencatatanLimbahB3/NeracaLimbahB3';

const TAB_CONFIG = [
	{ label: 'Pencatatan Limbah B3', path: '/limbah-b3/pencatatan' },
	{ label: 'Neraca Limbah B3', path: '/limbah-b3/neraca' },
];

const TAB_PATHS = TAB_CONFIG.map((tab) => tab.path);

function LimbahB3CombinedPage() {
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
			<PageHeader title="Limbah B3">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Typography color="text.tertiary">Operasional</Typography>
					<Typography color="text.primary">Limbah B3</Typography>
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
				<PencatatanLimbahB3 hideHeader />
			</Box>
			<Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
				<NeracaLimbahB3 hideHeader />
			</Box>
		</>
	);
}

export default LimbahB3CombinedPage;
