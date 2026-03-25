import { useMemo } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

import EnhancedTable, { createRowNumberColumn } from '@/components/dataTable';
import { toLocalDateString } from '@/utils/dateUtils';

function MasterDataTable({ rows, loading, config, onEdit, onDelete }) {
	if (!loading && rows.length === 0) {
		return (
			<Stack py={8} alignItems="center" spacing={1}>
				<Typography variant="h6">Belum ada data</Typography>
				<Typography variant="body2" color="text.secondary">
					Tambahkan data pertama untuk mulai menggunakan master ini.
				</Typography>
			</Stack>
		);
	}

	const dataColumns = config.tableColumns || [
		{
			id: 'id',
			label: 'NO',
		},
		{
			id: 'name',
			label: 'NAMA',
		},
	];
	const columns = useMemo(
		() =>
			dataColumns.map((column) => {
				if (column.id === 'id') {
					return createRowNumberColumn();
				}

				return {
					field: column.id,
					headerName: column.label,
					width: column.width,
					minWidth:
						column.id === 'content'
							? 360
							: column.minWidth ?? column.width ?? (column.type === 'date' ? 140 : 180),
					sortable: column.disableSort !== true,
					valueFormatter: column.type === 'date' ? (params) => toLocalDateString(params.value) : undefined,
					renderCell:
						column.id === 'content'
							? (params) => (
									<Typography
										variant="body2"
										sx={{
											whiteSpace: 'pre-wrap',
											wordBreak: 'break-word',
											lineHeight: 1.5,
										}}
									>
										{params.value || '-'}
									</Typography>
							  )
							: undefined,
				};
			}),
		[dataColumns],
	);

	return (
		<EnhancedTable
			rows={rows}
			columns={columns}
			columnResizeKey={`master-data-${config?.resource || 'shared'}-table`}
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
			height={480}
		/>
	);
}

export default MasterDataTable;
