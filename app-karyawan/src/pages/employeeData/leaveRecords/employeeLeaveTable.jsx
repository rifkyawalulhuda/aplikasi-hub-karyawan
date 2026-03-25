import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import EnhancedTable from '@/components/dataTable';
import TableRowActionMenu from '@/components/tableRowActionMenu';

import formatLeaveDate from './utils';

const stickyActionCellSx = {
	position: 'sticky',
	right: 0,
	minWidth: 84,
	backgroundColor: 'background.paper',
	zIndex: 2,
	boxShadow: '-6px 0 8px -8px rgba(15, 23, 42, 0.35)',
};

function EmployeeLeaveTable({ rows, onDetail, onEdit, onDelete }) {
	if (rows.length === 0) {
		return (
			<Stack py={8} alignItems="center" spacing={1}>
				<Typography variant="h6">Belum ada database cuti karyawan</Typography>
				<Typography variant="body2" color="text.secondary">
					Tambahkan data cuti karyawan pertama dari halaman ini.
				</Typography>
			</Stack>
		);
	}

	const headCells = [
		{ id: 'id', label: 'NO' },
		{ id: 'employeeName', label: 'NAMA KARYAWAN' },
		{ id: 'employeeNo', label: 'NIK' },
		{ id: 'leaveType', label: 'JENIS CUTI' },
		{ id: 'leaveDays', label: 'JUMLAH CUTI' },
		{ id: 'periodStart', label: 'PERIODE DARI' },
		{ id: 'periodEnd', label: 'PERIODE SAMPAI' },
		{ id: 'remainingLeave', label: 'SISA CUTI' },
		{ id: 'notes', label: 'CATATAN' },
		{ id: 'actions', label: 'AKSI', disableSort: true, sx: { ...stickyActionCellSx, zIndex: 4 } },
	];

	return (
		<EnhancedTable
			rows={rows}
			headCells={headCells}
			stickyHeader
			initialRowsPerPage={15}
			rowsPerPageOptions={[15, 30, 50, 100]}
			resizableColumns
			columnResizeKey="employee-leave-database-table"
			tableSx={{
				'& th, & td': {
					borderRight: '1px solid rgba(15, 23, 42, 0.08)',
				},
				'& th:last-of-type, & td:last-of-type': {
					borderRight: 'none',
				},
			}}
			tableContainerProps={{ sx: { maxHeight: 520 } }}
			render={(row, _index, meta) => (
				<TableRow hover key={row.id}>
					<TableCell>{meta?.rowNumber || 1}</TableCell>
					<TableCell>{row.employeeName}</TableCell>
					<TableCell>{row.employeeNo}</TableCell>
					<TableCell>{row.leaveType}</TableCell>
					<TableCell>{row.leaveDays}</TableCell>
					<TableCell>{formatLeaveDate(row.periodStart)}</TableCell>
					<TableCell>{formatLeaveDate(row.periodEnd)}</TableCell>
					<TableCell>{row.remainingLeave}</TableCell>
					<TableCell>{row.notes || '-'}</TableCell>
					<TableCell sx={{ ...stickyActionCellSx, py: 1.25 }}>
						<Stack direction="row" justifyContent="center">
							<TableRowActionMenu
								row={row}
								actions={[
									{
										key: 'detail',
										label: 'Detail',
										icon: <VisibilityOutlinedIcon fontSize="small" color="info" />,
										onClick: onDetail,
									},
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

export default EmployeeLeaveTable;
