import Checkbox from '@mui/material/Checkbox';
import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import EnhancedTable from '@/components/dataTable';
import TableRowActionMenu from '@/components/tableRowActionMenu';

import {
	DISCIPLINE_LETTER_CATEGORIES,
	formatWarningDate,
	getDisciplineCategoryLabel,
	getWarningEndDate,
} from './utils';

const stickyActionCellSx = {
	position: 'sticky',
	right: 0,
	minWidth: 84,
	backgroundColor: 'background.paper',
	zIndex: 2,
	boxShadow: '-6px 0 8px -8px rgba(15, 23, 42, 0.35)',
};

function WarningLetterTable({
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
				<Typography variant="h6">Belum ada data surat peringatan atau surat teguran</Typography>
				<Typography variant="body2" color="text.secondary">
					Tambahkan form surat peringatan atau surat teguran pertama dari halaman ini.
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
					inputProps={{ 'aria-label': 'Pilih semua data surat peringatan' }}
				/>
			),
			disableSort: true,
			sx: { width: 56, px: 1.5 },
		},
		{ id: 'id', label: 'NO' },
		{ id: 'category', label: 'KATEGORI' },
		{ id: 'employeeName', label: 'NAMA' },
		{ id: 'employeeNo', label: 'NIK' },
		{ id: 'warningLevel', label: 'SURAT PERINGATAN KE' },
		{ id: 'letterNumber', label: 'NOMOR SURAT' },
		{ id: 'letterDate', label: 'TANGGAL SURAT PERINGATAN' },
		{ id: 'warningEndDate', label: 'SAMPAI TANGGAL' },
		{ id: 'articleLabel', label: 'PASAL PKB' },
		{ id: 'superiorName', label: 'SUPERIOR' },
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
			columnResizeKey="warning-letters-table"
			tableSx={{
				'& th, & td': {
					borderRight: '1px solid rgba(15, 23, 42, 0.08)',
				},
				'& th:last-of-type, & td:last-of-type': {
					borderRight: 'none',
				},
			}}
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
								inputProps={{ 'aria-label': `Pilih data surat peringatan ${row.employeeName}` }}
							/>
						</TableCell>
						<TableCell>{meta?.rowNumber || 1}</TableCell>
						<TableCell>{getDisciplineCategoryLabel(row.category)}</TableCell>
						<TableCell>{row.employeeName}</TableCell>
						<TableCell>{row.employeeNo}</TableCell>
						<TableCell>
							{row.category === DISCIPLINE_LETTER_CATEGORIES.WARNING_LETTER ? row.warningLevel : '-'}
						</TableCell>
						<TableCell>{row.letterNumber}</TableCell>
						<TableCell>{formatWarningDate(row.letterDate)}</TableCell>
						<TableCell>
							{row.category === DISCIPLINE_LETTER_CATEGORIES.WARNING_LETTER
								? getWarningEndDate(row.letterDate)
								: '-'}
						</TableCell>
						<TableCell>{row.articleLabel || '-'}</TableCell>
						<TableCell>{row.superiorName}</TableCell>
						<TableCell sx={{ ...stickyActionCellSx, py: 1.25 }}>
							<Stack direction="row" justifyContent="center">
								<TableRowActionMenu
									row={row}
									actions={[
										{
											key: 'detail',
											label: 'Detail',
											icon: <VisibilityOutlinedIcon fontSize="small" color="info" />,
											onClick: onView,
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
				);
			}}
		/>
	);
}

export default WarningLetterTable;
