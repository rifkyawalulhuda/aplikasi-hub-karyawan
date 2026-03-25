import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import CheckboxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import { DataGrid } from '@mui/x-data-grid';

import TableRowActionMenu from '@/components/tableRowActionMenu';

import { formatGuidanceDate, guidanceCategoryConfigs } from './constants';

function GuidanceTable({ rows, selectedRowIds, onSelectionChange, onView, onEdit, onDelete }) {
	const [paginationModel, setPaginationModel] = useState({
		page: 0,
		pageSize: 15,
	});

	const columns = useMemo(
		() => [
			{
				field: 'id',
				headerName: 'NO',
				width: 88,
				sortable: true,
				renderCell: (params) => {
					const rowIndex = params.api.getRowIndexRelativeToVisibleRows(params.id);
					return (
						<Typography variant="body2" sx={{ fontWeight: 700, color: '#123B66' }}>
							{rowIndex != null ? rowIndex + 1 : params.value}
						</Typography>
					);
				},
			},
			{
				field: 'categoryLabel',
				headerName: 'KATEGORI',
				width: 130,
			},
			{
				field: 'employeeName',
				headerName: 'NAMA KARYAWAN',
				minWidth: 180,
				flex: 1,
			},
			{
				field: 'meetingNumber',
				headerName: 'PERTEMUAN KE',
				width: 130,
			},
			{
				field: 'meetingDate',
				headerName: 'TANGGAL',
				width: 130,
				valueFormatter: (params) => formatGuidanceDate(params.value),
			},
			{
				field: 'meetingTime',
				headerName: 'JAM',
				width: 110,
			},
			{
				field: 'location',
				headerName: 'TEMPAT',
				minWidth: 160,
				flex: 0.9,
			},
			{
				field: 'employeeNo',
				headerName: 'NIK',
				width: 140,
			},
			{
				field: 'departmentName',
				headerName: 'DEPARTEMEN',
				minWidth: 180,
				flex: 1,
			},
			{
				field: 'actions',
				headerName: 'AKSI',
				width: 92,
				sortable: false,
				filterable: false,
				disableColumnMenu: true,
				align: 'center',
				headerAlign: 'center',
				cellClassName: 'guidance-actions-cell',
				headerClassName: 'guidance-actions-header',
				renderCell: (params) => (
					<Stack direction="row" justifyContent="center" sx={{ width: '100%' }}>
						<TableRowActionMenu
							row={params.row}
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
				),
			},
		],
		[onDelete, onEdit, onView],
	);

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

	return (
		<Paper
			variant="outlined"
			sx={{
				borderRadius: 3,
				overflow: 'hidden',
				borderColor: 'rgba(15, 23, 42, 0.12)',
				boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
				backgroundColor: '#FFFFFF',
			}}
		>
			<Box
				sx={{
					height: 540,
					width: '100%',
					'& .MuiDataGrid-root': {
						border: 'none',
					},
					'& .MuiDataGrid-columnHeaders': {
						backgroundColor: '#F4F7FB',
						borderBottom: '1px solid rgba(15, 23, 42, 0.12)',
						borderTop: '1px solid rgba(15, 23, 42, 0.02)',
					},
					'& .MuiDataGrid-columnHeaderTitle': {
						fontWeight: 800,
						fontSize: '0.78rem',
						letterSpacing: '0.02em',
						color: '#20324A',
					},
					'& .MuiDataGrid-cell': {
						borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
						alignItems: 'center',
						py: 1.15,
					},
					'& .MuiDataGrid-row:hover': {
						backgroundColor: 'rgba(25, 118, 210, 0.03)',
					},
					'& .MuiDataGrid-row.Mui-selected': {
						backgroundColor: 'rgba(25, 118, 210, 0.06)',
					},
					'& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
						outline: 'none',
					},
					'& .MuiDataGrid-columnSeparator': {
						color: 'rgba(15, 23, 42, 0.12)',
					},
					'& .guidance-actions-header, & .guidance-actions-cell': {
						position: 'sticky',
						right: 0,
						backgroundColor: '#FFFFFF',
						zIndex: 3,
					},
					'& .guidance-actions-header': {
						backgroundColor: '#F4F7FB',
						zIndex: 4,
					},
				}}
			>
				<DataGrid
					rows={rows}
					columns={columns}
					density="compact"
					checkboxSelection
					disableRowSelectionOnClick
					rowSelectionModel={selectedRowIds}
					onRowSelectionModelChange={onSelectionChange}
					pagination
					paginationModel={paginationModel}
					onPaginationModelChange={setPaginationModel}
					pageSizeOptions={[15, 30, 50, 100]}
					columnHeaderHeight={56}
					rowHeight={52}
					hideFooterSelectedRowCount
					showCellVerticalBorder
					showColumnVerticalBorder
					sx={{
						'& .MuiDataGrid-columnHeaderCheckbox .MuiCheckbox-root': {
							color: '#1976d2',
						},
					}}
				/>
			</Box>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					gap: 1,
					px: 2,
					py: 1,
					borderTop: '1px solid rgba(15, 23, 42, 0.08)',
					backgroundColor: '#FBFCFE',
				}}
			>
				<Chip
					icon={<CheckboxOutlinedIcon sx={{ fontSize: 16 }} />}
					label={`${selectedRowIds.length} dipilih`}
					size="small"
					variant="outlined"
					sx={{
						fontWeight: 700,
						bgcolor: '#FFFFFF',
					}}
				/>
				<Typography variant="caption" color="text.secondary">
					Tampilan spreadsheet pilot dengan sorting, selection, dan action menu.
				</Typography>
			</Box>
		</Paper>
	);
}

export default GuidanceTable;
