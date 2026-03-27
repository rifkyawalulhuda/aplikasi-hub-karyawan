import { useMemo } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import EnhancedTable, { createRowNumberColumn } from '@/components/dataTable';

function renderTextCell(value) {
	return (
		<Typography variant="body2" noWrap title={value || '-'}>
			{value || '-'}
		</Typography>
	);
}

function GroupShiftTable({ rows, onEdit, onDelete }) {
	if (rows.length === 0) {
		return (
			<Stack py={8} alignItems="center" spacing={1}>
				<Typography variant="h6">Belum ada data master group shift</Typography>
				<Typography variant="body2" color="text.secondary">
					Tambahkan master group shift pertama dari form input atau import Excel.
				</Typography>
			</Stack>
		);
	}

	const columns = useMemo(
		() => [
			createRowNumberColumn(),
			{ field: 'groupShiftName', headerName: 'NAMA GROUP SHIFT', minWidth: 220, width: 240 },
			{
				field: 'foremanNames',
				headerName: 'FOREMAN',
				minWidth: 260,
				width: 300,
				renderCell: (params) => renderTextCell(params.value),
			},
			{
				field: 'employeeNames',
				headerName: 'KARYAWAN',
				minWidth: 320,
				width: 420,
				renderCell: (params) => renderTextCell(params.value),
			},
		],
		[],
	);

	return (
		<EnhancedTable
			rows={rows}
			columns={columns}
			columnResizeKey="master-group-shifts-table"
			getContextMenuActions={() => [
				{
					key: 'edit',
					label: 'Edit',
					icon: <EditOutlinedIcon fontSize="small" color="primary" />,
					onClick: onEdit,
				},
				{
					key: 'delete',
					label: 'Hapus',
					icon: <DeleteOutlineOutlinedIcon fontSize="small" color="error" />,
					onClick: onDelete,
				},
			]}
			height={520}
		/>
	);
}

export default GroupShiftTable;
