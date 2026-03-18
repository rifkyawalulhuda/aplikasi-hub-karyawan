import MASTER_DATA_PAGE_CONFIG from '@/constants/masterData';
import MasterDataPage from '@/pages/masterData/shared/masterDataPage';

function MasterVendorsPage() {
	return <MasterDataPage config={MASTER_DATA_PAGE_CONFIG.masterVendors} />;
}

export default MasterVendorsPage;
