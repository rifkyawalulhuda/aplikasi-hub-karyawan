import MasterDataImportDialog from '@/components/masterData/masterDataImportDialog';
import { getApiBaseUrl } from '@/services/api';

function GroupShiftImportDialog({ open, loading, onClose, onImport }) {
	return (
		<MasterDataImportDialog
			open={open}
			loading={loading}
			title="Import Master Group Shift"
			description="Unduh template Excel resmi, isi Nama Group Shift, Foreman, dan Karyawan. Gunakan tanda ; untuk memisahkan banyak nama dalam satu sel."
			templateHref={`${getApiBaseUrl()}/master/group-shifts/import-template`}
			onClose={onClose}
			onImport={onImport}
		/>
	);
}

export default GroupShiftImportDialog;
