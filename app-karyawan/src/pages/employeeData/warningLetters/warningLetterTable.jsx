import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import EnhancedTable from '@/components/dataTable';

import { formatWarningDate } from './utils';

const stickyActionCellSx = {
	position: 'sticky',
	right: 0,
	minWidth: 124,
	backgroundColor: 'background.paper',
	zIndex: 2,
	boxShadow: '-6px 0 8px -8px rgba(15, 23, 42, 0.35)',
};

const HEAD_CELLS = [
	{ id: 'id', label: 'NO' },
	{ id: 'employeeName', label: 'NAMA' },
	{ id: 'employeeNo', label: 'NIK' },
	{ id: 'warningLevel', label: 'SURAT PERINGATAN KE' },
	{ id: 'letterNumber', label: 'NOMOR SURAT' },
	{ id: 'letterDate', label: 'TANGGAL SURAT PERINGATAN' },
	{ id: 'articleLabel', label: 'PASAL PKB' },
	{ id: 'superiorName', label: 'SUPERIOR' },
	{ id: 'actions', label: 'AKSI', disableSort: true, sx: { ...stickyActionCellSx, zIndex: 4 } },
];

function WarningLetterTable({ rows, onView, onEdit, onDelete }) {
	if (rows.length === 0) {
		return (
			<Stack py={8} alignItems="center" spacing={1}>
				<Typography variant="h6">Belum ada data surat peringatan</Typography>
				<Typography variant="body2" color="text.secondary">
					Tambahkan form surat peringatan pertama dari halaman ini.
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
			render={(row) => (
				<TableRow hover key={row.id}>
					<TableCell>{row.id}</TableCell>
					<TableCell>{row.employeeName}</TableCell>
					<TableCell>{row.employeeNo}</TableCell>
					<TableCell>{row.warningLevel}</TableCell>
					<TableCell>{row.letterNumber}</TableCell>
					<TableCell>{formatWarningDate(row.letterDate)}</TableCell>
					<TableCell>{row.articleLabel}</TableCell>
					<TableCell>{row.superiorName}</TableCell>
					<TableCell sx={{ ...stickyActionCellSx, py: 1.25 }}>
						<Stack direction="row" spacing={0.25} justifyContent="center">
							<Tooltip title="Detail">
								<IconButton color="info" size="small" onClick={() => onView(row)}>
									<VisibilityOutlinedIcon fontSize="small" />
								</IconButton>
							</Tooltip>
							<Tooltip title="Edit">
								<IconButton color="primary" size="small" onClick={() => onEdit(row)}>
									<EditOutlinedIcon fontSize="small" />
								</IconButton>
							</Tooltip>
							<Tooltip title="Hapus">
								<IconButton color="error" size="small" onClick={() => onDelete(row)}>
									<DeleteOutlineOutlinedIcon fontSize="small" />
								</IconButton>
							</Tooltip>
						</Stack>
					</TableCell>
				</TableRow>
			)}
		/>
	);
}

export default WarningLetterTable;
