import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import CheckboxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';

import { DataGrid } from '@mui/x-data-grid';

import { getStatusConfig } from './constants';
import { formatDateShort } from './utils';

function DeliverySlipTable({ rows, loading, onEdit, onDelete, onPrint }) {
	const [contextMenu, setContextMenu] = useState(null);

	const columns = useMemo(
		() => [
			{
				field: 'rowNumber',
				headerName: 'NO',
				width: 70,
				sortable: false,
				renderCell: (params) => (
					<Typography variant="body2" sx={{ fontWeight: 700, color: '#123B66' }}>
						{params.value}
					</Typography>
				),
			},
			{ field: 'slipNumber', headerName: 'NOMOR LEMBAR', width: 220, minWidth: 180 },
			{
				field: 'slipDate',
				headerName: 'TANGGAL',
				width: 120,
				valueFormatter: (params) => formatDateShort(params.value),
			},
			{ field: 'recipientName', headerName: 'UNTUK', width: 200, minWidth: 160 },
			{ field: 'recipientAttention', headerName: 'ATENSI', width: 180, minWidth: 140 },
			{ field: 'senderName', headerName: 'PENGIRIM', width: 180, minWidth: 150 },
			{
				field: 'status',
				headerName: 'STATUS',
				width: 120,
				renderCell: (params) => {
					const config = getStatusConfig(params.value);
					return <Chip label={config.label} color={config.color} size="small" variant="outlined" />;
				},
			},
		],
		[],
	);

	const rowsWithNumber = useMemo(() => rows.map((row, index) => ({ ...row, rowNumber: index + 1 })), [rows]);
	const rowLookup = useMemo(() => new Map(rowsWithNumber.map((row) => [String(row.id), row])), [rowsWithNumber]);

	const closeContextMenu = () => {
		setContextMenu(null);
	};

	const handleGridContextMenu = (event) => {
		const rowElement = event.target.closest('.MuiDataGrid-row');

		if (!rowElement) {
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

		if (action === 'print') {
			onPrint(row);
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

	if (!loading && rows.length === 0) {
		return (
			<Stack py={8} alignItems="center" spacing={1}>
				<Typography variant="h6">Belum ada lembar pengiriman</Typography>
				<Typography variant="body2" color="text.secondary">
					Klik tombol Tambah Lembar Pengiriman untuk membuat data baru.
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
					'& .MuiDataGrid-root': { border: 'none' },
					'& .MuiDataGrid-columnHeaders': {
						backgroundColor: '#F4F7FB',
						borderBottom: '1px solid rgba(15, 23, 42, 0.12)',
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
					},
					'& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': { outline: 'none' },
					'& .MuiDataGrid-row': {
						cursor: 'context-menu',
					},
				}}
				onContextMenu={handleGridContextMenu}
			>
				<DataGrid
					rows={rowsWithNumber}
					columns={columns}
					loading={loading}
					density="compact"
					disableRowSelectionOnClick
					pagination
					initialState={{
						pagination: { paginationModel: { page: 0, pageSize: 15 } },
					}}
					pageSizeOptions={[15, 30, 50, 100]}
					columnHeaderHeight={52}
					rowHeight={48}
					showCellVerticalBorder
					showColumnVerticalBorder
				/>
				<Menu
					open={contextMenu !== null}
					onClose={closeContextMenu}
					anchorReference="anchorPosition"
					anchorPosition={
						contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
					}
				>
					<MenuItem onClick={() => handleContextAction('print')}>
						<Stack direction="row" spacing={1} alignItems="center">
							<PrintOutlinedIcon fontSize="small" color="secondary" />
							<Typography variant="body2">Print</Typography>
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
					label={`${rows.length} lembar`}
					size="small"
					variant="outlined"
					sx={{ fontWeight: 700, bgcolor: '#FFFFFF' }}
				/>
				<Typography variant="caption" color="text.secondary">
					Klik kanan pada baris untuk Print, Edit, atau Hapus.
				</Typography>
			</Box>
		</Paper>
	);
}

export default DeliverySlipTable;
