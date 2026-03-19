import Chip from '@mui/material/Chip';

const STATUS_CONFIG = {
	SUBMITTED: {
		label: 'Submitted',
		color: 'default',
	},
	IN_APPROVAL: {
		label: 'Dalam Approval',
		color: 'warning',
	},
	APPROVED: {
		label: 'Approved',
		color: 'success',
	},
	REJECTED: {
		label: 'Rejected',
		color: 'error',
	},
	CANCELLED: {
		label: 'Cancelled',
		color: 'default',
	},
	PENDING: {
		label: 'Menunggu Tindakan',
		color: 'warning',
	},
	WAITING: {
		label: 'Menunggu Tahap',
		color: 'default',
	},
	LOCKED: {
		label: 'Tidak Aktif',
		color: 'default',
	},
};

function LeaveStatusChip({ status, label, size = 'small', variant = 'filled' }) {
	const config = STATUS_CONFIG[status] || {
		label: label || status || '-',
		color: 'default',
	};

	return <Chip size={size} variant={variant} label={label || config.label} color={config.color} />;
}

export default LeaveStatusChip;
