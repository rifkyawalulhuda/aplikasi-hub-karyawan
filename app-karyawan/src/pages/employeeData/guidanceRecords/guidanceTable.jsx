import { useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import CheckboxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import { DataGrid } from '@mui/x-data-grid';

import { formatGuidanceDate, guidanceCategoryConfigs } from './constants';

const COLUMN_RESIZE_STORAGE_KEY = 'table-widths:guidance-records-table';

function GuidanceTable({ rows, selectedRowIds, onSelectionChange, onView, onEdit, onDelete }) {
	const baseColumns = useMemo(
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
				width: 220,
				minWidth: 180,
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
				width: 180,
				minWidth: 160,
			},
			{
				field: 'employeeNo',
				headerName: 'NIK',
				width: 140,
			},
			{
				field: 'departmentName',
				headerName: 'DEPARTEMEN',
				width: 220,
				minWidth: 180,
			},
		],
		[],
	);
	const [paginationModel, setPaginationModel] = useState({
		page: 0,
		pageSize: 15,
	});
	const [contextMenu, setContextMenu] = useState(null);
	const [columnWidths, setColumnWidths] = useState(() => {
		const fallbackWidths = Object.fromEntries(
			baseColumns.map((column) => [column.field, column.width ?? column.minWidth ?? 120]),
		);

		if (typeof window === 'undefined') {
			return fallbackWidths;
		}

		try {
			return {
				...fallbackWidths,
				...JSON.parse(window.localStorage.getItem(COLUMN_RESIZE_STORAGE_KEY) || '{}'),
			};
		} catch (error) {
			return fallbackWidths;
		}
	});
	const rowLookup = useMemo(() => new Map(rows.map((row) => [String(row.id), row])), [rows]);

	const handleColumnResizeStart = (event, field, minWidth = 80) => {
		event.preventDefault();
		event.stopPropagation();

		const startX = event.clientX;
		const initialWidth = columnWidths[field] ?? baseColumns.find((column) => column.field === field)?.width ?? 120;

		const handleMouseMove = (moveEvent) => {
			const nextWidth = Math.max(minWidth, Math.round(initialWidth + (moveEvent.clientX - startX)));

			setColumnWidths((currentWidths) => {
				if (currentWidths[field] === nextWidth) {
					return currentWidths;
				}

				return {
					...currentWidths,
					[field]: nextWidth,
				};
			});
		};

		const handleMouseUp = () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	};

	const handleColumnHeaderMouseDown = (event) => {
		if (event.button !== 0) {
			return;
		}

		const headerElement = event.target.closest('.MuiDataGrid-columnHeader');
		const field = headerElement?.getAttribute('data-field');

		if (!headerElement || !field || field === '__check__') {
			return;
		}

		const headerRect = headerElement.getBoundingClientRect();
		const isInResizeZone = event.clientX >= headerRect.right - 10;

		if (!isInResizeZone) {
			return;
		}

		const minWidth = baseColumns.find((column) => column.field === field)?.minWidth ?? 80;
		handleColumnResizeStart(event, field, minWidth);
	};

	const columns = useMemo(
		() =>
			baseColumns.map((column) => ({
				...column,
				width: columnWidths[column.field] ?? column.width ?? column.minWidth ?? 120,
				flex: undefined,
			})),
		[baseColumns, columnWidths],
	);

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		window.localStorage.setItem(COLUMN_RESIZE_STORAGE_KEY, JSON.stringify(columnWidths));
	}, [columnWidths]);

	const closeContextMenu = () => {
		setContextMenu(null);
	};

	const handleGridContextMenu = (event) => {
		const rowElement = event.target.closest('.MuiDataGrid-row');

		if (!rowElement || event.target.closest('.MuiDataGrid-cellCheckbox')) {
			closeContextMenu();
			return;
		}

		const row = rowLookup.get(rowElement.getAttribute('data-id'));

		if (!row) {
			closeContextMenu();
			return;
		}

		event.preventDefault();
		setContextMenu({
			mouseX: event.clientX + 2,
			mouseY: event.clientY - 6,
			row,
		});
	};

	const handleContextAction = (action) => {
		if (!contextMenu?.row) {
			return;
		}

		const { row } = contextMenu;
		closeContextMenu();

		if (action === 'detail') {
			onView(row);
			return;
		}

		if (action === 'edit') {
			onEdit(row);
			return;
		}

		if (action === 'delete') {
			onDelete(row);
		}
	};

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
				}}
				onMouseDownCapture={handleColumnHeaderMouseDown}
				onContextMenu={handleGridContextMenu}
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
						'& .MuiDataGrid-columnHeader': {
							position: 'relative',
						},
						'& .MuiDataGrid-columnHeader::after': {
							content: '""',
							position: 'absolute',
							top: 10,
							right: 0,
							width: 3,
							height: 'calc(100% - 20px)',
							borderRadius: 999,
							backgroundColor: 'transparent',
							transition: 'background-color 0.2s ease',
						},
						'& .MuiDataGrid-columnHeader:hover::after': {
							backgroundColor: 'rgba(25, 118, 210, 0.2)',
						},
						'& .MuiDataGrid-row': {
							cursor: 'context-menu',
						},
					}}
				/>
				<Menu
					open={contextMenu !== null}
					onClose={closeContextMenu}
					anchorReference="anchorPosition"
					anchorPosition={
						contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
					}
				>
					<MenuItem onClick={() => handleContextAction('detail')}>
						<Stack direction="row" spacing={1} alignItems="center">
							<VisibilityOutlinedIcon fontSize="small" color="info" />
							<Typography variant="body2">Detail</Typography>
						</Stack>
					</MenuItem>
					<MenuItem onClick={() => handleContextAction('edit')}>
						<Stack direction="row" spacing={1} alignItems="center">
							<EditOutlinedIcon fontSize="small" color="primary" />
							<Typography variant="body2">Edit</Typography>
						</Stack>
					</MenuItem>
					<MenuItem onClick={() => handleContextAction('delete')}>
						<Stack direction="row" spacing={1} alignItems="center">
							<DeleteOutlineOutlinedIcon fontSize="small" color="error" />
							<Typography variant="body2">Hapus</Typography>
						</Stack>
					</MenuItem>
				</Menu>
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
					Tampilan spreadsheet pilot dengan sorting, selection, dan klik kanan untuk aksi.
				</Typography>
			</Box>
		</Paper>
	);
}

export default GuidanceTable;
