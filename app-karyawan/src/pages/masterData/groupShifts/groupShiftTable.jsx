import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import EnhancedTable from '@/components/dataTable';

const stickyActionCellSx = {
	position: 'sticky',
	right: 0,
	minWidth: 128,
	backgroundColor: 'background.paper',
	zIndex: 2,
	boxShadow: '-6px 0 8px -8px rgba(15, 23, 42, 0.35)',
};

const HEAD_CELLS = [
	{ id: 'id', label: 'NO' },
	{ id: 'groupShiftName', label: 'NAMA GROUP SHIFT' },
	{ id: 'foremanNames', label: 'FOREMAN' },
	{ id: 'actions', label: 'AKSI', disableSort: true, sx: { ...stickyActionCellSx, zIndex: 4 } },
];

function GroupShiftTable({ rows, onEdit, onDelete }) {
	if (rows.length === 0) {
		return (
			<Stack py={8} alignItems="center" spacing={1}>
				<Typography variant="h6">Belum ada data master group shift</Typography>
				<Typography variant="body2" color="text.secondary">
					Tambahkan master group shift pertama dari form input.
				</Typography>
			</Stack>
		);
	}

	return (
		<EnhancedTable
			rows={rows}
			headCells={HEAD_CELLS}
			stickyHeader
			initialRowsPerPage={15}
			rowsPerPageOptions={[15, 30, 50, 100]}
			tableContainerProps={{ sx: { maxHeight: 520 } }}
			render={(row, _index, { rowNumber }) => (
				<TableRow hover key={row.id}>
					<TableCell>{rowNumber}</TableCell>
					<TableCell>{row.groupShiftName}</TableCell>
					<TableCell>{row.foremanNames}</TableCell>
					<TableCell sx={stickyActionCellSx}>
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

export default GroupShiftTable;
