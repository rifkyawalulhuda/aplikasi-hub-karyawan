import { useMemo } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import EnhancedTable, { createRowNumberColumn } from '@/components/dataTable';

function AdminTable({ rows, onEdit, onDelete }) {
	if (rows.length === 0) {
		return (
			<Stack py={8} alignItems="center" spacing={1}>
				<Typography variant="h6">Belum ada data master admin</Typography>
				<Typography variant="body2" color="text.secondary">
					Tambahkan master admin pertama dari form input.
				</Typography>
			</Stack>
		);
	}

	const columns = useMemo(
		() => [
			createRowNumberColumn(),
			{ field: 'employeeName', headerName: 'NAMA', minWidth: 220, flex: 1 },
			{ field: 'employeeNo', headerName: 'NIK', minWidth: 140 },
			{ field: 'password', headerName: 'PASSWORD', minWidth: 170 },
			{
				field: 'role',
				headerName: 'ROLE',
				minWidth: 120,
				renderCell: (params) => String(params.value || '').toLowerCase(),
			},
		],
		[],
	);

	return (
		<EnhancedTable
			rows={rows}
			columns={columns}
			columnResizeKey="master-admin-table"
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

export default AdminTable;
