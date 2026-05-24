import { useMemo } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import EnhancedTable, { createRowNumberColumn } from '@/components/dataTable';

function SiteTable({ rows, onEdit, onDelete }) {
	if (rows.length === 0) {
		return (
			<Stack py={8} alignItems="center" spacing={1}>
				<Typography variant="h6">Belum ada data site</Typography>
				<Typography variant="body2" color="text.secondary">
					Tambahkan site pertama dari form input.
				</Typography>
			</Stack>
		);
	}

	const columns = useMemo(
		() => [
			createRowNumberColumn(),
			{ field: 'name', headerName: 'NAMA SITE', minWidth: 220, flex: 1 },
			{
				field: 'adminCount',
				headerName: 'JUMLAH ADMIN',
				minWidth: 150,
				// eslint-disable-next-line no-underscore-dangle
				valueGetter: (params) => params.row._count?.admins ?? 0,
			},
			{
				field: 'employeeCount',
				headerName: 'JUMLAH KARYAWAN',
				minWidth: 170,
				// eslint-disable-next-line no-underscore-dangle
				valueGetter: (params) => params.row._count?.employees ?? 0,
			},
		],
		[],
	);

	return (
		<EnhancedTable
			rows={rows}
			columns={columns}
			columnResizeKey="master-site-table"
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

export default SiteTable;
