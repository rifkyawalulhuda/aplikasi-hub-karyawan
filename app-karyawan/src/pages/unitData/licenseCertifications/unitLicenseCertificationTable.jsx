import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import EnhancedTable from '@/components/dataTable';
import TableRowActionMenu from '@/components/tableRowActionMenu';

import { formatUnitLicenseDate, getUnitLicenseStatusChipColor } from './utils';

const stickyActionCellSx = {
	position: 'sticky',
	right: 0,
	minWidth: 84,
	backgroundColor: 'background.paper',
	zIndex: 2,
	boxShadow: '-6px 0 8px -8px rgba(15, 23, 42, 0.35)',
};

function UnitLicenseCertificationTable({ rows, onEdit, onDelete }) {
	if (rows.length === 0) {
		return (
			<Stack py={8} alignItems="center" spacing={1}>
				<Typography variant="h6">Belum ada data lisensi & sertifikasi unit</Typography>
				<Typography variant="body2" color="text.secondary">
					Tambahkan data lisensi atau sertifikasi unit pertama dari halaman ini.
				</Typography>
			</Stack>
		);
	}

	const headCells = [
		{ id: 'id', label: 'NO' },
		{ id: 'unitName', label: 'NAMA UNIT' },
		{ id: 'assetNo', label: 'ASSET NO' },
		{ id: 'unitType', label: 'JENIS UNIT' },
		{ id: 'capacity', label: 'KAPASITAS' },
		{ id: 'unitSerialNumber', label: 'UNIT/SERIAL NUMBER' },
		{ id: 'documentNumber', label: 'NO. DOKUMEN' },
		{ id: 'issuedBy', label: 'DITERBITKAN' },
		{ id: 'vendorName', label: 'VENDOR PENGURUS' },
		{ id: 'expiryDate', label: 'MASA BERLAKU' },
		{ id: 'status', label: 'STATUS' },
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
			columnResizeKey="unit-license-certifications-table"
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
					<TableCell>{row.unitName}</TableCell>
					<TableCell>{row.assetNo}</TableCell>
					<TableCell>{row.unitType}</TableCell>
					<TableCell>{row.capacity}</TableCell>
					<TableCell>{row.unitSerialNumber}</TableCell>
					<TableCell>{row.documentNumber}</TableCell>
					<TableCell>{row.issuedBy}</TableCell>
					<TableCell>{row.vendorName}</TableCell>
					<TableCell>{formatUnitLicenseDate(row.expiryDate)}</TableCell>
					<TableCell>
						<Chip
							size="small"
							label={row.status}
							color={getUnitLicenseStatusChipColor(row.status)}
							variant="outlined"
						/>
					</TableCell>
					<TableCell>{row.notes || '-'}</TableCell>
					<TableCell sx={{ ...stickyActionCellSx, py: 1.25 }}>
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

export default UnitLicenseCertificationTable;
