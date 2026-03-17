import MASTER_DATA_PAGE_CONFIG from '@/constants/masterData';
import MasterDataPage from '@/pages/masterData/shared/masterDataPage';

function JobLevelsPage() {
	return <MasterDataPage config={MASTER_DATA_PAGE_CONFIG.jobLevels} />;
}

export default JobLevelsPage;
