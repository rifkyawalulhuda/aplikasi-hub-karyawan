import MASTER_DATA_PAGE_CONFIG from '@/constants/masterData';
import MasterDataPage from '@/pages/masterData/shared/masterDataPage';

function MasterUnitsPage() {
	return <MasterDataPage config={MASTER_DATA_PAGE_CONFIG.masterUnits} />;
}

export default MasterUnitsPage;
