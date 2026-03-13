import MASTER_DATA_PAGE_CONFIG from '@/constants/masterData';
import MasterDataPage from '../shared/masterDataPage';

function DepartmentsPage() {
	return <MasterDataPage config={MASTER_DATA_PAGE_CONFIG.departments} />;
}

export default DepartmentsPage;
