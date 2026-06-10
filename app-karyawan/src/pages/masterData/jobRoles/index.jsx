import MASTER_DATA_PAGE_CONFIG from '@/constants/masterData';
import MasterDataPage from '@/pages/masterData/shared/masterDataPage';

function JobRolesPage({ hideHeader }) {
	return <MasterDataPage config={MASTER_DATA_PAGE_CONFIG.jobRoles} hideHeader={hideHeader} />;
}

export default JobRolesPage;
