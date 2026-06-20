import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

import PageHeader from '@/components/pageHeader';
import MasterDokPkbPage from '@/pages/masterData/masterDokPkb';
import MasterDokKaryawanPage from '@/pages/masterData/masterDokKaryawan';
import MasterCutiKaryawanPage from '@/pages/masterData/masterCutiKaryawan';
import MasterHolidayPage from '@/pages/masterData/masterHoliday';
import JenisLimbahB3Tab from '@/pages/masterData/masterDokumen/JenisLimbahB3Tab';

const TAB_CONFIG = [
	{ label: 'Master Dok PKB', path: '/data-master/master-data-dokumen/master-dok-pkb' },
	{ label: 'Master Dok Karyawan', path: '/data-master/master-data-dokumen/master-dok-karyawan' },
	{ label: 'Master Cuti Karyawan', path: '/data-master/master-data-dokumen/master-cuti-karyawan' },
	{ label: 'Master Hari Libur', path: '/data-master/master-data-dokumen/master-hari-libur' },
	{ label: 'Jenis Limbah B3', path: '/data-master/master-data-dokumen/jenis-limbah-b3' },
];

const TAB_PATHS = TAB_CONFIG.map((tab) => tab.path);

function MasterDataDokumenCombinedPage() {
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
			<PageHeader title="Master Data Dokumen">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Link underline="hover" href="#!">
						Data Master
					</Link>
					<Typography color="text.tertiary">Master Data Dokumen</Typography>
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
				<MasterDokPkbPage hideHeader />
			</Box>
			<Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
				<MasterDokKaryawanPage hideHeader />
			</Box>
			<Box sx={{ display: activeTab === 2 ? 'block' : 'none' }}>
				<MasterCutiKaryawanPage hideHeader />
			</Box>
			<Box sx={{ display: activeTab === 3 ? 'block' : 'none' }}>
				<MasterHolidayPage hideHeader />
			</Box>
			<Box sx={{ display: activeTab === 4 ? 'block' : 'none' }}>
				<JenisLimbahB3Tab />
			</Box>
		</>
	);
}

export default MasterDataDokumenCombinedPage;
