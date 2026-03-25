import { useMemo } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import EnhancedTable, { createRowNumberColumn } from '@/components/dataTable';

import {
	DISCIPLINE_LETTER_CATEGORIES,
	formatWarningDate,
	getDisciplineCategoryLabel,
	getWarningEndDate,
} from './utils';

function WarningLetterTable({ rows, selectedRowIds, onSelectionChange, onView, onEdit, onDelete }) {
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

	const columns = useMemo(
		() => [
			createRowNumberColumn(),
			{
				field: 'category',
				headerName: 'KATEGORI',
				minWidth: 140,
				valueFormatter: (params) => getDisciplineCategoryLabel(params.value),
			},
			{ field: 'employeeName', headerName: 'NAMA', minWidth: 220, flex: 1 },
			{ field: 'employeeNo', headerName: 'NIK', minWidth: 140 },
			{
				field: 'warningLevel',
				headerName: 'SURAT PERINGATAN KE',
				minWidth: 180,
				renderCell: (params) =>
					params.row.category === DISCIPLINE_LETTER_CATEGORIES.WARNING_LETTER ? params.value : '-',
			},
			{ field: 'letterNumber', headerName: 'NOMOR SURAT', minWidth: 170 },
			{
				field: 'letterDate',
				headerName: 'TANGGAL SURAT PERINGATAN',
				minWidth: 190,
				valueFormatter: (params) => formatWarningDate(params.value),
			},
			{
				field: 'warningEndDate',
				headerName: 'SAMPAI TANGGAL',
				minWidth: 160,
				sortable: false,
				renderCell: (params) =>
					params.row.category === DISCIPLINE_LETTER_CATEGORIES.WARNING_LETTER
						? getWarningEndDate(params.row.letterDate)
						: '-',
			},
			{
				field: 'articleLabel',
				headerName: 'PASAL PKB',
				minWidth: 160,
				renderCell: (params) => params.value || '-',
			},
			{ field: 'superiorName', headerName: 'SUPERIOR', minWidth: 220, flex: 1 },
		],
		[],
	);

	return (
		<EnhancedTable
			rows={rows}
			columns={columns}
			checkboxSelection
			rowSelectionModel={selectedRowIds}
			onRowSelectionModelChange={onSelectionChange}
			columnResizeKey="warning-letters-table"
			getContextMenuActions={() => [
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
			height={520}
		/>
	);
}

export default WarningLetterTable;
