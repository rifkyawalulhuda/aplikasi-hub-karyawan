import MASTER_DATA_PAGE_CONFIG from '@/constants/masterData';
import MasterDataPage from '@/pages/masterData/shared/masterDataPage';

function JobRolesPage() {
	return <MasterDataPage config={MASTER_DATA_PAGE_CONFIG.jobRoles} />;
}

export default JobRolesPage;
