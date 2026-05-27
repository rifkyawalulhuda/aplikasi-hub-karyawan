import MASTER_DATA_PAGE_CONFIG from '@/constants/masterData';
import MasterDataPage from '@/pages/masterData/shared/masterDataPage';

function JobLevelsPage({ hideHeader }) {
	return <MasterDataPage config={MASTER_DATA_PAGE_CONFIG.jobLevels} hideHeader={hideHeader} />;
}

export default JobLevelsPage;
