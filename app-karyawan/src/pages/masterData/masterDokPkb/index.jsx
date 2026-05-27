import MASTER_DATA_PAGE_CONFIG from '@/constants/masterData';
import MasterDataPage from '@/pages/masterData/shared/masterDataPage';

function MasterDokPkbPage({ hideHeader }) {
	return <MasterDataPage config={MASTER_DATA_PAGE_CONFIG.masterDokPkb} hideHeader={hideHeader} />;
}

export default MasterDokPkbPage;
