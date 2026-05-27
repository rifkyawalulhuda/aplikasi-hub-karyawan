import MASTER_DATA_PAGE_CONFIG from '@/constants/masterData';
import MasterDataPage from '@/pages/masterData/shared/masterDataPage';

function MasterCutiKaryawanPage({ hideHeader }) {
	return <MasterDataPage config={MASTER_DATA_PAGE_CONFIG.masterCutiKaryawan} hideHeader={hideHeader} />;
}

export default MasterCutiKaryawanPage;
