import MASTER_DATA_PAGE_CONFIG from '@/constants/masterData';
import MasterDataPage from '@/pages/masterData/shared/masterDataPage';

function DepartmentsPage({ hideHeader }) {
	return <MasterDataPage config={MASTER_DATA_PAGE_CONFIG.departments} hideHeader={hideHeader} />;
}

export default DepartmentsPage;
