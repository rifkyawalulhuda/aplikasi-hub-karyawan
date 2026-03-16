import Checkbox from '@mui/material/Checkbox';
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

import { formatGuidanceDate, guidanceCategoryConfigs } from './constants';

const stickyActionCellSx = {
	position: 'sticky',
	right: 0,
	minWidth: 124,
	backgroundColor: 'background.paper',
	zIndex: 2,
	boxShadow: '-6px 0 8px -8px rgba(15, 23, 42, 0.35)',
};

function GuidanceTable({
	rows,
	selectedRowIds,
	allRowsSelected,
	someRowsSelected,
	onToggleSelectAll,
	onToggleSelectRow,
	onView,
	onEdit,
	onDelete,
}) {
	if (rows.length === 0) {
		return (
			<Stack py={8} alignItems="center" spacing={1}>
				<Typography variant="h6">{guidanceCategoryConfigs.GUIDANCE.emptyTitle}</Typography>
				<Typography variant="body2" color="text.secondary">
					{guidanceCategoryConfigs.GUIDANCE.emptyDescription}
				</Typography>
			</Stack>
		);
	}

	const headCells = [
		{
			id: 'select',
			label: (
				<Checkbox
					size="small"
					checked={allRowsSelected}
					indeterminate={someRowsSelected}
					onChange={(event) => onToggleSelectAll(event.target.checked)}
					inputProps={{ 'aria-label': 'Pilih semua data bimbingan dan pengarahan' }}
				/>
			),
			disableSort: true,
			sx: { width: 56, px: 1.5 },
		},
		{ id: 'id', label: 'NO' },
		{ id: 'categoryLabel', label: 'KATEGORI' },
		{ id: 'meetingNumber', label: 'PERTEMUAN KE' },
		{ id: 'meetingDate', label: 'TANGGAL' },
		{ id: 'meetingTime', label: 'JAM' },
		{ id: 'location', label: 'TEMPAT' },
		{ id: 'employeeName', label: 'NAMA KARYAWAN' },
		{ id: 'employeeNo', label: 'NIK' },
		{ id: 'departmentName', label: 'DEPARTEMEN' },
		{ id: 'actions', label: 'AKSI', disableSort: true, sx: { ...stickyActionCellSx, zIndex: 4 } },
	];

	return (
		<EnhancedTable
			rows={rows}
			headCells={headCells}
			stickyHeader
			initialRowsPerPage={15}
			rowsPerPageOptions={[15, 30, 50, 100]}
			tableContainerProps={{ sx: { maxHeight: 520 } }}
			render={(row, _index, meta) => {
				const isSelected = selectedRowIds.includes(row.id);

				return (
					<TableRow hover key={row.id} selected={isSelected}>
						<TableCell padding="checkbox" sx={{ pl: 1.5 }}>
							<Checkbox
								size="small"
								checked={isSelected}
								onChange={(event) => onToggleSelectRow(row.id, event.target.checked)}
								inputProps={{ 'aria-label': `Pilih data ${row.employeeName}` }}
							/>
						</TableCell>
						<TableCell>{meta?.rowNumber || 1}</TableCell>
						<TableCell>{row.categoryLabel}</TableCell>
						<TableCell>{row.meetingNumber}</TableCell>
						<TableCell>{formatGuidanceDate(row.meetingDate)}</TableCell>
						<TableCell>{row.meetingTime}</TableCell>
						<TableCell>{row.location}</TableCell>
						<TableCell>{row.employeeName}</TableCell>
						<TableCell>{row.employeeNo}</TableCell>
						<TableCell>{row.departmentName}</TableCell>
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
				);
			}}
		/>
	);
}

export default GuidanceTable;
