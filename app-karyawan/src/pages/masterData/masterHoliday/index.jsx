import MASTER_DATA_PAGE_CONFIG from '@/constants/masterData';
import MasterDataPage from '@/pages/masterData/shared/masterDataPage';

function MasterHolidayPage() {
	return <MasterDataPage config={MASTER_DATA_PAGE_CONFIG.masterHolidays} />;
}

export default MasterHolidayPage;
