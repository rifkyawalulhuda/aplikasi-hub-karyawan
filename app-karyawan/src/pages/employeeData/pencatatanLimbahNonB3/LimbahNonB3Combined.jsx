import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

import PageHeader from '@/components/pageHeader';

import NeracaLimbahNonB3 from './NeracaLimbahNonB3';
import PencatatanLimbahNonB3 from './PencatatanLimbahNonB3';

const TAB_CONFIG = [
	{ label: 'Pencatatan Limbah Non-B3', path: '/limbah-non-b3/pencatatan' },
	{ label: 'Neraca Limbah Non-B3', path: '/limbah-non-b3/neraca' },
];

const TAB_PATHS = TAB_CONFIG.map((tab) => tab.path);

function LimbahNonB3CombinedPage() {
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
			<PageHeader title="Limbah Non-B3">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Typography color="text.tertiary">Operasional</Typography>
					<Typography color="text.primary">Limbah Non-B3</Typography>
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
				<PencatatanLimbahNonB3 />
			</Box>
			<Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
				<NeracaLimbahNonB3 />
			</Box>
		</>
	);
}

export default LimbahNonB3CombinedPage;
