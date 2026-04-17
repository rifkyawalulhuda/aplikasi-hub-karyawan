import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import PlaylistAddCheckCircleOutlinedIcon from '@mui/icons-material/PlaylistAddCheckCircleOutlined';
import RuleFolderOutlinedIcon from '@mui/icons-material/RuleFolderOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

export function getAdminNotificationCategoryLabel(category = '') {
	switch (category) {
		case 'EMPLOYEE_LICENSE':
			return 'Lisensi Karyawan';
		case 'UNIT_LICENSE':
			return 'Lisensi Unit';
		case 'LEAVE_FLOW':
			return 'Flow Cuti';
		case 'LEAVE_REJECTED':
			return 'Cuti Ditolak';
		case 'EMAIL_FAILED':
			return 'Email Gagal';
		case 'EMPLOYEE_PROFILE_CHANGE':
			return 'Perubahan Profil Karyawan';
		default:
			return category || 'Notifikasi';
	}
}

export function getAdminNotificationStatusLabel(isRead) {
	return isRead ? 'Sudah dibaca' : 'Belum dibaca';
}

export function getAdminNotificationVisual(item = {}) {
	let fallbackIcon = <InfoOutlinedIcon fontSize="small" />;
	let fallbackColor = '#4E7AA7';
	let fallbackTint = 'rgba(78, 122, 167, 0.12)';

	if (item.severity === 'error') {
		fallbackIcon = <ErrorOutlineOutlinedIcon fontSize="small" />;
		fallbackColor = '#C9584D';
		fallbackTint = 'rgba(201, 88, 77, 0.10)';
	} else if (item.severity === 'warning') {
		fallbackIcon = <WarningAmberOutlinedIcon fontSize="small" />;
		fallbackColor = '#D08A1D';
		fallbackTint = 'rgba(208, 138, 29, 0.12)';
	}

	switch (item.category) {
		case 'EMPLOYEE_LICENSE':
		case 'UNIT_LICENSE':
			return {
				icon:
					item.severity === 'error' ? (
						<RuleFolderOutlinedIcon fontSize="small" />
					) : (
						<WarningAmberOutlinedIcon fontSize="small" />
					),
				color: item.severity === 'error' ? '#C9584D' : '#D08A1D',
				tint: item.severity === 'error' ? 'rgba(201, 88, 77, 0.10)' : 'rgba(208, 138, 29, 0.12)',
			};
		case 'LEAVE_FLOW':
			return {
				icon: <PlaylistAddCheckCircleOutlinedIcon fontSize="small" />,
				color: '#2F74BC',
				tint: 'rgba(47, 116, 188, 0.12)',
			};
		case 'EMAIL_FAILED':
			return {
				icon: <MarkEmailUnreadOutlinedIcon fontSize="small" />,
				color: '#C9584D',
				tint: 'rgba(201, 88, 77, 0.10)',
			};
		case 'EMPLOYEE_PROFILE_CHANGE':
			return {
				icon: <ManageAccountsOutlinedIcon fontSize="small" />,
				color: '#2F74BC',
				tint: 'rgba(47, 116, 188, 0.12)',
			};
		case 'LEAVE_REJECTED':
			return {
				icon: <InfoOutlinedIcon fontSize="small" />,
				color: '#4E7AA7',
				tint: 'rgba(78, 122, 167, 0.12)',
			};
		default:
			return {
				icon: fallbackIcon,
				color: fallbackColor,
				tint: fallbackTint,
			};
	}
}
