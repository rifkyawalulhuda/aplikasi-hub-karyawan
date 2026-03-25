import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import EnhancedTable from '@/components/dataTable';
import TableRowActionMenu from '@/components/tableRowActionMenu';

const stickyActionCellSx = {
	position: 'sticky',
	right: 0,
	minWidth: 84,
	backgroundColor: 'background.paper',
	zIndex: 2,
	boxShadow: '-6px 0 8px -8px rgba(15, 23, 42, 0.35)',
};

const HEAD_CELLS = [
	{ id: 'id', label: 'NO' },
	{ id: 'employeeName', label: 'NAMA' },
	{ id: 'employeeNo', label: 'NIK' },
	{ id: 'password', label: 'PASSWORD' },
	{ id: 'role', label: 'ROLE' },
	{ id: 'actions', label: 'AKSI', disableSort: true, sx: { ...stickyActionCellSx, zIndex: 4 } },
];

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
					<TableCell>{row.employeeName}</TableCell>
					<TableCell>{row.employeeNo}</TableCell>
					<TableCell>{row.password}</TableCell>
					<TableCell sx={{ textTransform: 'lowercase' }}>{row.role}</TableCell>
					<TableCell sx={stickyActionCellSx}>
						<Stack direction="row" justifyContent="center">
							<TableRowActionMenu
								row={row}
								actions={[
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
							/>
						</Stack>
					</TableCell>
				</TableRow>
			)}
		/>
	);
}

export default AdminTable;
