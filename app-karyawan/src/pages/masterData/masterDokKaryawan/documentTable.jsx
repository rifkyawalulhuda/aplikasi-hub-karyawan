import { useMemo } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import EnhancedTable, { createRowNumberColumn } from '@/components/dataTable';

function DocumentTable({ rows, onEdit, onDelete }) {
	if (rows.length === 0) {
		return (
			<Stack py={8} alignItems="center" spacing={1}>
				<Typography variant="h6">Belum ada data dokumen karyawan</Typography>
				<Typography variant="body2" color="text.secondary">
					Tambahkan master dokumen karyawan pertama dari form input.
				</Typography>
			</Stack>
		);
	}

	const columns = useMemo(
		() => [
			createRowNumberColumn(),
			{ field: 'documentName', headerName: 'NAMA DOKUMEN', minWidth: 220, flex: 1 },
			{ field: 'documentType', headerName: 'JENIS DOKUMEN', minWidth: 180 },
			{ field: 'issuer', headerName: 'PENERBIT', minWidth: 180, flex: 1 },
		],
		[],
	);

	return (
		<EnhancedTable
			rows={rows}
			columns={columns}
			columnResizeKey="master-documents-table"
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

export default DocumentTable;
