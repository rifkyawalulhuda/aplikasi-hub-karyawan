import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

import EnhancedTable from '@/components/dataTable';

const HEAD_CELLS = [
	{
		id: 'id',
		label: 'NO',
	},
	{
		id: 'name',
		label: 'NAMA',
	},
	{
		id: 'actions',
		label: 'AKSI',
	},
];

function MasterDataTable({ rows, loading, onEdit, onDelete }) {
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

	return (
		<EnhancedTable
			rows={rows}
			headCells={HEAD_CELLS}
			stickyHeader
			tableContainerProps={{
				sx: {
					maxHeight: 480,
				},
			}}
			render={(row) => (
				<TableRow hover key={row.id}>
					<TableCell>{row.id}</TableCell>
					<TableCell>{row.name}</TableCell>
					<TableCell width={120}>
						<Stack direction="row" spacing={1}>
							<Tooltip title="Edit">
								<IconButton color="primary" onClick={() => onEdit(row)}>
									<EditOutlinedIcon />
								</IconButton>
							</Tooltip>
							<Tooltip title="Hapus">
								<IconButton color="error" onClick={() => onDelete(row)}>
									<DeleteOutlineOutlinedIcon />
								</IconButton>
							</Tooltip>
						</Stack>
					</TableCell>
				</TableRow>
			)}
		/>
	);
}

export default MasterDataTable;
